from fastapi import APIRouter

from app.core.rate_limiter import limiter

router = APIRouter(tags=["Internal"])

@router.get("/internal/usage")
async def get_usage():
    """
    Dev-only endpoint to check current rate limit consumption.
    TODO: Hide this in production using environment checks.
    """
    return limiter.get_usage()