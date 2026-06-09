import logging
import time
from collections import deque

from fastapi import Request
from starlette.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

try:
    from redis import asyncio as redis_async
except ImportError:  # pragma: no cover - keeps local dev working before installing dependencies
    redis_async = None

from src.core import (RATE_LIMIT_AUTH_MAX_REQUESTS, RATE_LIMIT_AUTH_WINDOW_SECONDS, RATE_LIMIT_MAX_REQUESTS,
    RATE_LIMIT_REDIS_URL, RATE_LIMIT_WINDOW_SECONDS, TRUSTED_PROXY_IPS
)


logger = logging.getLogger("beautyflow.rate_limit")

class RateLimitMiddleware(BaseHTTPMiddleware):
    MAX_IN_MEMORY_KEYS = 10_000

    def __init__(self, app, max_requests: int | None = None, window: int | None = None):
        super().__init__(app)
        self.max_requests = max_requests or RATE_LIMIT_MAX_REQUESTS
        self.window = window or RATE_LIMIT_WINDOW_SECONDS
        self.clients: dict[str, deque[float]] = {}
        self.last_cleanup = 0.0
        self.redis_client = (
            redis_async.from_url(RATE_LIMIT_REDIS_URL, decode_responses=True)
            if redis_async and RATE_LIMIT_REDIS_URL
            else None
        )

    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        if path.startswith("/static"):
            return await call_next(request)

        client_ip = self._get_client_ip(request)
        max_requests, window = self._limits_for(request)
        bucket = path if self._is_auth_path(request) else "general"
        key = f"rate-limit:{client_ip}:{request.method}:{bucket}"

        if self.redis_client:
            try:
                allowed = await self._allow_with_redis(key, max_requests, window)
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
        if self._is_auth_path(request):
            return RATE_LIMIT_AUTH_MAX_REQUESTS, RATE_LIMIT_AUTH_WINDOW_SECONDS
        return self.max_requests, self.window

    def _is_auth_path(self, request: Request) -> bool:
        return request.method == "POST" and request.url.path in {
            "/v1/auth/login",
            "/v1/auth/refresh",
            "/admin/login",
        }

    async def _allow_with_redis(self, key: str, max_requests: int, window: int) -> bool:
        pipe = self.redis_client.pipeline()  # type: ignore[union-attr]
        pipe.incr(key)
        pipe.ttl(key)
        current, ttl = await pipe.execute()

        if current == 1 or ttl == -1:
            await self.redis_client.expire(key, window)  # type: ignore[union-attr]

        return int(current) <= max_requests

    def _allow_in_memory(self, key: str, max_requests: int, window: int) -> bool:
        current_time = time.time()
        self._cleanup_in_memory(current_time, window)
        request_times = self.clients.setdefault(key, deque())

        while request_times and current_time - request_times[0] >= window:
            request_times.popleft()

        if len(request_times) >= max_requests:
            return False

        request_times.append(current_time)
        return True

    def _cleanup_in_memory(self, current_time: float, window: int) -> None:
        cleanup_interval = min(window, 30)
        at_capacity = len(self.clients) >= self.MAX_IN_MEMORY_KEYS
        if not at_capacity and current_time - self.last_cleanup < cleanup_interval:
            return

        self.last_cleanup = current_time
        expired_keys = [
            key
            for key, request_times in self.clients.items()
            if not request_times or current_time - request_times[-1] >= window
        ]
        for key in expired_keys:
            self.clients.pop(key, None)

        if len(self.clients) < self.MAX_IN_MEMORY_KEYS:
            return

        oldest_key = min(
            self.clients,
            key=lambda key: self.clients[key][-1] if self.clients[key] else 0,
        )
        self.clients.pop(oldest_key, None)

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
