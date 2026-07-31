import json
import google.genai
from google.genai import types

from app.core.config import settings
from app.models.gemini_schemas import AnalysisResult
from app.services.prompt_builder import SYSTEM_INSTRUCTION, build_prompt


class GeminiResponseError(Exception):
    """Raised when Gemini returns an invalid or unparseable response."""
    pass


def call_gemini(job_description: str, resume_text: str, model_name: str | None = None) -> AnalysisResult:
    """
    Calls the Gemini API to analyze and optimize the resume.
    Returns a validated Pydantic AnalysisResult object.
    """
    client = google.genai.Client(api_key=settings.gemini_api_key)
    
    # Use the provided model_name, or fallback to the default in settings
    active_model = model_name or settings.model_name
    
    user_prompt = build_prompt(job_description, resume_text)

    try:
        response = client.models.generate_content(
            model=active_model, # <--- Changed from settings.model_name
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                temperature=0.2,
                response_mime_type="application/json",
                response_schema=AnalysisResult,
            )
        )
        
        response_text = response.text
        
        if not response_text:
            raise GeminiResponseError("Gemini returned an empty response.")
            
        return AnalysisResult.model_validate_json(response_text)

    except json.JSONDecodeError as e:
        raise GeminiResponseError(f"Failed to decode Gemini JSON response: {e}")
    except Exception as e:
        if "Validation" in type(e).__name__:
            raise GeminiResponseError(f"Gemini response failed schema validation: {e}")
        
        # Catch Google API specific quota/rate limit errors to trigger retry later
        error_str = str(e).lower()
        if "429" in error_str or "quota" in error_str or "rate limit" in error_str:
            raise GeminiResponseError(f"RATE_LIMIT: {e}")
            
        raise GeminiResponseError(f"Error communicating with Gemini API: {e}")