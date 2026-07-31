import io
import os
import pytest
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient

from app.main import app
from app.models.gemini_schemas import AnalysisResult, OptimizedResume

client = TestClient(app)

# Load your REAL resume from the fixtures folder
FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures")
REAL_RESUME_PATH = os.path.join(FIXTURES_DIR, "CURRICULO-WERIOLIVEIRA.pdf")

# A realistic fake response from Gemini
MOCK_GEMINI_RESULT = AnalysisResult(
    match_score=92,
    summary_feedback="Excellent match, highly optimized.",
    matched_keywords=[{"keyword": "Python"}, {"keyword": "FastAPI"}],
    missing_keywords=[],
    section_feedback=[],
    optimized_resume=OptimizedResume(
        name="WERI OLIVEIRA SANTOS",
        contact_info="São Gabriel, BA | (74) 99946-7851",
        objective="Desenvolvedor Fullstack",
        summary="Rewritten summary...",
        experience=[],
        skills=[{"category": "Backend", "skills": ["Python"]}],
        education=[]
    )
)


@pytest.mark.skipif(not os.path.exists(REAL_RESUME_PATH), reason="Real resume fixture not found")
@patch("app.api.routes_analyze.call_gemini_with_fallback", new_callable=AsyncMock)
def test_full_integration_real_file_mocked_gemini(mock_gemini):
    """
    End-to-end test: Reads a REAL PDF, parses it in memory, 
    builds the prompt, but mocks the actual Gemini API call.
    """
    mock_gemini.return_value = MOCK_GEMINI_RESULT

    with open(REAL_RESUME_PATH, "rb") as f:
        real_pdf_bytes = f.read()

    response = client.post(
        "/analyze",
        files={"file": ("CURRICULO-WERIOLIVEIRA.pdf", io.BytesIO(real_pdf_bytes), "application/pdf")},
        data={"job_description": "Vaga de Desenvolvedor Python Pleno"}
    )

    # 1. Assert the request was fully successful
    assert response.status_code == 200
    
    # 2. Assert the response schema is correct
    data = response.json()
    assert data["match_score"] == 92
    assert data["optimized_resume"]["name"] == "WERI OLIVEIRA SANTOS"
    
    # 3. Assert Gemini was called with the REAL extracted text
    mock_gemini.assert_called_once()
    
    # Get the arguments passed to the mock
    call_args = mock_gemini.call_args
    job_desc_passed = call_args[0][0]
    resume_text_passed = call_args[0][1]
    
    # Verify it wasn't passed empty strings or mocked text
    assert "Vaga de Desenvolvedor Python Pleno" in job_desc_passed
    assert "WERI" in resume_text_passed.upper() # Proves pdfplumber actually extracted your real text!