from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.v1 import router as v1_router
from .middlewares import LoggingMiddleware, RateLimitMiddleware

app = FastAPI(title="API de Agendamento de Serviços")

app.add_middleware(CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(LoggingMiddleware)
app.add_middleware(RateLimitMiddleware, max_requests=100, window=60)

app.include_router(v1_router, prefix="/v1")