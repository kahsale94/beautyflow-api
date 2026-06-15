import json

from fastapi import APIRouter, HTTPException, Request

from src.clients import EvolutionAPIError, EvolutionConfigurationError
from src.schemas import BusinessIntegrationUpdate
from src.dependecies import BusinessIntegrationServiceDep, EvolutionInstanceServiceDep
from src.services.business_integration_service import BusinessIntegrationNotFoundError
from src.services.evolution_instance_service import (
    EvolutionInstanceConflictError,
    EvolutionInstanceNotFoundError,
    EvolutionWebhookConfigurationError,
)

from ..templating import render, redirect_with_flash
from ..dependencies import AdminSessionDep, SuperAdminSessionDep, validate_csrf

router = APIRouter(prefix="/integrations", tags=["Admin ➔ Integrations"])

def _raise_evolution_http_error(exc: Exception) -> None:
    if isinstance(exc, EvolutionInstanceNotFoundError):
        raise HTTPException(status_code=404, detail="Integração ou instância não encontrada.")
    if isinstance(exc, EvolutionInstanceConflictError):
        raise HTTPException(status_code=409, detail="A empresa já possui outra instância vinculada.")
    if isinstance(exc, (EvolutionConfigurationError, EvolutionWebhookConfigurationError)):
        raise HTTPException(status_code=503, detail="Evolution API ainda não está configurada no servidor.")
    if isinstance(exc, EvolutionAPIError):
        raise HTTPException(status_code=502, detail="Não foi possível concluir a operação na Evolution API.")
    raise exc


@router.get("")
def integrations_page(
    request: Request,
    service: BusinessIntegrationServiceDep,
    evolution_service: EvolutionInstanceServiceDep,
    session: AdminSessionDep,
):
    integrations = service.get_all(session.business_id)
    evolution_instance = evolution_service.get_for_business(session.business_id)

    return render(
        request,
        "admin/integrations/index.html",
        {
            "integrations": integrations,
            "evolution_instance": evolution_instance,
            "evolution_configured": evolution_service.configured,
        },
        session=session,
        active="integrations",
    )


@router.post("/{integration_id}/whatsapp/connect")
async def connect_whatsapp_action(
    integration_id: int,
    request: Request,
    service: EvolutionInstanceServiceDep,
    session: AdminSessionDep,
):
    await validate_csrf(request)
    try:
        result = await service.provision(session.business_id, integration_id)
        return result.as_dict()
    except (
        EvolutionAPIError,
        EvolutionConfigurationError,
        EvolutionInstanceConflictError,
        EvolutionInstanceNotFoundError,
        EvolutionWebhookConfigurationError,
    ) as exc:
        _raise_evolution_http_error(exc)


@router.get("/{integration_id}/whatsapp/status")
async def whatsapp_status_action(
    integration_id: int,
    service: EvolutionInstanceServiceDep,
    session: AdminSessionDep,
):
    try:
        result = await service.refresh_status(session.business_id, integration_id)
        return result.as_dict()
    except (
        EvolutionAPIError,
        EvolutionConfigurationError,
        EvolutionInstanceNotFoundError,
    ) as exc:
        _raise_evolution_http_error(exc)


@router.post("/{integration_id}/whatsapp/qrcode")
async def refresh_whatsapp_qrcode_action(
    integration_id: int,
    request: Request,
    service: EvolutionInstanceServiceDep,
    session: AdminSessionDep,
):
    await validate_csrf(request)
    try:
        result = await service.refresh_qr_code(session.business_id, integration_id)
        return result.as_dict()
    except (
        EvolutionAPIError,
        EvolutionConfigurationError,
        EvolutionInstanceNotFoundError,
        EvolutionWebhookConfigurationError,
    ) as exc:
        _raise_evolution_http_error(exc)


@router.post("/{integration_id}/whatsapp/logout")
async def logout_whatsapp_action(
    integration_id: int,
    request: Request,
    service: EvolutionInstanceServiceDep,
    session: AdminSessionDep,
):
    await validate_csrf(request)
    try:
        result = await service.logout(session.business_id, integration_id)
        return result.as_dict()
    except (
        EvolutionAPIError,
        EvolutionConfigurationError,
        EvolutionInstanceNotFoundError,
    ) as exc:
        _raise_evolution_http_error(exc)


@router.post("/{integration_id}/whatsapp/remove")
async def remove_whatsapp_action(
    integration_id: int,
    request: Request,
    service: EvolutionInstanceServiceDep,
    session: AdminSessionDep,
):
    await validate_csrf(request)
    try:
        await service.delete(session.business_id, integration_id)
        return {"removed": True}
    except (
        EvolutionAPIError,
        EvolutionConfigurationError,
        EvolutionInstanceNotFoundError,
    ) as exc:
        _raise_evolution_http_error(exc)


@router.post("/{integration_id}/config")
async def update_integration_config_action(integration_id: int, request: Request, service: BusinessIntegrationServiceDep, session: SuperAdminSessionDep):
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
        return redirect_with_flash("/admin/integrations", "JSON de configuração inválido.", "error", request=request)
    
    except BusinessIntegrationNotFoundError:
        return redirect_with_flash("/admin/integrations", "Integração não encontrada.", "error", request=request)

    return redirect_with_flash("/admin/integrations", "Configuração atualizada.", request=request)
