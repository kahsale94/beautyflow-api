from pathlib import Path

import pytest
from fastapi import HTTPException

from src.api.v1.auth_routes import login_integration
from src.services.auth_service import BusinessNotFoundError, IntegrationNotFoundError

ROOT = Path(__file__).resolve().parents[1]

def read_source(relative_path: str) -> str:
    return (ROOT / relative_path).read_text(encoding="utf-8")

def test_deactivated_user_cannot_login():
    source = read_source("src/services/auth_service.py")

    assert "if not user or not user.is_active" in source
    assert "raise InvalidCredentialError()" in source

def test_deactivated_user_refresh_still_fails():
    source = read_source("src/services/auth_service.py")

    assert "or not user.is_active" in source
    assert "raise DeactivatedUserError()" in source

def test_user_email_is_globally_unique_and_normalized():
    model_source = read_source("src/models/user_model.py")
    user_service_source = read_source("src/services/user_service.py")
    auth_service_source = read_source("src/services/auth_service.py")

    assert 'UniqueConstraint("email", name="uq_user_email")' in model_source
    assert "uq_user_business_email" not in model_source
    assert ".strip().lower()" in user_service_source
    assert "normalized_email = email.strip().lower()" in auth_service_source
    assert "User.email == normalized_email" in auth_service_source

@pytest.mark.parametrize("service_error", [IntegrationNotFoundError(), BusinessNotFoundError()])
def test_integration_login_hides_invalid_business_or_integration(service_error):
    class ServiceStub:
        def get_business_integration_token(self, business_phone, integration_id):
            raise service_error

    integration = type("Integration", (), {"id": 1})()

    with pytest.raises(HTTPException) as exc_info:
        login_integration(
            integration,
            ServiceStub(),
            x_evolution_instance=None,
            x_business_phone="5511999999999",
        )

    assert exc_info.value.status_code == 401
    assert exc_info.value.detail == "Credenciais de integração inválidas!"

def test_integration_login_prefers_evolution_instance():
    class ServiceStub:
        def get_business_integration_token_by_instance(self, instance_name, integration_id):
            assert instance_name == "beautyflow-n8n-atendimento-teste"
            assert integration_id == 3
            return "instance-token"

    integration = type("Integration", (), {"id": 3})()

    result = login_integration(
        integration,
        ServiceStub(),
        x_evolution_instance="beautyflow-n8n-atendimento-teste",
        x_business_phone=None,
    )

    assert result["access_token"] == "instance-token"

def test_integration_login_falls_back_to_phone_for_legacy_instance():
    class ServiceStub:
        def get_business_integration_token_by_instance(self, instance_name, integration_id):
            raise BusinessNotFoundError()

        def get_business_integration_token(self, business_phone, integration_id):
            assert business_phone == "5511999999999"
            return "legacy-token"

    integration = type("Integration", (), {"id": 3})()

    result = login_integration(
        integration,
        ServiceStub(),
        x_evolution_instance="legacy-instance",
        x_business_phone="5511999999999",
    )

    assert result["access_token"] == "legacy-token"
