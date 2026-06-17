from pydantic import ValidationError
from fastapi import APIRouter, Request

from src.dependecies import ServiceServiceDep
from src.schemas import ServiceCreate, ServiceUpdate
from src.utils import form_decimal, form_int, form_value
from src.services.service_service import ServiceAlreadyExistsError, ServiceNotFoundError

from ..templating import render, redirect_with_flash
from ..dependencies import AdminSessionDep, validate_csrf


router = APIRouter(prefix="/services", tags=["Admin ➔ Services"])

@router.get("")
def services_page(request: Request, service: ServiceServiceDep, session: AdminSessionDep, q: str | None = None):
    services = service.get_all(session.business_id)
    if q:
        q_lower = q.lower().strip()
        services = [item for item in services if q_lower in item.name.lower()]

    return render(
        request,
        "admin/services/index.html",
        {"services": services, "q": q or ""},
        session=session,
        active="services",
    )

@router.post("")
async def create_service_action(request: Request, service: ServiceServiceDep, session: AdminSessionDep):
    await validate_csrf(request)
    form = await request.form()
    
    try:
        data = ServiceCreate(
            name=form_value(form, "name", ""),
            duration_minutes=form_int(form, "duration_minutes", 0),
            price=form_decimal(form, "price"),
        )
        service.create(session.business_id, data)

    except (ValidationError, ValueError):
        return redirect_with_flash("/admin/services", "Dados inválidos para o serviço.", "error", request=request)
    
    except ServiceAlreadyExistsError:
        return redirect_with_flash("/admin/services", "Serviço já cadastrado.", "error", request=request)

    return redirect_with_flash("/admin/services", "Serviço criado com sucesso.", request=request)

@router.post("/{service_id}")
async def update_service_action(service_id: int, request: Request, service: ServiceServiceDep, session: AdminSessionDep):
    await validate_csrf(request)
    form = await request.form()

    try:
        data = ServiceUpdate(
            name=form_value(form, "name"),
            duration_minutes=form_int(form, "duration_minutes"),
            price=form_decimal(form, "price"),
        )
        service.update(session.business_id, service_id, data)

    except ValidationError:
        return redirect_with_flash("/admin/services", "Dados inválidos para atualização.", "error", request=request)
    
    except ServiceNotFoundError:
        return redirect_with_flash("/admin/services", "Serviço não encontrado.", "error", request=request)
    
    except ServiceAlreadyExistsError:
        return redirect_with_flash("/admin/services", "Já existe um serviço com esse nome.", "error", request=request)

    return redirect_with_flash("/admin/services", "Serviço atualizado com sucesso.", request=request)

@router.post("/{service_id}/deactivate")
async def deactivate_service_action(service_id: int, request: Request, service: ServiceServiceDep, session: AdminSessionDep):
    await validate_csrf(request)

    try:
        service.deactivate(session.business_id, service_id)

    except ServiceNotFoundError:
        return redirect_with_flash("/admin/services", "Serviço não encontrado.", "error", request=request)
    
    return redirect_with_flash("/admin/services", "Serviço desativado com sucesso.", request=request)
