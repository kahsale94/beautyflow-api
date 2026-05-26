from pathlib import Path

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
    source = read_source("src/api/v1/appointment_routes.py")

    assert "except ProfessionalServiceMismatchError" in source
    assert "Este profissional não executa o serviço informado" in source