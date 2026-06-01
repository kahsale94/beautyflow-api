from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from .api import router as user_router
from .admin import router as admin_router
from .core import ENVIRONMENT, CORS_ORIGINS, configure_logging
from .middlewares import LoggingMiddleware, RateLimitMiddleware, SecurityHeadersMiddleware

configure_logging()

if ENVIRONMENT == "production":
    app = FastAPI(
        title="Beautyflow API",
        docs_url=None,
        redoc_url=None,
        openapi_url=None,
    )
else:
    app = FastAPI(title="Beautyflow API")

allowed_origins = CORS_ORIGINS

if ENVIRONMENT != "production" and not allowed_origins:
    allowed_origins = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8000",
    ]

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
        "X-CSRF-Token",
    ],
)

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(LoggingMiddleware)

app.mount("/static", StaticFiles(directory="src/static"), name="static")

app.include_router(admin_router)
app.include_router(user_router)