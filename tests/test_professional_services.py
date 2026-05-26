from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def read_source(relative_path: str) -> str:
    return (ROOT / relative_path).read_text(encoding="utf-8")

def test_professional_service_link_layers_exist():
    expected_files = [
        "src/schemas/professional_service_schema.py",
        "src/repositories/professional_service_repo.py",
        "src/services/professional_service_link_service.py",
        "src/api/v1/professional_service_routes.py",
    ]

    for relative_path in expected_files:
        assert (ROOT / relative_path).exists()

def test_professional_service_link_routes_are_registered():
    source = read_source("src/api/v1/__init__.py")

    assert "professional_service_router" in source
    assert "router.include_router(professional_service_router)" in source

def test_professional_service_link_dependency_is_registered():
    source = read_source("src/dependecies.py")

    assert "ProfessionalServiceLinkServiceDep" in source
    assert "get_professional_service_link_service" in source

def test_professional_service_link_admin_write_permission():
    source = read_source("src/api/v1/professional_service_routes.py")

    assert "admin: AdminDep" in source
    assert "actor: UserOrBusinessIntegrationDep" in source