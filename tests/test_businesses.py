from datetime import datetime, time
from pathlib import Path
from types import SimpleNamespace
from zoneinfo import ZoneInfo

import pytest
from pydantic import ValidationError

from src.clients.viacep_client import CepNotFoundError, _parse_viacep_payload
from src.models import Business, BusinessOpeningHour
from src.models.business_model import BusinessAttendancePlan, BusinessType
from src.schemas import BusinessCreate, BusinessOpeningHourCreate, BusinessUpdate
from src.services.business_service import BusinessService
from src.utils import join_address_number, normalize_cep, split_address_number

ROOT = Path(__file__).resolve().parents[1]

def read_source(relative_path: str) -> str:
    return (ROOT / relative_path).read_text(encoding="utf-8")

def test_business_phone_is_required_and_normalized():
    schema_source = read_source("src/schemas/business_schema.py")
    service_source = read_source("src/services/business_service.py")
    route_source = read_source("src/api/v1/business_routes.py")

    assert "phone: phone_type = Field" in schema_source
    assert "normalize_phone(data.phone)" in service_source
    assert "Telefone da empresa é obrigatório" in service_source
    assert "except ValueError as exc" in route_source

def test_business_opening_hours_is_available_in_admin_and_api():
    model_source = read_source("src/models/business_model.py")
    opening_hour_model_source = read_source("src/models/business_opening_hour_model.py")
    schema_source = read_source("src/schemas/business_schema.py")
    service_source = read_source("src/services/business_service.py")
    admin_route_source = read_source("src/admin/routes/business.py")
    template_source = read_source("src/templates/admin/business/settings.html")
    migration_source = read_source("alembic/versions/0008_add_business_opening_hours.py")
    attendance_migration_source = read_source("alembic/versions/0010_add_business_attendance.py")

    assert 'opening_hours: Mapped[list["BusinessOpeningHour"]]' in model_source
    assert "BusinessAttendancePlan" in model_source
    assert "attendance_plan" in model_source
    assert 'back_populates="business"' in model_source
    assert "business_opening_hours" in opening_hour_model_source
    assert 'opening_hours: list["BusinessOpeningHourCreate"]' in schema_source
    assert "attendance_allowed" in schema_source
    assert "BusinessOpeningHourCreate" in schema_source
    assert "_replace_opening_hours" in service_source
    assert "business.opening_hours" in service_source
    assert "_opening_hours_from_form" in admin_route_source
    assert "BusinessAttendancePlan" in admin_route_source
    assert "Plano de atendimento" in template_source
    assert "Horário de Funcionamento" in template_source
    assert "business_weekday_{{ weekday }}_enabled" in template_source
    assert "business_opening_hours" in migration_source
    assert "businessattendanceplan" in attendance_migration_source

def test_business_attendance_plan_controls_allowed_status():
    business = Business(
        id=1,
        name="Salão Bela Vida",
        slug="salao-bela-vida",
        type=BusinessType.salon,
        attendance_plan=BusinessAttendancePlan.business_hours,
        timezone="America/Sao_Paulo",
        phone="11922220001",
    )
    business.opening_hours = [
        BusinessOpeningHour(
            business_id=1,
            weekday=0,
            start_time=time(9, 0),
            end_time=time(18, 0),
        )
    ]

    during_business_hours = datetime(2026, 6, 22, 10, 0, tzinfo=ZoneInfo("America/Sao_Paulo"))
    after_business_hours = datetime(2026, 6, 22, 20, 0, tzinfo=ZoneInfo("America/Sao_Paulo"))

    assert business.is_open_at(during_business_hours) is True
    assert business.attendance_status_at(during_business_hours)["allowed"] is True

    business.attendance_plan = BusinessAttendancePlan.after_hours
    blocked_status = business.attendance_status_at(during_business_hours)
    assert blocked_status["allowed"] is False
    assert blocked_status["block_reason"] == "inside_business_hours"
    assert business.attendance_status_at(after_business_hours)["allowed"] is True

    business.attendance_plan = BusinessAttendancePlan.always
    assert business.attendance_status_at(after_business_hours)["allowed"] is True

def test_business_cep_admin_fields_and_helpers_are_available():
    schema_source = read_source("src/schemas/business_schema.py")
    service_source = read_source("src/services/business_service.py")
    admin_route_source = read_source("src/admin/routes/business.py")
    template_source = read_source("src/templates/admin/business/settings.html")
    script_source = read_source("src/static/admin/js/admin.js")

    assert "cep: str | None = None" in schema_source
    assert "_validate_cep_if_present" in service_source
    assert '@router.get("/cep/{cep}")' in admin_route_source
    assert "join_address_number" in admin_route_source
    assert "Contatos" in template_source
    assert "Localização" in template_source
    assert 'name="address_street"' in template_source
    assert 'name="address_number"' in template_source
    assert "initializeBusinessCepLookup" in script_source

def test_cep_format_accepts_only_plain_or_masked_brazilian_cep():
    assert normalize_cep("01001000") == "01001000"
    assert normalize_cep("01001-000") == "01001000"
    assert normalize_cep("") is None

    with pytest.raises(ValueError):
        normalize_cep("01001-000x")

def test_sparse_viacep_payload_is_treated_as_missing_cep():
    with pytest.raises(CepNotFoundError):
        _parse_viacep_payload({"cep": "00000-000"}, "00000000")

def test_address_is_split_and_joined_without_breaking_legacy_values():
    parsed = split_address_number("Rua das Flores, 123")
    assert parsed.street == "Rua das Flores"
    assert parsed.number == "123"
    assert join_address_number(parsed.street, parsed.number) == "Rua das Flores, 123"

    legacy = split_address_number("Endereço antigo sem número claro")
    assert legacy.street == "Endereço antigo sem número claro"
    assert legacy.number == ""

    with pytest.raises(ValueError):
        join_address_number("", "123")

def test_business_delete_is_soft_delete():
    source = read_source("src/services/business_service.py")

    assert "def delete" in source
    assert "return self.deactivate(business_id)" in source
    assert "business_repo.delete" not in source[source.index("def delete"):]

def test_cors_fails_safe_in_production():
    source = read_source("src/main.py")

    assert "CORS_ORIGINS deve ser definido em produção" in source
    assert "CORS_ORIGINS não pode conter '*' em produção" in source

class FakeDatabase:

    def commit(self):
        return None

    def rollback(self):
        return None

    def refresh(self, value):
        return None

class FakeBusinessRepository:

    def __init__(self, existing_slugs=None, business=None):
        self.existing_slugs = set(existing_slugs or [])
        self.business = business
        self.added = None

    def add(self, db, business):
        self.added = business

    def get_by_id(self, db, business_id):
        if self.business and self.business.id == business_id:
            return self.business
        return None

    def get_by_exact_slug(self, db, business_slug):
        if business_slug in self.existing_slugs:
            return SimpleNamespace(slug=business_slug)
        return None

def make_business_create(name: str, slug: str | None = None) -> BusinessCreate:
    return BusinessCreate(
        name=name,
        slug=slug,
        type=BusinessType.salon,
        timezone="America/Sao_Paulo",
        phone="11922220001",
    )

def test_business_creation_generates_slug_from_name():
    service = BusinessService(FakeDatabase(), FakeBusinessRepository())

    business = service.create(make_business_create("Salão Bela Vida"))

    assert business.slug == "salao-bela-vida"

def test_business_creation_generates_unique_slug_suffix():
    service = BusinessService(
        FakeDatabase(),
        FakeBusinessRepository(existing_slugs={"salao-bela-vida"}),
    )

    business = service.create(make_business_create("Salão Bela Vida"))

    assert business.slug == "salao-bela-vida-2"

def test_business_creation_preserves_explicit_slug():
    service = BusinessService(FakeDatabase(), FakeBusinessRepository())

    business = service.create(make_business_create("Salão Bela Vida", slug="bela-vida-sp"))

    assert business.slug == "bela-vida-sp"

def test_business_creation_persists_opening_hours():
    service = BusinessService(FakeDatabase(), FakeBusinessRepository())
    data = make_business_create("Salão Bela Vida")
    data.opening_hours = [
        BusinessOpeningHourCreate(
            weekday=0,
            start_time=time(9, 0),
            end_time=time(18, 0),
        )
    ]

    business = service.create(data)

    assert len(business.opening_hours) == 1
    assert business.opening_hours[0].weekday == 0
    assert business.opening_hours[0].start_time == time(9, 0)
    assert business.opening_hours[0].end_time == time(18, 0)

def test_business_creation_validates_cep_without_persisting_it(monkeypatch):
    calls = []

    def fake_lookup_cep(cep):
        calls.append(cep)
        return SimpleNamespace(cep=cep)

    monkeypatch.setattr("src.services.business_service.lookup_cep", fake_lookup_cep)
    service = BusinessService(FakeDatabase(), FakeBusinessRepository())

    business = service.create(
        BusinessCreate(
            name="Salão Bela Vida",
            type=BusinessType.salon,
            timezone="America/Sao_Paulo",
            phone="11922220001",
            cep="01001-000",
            address="Praça da Sé, 1",
            city="São Paulo",
            state="SP",
        )
    )

    assert calls == ["01001000"]
    assert business.address == "Praça da Sé, 1"
    assert not hasattr(business, "cep")

def test_business_update_validates_cep_without_writing_transient_field(monkeypatch):
    calls = []

    def fake_lookup_cep(cep):
        calls.append(cep)
        return SimpleNamespace(cep=cep)

    monkeypatch.setattr("src.services.business_service.lookup_cep", fake_lookup_cep)
    business = SimpleNamespace(id=1, is_active=True, name="Salão Bela Vida", slug="bela-vida")
    service = BusinessService(
        FakeDatabase(),
        FakeBusinessRepository(business=business),
    )

    service.update(1, BusinessUpdate(cep="01001-000", address="Praça da Sé, 1"))

    assert calls == ["01001000"]
    assert business.address == "Praça da Sé, 1"
    assert not hasattr(business, "cep")

def test_business_schema_rejects_invalid_cep_format():
    with pytest.raises(ValidationError):
        BusinessCreate(
            name="Salão Bela Vida",
            type=BusinessType.salon,
            timezone="America/Sao_Paulo",
            phone="11922220001",
            cep="abc01001000",
        )

def test_business_update_does_not_clear_existing_slug():
    business = SimpleNamespace(id=1, is_active=True, name="Salão Bela Vida", slug="bela-vida")
    service = BusinessService(
        FakeDatabase(),
        FakeBusinessRepository(business=business),
    )

    service.update(1, BusinessUpdate(slug=None))

    assert business.slug == "bela-vida"

def test_business_update_generates_missing_legacy_slug():
    business = SimpleNamespace(id=1, is_active=True, name="Salão Bela Vida", slug=None)
    service = BusinessService(
        FakeDatabase(),
        FakeBusinessRepository(business=business),
    )

    service.update(1, BusinessUpdate(slug=None))

    assert business.slug == "salao-bela-vida"
