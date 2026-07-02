from pathlib import Path
from datetime import datetime, time
from types import SimpleNamespace
from zoneinfo import ZoneInfo

from src.schemas.appointment_schema import AppointmentStatus
from src.services.availability_service import AvailabilityService

ROOT = Path(__file__).resolve().parents[1]

def read_source(relative_path: str) -> str:
    return (ROOT / relative_path).read_text(encoding="utf-8")

def test_weekday_zero_filter_is_supported():
    source = read_source("src/api/v1/availability_routes.py")

    assert "if weekday is not None" in source
    assert "return [service.get_by_weekday" in source

def test_availability_lists_can_return_empty_list():
    source = read_source("src/services/availability_service.py")

    get_all_slice = source[source.index("def get_all"):source.index("def get_by_weekday")]
    assert "not result" not in get_all_slice

def test_slots_require_professional_service_link():
    source = read_source("src/services/availability_service.py")

    assert "ProfessionalServiceMismatchError" in source
    assert "professional_service_repo.get_by_ids" in source
    assert "raise ProfessionalServiceMismatchError()" in source

def test_slots_use_business_scheduling_settings():
    source = read_source("src/services/availability_service.py")

    assert "slot_interval_minutes" in source
    assert "minimum_notice_minutes" in source
    assert "maximum_schedule_days" in source

def test_professional_opening_hours_checkbox_is_admin_only():
    schema_source = read_source("src/schemas/availability_schema.py")
    template_source = read_source("src/templates/admin/professionals/detail.html")
    script_source = read_source("src/static/admin/js/admin.js")

    assert "start_time: time" in schema_source
    assert "end_time: time" in schema_source
    assert "Seguir horário de funcionamento da empresa" in template_source
    assert "data-follow-business-hours" in template_source
    assert "companyStart" in script_source
    assert "parts.start.value = companyStart" in script_source

def test_availability_admin_write_permission():
    source = read_source("src/api/v1/availability_routes.py")

    assert "admin: AdminDep" in source

def test_check_and_suggest_contract_exists():
    schema_source = read_source("src/schemas/availability_schema.py")
    route_source = read_source("src/api/v1/availability_routes.py")
    service_source = read_source("src/services/availability_service.py")

    assert "AvailabilityCheckAndSuggestRequest" in schema_source
    assert "AvailabilitySuggestionResponse" in schema_source
    assert "AvailabilityCheckAndSuggestResponse" in schema_source
    assert '@router.post("/check-and-suggest"' in route_source
    assert "def check_and_suggest" in service_source


def test_check_and_suggest_does_not_change_existing_get_slots_contract():
    service_source = read_source("src/services/availability_service.py")
    route_source = read_source("src/api/v1/availability_routes.py")

    assert "def get_slots" in service_source
    assert "list[AvailabilitySlotsResponse]" in route_source
    assert "return [AvailabilitySlotsResponse(slot_time=item.time())" in service_source


def test_check_and_suggest_reuses_existing_scheduling_rules():
    service_source = read_source("src/services/availability_service.py")

    assert "minimum_notice_minutes" in service_source
    assert "maximum_schedule_days" in service_source
    assert "slot_interval_minutes" in service_source
    assert "get_scheduled_by_professional_and_date" in service_source
    assert "professional_service_repo.get_by_ids" in service_source


class _AvailabilityRepo:
    def get_by_professional_and_weekday(self, db, professional_id, weekday):
        return SimpleNamespace(
            professional_id=professional_id,
            weekday=weekday,
            start_time=time(14, 0),
            end_time=time(16, 0),
        )


class _AppointmentRepo:
    def __init__(self, appointment):
        self.appointment = appointment

    def get_by_id(self, db, business_id, appointment_id):
        if self.appointment.id == appointment_id and self.appointment.business_id == business_id:
            return self.appointment
        return None

    def get_scheduled_by_professional_and_date(self, db, business_id, professional_id, start_of_day, end_of_day):
        return [self.appointment]


class _ScheduleBlockRepo:
    def get_active_by_professional_and_date(self, db, business_id, professional_id, start_of_day, end_of_day):
        return []


def _availability_service_with_appointment(client_id=11):
    business = SimpleNamespace(
        id=1,
        timezone="America/Sao_Paulo",
        slot_interval_minutes=15,
        minimum_notice_minutes=0,
    )
    appointment = SimpleNamespace(
        id=14,
        business_id=1,
        client_id=client_id,
        professional_id=2,
        status=AppointmentStatus.scheduled,
        start_datetime=datetime(2026, 7, 3, 14, 0, tzinfo=ZoneInfo("America/Sao_Paulo")),
        end_datetime=datetime(2026, 7, 3, 14, 45, tzinfo=ZoneInfo("America/Sao_Paulo")),
    )
    service = AvailabilityService.__new__(AvailabilityService)
    service.db = object()
    service.availability_repo = _AvailabilityRepo()
    service.appointment_repo = _AppointmentRepo(appointment)
    service.schedule_block_repo = _ScheduleBlockRepo()
    return service, SimpleNamespace(id=2, business=business), SimpleNamespace(duration_minutes=75), appointment


def test_slots_can_ignore_same_clients_existing_appointment_for_service_change():
    service, professional, requested_service, appointment = _availability_service_with_appointment(client_id=11)
    now = datetime(2026, 7, 2, 12, 0, tzinfo=ZoneInfo("America/Sao_Paulo"))
    exclude_id = service._resolve_excluded_appointment_id(1, 2, appointment.id, client_id=11)

    slots = service._get_slot_datetimes_for_date(
        1,
        professional,
        requested_service,
        appointment.start_datetime.date(),
        now,
        exclude_id,
    )

    assert appointment.start_datetime in slots


def test_slots_do_not_ignore_another_clients_appointment():
    service, professional, requested_service, appointment = _availability_service_with_appointment(client_id=99)
    now = datetime(2026, 7, 2, 12, 0, tzinfo=ZoneInfo("America/Sao_Paulo"))
    exclude_id = service._resolve_excluded_appointment_id(1, 2, appointment.id, client_id=11)

    slots = service._get_slot_datetimes_for_date(
        1,
        professional,
        requested_service,
        appointment.start_datetime.date(),
        now,
        exclude_id,
    )

    assert exclude_id is None
    assert appointment.start_datetime not in slots
