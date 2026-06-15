import hashlib

from starlette.requests import Request
from starlette.responses import Response

from src.admin.templating import STATIC_ROOT, admin_label, static_version
from src.core.error_reporting import build_error_payload
from src.core.http_header import apply_security_headers
from src.repositories import ScheduleBlockRepository
from src.services.availability_service import get_availability_service
from src.services.integration_service import IntegrationService


class IntegrationRepositoryStub:
    def get_by_name(self, db, name):
        return ["first", "second"]

def test_availability_factory_injects_schedule_block_repository():
    service = get_availability_service(None)

    assert isinstance(service.schedule_block_repo, ScheduleBlockRepository)

def test_integration_name_search_preserves_repository_list_contract():
    service = IntegrationService(None, IntegrationRepositoryStub())

    assert service.get_by_name("automation") == ["first", "second"]

def test_static_asset_version_matches_file_content():
    path = "admin/css/admin.css"
    expected = hashlib.sha256((STATIC_ROOT / path).read_bytes()).hexdigest()[:12]

    assert static_version(path) == expected

def test_admin_labels_are_presented_in_portuguese():
    assert admin_label("scheduled") == "Agendado"
    assert admin_label("super_admin") == "Superadministrador"
    assert admin_label("barbershop") == "Barbearia"

def test_admin_integration_layout_does_not_reserve_empty_message_space():
    template = (STATIC_ROOT.parent / "templates/admin/integrations/index.html").read_text(encoding="utf-8")
    script = (STATIC_ROOT / "admin/js/admin.js").read_text(encoding="utf-8")
    stylesheet = (STATIC_ROOT / "admin/css/admin.css").read_text(encoding="utf-8")

    assert "{% if evolution_configured %}hidden{% endif %}" in template
    assert "messageElement.hidden = !message" in script
    assert ".integration-message[hidden]" in stylesheet

def test_modal_close_icon_is_drawn_from_centered_css_lines():
    template = (STATIC_ROOT.parent / "templates/admin/base.html").read_text(encoding="utf-8")
    stylesheet = (STATIC_ROOT / "admin/css/admin.css").read_text(encoding="utf-8")

    assert 'aria-label="Fechar janela"' in template
    assert ">×</button>" not in template
    assert ".modal-close::before" in stylesheet
    assert ".modal-close::after" in stylesheet
    assert "translate(-50%, -50%)" in stylesheet

def test_production_image_excludes_local_workspace_state():
    root = STATIC_ROOT.parents[1]
    dockerfile = (root / "Dockerfile").read_text(encoding="utf-8")
    dockerignore = (root / ".dockerignore").read_text(encoding="utf-8")

    assert "COPY . ." not in dockerfile
    assert "COPY src ./src" in dockerfile
    assert ".n8nac/" in dockerignore
    assert "n8nac-config.json" in dockerignore
    assert "workflows/" in dockerignore

def test_pytest_and_ci_include_the_repository_root():
    root = STATIC_ROOT.parents[1]
    pytest_config = (root / "pytest.ini").read_text(encoding="utf-8")
    ci_workflow = (root / ".github/workflows/ci.yml").read_text(encoding="utf-8")

    assert "pythonpath = ." in pytest_config
    assert "testpaths = tests" in pytest_config
    assert "run: python -m pytest -q" in ci_workflow

def test_admin_pages_are_not_cached():
    request = Request(
        {
            "type": "http",
            "method": "GET",
            "path": "/admin/appointments",
            "raw_path": b"/admin/appointments",
            "query_string": b"",
            "headers": [],
            "client": ("127.0.0.1", 1234),
            "server": ("testserver", 80),
            "scheme": "http",
        }
    )
    response = Response()

    apply_security_headers(request, response)

    assert response.headers["Cache-Control"] == "no-store"

def test_unhandled_error_payload_does_not_expose_request_secrets():
    request = Request(
        {
            "type": "http",
            "method": "POST",
            "path": "/v1/appointments",
            "raw_path": b"/v1/appointments",
            "query_string": b"token=secret",
            "headers": [(b"authorization", b"Bearer secret")],
            "client": ("127.0.0.1", 1234),
            "server": ("testserver", 80),
            "scheme": "https",
        }
    )

    payload = build_error_payload(request, RuntimeError("database password"), "error-123")

    assert payload["error"]["id"] == "error-123"
    assert payload["error"]["node"] == "POST /v1/appointments"
    assert payload["error"]["description"] == "RuntimeError"
    assert "secret" not in str(payload)
    assert "database password" not in str(payload)
