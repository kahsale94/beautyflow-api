from pydantic import ValidationError
from fastapi import APIRouter, Request

from src.dependecies import ClientServiceDep, RecurringScheduleServiceDep, ServiceServiceDep
from src.schemas import RecurringScheduleCreate, RecurringScheduleUpdate
from src.services.recurring_schedule_service import (
    RecurringScheduleFeatureDisabledError,
    RecurringScheduleInvalidStateError,
    RecurringScheduleNotFoundError,
    RecurringScheduleRelatedEntityError,
)
from src.utils import form_int, form_value

from ..dependencies import AdminSessionDep, validate_csrf
from ..templating import WEEKDAYS, redirect_with_flash, render


router = APIRouter(prefix="/recurring-schedules", tags=["Admin ➔ Recurring Schedules"])


def _error_redirect(request: Request, exc: Exception):
    if isinstance(exc, RecurringScheduleFeatureDisabledError):
        message = "Ative horários recorrentes nos recursos da empresa."
    elif isinstance(exc, RecurringScheduleNotFoundError):
        message = "Horário recorrente não encontrado."
    elif isinstance(exc, RecurringScheduleInvalidStateError):
        message = "Ação incompatível com o estado do horário recorrente."
    elif isinstance(exc, RecurringScheduleRelatedEntityError):
        message = "Cliente ou serviço inválido para esta empresa."
    else:
        message = str(exc) or "Dados inválidos para o horário recorrente."
    return redirect_with_flash(
        "/admin/recurring-schedules", message, "error", request=request
    )


@router.get("")
def recurring_schedules_page(
    request: Request,
    recurring_service: RecurringScheduleServiceDep,
    client_service: ClientServiceDep,
    service_service: ServiceServiceDep,
    session: AdminSessionDep,
):
    feature_enabled = True
    try:
        schedules = recurring_service.list(session.business_id)
    except RecurringScheduleFeatureDisabledError:
        feature_enabled = False
        schedules = []
    clients = client_service.get_all(session.business_id)
    services = service_service.get_all(session.business_id)
    return render(
        request,
        "admin/recurring_schedules/index.html",
        {
            "schedules": schedules,
            "clients": clients,
            "services": services,
            "clients_by_id": {item.id: item for item in clients},
            "services_by_id": {item.id: item for item in services},
            "weekdays": WEEKDAYS,
            "feature_enabled": feature_enabled,
        },
        session=session,
        active="recurring_schedules",
    )


@router.post("")
async def create_recurring_schedule_action(
    request: Request,
    recurring_service: RecurringScheduleServiceDep,
    session: AdminSessionDep,
):
    await validate_csrf(request)
    form = await request.form()
    try:
        recurring_service.create(
            session.business_id,
            RecurringScheduleCreate(
                client_id=form_int(form, "client_id"),
                service_id=form_int(form, "service_id"),
                weekday=form_int(form, "weekday"),
                start_time=form_value(form, "start_time"),
                effective_from=form_value(form, "effective_from"),
                effective_until=form_value(form, "effective_until"),
            ),
        )
    except (ValidationError, ValueError, RecurringScheduleFeatureDisabledError,
            RecurringScheduleRelatedEntityError) as exc:
        return _error_redirect(request, exc)
    return redirect_with_flash(
        "/admin/recurring-schedules", "Horário recorrente criado.", request=request
    )


@router.post("/{series_id}")
async def update_recurring_schedule_action(
    series_id: int,
    request: Request,
    recurring_service: RecurringScheduleServiceDep,
    session: AdminSessionDep,
):
    await validate_csrf(request)
    form = await request.form()
    try:
        recurring_service.update(
            session.business_id,
            series_id,
            RecurringScheduleUpdate(
                client_id=form_int(form, "client_id"),
                service_id=form_int(form, "service_id"),
                weekday=form_int(form, "weekday"),
                start_time=form_value(form, "start_time"),
                effective_from=form_value(form, "effective_from"),
                effective_until=form_value(form, "effective_until"),
            ),
        )
    except Exception as exc:
        return _error_redirect(request, exc)
    return redirect_with_flash(
        "/admin/recurring-schedules", "Horário recorrente atualizado.", request=request
    )


@router.post("/{series_id}/{action}")
async def recurring_schedule_lifecycle_action(
    series_id: int,
    action: str,
    request: Request,
    recurring_service: RecurringScheduleServiceDep,
    session: AdminSessionDep,
):
    await validate_csrf(request)
    operations = {
        "pause": recurring_service.pause,
        "resume": recurring_service.resume,
        "cancel": recurring_service.cancel,
    }
    operation = operations.get(action)
    if not operation:
        return _error_redirect(request, ValueError("Ação inválida."))
    try:
        operation(session.business_id, series_id)
    except Exception as exc:
        return _error_redirect(request, exc)
    return redirect_with_flash(
        "/admin/recurring-schedules", "Estado do horário recorrente atualizado.", request=request
    )
