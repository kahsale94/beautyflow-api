import time

from fastapi import Request
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