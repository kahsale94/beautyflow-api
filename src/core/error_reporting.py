import logging

import httpx
from fastapi import Request

from .config import N8N_ERROR_WEBHOOK_URL, N8N_WEBHOOK_HEADER, N8N_WEBHOOK_SECRET


logger = logging.getLogger("beautyflow.error_reporting")


def build_error_payload(request: Request, exc: Exception, error_id: str) -> dict:
    return {
        "error": {
            "id": error_id,
            "workflow": "beautyflow-api",
            "execution": error_id,
            "type": "backend.unhandled",
            "node": f"{request.method} {request.url.path}",
            "code": "500",
            "description": type(exc).__name__,
        },
        "business": {},
        "client": {},
        "api": {},
    }


async def report_unhandled_exception(request: Request, exc: Exception, error_id: str) -> None:
    if not N8N_ERROR_WEBHOOK_URL or not N8N_WEBHOOK_HEADER or not N8N_WEBHOOK_SECRET:
        logger.error("Unhandled error reporting is not configured. error_id=%s", error_id)
        return

    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            response = await client.post(
                N8N_ERROR_WEBHOOK_URL,
                headers={N8N_WEBHOOK_HEADER: N8N_WEBHOOK_SECRET},
                json=build_error_payload(request, exc, error_id),
            )
            response.raise_for_status()
    except Exception:
        logger.exception("Failed to report unhandled error. error_id=%s", error_id)
