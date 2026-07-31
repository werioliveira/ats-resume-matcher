import os
import pytest

from app.services.file_parser import parse_resume, UnextractableFileError

FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures")

# Map file extensions to the correct MIME types
MIME_TYPES = {
    ".pdf": "application/pdf",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


def get_fixture_files():
    """
    Dynamically scans the fixtures folder and returns whatever files it finds.
    This means you can have 1 file or 100 files, and it will test them all automatically.
    """
    if not os.path.exists(FIXTURES_DIR):
        return []
    
    files = []
    for filename in os.listdir(FIXTURES_DIR):
        filepath = os.path.join(FIXTURES_DIR, filename)
        if os.path.isfile(filepath):
            ext = os.path.splitext(filename)[1].lower()
            mime = MIME_TYPES.get(ext)
            if mime:
                files.append((filename, filepath, mime))
                
    return files


# This decorator automatically creates a separate test for EVERY file in the folder
@pytest.mark.parametrize("filename,filepath,mime_type", get_fixture_files())
def test_parse_real_resume(filename, filepath, mime_type):
    """Tests any PDF or DOCX placed inside the fixtures folder."""
    with open(filepath, "rb") as f:
        file_bytes = f.read()
    
    # 1. Parse the file
    result = parse_resume(file_bytes, mime_type)
    
    # 2. Assert basic extraction worked
    assert isinstance(result, str), f"Failed to return a string for {filename}"
    assert len(result) > 50, f"Extracted text from {filename} seems too short"
    
    # 3. Assert normalization worked (no weird spacing)
    assert "\n\n\n" not in result, f"{filename} has excessive blank lines"
    
    for line in result.split("\n"):
        assert line == line.rstrip(), f"{filename} has trailing spaces in line: '{line}'"


# ---------------------------------------------------------
# EDGE CASES (These don't need any files to run)
# ---------------------------------------------------------

def test_unsupported_type_raises():
    with pytest.raises(ValueError, match="Unsupported file type"):
        parse_resume(b"fake content", "image/png")


def test_empty_bytes_pdf_raises():
    """Test that completely empty bytes raise an error."""
    with pytest.raises(UnextractableFileError):
        parse_resume(b"", "application/pdf")


def test_fake_scanned_pdf_raises():
    """A valid PDF structure but with zero text should raise UnextractableFileError."""
    fake_pdf = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [] /Count 0 >>\nendobj\nxref\n0 3\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \ntrailer\n<< /Size 3 /Root 1 0 R >>\nstartxref\n110\n%%EOF"
    with pytest.raises(UnextractableFileError):
        parse_resume(fake_pdf, "application/pdf")