from pathlib import Path

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
