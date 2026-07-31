import asyncio
import pytest
from unittest.mock import patch, AsyncMock

from app.core.rate_limiter import TokenBucketLimiter, call_gemini_with_fallback
from app.services.gemini_client import GeminiResponseError
from app.models.gemini_schemas import AnalysisResult
from app.core.config import settings


@pytest.fixture
def strict_limiter():
    """A limiter that only allows 2 requests per minute for testing."""
    return TokenBucketLimiter(rpm_limit=2, rpd_limit=100)


@pytest.mark.asyncio
@patch("app.core.rate_limiter.asyncio.sleep", new_callable=AsyncMock) # Mock sleep so it's instant
async def test_limiter_blocks_when_rpm_exceeded(mock_sleep, strict_limiter):
    """Should allow 2 requests instantly, but trigger a sleep on the 3rd."""
    await strict_limiter.acquire()
    await strict_limiter.acquire()
    
    # The 3rd call should trigger asyncio.sleep because it has to wait for the bucket
    await strict_limiter.acquire()
    
    # If sleep was called, it means the limiter correctly blocked and waited
    assert mock_sleep.called


@pytest.mark.asyncio
async def test_limiter_usage_stats(strict_limiter):
    await strict_limiter.acquire()
    stats = strict_limiter.get_usage()
    assert stats["rpm_current"] == 1
    assert stats["rpm_limit"] == 2


@pytest.mark.asyncio
@patch("app.core.rate_limiter.asyncio.sleep", new_callable=AsyncMock) # Mock sleep so it's instant
@patch("app.core.rate_limiter.call_gemini")
@patch("app.core.rate_limiter.limiter")
async def test_fallback_triggers_on_3rd_attempt(mock_limiter, mock_gemini_call, mock_sleep):
    """Tests that if rate limit fails twice, it calls Gemini with the fallback model on the 3rd try."""
    # Setup limiter mock to do nothing
    mock_limiter.acquire = AsyncMock()
    
    # Fail twice with rate limit, succeed on 3rd
    mock_gemini_call.side_effect = [
        GeminiResponseError("RATE_LIMIT: 429"),
        GeminiResponseError("RATE_LIMIT: 429"),
        AnalysisResult(
            match_score=50,
            summary_feedback="test",
            matched_keywords=[],
            missing_keywords=[],
            section_feedback=[],
            optimized_resume={
                "summary": "test",
                "experience": [],
                "skills": [],
                "education": []
            }
        )
    ]
    
    result = await call_gemini_with_fallback("job", "resume")
    
    assert result.match_score == 50
    assert mock_gemini_call.call_count == 3
    
    # asyncio.to_thread passes arguments POSITIONALLY, so we check args, not kwargs
    # args[0] = job_description, args[1] = resume_text, args[2] = model_name
    third_call_args = mock_gemini_call.call_args_list[2].args
    assert third_call_args[2] == settings.fallback_model_name  # <-- Use dynamic setting here