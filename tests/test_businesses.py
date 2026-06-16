from pathlib import Path
from types import SimpleNamespace

from src.models.business_model import BusinessType
from src.schemas import BusinessCreate, BusinessUpdate
from src.services.business_service import BusinessService

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
