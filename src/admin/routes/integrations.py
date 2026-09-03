import json

from fastapi import APIRouter, HTTPException, Request

from src.clients import (
    CovercutAPIError,
    CovercutConfigurationError,
    EvolutionAPIError,
    EvolutionConfigurationError,
)
from src.dependecies import BusinessIntegrationServiceDep, WhatsAppConnectionServiceDep
from src.schemas import BusinessIntegrationUpdate
from src.services.business_integration_service import BusinessIntegrationNotFoundError
from src.services.evolution_instance_service import (
    EvolutionInstanceConflictError,
    EvolutionInstanceNotFoundError,
    EvolutionWebhookConfigurationError,
)
from src.services.whatsapp_connection_service import (
    WhatsAppConnectionConflictError,
    WhatsAppConnectionNotFoundError,
    WhatsAppProviderUnavailableError,
)

from ..dependencies import AdminSessionDep, SuperAdminSessionDep, validate_csrf
from ..templating import redirect_with_flash, render


router = APIRouter(prefix="/integrations", tags=["Admin ➔ Integrations"])


def _raise_whatsapp_http_error(exc: Exception) -> None:
    if isinstance(exc, (WhatsAppConnectionNotFoundError, EvolutionInstanceNotFoundError)):
        raise HTTPException(status_code=404, detail="Integração ou conexão não encontrada.")
    if isinstance(exc, (WhatsAppConnectionConflictError, EvolutionInstanceConflictError)):
        raise HTTPException(status_code=409, detail="A empresa já possui outra conexão vinculada.")
    if isinstance(
        exc,
        (
            WhatsAppProviderUnavailableError,
            CovercutConfigurationError,
            EvolutionConfigurationError,
            EvolutionWebhookConfigurationError,
        ),
    ):
        raise HTTPException(status_code=503, detail="Provider WhatsApp ainda não está configurado no servidor.")
    if isinstance(exc, (CovercutAPIError, EvolutionAPIError)):
        raise HTTPException(status_code=502, detail="Não foi possível concluir a operação no provider WhatsApp.")
    raise exc


@router.get("")
def integrations_page(
    request: Request,
    service: BusinessIntegrationServiceDep,
    whatsapp_service: WhatsAppConnectionServiceDep,
    session: AdminSessionDep,
):
    integrations = service.get_all(session.business_id)
    whatsapp_connection = whatsapp_service.get_for_business(session.business_id)
    whatsapp_configured = {}
    for item in integrations:
        try:
            whatsapp_configured[item.integration_id] = whatsapp_service.configured_for(
                session.business_id,
                item.integration_id,
            )
        except WhatsAppConnectionNotFoundError:
            whatsapp_configured[item.integration_id] = False

    return render(
        request,
        "admin/integrations/index.html",
        {
            "integrations": integrations,
            "whatsapp_connection": whatsapp_connection,
            "whatsapp_configured": whatsapp_configured,
        },
        session=session,
        active="integrations",
    )


@router.post("/{integration_id}/whatsapp/connect")
async def connect_whatsapp_action(
    integration_id: int,
    request: Request,
    service: WhatsAppConnectionServiceDep,
    session: AdminSessionDep,
):
    await validate_csrf(request)
    try:
        return (await service.provision(session.business_id, integration_id)).as_dict()
    except Exception as exc:
        _raise_whatsapp_http_error(exc)


@router.get("/{integration_id}/whatsapp/status")
async def whatsapp_status_action(
    integration_id: int,
    service: WhatsAppConnectionServiceDep,
    session: AdminSessionDep,
):
    try:
        return (await service.refresh_status(session.business_id, integration_id)).as_dict()
    except Exception as exc:
        _raise_whatsapp_http_error(exc)


@router.post("/{integration_id}/whatsapp/qrcode")
async def refresh_whatsapp_qrcode_action(
    integration_id: int,
    request: Request,
    service: WhatsAppConnectionServiceDep,
    session: AdminSessionDep,
):
    await validate_csrf(request)
    try:
        return (await service.refresh_qr_code(session.business_id, integration_id)).as_dict()
    except Exception as exc:
        _raise_whatsapp_http_error(exc)


@router.post("/{integration_id}/whatsapp/logout")
async def logout_whatsapp_action(
    integration_id: int,
    request: Request,
    service: WhatsAppConnectionServiceDep,
    session: AdminSessionDep,
):
    await validate_csrf(request)
    try:
        return (await service.disconnect(session.business_id, integration_id)).as_dict()
    except Exception as exc:
        _raise_whatsapp_http_error(exc)


@router.post("/{integration_id}/whatsapp/remove")
async def remove_whatsapp_action(
    integration_id: int,
    request: Request,
    service: WhatsAppConnectionServiceDep,
    session: AdminSessionDep,
):
    await validate_csrf(request)
    try:
        await service.remove(session.business_id, integration_id)
        return {"removed": True}
    except Exception as exc:
        _raise_whatsapp_http_error(exc)


@router.post("/{integration_id}/config")
async def update_integration_config_action(
    integration_id: int,
    request: Request,
    service: BusinessIntegrationServiceDep,
    session: SuperAdminSessionDep,
):
    await validate_csrf(request)
    form = await request.form()

    try:
        config = json.loads(str(form.get("config") or "{}"))
        service.update_config(
            session.business_id,
            integration_id,
            BusinessIntegrationUpdate(config=config),
        )
    except json.JSONDecodeError:
        return redirect_with_flash(
            "/admin/integrations",
            "JSON de configuração inválido.",
            "error",
            request=request,
        )
    except BusinessIntegrationNotFoundError:
        return redirect_with_flash(
            "/admin/integrations",
            "Integração não encontrada.",
            "error",
            request=request,
        )

    return redirect_with_flash("/admin/integrations", "Configuração atualizada.", request=request)
