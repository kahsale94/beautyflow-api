from pathlib import Path

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
