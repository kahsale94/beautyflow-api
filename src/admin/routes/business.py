from pydantic import ValidationError
from fastapi import APIRouter, Request

from src.schemas import BusinessUpdate
from src.dependecies import BusinessServiceDep
from src.models.business_model import BusinessType
from src.utils import form_bool, form_int, form_value
from src.services.business_service import BusinessAlreadyExistsError, BusinessNotFoundError

from ..templating import render, redirect_with_flash
from ..dependencies import AdminSessionDep, validate_csrf

router = APIRouter(prefix="/business")

@router.get("")
def business_settings_page(request: Request, service: BusinessServiceDep, session: AdminSessionDep):
    business = service.get_by_id(session.business_id)

    return render(
        request,
        "admin/business/settings.html",
        {"business": business, "business_types": list(BusinessType)},
        session=session,
        active="business",
    )

@router.post("")
async def update_business_settings_action(request: Request, service: BusinessServiceDep, session: AdminSessionDep):
    await validate_csrf(request)
    form = await request.form()
    try:
        data = BusinessUpdate(
            name=form_value(form, "name"),
            slug=form_value(form, "slug"),
            type=form_value(form, "type"),
            timezone=form_value(form, "timezone"),
            phone=form_value(form, "phone"),
            email=form_value(form, "email"),
            address=form_value(form, "address"),
            city=form_value(form, "city"),
            state=form_value(form, "state"),
            description=form_value(form, "description"),
            booking_enabled=form_bool(form, "booking_enabled"),
            slot_interval_minutes=form_int(form, "slot_interval_minutes"),
            minimum_notice_minutes=form_int(form, "minimum_notice_minutes"),
            maximum_schedule_days=form_int(form, "maximum_schedule_days"),
            allow_client_cancel=form_bool(form, "allow_client_cancel"),
            cancel_limit_hours=form_int(form, "cancel_limit_hours"),
            appointment_confirmation_required=form_bool(form, "appointment_confirmation_required"),
        )
        service.update(session.business_id, data)

    except ValidationError:
        return redirect_with_flash("/admin/business", "Dados inválidos. Verifique os campos da empresa.", "error")
    
    except BusinessNotFoundError:
        return redirect_with_flash("/admin/business", "Empresa não encontrada.", "error")
    
    except BusinessAlreadyExistsError:
        return redirect_with_flash("/admin/business", "Já existe empresa com esse nome ou slug.", "error")

    return redirect_with_flash("/admin/business", "Dados da empresa atualizados.")