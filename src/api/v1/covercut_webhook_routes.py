from fastapi import APIRouter, Header, HTTPException, Request

from src.clients import CovercutAPIError
from src.dependecies import CovercutWebhookServiceDep
from src.services.covercut_webhook_service import (
    CovercutWebhookAuthenticationError,
    CovercutWebhookConfigurationError,
    CovercutWebhookConflictError,
    CovercutWebhookPayloadError,
)


router = APIRouter(prefix="/webhooks/covercut", tags=["V1 ➔ CoverCut Webhooks"])


async def _body(request: Request) -> bytes:
    raw_body = await request.body()
    if not raw_body or len(raw_body) > 25 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Payload de webhook inválido.")
    return raw_body


def _raise_webhook_error(exc: Exception) -> None:
    if isinstance(exc, CovercutWebhookAuthenticationError):
        raise HTTPException(status_code=401, detail="Assinatura de webhook inválida.")
    if isinstance(exc, CovercutWebhookPayloadError):
        raise HTTPException(status_code=400, detail="Payload de webhook inválido.")
    if isinstance(exc, CovercutWebhookConflictError):
        raise HTTPException(status_code=409, detail="Evento de webhook conflitante.")
    if isinstance(exc, CovercutWebhookConfigurationError):
        raise HTTPException(status_code=503, detail="Webhook CoverCut não configurado.")
    if isinstance(exc, CovercutAPIError):
        raise HTTPException(status_code=502, detail="Falha ao obter mídia do provider.")
    raise exc


@router.post("/messages")
async def covercut_message_webhook(
    request: Request,
    service: CovercutWebhookServiceDep,
    signature: str | None = Header(default=None, alias="X-BSP-Signature"),
    timestamp: str | None = Header(default=None, alias="X-BSP-Timestamp"),
):
    try:
        return await service.handle_message(
            await _body(request),
            signature=signature,
            timestamp=timestamp,
        )
    except Exception as exc:
        _raise_webhook_error(exc)


@router.post("/saas")
async def covercut_saas_webhook(
    request: Request,
    service: CovercutWebhookServiceDep,
    signature: str | None = Header(default=None, alias="X-BSP-Signature"),
    timestamp: str | None = Header(default=None, alias="X-BSP-Timestamp"),
    event: str = Header(alias="X-BSP-Event"),
):
    try:
        return await service.handle_saas(
            await _body(request),
            signature=signature,
            timestamp=timestamp,
            event_header=event,
        )
    except Exception as exc:
        _raise_webhook_error(exc)
