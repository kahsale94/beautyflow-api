from pathlib import Path

import pytest
from fastapi import HTTPException

from src.api.v1.appointment_routes import _handle_booking_rule_errors
from src.services.appointment_service import AppointmentAlreadyCompletedError, ProfessionalServiceMismatchError


ROOT = Path(__file__).resolve().parents[1]

def read_source(relative_path: str) -> str:
    return (ROOT / relative_path).read_text(encoding="utf-8")

def test_appointment_conflict_constraint_name_is_aligned():
    model_source = read_source("src/models/appointment_model.py")
    service_source = read_source("src/services/appointment_service.py")

    assert "ex_appointments_business_professional_time_conflict" in model_source
    assert "ex_appointments_business_professional_time_conflict" in service_source

def test_appointment_requires_professional_service_link():
    source = read_source("src/services/appointment_service.py")

    assert "ProfessionalServiceMismatchError" in source
    assert "professional_service_repo.get_by_ids" in source
    assert "raise ProfessionalServiceMismatchError()" in source

def test_appointment_lists_can_return_empty_list():
    source = read_source("src/services/appointment_service.py")

    get_all_slice = source[source.index("def get_all"):source.index("def get_by_id")]
    get_by_client_slice = source[source.index("def get_by_client"):source.index("def get_by_professional")]
    get_by_professional_slice = source[source.index("def get_by_professional"):source.index("def get_by_period")]

    assert "not result" not in get_all_slice
    assert "not result" not in get_by_client_slice
    assert "not result" not in get_by_professional_slice

def test_appointment_period_filter_exists():
    repo_source = read_source("src/repositories/appointment_repo.py")
    service_source = read_source("src/services/appointment_service.py")
    route_source = read_source("src/api/v1/appointment_routes.py")

    assert "def get_by_business_period" in repo_source
    assert "def get_by_period" in service_source
    assert "start_datetime: datetime | None = None" in route_source
    assert "end_datetime: datetime | None = None" in route_source

def test_appointment_route_handles_professional_service_mismatch():
    with pytest.raises(HTTPException) as exc_info:
        _handle_booking_rule_errors(ProfessionalServiceMismatchError())

    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == "Este profissional não executa o serviço informado!"

def test_appointment_create_and_update_reuse_business_booking_rules():
    service_source = read_source("src/services/appointment_service.py")
    route_source = read_source("src/api/v1/appointment_routes.py")

    assert "BusinessNotAvailableForBookingError" in service_source
    assert "AppointmentMinimumNoticeError" in service_source
    assert "AppointmentMaximumScheduleWindowError" in service_source
    assert "AppointmentInvalidSlotIntervalError" in service_source
    assert "InvalidBusinessTimezoneError" in service_source
    assert "_is_aligned_to_slot" in service_source
    assert "business.booking_enabled" in service_source
    assert "minimum_notice_minutes" in service_source
    assert "maximum_schedule_days" in service_source
    assert "slot_interval_minutes" in service_source
    assert "Agendamento desabilitado para esta empresa" in route_source
    assert "Horário não respeita a antecedência mínima" in route_source
    assert "Horário excede a janela máxima" in route_source
    assert "Horário não está alinhado" in route_source

def test_update_appointment_rejects_null_required_fields():
    source = read_source("src/services/appointment_service.py")

    assert 'for field in ("client_id", "professional_id", "service_id", "start_datetime")' in source
    assert 'raise ValueError(f"{field} não pode ser nulo")' in source

def test_cancel_completed_appointment_returns_conflict():
    service_source = read_source("src/services/appointment_service.py")

    cancel_slice = service_source[service_source.index("def cancel"):service_source.index("def delete")]
    assert "AppointmentStatus.completed" in cancel_slice
    assert "raise AppointmentAlreadyCompletedError()" in cancel_slice

    with pytest.raises(HTTPException) as exc_info:
        _handle_booking_rule_errors(AppointmentAlreadyCompletedError())

    assert exc_info.value.status_code == 409
    assert "não pode ser alterado" in exc_info.value.detail

def test_delete_appointment_is_logical_cancel():
    source = read_source("src/services/appointment_service.py")
    delete_slice = source[source.index("def delete"):]

    assert "appointment.status = AppointmentStatus.canceled" in delete_slice
    assert "appointment_repo.delete" not in delete_slice

def test_admin_appointment_forms_filter_services_by_professional():
    route_source = read_source("src/admin/routes/appointments.py")
    calendar_template = read_source("src/templates/admin/appointments/calendar.html")
    details_template = read_source("src/templates/admin/appointments/_details.html")
    calendar_script = read_source("src/static/admin/js/calendar.js")

    assert "ProfessionalServiceLinkServiceDep" in route_source
    assert '"service_professional_ids"' in route_source
    assert "data-appointment-service-filter" in calendar_template
    assert "data-appointment-service-filter" in details_template
    assert "data-appointment-professional" in calendar_template
    assert "data-appointment-professional" in details_template
    assert "data-appointment-service" in calendar_template
    assert "data-appointment-service" in details_template
    assert "data-professional-ids" in calendar_template
    assert "data-professional-ids" in details_template
    assert "initializeAppointmentServiceFilters" in calendar_script
    assert "Nenhum serviço disponível" in calendar_script
    assert "professionalSelect.addEventListener('change', syncServices)" in calendar_script
