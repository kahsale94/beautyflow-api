from zoneinfo import ZoneInfo
from datetime import datetime, timedelta

from pydantic import ValidationError
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from src.schemas import AppointmentCreate, AppointmentUpdate
from src.utils import form_int, form_value, local_datetime_from_form
from src.dependecies import AppointmentServiceDep, BusinessServiceDep, ClientServiceDep, ProfessionalServiceDep, ServiceServiceDep
from src.services.appointment_service import ( AppointmentAlreadyCanceledError, AppointmentAlreadyCompletedError, AppointmentNotFoundError,
    AppointmentTimeConflictError, ClientNotFoundError, DatetimeFormatError, ProfessionalNotAvailableError, ProfessionalServiceMismatchError, ServiceNotAvailableError,
)

from ..dependencies import AdminSessionDep, validate_csrf
from ..templating import render, redirect_with_flash, attach_refreshed_admin_cookies

router = APIRouter(prefix="/appointments", tags=["Admin ➔ Appointments"])

DEFAULT_ADMIN_TIMEZONE = "America/Sao_Paulo"


def _safe_timezone(timezone_name: str | None):
    try:
        return ZoneInfo(timezone_name or DEFAULT_ADMIN_TIMEZONE)
    except Exception:
        return ZoneInfo(DEFAULT_ADMIN_TIMEZONE)

def _safe_timezone_name(timezone_name: str | None) -> str:
    return getattr(_safe_timezone(timezone_name), "key", DEFAULT_ADMIN_TIMEZONE)

def _parse_calendar_datetime(value: str, timezone_name: str | None) -> datetime:
    value = value.replace("Z", "+00:00")
    parsed = datetime.fromisoformat(value)
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=_safe_timezone(timezone_name))
    return parsed

def _round_up_to_slot(value: datetime, interval_minutes: int | None) -> datetime:
    interval = max(int(interval_minutes or 15), 1)
    has_subminute_value = bool(value.second or value.microsecond)
    value = value.replace(second=0, microsecond=0)
    remainder = value.minute % interval
    if remainder:
        value += timedelta(minutes=interval - remainder)
    elif has_subminute_value:
        value += timedelta(minutes=interval)
    return value

def _slot_duration(interval_minutes: int | None) -> str:
    interval = max(int(interval_minutes or 15), 1)
    hours, minutes = divmod(interval, 60)
    return f"{hours:02d}:{minutes:02d}:00"

def _appointment_error_message(exc: Exception) -> str:
    if isinstance(exc, AppointmentTimeConflictError):
        return "Horário já ocupado."
    if isinstance(exc, ProfessionalNotAvailableError):
        return "Profissional indisponível nesse horário."
    if isinstance(exc, ServiceNotAvailableError):
        return "Serviço não disponível."
    if isinstance(exc, ClientNotFoundError):
        return "Cliente não encontrado."
    if isinstance(exc, ProfessionalServiceMismatchError):
        return "Esse profissional não executa o serviço selecionado."
    if isinstance(exc, DatetimeFormatError):
        return "Data inválida."
    if isinstance(exc, AppointmentAlreadyCanceledError):
        return "Agendamento já cancelado."
    if isinstance(exc, AppointmentAlreadyCompletedError):
        return "Agendamento já concluído."

    return "Não foi possível salvar o agendamento."

@router.get("")
def calendar_page(request: Request, client_service: ClientServiceDep, professional_service: ProfessionalServiceDep, service_service: ServiceServiceDep,
    business_service: BusinessServiceDep, session: AdminSessionDep):
    business = business_service.get_by_id(session.business_id)
    business_timezone = _safe_timezone_name(business.timezone)
    tz = _safe_timezone(business_timezone)
    now = datetime.now(tz)
    min_start = now + timedelta(minutes=business.minimum_notice_minutes)
    default_start = _round_up_to_slot(min_start, business.slot_interval_minutes)
    max_start = now + timedelta(days=business.maximum_schedule_days)

    return render(
        request,
        "admin/appointments/calendar.html",
        {
            "business": business,
            "business_timezone": business_timezone,
            "default_start_datetime": default_start.strftime("%Y-%m-%dT%H:%M"),
            "min_start_datetime": min_start.strftime("%Y-%m-%dT%H:%M"),
            "max_start_datetime": max_start.strftime("%Y-%m-%dT%H:%M"),
            "slot_interval_seconds": business.slot_interval_minutes * 60,
            "slot_duration": _slot_duration(business.slot_interval_minutes),
            "clients": client_service.get_all(session.business_id),
            "professionals": professional_service.get_all(session.business_id),
            "services": service_service.get_all(session.business_id),
        },
        session=session,
        active="appointments",
    )

@router.get("/events")
def calendar_events(request: Request, start: str, end: str, appointment_service: AppointmentServiceDep, business_service: BusinessServiceDep,
    client_service: ClientServiceDep, professional_service: ProfessionalServiceDep, service_service: ServiceServiceDep, session: AdminSessionDep, professional_id: int | None = None):
    business = business_service.get_by_id(session.business_id)
    business_timezone = _safe_timezone_name(business.timezone)
    start_dt = _parse_calendar_datetime(start, business_timezone)
    end_dt = _parse_calendar_datetime(end, business_timezone)

    appointments = appointment_service.get_by_period(
        session.business_id,
        start_dt,
        end_dt,
        professional_id,
    )

    clients = {item.id: item for item in client_service.get_all(session.business_id)}
    professionals = {item.id: item for item in professional_service.get_all(session.business_id)}
    services = {item.id: item for item in service_service.get_all(session.business_id)}

    events = []
    for appointment in appointments:
        client = clients.get(appointment.client_id)
        professional = professionals.get(appointment.professional_id)
        service = services.get(appointment.service_id)
        status = appointment.status.value if hasattr(appointment.status, "value") else str(appointment.status)

        title = f"{client.name if client and client.name else client.phone if client else 'Cliente'} - {service.name if service else 'Serviço'}"

        events.append(
            {
                "id": str(appointment.id),
                "title": title,
                "start": appointment.start_datetime.isoformat(),
                "end": appointment.end_datetime.isoformat(),
                "extendedProps": {
                    "status": status,
                    "client": client.name if client and client.name else client.phone if client else "",
                    "professional": professional.name if professional else "",
                    "service": service.name if service else "",
                },
            }
        )

    response = JSONResponse(events)
    attach_refreshed_admin_cookies(request, response)
    return response

@router.get("/{appointment_id}/details")
def appointment_details_fragment(appointment_id: int, request: Request, appointment_service: AppointmentServiceDep, business_service: BusinessServiceDep,
    client_service: ClientServiceDep, professional_service: ProfessionalServiceDep, service_service: ServiceServiceDep, session: AdminSessionDep):
    appointment = appointment_service.get_by_id(session.business_id, appointment_id)
    business = business_service.get_by_id(session.business_id)
    business_timezone = _safe_timezone_name(business.timezone)
    clients = {item.id: item for item in client_service.get_all(session.business_id)}
    professionals = {item.id: item for item in professional_service.get_all(session.business_id)}
    services = {item.id: item for item in service_service.get_all(session.business_id)}
    return render(
        request,
        "admin/appointments/_details.html",
        {
            "appointment": appointment,
            "client": clients.get(appointment.client_id),
            "professional": professionals.get(appointment.professional_id),
            "service": services.get(appointment.service_id),
            "clients": list(clients.values()),
            "professionals": list(professionals.values()),
            "services": list(services.values()),
            "business_timezone": business_timezone,
            "slot_interval_minutes": business.slot_interval_minutes,
            "slot_interval_seconds": business.slot_interval_minutes * 60,
        },
        session=session,
        active="appointments",
    )

@router.post("")
async def create_appointment_action(request: Request, appointment_service: AppointmentServiceDep, business_service: BusinessServiceDep, session: AdminSessionDep):
    await validate_csrf(request)
    form = await request.form()
    business = business_service.get_by_id(session.business_id)
    business_timezone = _safe_timezone_name(business.timezone)
    try:
        start_value = form_value(form, "start_datetime", "")
        data = AppointmentCreate(
            client_id=form_int(form, "client_id"),
            professional_id=form_int(form, "professional_id"),
            service_id=form_int(form, "service_id"),
            start_datetime=local_datetime_from_form(start_value, business_timezone),
        )
        appointment_service.create(session.business_id, data)

    except (ValidationError, ValueError) as exc:
        return redirect_with_flash("/admin/appointments", _appointment_error_message(exc), "error", request = request)

    except Exception as exc:
        return redirect_with_flash("/admin/appointments", _appointment_error_message(exc), "error", request = request)

    return redirect_with_flash("/admin/appointments", "Agendamento criado com sucesso.", request = request)

@router.post("/{appointment_id}")
async def update_appointment_action(appointment_id: int, request: Request, appointment_service: AppointmentServiceDep, business_service: BusinessServiceDep, session: AdminSessionDep):
    await validate_csrf(request)
    form = await request.form()
    business = business_service.get_by_id(session.business_id)
    business_timezone = _safe_timezone_name(business.timezone)
    try:
        start_value = form_value(form, "start_datetime", "")
        data = AppointmentUpdate(
            client_id=form_int(form, "client_id"),
            professional_id=form_int(form, "professional_id"),
            service_id=form_int(form, "service_id"),
            start_datetime=local_datetime_from_form(start_value, business_timezone),
        )
        appointment_service.update(session.business_id, appointment_id, data)

    except AppointmentNotFoundError:
        return redirect_with_flash("/admin/appointments", "Agendamento não encontrado.", "error", request = request)

    except (ValidationError, ValueError) as exc:
        return redirect_with_flash("/admin/appointments", _appointment_error_message(exc), "error", request = request)

    except Exception as exc:
        return redirect_with_flash("/admin/appointments", _appointment_error_message(exc), "error", request = request)

    return redirect_with_flash("/admin/appointments", "Agendamento atualizado com sucesso.", request = request)

@router.post("/{appointment_id}/cancel")
async def cancel_appointment_action(appointment_id: int, request: Request, appointment_service: AppointmentServiceDep, session: AdminSessionDep):
    await validate_csrf(request)

    try:
        appointment_service.cancel(session.business_id, appointment_id)

    except Exception as exc:
        return redirect_with_flash("/admin/appointments", _appointment_error_message(exc), "error", request = request)

    return redirect_with_flash("/admin/appointments", "Agendamento cancelado.", request = request)

@router.post("/{appointment_id}/complete")
async def complete_appointment_action(appointment_id: int, request: Request, appointment_service: AppointmentServiceDep, session: AdminSessionDep):
    await validate_csrf(request)

    try:
        appointment_service.complete(session.business_id, appointment_id)

    except Exception as exc:
        return redirect_with_flash("/admin/appointments", _appointment_error_message(exc), "error", request = request)

    return redirect_with_flash("/admin/appointments", "Agendamento concluído.", request = request)