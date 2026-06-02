import json

from fastapi import APIRouter, Request

from src.schemas import BusinessIntegrationUpdate
from src.dependecies import BusinessIntegrationServiceDep
from src.services.business_integration_service import BusinessIntegrationNotFoundError

from ..templating import render, redirect_with_flash
from ..dependencies import AdminSessionDep, SuperAdminSessionDep, validate_csrf

router = APIRouter(prefix="/integrations", tags=["Admin ➔ Integrations"])

@router.get("")
def integrations_page(request: Request, service: BusinessIntegrationServiceDep, session: AdminSessionDep):
    integrations = service.get_all(session.business_id)

    return render(
        request,
        "admin/integrations/index.html",
        {"integrations": integrations},
        session=session,
        active="integrations",
    )

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
        return redirect_with_flash("/admin/integrations", "JSON de configuração inválido.", "error")
    
    except BusinessIntegrationNotFoundError:
        return redirect_with_flash("/admin/integrations", "Integração não encontrada.", "error")

    return redirect_with_flash("/admin/integrations", "Configuração atualizada.")