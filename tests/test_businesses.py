from pathlib import Path

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
