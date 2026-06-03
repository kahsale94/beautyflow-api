import time
import logging

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

from src.core import (SENSITIVE_HEADER_NAMES, get_forwarded_for, get_real_ip)

logger = logging.getLogger("beautyflow.requests")

def _safe(value: str | int | None) -> str:
    if value is None or value == "":
        return "-"
    return str(value)

class LoggingMiddleware(BaseHTTPMiddleware):

    async def dispatch(self, request: Request, call_next):
        start = time.perf_counter()

        client = request.client.host if request.client else None
        port = request.client.port if request.client else None

        xff = get_forwarded_for(request)
        xri = get_real_ip(request)

        try:
            response = await call_next(request)
        except Exception:
            ms = round((time.perf_counter() - start) * 1000, 2)

            logger.exception(
                "Request failed: %s %s | Time: %sms | Client: %s:%s | X-Forwarded-For: %s | X-Real-Ip: %s",
                request.method,
                request.url.path,
                ms,
                _safe(client),
                _safe(port),
                _safe(xff),
                _safe(xri),
            )

            raise

        ms = round((time.perf_counter() - start) * 1000, 2)

        logger.info(
            "Request: %s %s | Status: %s | Time: %sms | Client: %s:%s | X-Forwarded-For: %s | X-Real-Ip: %s",
            request.method,
            request.url.path,
            response.status_code,
            ms,
            _safe(client),
            _safe(port),
            _safe(xff),
            _safe(xri),
        )

        for header_name in SENSITIVE_HEADER_NAMES:
            if request.headers.get(header_name):
                logger.debug("Sensitive header received: %s=[REDACTED]", header_name)

        return response