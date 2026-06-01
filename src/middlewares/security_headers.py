from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

from src.core import apply_security_headers

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        apply_security_headers(request, response)

        return response