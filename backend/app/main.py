import logging
import uuid
import time
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.api.routes_internal import router as internal_router
from app.api.routes_analyze import router as analyze_router
from app.api.routes_export import router as export_router

# --- LOGGING SETUP ---
# Simple JSON formatter so logs are easy to parse in production
class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_record = {
            "timestamp": self.formatTime(record),
            "level": record.levelname,
            "message": record.getMessage(),
            "request_id": getattr(record, "request_id", None),
        }
        if record.exc_info:
            log_record["exception"] = self.formatException(record.exc_info)
        import json
        return json.dumps(log_record)

handler = logging.StreamHandler()
handler.setFormatter(JSONFormatter())
logging.getLogger().handlers = [handler]
logging.getLogger().setLevel(logging.INFO)
logger = logging.getLogger(__name__)


app = FastAPI(
    title="ATS Resume Matcher & Optimizer",
    description="API para analisar e otimizar currículos baseado em descrições de vagas usando IA.",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list, # Never '*'
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- MIDDLEWARE FOR REQUEST ID & LOGGING ---
@app.middleware("http")
async def log_requests(request: Request, call_next):
    request_id = str(uuid.uuid4())
    
    # Attach request_id to logging
    logger.info(f"Incoming request: {request.method} {request.url.path}", extra={"request_id": request_id})
    
    start_time = time.time()
    response = await call_next(request)
    process_time = (time.time() - start_time) * 1000
    
    response.headers["X-Request-ID"] = request_id
    logger.info(f"Finished request: {request.method} {request.url.path} - Status: {response.status_code} in {process_time:.2f}ms", extra={"request_id": request_id})
    
    return response


# --- GLOBAL EXCEPTION HANDLERS ---
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catches ANY unhandled exception and hides the stacktrace from the client."""
    request_id = request.headers.get("X-Request-ID", "unknown")
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True, extra={"request_id": request_id})
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal Server Error",
            "detail": "An unexpected error occurred. Please try again later."
        },
        headers={"X-Request-ID": request_id}
    )


@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    """Catches ValueErrors and returns a clean 400."""
    request_id = request.headers.get("X-Request-ID", "unknown")
    logger.warning(f"ValueError: {str(exc)}", extra={"request_id": request_id})
    
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "error": "Bad Request",
            "detail": str(exc)
        },
        headers={"X-Request-ID": request_id}
    )


# --- ROUTERS ---
app.include_router(internal_router)
app.include_router(analyze_router)
app.include_router(export_router)

@app.get("/health", status_code=200)
async def health_check():
    return {"status": "ok"}