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