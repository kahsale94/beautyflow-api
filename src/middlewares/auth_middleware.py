import time
from collections import defaultdict
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware

class LoggingMiddleware(BaseHTTPMiddleware):
    
    async def dispatch(self, request: Request, call_next):
        start = time.time()
        response = await call_next(request)
        ms = round((time.time() - start) * 1000, 2)

        client = request.client.host if request.client else None
        port = request.client.port if request.client else None

        xff = request.headers.get("x-forwarded-for")
        xri = request.headers.get("x-real-ip")
        ua = request.headers.get("user-agent")

        print(
            f"Request: {request.method} {request.url.path}\n"
            f"Status: {response.status_code}\n"
            f"Time: {ms}ms\n"
            f"Client: {client}:{port}\n"
            f"X-Forwarded-For: {xff}\n"
            f"X-Real-Ip: {xri}\n"
            f"User-Agent: {ua}\n"
        )

        return response

class RateLimitMiddleware(BaseHTTPMiddleware):

    def __init__(self, app, max_requests: int = 30, window: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window = window
        self.clients = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host
        current_time = time.time()

        request_times = self.clients[client_ip]

        self.clients[client_ip] = [
            t for t in request_times if current_time - t < self.window
        ]

        if len(self.clients[client_ip]) >= self.max_requests:
            raise HTTPException(status_code=429, detail="Too many requests")

        self.clients[client_ip].append(current_time)

        response = await call_next(request)
        return response