from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse
import io
from app.services.resume_exporter import generate_resume_docx

router = APIRouter(tags=["Export"])


@router.post("/export")
async def export_resume(optimized_resume: dict):
    """
    Receives the optimized_resume JSON object and returns a .docx file.
    """
    if not optimized_resume.get("optimized_resume"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid payload: 'optimized_resume' object is missing."
        )

    try:
        # Generate the DOCX in memory
        docx_bytes = generate_resume_docx(optimized_resume["optimized_resume"])
        
        # Return as a streaming downloadable file
        return StreamingResponse(
            io.BytesIO(docx_bytes),
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={
                "Content-Disposition": "attachment; filename=curriculo_otimizado.docx"
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate DOCX file: {str(e)}"
        )