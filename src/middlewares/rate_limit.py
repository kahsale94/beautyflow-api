import logging
import time
from collections import defaultdict

from fastapi import Request
from starlette.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

try:
    import redis
except ImportError:  # pragma: no cover - keeps local dev working before installing dependencies
    redis = None

from src.core import (
    RATE_LIMIT_AUTH_MAX_REQUESTS,
    RATE_LIMIT_AUTH_WINDOW_SECONDS,
    RATE_LIMIT_MAX_REQUESTS,
    RATE_LIMIT_REDIS_URL,
    RATE_LIMIT_WINDOW_SECONDS,
    TRUSTED_PROXY_IPS,
)

logger = logging.getLogger("beautyflow.rate_limit")

class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_requests: int | None = None, window: int | None = None):
        super().__init__(app)
        self.max_requests = max_requests or RATE_LIMIT_MAX_REQUESTS
        self.window = window or RATE_LIMIT_WINDOW_SECONDS
        self.clients = defaultdict(list)
        self.redis_client = redis.from_url(RATE_LIMIT_REDIS_URL, decode_responses=True) if redis and RATE_LIMIT_REDIS_URL else None

    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        if path.startswith("/static"):
            return await call_next(request)

        client_ip = self._get_client_ip(request)
        max_requests, window = self._limits_for(request)
        key = f"rate-limit:{client_ip}:{request.method}:{path}"

        if self.redis_client:
            try:
                allowed = self._allow_with_redis(key, max_requests, window)
            except Exception:
                logger.exception("Redis rate limit unavailable. Falling back to in-memory rate limit.")
                allowed = self._allow_in_memory(key, max_requests, window)
        else:
            allowed = self._allow_in_memory(key, max_requests, window)

        if not allowed:
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests"},
            )

        return await call_next(request)

    def _limits_for(self, request: Request) -> tuple[int, int]:
        path = request.url.path
        if request.method == "POST" and path in {"/v1/auth/login", "/v1/auth/refresh", "/admin/login"}:
            return RATE_LIMIT_AUTH_MAX_REQUESTS, RATE_LIMIT_AUTH_WINDOW_SECONDS
        return self.max_requests, self.window

    def _allow_with_redis(self, key: str, max_requests: int, window: int) -> bool:
        pipe = self.redis_client.pipeline()  # type: ignore[union-attr]
        pipe.incr(key)
        pipe.ttl(key)
        current, ttl = pipe.execute()

        if current == 1 or ttl == -1:
            self.redis_client.expire(key, window)  # type: ignore[union-attr]

        return int(current) <= max_requests

    def _allow_in_memory(self, key: str, max_requests: int, window: int) -> bool:
        current_time = time.time()
        request_times = self.clients[key]
        self.clients[key] = [t for t in request_times if current_time - t < window]

        if len(self.clients[key]) >= max_requests:
            return False

        self.clients[key].append(current_time)
        return True

    def _get_client_ip(self, request: Request) -> str:
        direct_client_ip = request.client.host if request.client else "unknown"

        if direct_client_ip in TRUSTED_PROXY_IPS:
            real_ip = request.headers.get("x-real-ip")
            if real_ip:
                return real_ip.strip()

            forwarded_for = request.headers.get("x-forwarded-for")
            if forwarded_for:
                return forwarded_for.split(",")[0].strip()

        return direct_client_ip
