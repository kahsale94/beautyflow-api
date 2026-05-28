import time
from collections import defaultdict

from fastapi import Request
from starlette.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_requests: int = 300, window: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window = window
        self.clients = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        if path.startswith("/static") or path.startswith("/admin"):
            return await call_next(request)

        client_ip = self._get_client_ip(request)
        current_time = time.time()

        request_times = self.clients[client_ip]

        self.clients[client_ip] = [
            t for t in request_times if current_time - t < self.window
        ]

        if len(self.clients[client_ip]) >= self.max_requests:
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests"},
            )

        self.clients[client_ip].append(current_time)

        return await call_next(request)

    def _get_client_ip(self, request: Request) -> str:
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()

        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip.strip()

        if request.client:
            return request.client.host

        return "unknown"