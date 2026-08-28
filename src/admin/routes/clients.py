from collections import Counter, defaultdict
from datetime import datetime, timezone

from pydantic import ValidationError
from fastapi import APIRouter, Request

from src.utils import form_value
from src.dependecies import (
    AppointmentServiceDep,
    BusinessServiceDep,
    ClientServiceDep,
    ProfessionalServiceDep,
)
from src.schemas import ClientCreate, ClientUpdate
from src.services.client_service import ClientAlreadyExistsError, ClientNotFoundError

from ..templating import redirect_with_flash, render, safe_timezone
from ..dependencies import AdminSessionDep, validate_csrf


router = APIRouter(prefix="/clients", tags=["Admin ➔ Clients"])

WEEKDAY_LABELS = (
    "Segunda",
    "Terça",
    "Quarta",
    "Quinta",
    "Sexta",
    "Sábado",
    "Domingo",
)


def _status_value(value) -> str:
    return str(getattr(value, "value", value))


def _build_client_schedule_overview(
    appointments,
    professionals_by_id: dict[int, object],
    now: datetime | None = None,
    business_timezone=timezone.utc,
) -> dict[int, dict]:
    """Derive demo-friendly weekly patterns without creating recurrence metadata."""
    now = now or datetime.now(timezone.utc)
    appointments_by_client = defaultdict(list)
    for appointment in appointments:
        start_datetime = appointment.start_datetime
        if start_datetime.tzinfo:
            start_datetime = start_datetime.astimezone(business_timezone)
        else:
            start_datetime = start_datetime.replace(tzinfo=business_timezone)
        appointments_by_client[appointment.client_id].append((appointment, start_datetime))

    if now.tzinfo:
        local_now = now.astimezone(business_timezone)
    else:
        local_now = now.replace(tzinfo=business_timezone)

    result: dict[int, dict] = {}
    for client_id, client_appointments in appointments_by_client.items():
        pattern_counts = Counter(
            (
                start_datetime.weekday(),
                start_datetime.strftime("%H:%M"),
                item.professional_id,
            )
            for item, start_datetime in client_appointments
        )
        pattern_has_active_occurrence = defaultdict(bool)
        for item, start_datetime in client_appointments:
            key = (
                start_datetime.weekday(),
                start_datetime.strftime("%H:%M"),
                item.professional_id,
            )
            if _status_value(item.status) != "canceled":
                pattern_has_active_occurrence[key] = True

        fixed_keys = {
            key
            for key, count in pattern_counts.items()
            if count >= 2 and pattern_has_active_occurrence[key]
        }
        fixed_slots = []
        for weekday, time_label, professional_id in sorted(fixed_keys):
            professional = professionals_by_id.get(professional_id)
            fixed_slots.append(
                {
                    "weekday": WEEKDAY_LABELS[weekday],
                    "time": time_label,
                    "professional": getattr(professional, "name", None)
                    or f"Professor #{professional_id}",
                    "occurrences": pattern_counts[(weekday, time_label, professional_id)],
                }
            )

        isolated_appointments = []
        for item, start_datetime in sorted(
            client_appointments,
            key=lambda appointment_with_start: appointment_with_start[1],
        ):
            key = (
                start_datetime.weekday(),
                start_datetime.strftime("%H:%M"),
                item.professional_id,
            )
            if key in fixed_keys or _status_value(item.status) != "scheduled":
                continue

            if start_datetime < local_now:
                continue

            professional = professionals_by_id.get(item.professional_id)
            isolated_appointments.append(
                {
                    "date": start_datetime.strftime("%d/%m/%Y"),
                    "weekday": WEEKDAY_LABELS[start_datetime.weekday()],
                    "time": start_datetime.strftime("%H:%M"),
                    "professional": getattr(professional, "name", None)
                    or f"Professor #{item.professional_id}",
                }
            )

        result[client_id] = {
            "fixed_slots": fixed_slots,
            "isolated_appointments": isolated_appointments[:3],
        }

    return result

@router.get("")
def clients_page(
    request: Request,
    service: ClientServiceDep,
    appointment_service: AppointmentServiceDep,
    professional_service: ProfessionalServiceDep,
    business_service: BusinessServiceDep,
    session: AdminSessionDep,
    q: str | None = None,
):
    clients = service.get_all(session.business_id)
    if q:
        q_lower = q.lower().strip()
        clients = [c for c in clients if q_lower in (c.name or "").lower() or q_lower in c.phone]

    professionals_by_id = {
        item.id: item for item in professional_service.get_all(session.business_id)
    }
    schedule_overview = _build_client_schedule_overview(
        appointment_service.get_all(session.business_id),
        professionals_by_id,
        business_timezone=safe_timezone(
            business_service.get_by_id(session.business_id).timezone
        ),
    )

    return render(
        request,
        "admin/clients/index.html",
        {"clients": clients, "q": q or "", "schedule_overview": schedule_overview},
        session=session,
        active="clients",
    )

@router.post("")
async def create_client_action(request: Request, service: ClientServiceDep, session: AdminSessionDep):
    await validate_csrf(request)
    form = await request.form()
    try:
        data = ClientCreate(
            name=form_value(form, "name"),
            phone=form_value(form, "phone", ""),
        )
        service.create(session.business_id, data)

    except (ValidationError, ValueError):
        return redirect_with_flash("/admin/clients", "Dados inválidos. Confira nome e telefone.", "error", request=request)
    
    except ClientAlreadyExistsError:
        return redirect_with_flash("/admin/clients", "Aluno já cadastrado.", "error", request=request)

    return redirect_with_flash("/admin/clients", "Aluno criado com sucesso.", request=request)

@router.post("/{client_id}")
async def update_client_action(client_id: int, request: Request, service: ClientServiceDep, session: AdminSessionDep):
    await validate_csrf(request)
    form = await request.form()
    try:
        data = ClientUpdate(
            name=form_value(form, "name"),
            phone=form_value(form, "phone"),
        )
        service.update(session.business_id, client_id, data)

    except ValidationError:
        return redirect_with_flash("/admin/clients", "Dados inválidos.", "error", request=request)
    
    except ClientNotFoundError:
        return redirect_with_flash("/admin/clients", "Aluno não encontrado.", "error", request=request)
    
    except ClientAlreadyExistsError:
        return redirect_with_flash("/admin/clients", "Já existe aluno com esse telefone.", "error", request=request)

    return redirect_with_flash("/admin/clients", "Aluno atualizado com sucesso.", request=request)
