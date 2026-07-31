import os
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Request, status

from app.core.config import settings
from app.services.file_parser import parse_resume, UnextractableFileError
from app.core.rate_limiter import call_gemini_with_fallback, limiter
from app.services.gemini_client import GeminiResponseError
from app.models.schemas import AnalyzeResponse

router = APIRouter(tags=["Analyze"])

ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_resume(
    request: Request,
    job_description: str = Form(...),
    file: UploadFile = File(...)
):
    # 0. Pre-emptive size check via Content-Length header
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > settings.max_file_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Request too large. Maximum payload size is {settings.max_file_size_mb}MB."
        )

    # 1. Validate MIME type
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type: {file.content_type}. Only PDF and DOCX are allowed."
        )

    # 2. Read file and validate size
    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is empty."
        )
        
    if len(file_bytes) > settings.max_file_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum size is {settings.max_file_size_mb}MB."
        )

    # 3. Parse the resume
    try:
        resume_text = parse_resume(file_bytes, file.content_type)
    except UnextractableFileError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    # 4. Call Gemini (with rate limiting and retries built-in)
    try:
        gemini_result = await call_gemini_with_fallback(job_description, resume_text)
    except GeminiResponseError as e:
        error_msg = str(e)
        
        if "RATE_LIMIT" in error_msg:
            # Calculate Retry-After based on current limiter state
            usage = limiter.get_usage()
            retry_after = 60 if usage["rpm_current"] >= usage["rpm_limit"] else 86400
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Please wait before trying again.",
                headers={"Retry-After": str(retry_after)}
            )
        elif "Validation" in error_msg or "schema" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="The AI returned an invalid response format. Please try again."
            )
        else:
            # General Gemini unavailability (502/503)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI service is currently unavailable. Please try again in a moment."
            )

    # 5. Map Gemini result to API Response model
    # (We convert the Gemini schema to the API schema to keep them decoupled)
    # 5. Map Gemini result to API Response model
    # Convert to dict first to avoid Pydantic cross-module class conflicts,
    # then inject the parsed resume text.
    response_data = gemini_result.model_dump()
    response_data["original_resume_text"] = resume_text
    
    return AnalyzeResponse(**response_data)