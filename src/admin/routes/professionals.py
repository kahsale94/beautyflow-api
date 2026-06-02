from pydantic import ValidationError
from fastapi import APIRouter, Request

from src.utils import form_value, normalize_phone
from src.services.availability_service import AvailabilityAlreadyExistsError, AvailabilityNotFoundError
from src.services.professional_service import ProfessionalAlreadyExistsError, ProfessionalNotFoundError
from src.dependecies import AvailabilityServiceDep, ProfessionalServiceDep, ProfessionalServiceLinkServiceDep, ServiceServiceDep
from src.schemas import AvailabilityCreate, AvailabilityUpdate, ProfessionalCreate, ProfessionalServiceCreate, ProfessionalUpdate
from src.services.professional_service_link_service import ProfessionalServiceLinkAlreadyExistsError, ProfessionalServiceLinkNotFoundError

from ..dependencies import AdminSessionDep, validate_csrf
from ..templating import WEEKDAYS, render, redirect_with_flash

router = APIRouter(prefix="/professionals", tags=["Admin ➔ Professionals"])

@router.get("")
def professionals_page(request: Request, professional_service: ProfessionalServiceDep, session: AdminSessionDep, q: str | None = None):
    professionals = professional_service.get_all(session.business_id)
    if q:
        q_lower = q.lower().strip()
        professionals = [
            item for item in professionals
            if q_lower in item.name.lower() or q_lower in item.email.lower()
        ]

    return render(
        request,
        "admin/professionals/index.html",
        {"professionals": professionals, "q": q or ""},
        session=session,
        active="professionals",
    )

@router.post("")
async def create_professional_action(request: Request, professional_service: ProfessionalServiceDep, session: AdminSessionDep):
    await validate_csrf(request)
    form = await request.form()
    phone = form_value(form, "phone", "")

    try:
        data = ProfessionalCreate(
            name = form_value(form, "name", ""),
            email = form_value(form, "email", ""),
            phone = normalize_phone(phone),
        )
        professional_service.create(session.business_id, data)

    except ValidationError:
        return redirect_with_flash("/admin/professionals", "Dados inválidos para o profissional.", "error")
    
    except ProfessionalAlreadyExistsError:
        return redirect_with_flash("/admin/professionals", "Profissional já cadastrado.", "error")

    return redirect_with_flash("/admin/professionals", "Profissional criado com sucesso.")

@router.get("/{professional_id}")
def professional_detail_page(professional_id: int, request: Request, professional_service: ProfessionalServiceDep, service_service: ServiceServiceDep,
    link_service: ProfessionalServiceLinkServiceDep, availability_service: AvailabilityServiceDep, session: AdminSessionDep):
    professional = professional_service.get_by_id(session.business_id, professional_id)
    services = service_service.get_all(session.business_id)
    links = link_service.get_by_professional(session.business_id, professional_id)
    linked_service_ids = {item.service_id for item in links}

    availabilities = availability_service.get_all(session.business_id, professional_id)
    availability_by_weekday = {item.weekday: item for item in availabilities}

    return render(
        request,
        "admin/professionals/detail.html",
        {
            "professional": professional,
            "services": services,
            "linked_service_ids": linked_service_ids,
            "availability_by_weekday": availability_by_weekday,
            "weekdays": WEEKDAYS,
        },
        session=session,
        active="professionals",
    )

@router.post("/{professional_id}")
async def update_professional_action(professional_id: int, request: Request, professional_service: ProfessionalServiceDep, session: AdminSessionDep):
    await validate_csrf(request)
    form = await request.form()
    return_to = form_value(form, "_return_to", f"/admin/professionals/{professional_id}")
    if not return_to or not return_to.startswith("/admin/professionals"):
        return_to = f"/admin/professionals/{professional_id}"

    phone = form_value(form, "phone")

    try:
        data = ProfessionalUpdate(
            name = form_value(form, "name"),
            email = form_value(form, "email"),
            phone = normalize_phone(phone) if phone else None,
        )
        professional_service.update(session.business_id, professional_id, data)

    except ValidationError:
        return redirect_with_flash(return_to, "Dados inválidos.", "error")
    
    except ProfessionalNotFoundError:
        return redirect_with_flash("/admin/professionals", "Profissional não encontrado.", "error")
    
    except ProfessionalAlreadyExistsError:
        return redirect_with_flash(return_to, "Profissional já cadastrado.", "error")

    return redirect_with_flash(return_to, "Profissional atualizado com sucesso.")

@router.post("/{professional_id}/deactivate")
async def deactivate_professional_action(professional_id: int, request: Request, professional_service: ProfessionalServiceDep, session: AdminSessionDep):
    await validate_csrf(request)

    try:
        professional_service.deactivate(session.business_id, professional_id)

    except ProfessionalNotFoundError:
        return redirect_with_flash("/admin/professionals", "Profissional não encontrado.", "error")
    
    return redirect_with_flash("/admin/professionals", "Profissional desativado com sucesso.")


@router.post("/{professional_id}/services")
async def update_professional_services_action(professional_id: int, request: Request, service_service: ServiceServiceDep, link_service: ProfessionalServiceLinkServiceDep, session: AdminSessionDep):
    await validate_csrf(request)
    form = await request.form()
    selected_ids = {int(value) for value in form.getlist("service_ids")}
    all_services = service_service.get_all(session.business_id)
    valid_service_ids = {item.id for item in all_services}
    selected_ids = selected_ids.intersection(valid_service_ids)

    existing_links = link_service.get_by_professional(session.business_id, professional_id)
    existing_ids = {item.service_id for item in existing_links}

    for service_id in selected_ids - existing_ids:
        try:
            link_service.create(
                session.business_id,
                ProfessionalServiceCreate(professional_id=professional_id, service_id=service_id),
            )
        except ProfessionalServiceLinkAlreadyExistsError:
            pass

    for service_id in existing_ids - selected_ids:
        try:
            link_service.delete(session.business_id, professional_id, service_id)

        except ProfessionalServiceLinkNotFoundError:
            pass

    return redirect_with_flash(f"/admin/professionals/{professional_id}", "Serviços do profissional atualizados.")

@router.post("/{professional_id}/availability")
async def update_professional_availability_action(professional_id: int, request: Request, availability_service: AvailabilityServiceDep, session: AdminSessionDep):
    await validate_csrf(request)
    form = await request.form()

    existing = availability_service.get_all(session.business_id, professional_id)
    existing_by_weekday = {item.weekday: item for item in existing}

    try:
        for weekday, _label in WEEKDAYS:
            enabled = form.get(f"weekday_{weekday}_enabled") == "on"
            current = existing_by_weekday.get(weekday)

            if enabled:
                start_time = form_value(form, f"weekday_{weekday}_start", "09:00")
                end_time = form_value(form, f"weekday_{weekday}_end", "18:00")
                if current:
                    availability_service.update(
                        session.business_id,
                        professional_id,
                        weekday,
                        AvailabilityUpdate(start_time=start_time, end_time=end_time),
                    )
                else:
                    availability_service.create(
                        session.business_id,
                        AvailabilityCreate(
                            professional_id=professional_id,
                            weekday=weekday,
                            start_time=start_time,
                            end_time=end_time,
                        ),
                    )
            elif current:
                availability_service.delete(session.business_id, professional_id, weekday)

    except (ValidationError, ValueError, AvailabilityAlreadyExistsError):
        return redirect_with_flash(f"/admin/professionals/{professional_id}", "Disponibilidade inválida.", "error")
    
    except AvailabilityNotFoundError:
        return redirect_with_flash(f"/admin/professionals/{professional_id}", "Disponibilidade não encontrada.", "error")

    return redirect_with_flash(f"/admin/professionals/{professional_id}", "Disponibilidade atualizada.")