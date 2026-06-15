import logging
from uuid import uuid4

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from .api import router as user_router
from .api.health_routes import router as health_router
from .admin import router as admin_router
from .core import ENVIRONMENT, CORS_ORIGINS, configure_logging, report_unhandled_exception
from .middlewares import LoggingMiddleware, RateLimitMiddleware, SecurityHeadersMiddleware

configure_logging()
logger = logging.getLogger("beautyflow.unhandled")

if ENVIRONMENT == "production":
    app = FastAPI(
        title="Beautyflow API",
        docs_url=None,
        redoc_url=None,
        openapi_url=None,
        swagger_ui_parameters={"docExpansion": "none"},
    )
else:
    app = FastAPI(
        title="Beautyflow API",
        swagger_ui_parameters={"docExpansion": "none"},
    )

allowed_origins = CORS_ORIGINS

if ENVIRONMENT != "production" and not allowed_origins:
    allowed_origins = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8000",
    ]

if ENVIRONMENT == "production":
    if not allowed_origins:
        raise RuntimeError("CORS_ORIGINS deve ser definido em produção")

    if "*" in allowed_origins:
        raise RuntimeError("CORS_ORIGINS não pode conter '*' em produção")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=allowed_origins,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=[
        "Authorization",
        "Content-Type",
        "X-Business-ID",
        "X-Business-Phone",
        "X-Evolution-Instance",
        "X-CSRF-Token",
    ],
)

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(LoggingMiddleware)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    error_id = uuid4().hex
    logger.error(
        "Unhandled application error. error_id=%s method=%s path=%s",
        error_id,
        request.method,
        request.url.path,
    )
    await report_unhandled_exception(request, exc, error_id)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Erro interno inesperado.",
            "error_id": error_id,
        },
    )

app.mount("/static", StaticFiles(directory="src/static"), name="static")

app.include_router(health_router)
app.include_router(admin_router)
app.include_router(user_router)
