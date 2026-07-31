import io
import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from fastapi.testclient import TestClient

from app.main import app
from app.models.gemini_schemas import AnalysisResult, OptimizedResume

client = TestClient(app)

# A fake Gemini response to inject into our mocks
FAKE_GEMINI_RESULT = AnalysisResult(
    match_score=85,
    summary_feedback="Great match!",
    matched_keywords=[{"keyword": "Python"}],
    missing_keywords=[{"keyword": "AWS", "suggestion": "Add AWS"}],
    section_feedback=[{"section_name": "Skills", "feedback": "Good"}],
    optimized_resume=OptimizedResume(
        summary="Rewritten summary",
        experience=[],
        skills=[],
        education=[]
    )
)

@pytest.fixture
def fake_pdf_bytes():
    # Minimal valid PDF header just to pass size checks
    return b"%PDF-1.4 fake content"


@patch("app.api.routes_analyze.call_gemini_with_fallback", new_callable=AsyncMock)
@patch("app.api.routes_analyze.parse_resume")
def test_analyze_success(mock_parser, mock_gemini, fake_pdf_bytes):
    """Tests a successful end-to-end mocked request."""
    mock_parser.return_value = "Extracted resume text"
    mock_gemini.return_value = FAKE_GEMINI_RESULT

    response = client.post(
        "/analyze",
        files={"file": ("resume.pdf", io.BytesIO(fake_pdf_bytes), "application/pdf")},
        data={"job_description": "Python Developer"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["match_score"] == 85
    assert data["summary_feedback"] == "Great match!"
    mock_parser.assert_called_once()
    mock_gemini.assert_called_once_with("Python Developer", "Extracted resume text")


def test_analyze_invalid_file_type(fake_pdf_bytes):
    """Tests rejection of unsupported file types like .png."""
    response = client.post(
        "/analyze",
        files={"file": ("image.png", io.BytesIO(fake_pdf_bytes), "image/png")},
        data={"job_description": "Python Developer"}
    )
    assert response.status_code == 400
    assert "Invalid file type" in response.json()["detail"]


def test_analyze_file_too_large():
    """Tests 413 error when file exceeds limit."""
    # Create a byte array larger than 5MB (default limit)
    huge_bytes = b"x" * (6 * 1024 * 1024) 
    
    response = client.post(
        "/analyze",
        files={"file": ("big.pdf", io.BytesIO(huge_bytes), "application/pdf")},
        data={"job_description": "Python Developer"}
    )
    assert response.status_code == 413
    assert "too large" in response.json()["detail"].lower()


@patch("app.api.routes_analyze.parse_resume")
def test_analyze_scanned_pdf_raises_400(mock_parser, fake_pdf_bytes):
    """Tests 400 error when parser detects a scanned PDF."""
    from app.services.file_parser import UnextractableFileError
    mock_parser.side_effect = UnextractableFileError("This PDF is scanned.")
    
    response = client.post(
        "/analyze",
        files={"file": ("scanned.pdf", io.BytesIO(fake_pdf_bytes), "application/pdf")},
        data={"job_description": "Python Developer"}
    )
    assert response.status_code == 400
    assert "scanned" in response.json()["detail"].lower()


@patch("app.api.routes_analyze.call_gemini_with_fallback", new_callable=AsyncMock)
@patch("app.api.routes_analyze.parse_resume")
def test_analyze_gemini_rate_limit_429(mock_parser, mock_gemini, fake_pdf_bytes):
    """Tests 429 error with Retry-After header when rate limit is hit."""
    mock_parser.return_value = "Text"
    from app.services.gemini_client import GeminiResponseError
    mock_gemini.side_effect = GeminiResponseError("RATE_LIMIT: 429 Too Many Requests")

    response = client.post(
        "/analyze",
        files={"file": ("resume.pdf", io.BytesIO(fake_pdf_bytes), "application/pdf")},
        data={"job_description": "Python Developer"}
    )
    
    assert response.status_code == 429
    assert "Retry-After" in response.headers