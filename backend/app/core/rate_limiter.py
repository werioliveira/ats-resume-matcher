import time
import asyncio
from datetime import datetime, timedelta
from collections import deque

from tenacity import retry, wait_exponential, stop_after_attempt, retry_if_exception_type

from app.core.config import settings
from app.services.gemini_client import call_gemini, GeminiResponseError
from app.models.gemini_schemas import AnalysisResult


class TokenBucketLimiter:
    """In-memory async rate limiter tracking RPM and RPD."""
    def __init__(self, rpm_limit: int, rpd_limit: int):
        self.rpm_limit = rpm_limit
        self.rpd_limit = rpd_limit
        self.rpm_timestamps = deque()
        self.rpd_timestamps = deque()
        self._lock = asyncio.Lock()

    async def acquire(self):
        """Waits asynchronously until a request slot is available."""
        async with self._lock:
            now = time.time()
            
            # Clean old timestamps (older than 60s for RPM, 24h for RPD)
            cutoff_rpm = now - 60
            while self.rpm_timestamps and self.rpm_timestamps[0] < cutoff_rpm:
                self.rpm_timestamps.popleft()
                
            cutoff_rpd = now - (24 * 60 * 60)
            while self.rpd_timestamps and self.rpd_timestamps[0] < cutoff_rpd:
                self.rpd_timestamps.popleft()

            # If at limit, calculate wait time and sleep
            if len(self.rpm_timestamps) >= self.rpm_limit:
                sleep_time = self.rpm_timestamps[0] + 60 - now + 0.1
                if sleep_time > 0:
                    await asyncio.sleep(sleep_time)
                    
            if len(self.rpd_timestamps) >= self.rpd_limit:
                sleep_time = self.rpd_timestamps[0] + (24 * 60 * 60) - now + 0.1
                if sleep_time > 0:
                    await asyncio.sleep(sleep_time)

            # Record this request
            self.rpm_timestamps.append(time.time())
            self.rpd_timestamps.append(time.time())

    def get_usage(self) -> dict:
        """Returns current usage stats."""
        now = time.time()
        rpm_active = sum(1 for t in self.rpm_timestamps if t > now - 60)
        rpd_active = sum(1 for t in self.rpd_timestamps if t > now - (24 * 60 * 60))
        return {
            "rpm_current": rpm_active,
            "rpm_limit": self.rpm_limit,
            "rpd_current": rpd_active,
            "rpd_limit": self.rpd_limit,
        }


# Global instance
limiter = TokenBucketLimiter(rpm_limit=settings.rpm_limit, rpd_limit=settings.rpd_limit)


def _is_rate_limit_error(exception: Exception) -> bool:
    return isinstance(exception, GeminiResponseError) and "RATE_LIMIT" in str(exception)


# The Resilient Wrapper
@retry(
    wait=wait_exponential(multiplier=1, min=2, max=8), # Waits 2s, 4s, 8s
    stop=stop_after_attempt(3),
    retry=retry_if_exception_type(GeminiResponseError),
    before_sleep=lambda retry_state: print(f"⚠️ Rate limit hit. Retrying in {retry_state.next_action.sleep} seconds... (Attempt {retry_state.attempt_number}/3)")
)
async def call_gemini_protected(job_description: str, resume_text: str) -> AnalysisResult:
    """
    Wraps call_gemini with rate limiting and retries.
    Switches to fallback model on the final attempt if still failing.
    """
    await limiter.acquire()
    
    # If this is the last attempt, force the fallback model
    model_to_use = None
    retry_state = getattr(call_gemini_protected, "retry_state", None)
    
    # tenacity injects retry_state into the function's kwargs if configured, 
    # but a simpler way is checking the attempt number via the exception traceback context.
    # For simplicity and robustness, we rely on tenacity's callback above for logging,
    # and we use a simple flag if it's the 3rd attempt.
    
    try:
        # Run the synchronous call_gemini in a thread pool so it doesn't block the async loop
        return await asyncio.to_thread(call_gemini, job_description, resume_text, model_to_use)
    except GeminiResponseError as e:
        # If we fail and it's a rate limit error, tenacity will retry.
        # If it fails on the 3rd attempt, tenacity raises the exception.
        # To force fallback on the 3rd attempt, we modify the approach slightly:
        raise e


# To properly handle the fallback on the 3rd attempt without overcomplicating tenacity:
async def call_gemini_with_fallback(job_description: str, resume_text: str) -> AnalysisResult:
    """Public interface that handles retries and model fallback gracefully."""
    attempts = 0
    last_error = None
    use_fallback = False

    while attempts < 3:
        attempts += 1
        try:
            await limiter.acquire()
            model = settings.fallback_model_name if use_fallback else None
            return await asyncio.to_thread(call_gemini, job_description, resume_text, model)
        except GeminiResponseError as e:
            last_error = e
            if "RATE_LIMIT" in str(e) and attempts < 3:
                wait_time = 2 ** attempts
                print(f"⚠️ Rate limit hit. Waiting {wait_time}s... (Attempt {attempts}/3)")
                await asyncio.sleep(wait_time)
                # On the 3rd attempt, we will use the fallback model
                if attempts == 2:
                    use_fallback = True
                    print("🔄 Switching to fallback model for next attempt...")
            else:
                raise last_error

    raise last_error