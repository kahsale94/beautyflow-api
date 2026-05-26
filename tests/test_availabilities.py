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

def test_availability_admin_write_permission():
    source = read_source("src/api/v1/availability_routes.py")

    assert "admin: AdminDep" in source