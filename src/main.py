from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.v1 import router as v1_router
from .middlewares import LoggingMiddleware, RateLimitMiddleware
from .core import ENVIRONMENT, CORS_ORIGINS

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
    allowed_origins = ["http://localhost:3000", "http://localhost:5173", "http://localhost:8000"]

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(LoggingMiddleware)
app.add_middleware(RateLimitMiddleware, max_requests=30, window=60)

app.include_router(v1_router, prefix="/v1")