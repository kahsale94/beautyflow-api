import hashlib
import hmac
from datetime import datetime, timedelta, timezone

import pytest
from fastapi import HTTPException
from jose import jwt
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

from src.admin.dependencies import create_csrf_token, is_valid_csrf_token
from src.core import ALGORITHM
from src.models import Base, Business, User, UserRefreshToken
from src.models.user_model import UserRole
from src.security import (
    RefreshRequest,
    TokenManager,
    create_business_integration_token,
    create_integration_token,
    create_user_access_token,
)
from src.security import key_rotation
from src.services.auth_service import AuthService, InvalidTokenError


USER_CURRENT_SECRET = "user-current-secret-with-more-than-32-chars"
USER_OLD_SECRET = "user-previous-secret-with-more-than-32-chars"
INTEGRATION_CURRENT_SECRET = "integration-current-secret-more-than-32-chars"
INTEGRATION_OLD_SECRET = "integration-previous-secret-more-than-32-chars"
BUSINESS_CURRENT_SECRET = "business-current-secret-with-more-than-32"
BUSINESS_OLD_SECRET = "business-previous-secret-with-more-than-32"


def _build_key_sets(with_fallbacks: bool = True) -> dict[str, key_rotation.JwtKeySet]:
    user_fallbacks = (key_rotation.JwtKey("user-v1", USER_OLD_SECRET),) if with_fallbacks else ()
    integration_fallbacks = (
        key_rotation.JwtKey("integration-v1", INTEGRATION_OLD_SECRET),
    ) if with_fallbacks else ()
    business_fallbacks = (
        key_rotation.JwtKey("business-v1", BUSINESS_OLD_SECRET),
    ) if with_fallbacks else ()

    return {
        "user": key_rotation.JwtKeySet(
            current=key_rotation.JwtKey("user-v2", USER_CURRENT_SECRET),
            fallbacks=user_fallbacks,
        ),
        "integration": key_rotation.JwtKeySet(
            current=key_rotation.JwtKey("integration-v2", INTEGRATION_CURRENT_SECRET),
            fallbacks=integration_fallbacks,
        ),
        "business_integration": key_rotation.JwtKeySet(
            current=key_rotation.JwtKey("business-v2", BUSINESS_CURRENT_SECRET),
            fallbacks=business_fallbacks,
        ),
    }


@pytest.fixture
def rotated_keys(monkeypatch):
    monkeypatch.setattr(key_rotation, "JWT_KEY_SETS", _build_key_sets())


def _future_expiration() -> datetime:
    return datetime.now(timezone.utc) + timedelta(minutes=10)


def _digest(secret: str, value: str) -> str:
    return hmac.new(secret.encode("utf-8"), value.encode("utf-8"), hashlib.sha256).hexdigest()


@pytest.mark.parametrize(
    ("issuer", "expected_type", "expected_kid", "current_secret"),
    [
        (lambda: create_user_access_token(42), "user", "user-v2", USER_CURRENT_SECRET),
        (lambda: create_integration_token(7), "integration", "integration-v2", INTEGRATION_CURRENT_SECRET),
        (
            lambda: create_business_integration_token(3, 7),
            "business_integration",
            "business-v2",
            BUSINESS_CURRENT_SECRET,
        ),
    ],
)
def test_new_tokens_are_signed_with_current_key_and_kid(rotated_keys, issuer, expected_type, expected_kid, current_secret):
    token = issuer()

    assert jwt.get_unverified_header(token)["kid"] == expected_kid
    assert jwt.decode(token, current_secret, algorithms=[ALGORITHM])["type"] == expected_type
    assert TokenManager.decode(token)["type"] == expected_type


@pytest.mark.parametrize(
    ("payload", "old_secret", "headers"),
    [
        (
            {"sub": "42", "type": "user", "token_type": "access", "exp": _future_expiration()},
            USER_OLD_SECRET,
            None,
        ),
        (
            {"sub": "7", "type": "integration", "token_type": "access", "exp": _future_expiration()},
            INTEGRATION_OLD_SECRET,
            {"kid": "integration-v1"},
        ),
        (
            {
                "sub": "7",
                "business_id": 3,
                "type": "business_integration",
                "token_type": "access",
                "exp": _future_expiration(),
            },
            BUSINESS_OLD_SECRET,
            {"kid": "business-v1"},
        ),
    ],
)
def test_old_tokens_validate_while_fallback_key_is_configured(rotated_keys, payload, old_secret, headers):
    token = jwt.encode(payload, old_secret, algorithm=ALGORITHM, headers=headers)

    assert TokenManager.decode(token)["type"] == payload["type"]


def test_token_with_stale_current_kid_still_validates_with_fallback(rotated_keys):
    payload = {"sub": "42", "type": "user", "token_type": "access", "exp": _future_expiration()}
    token = jwt.encode(payload, USER_OLD_SECRET, algorithm=ALGORITHM, headers={"kid": "current"})

    assert TokenManager.decode(token)["sub"] == "42"


def test_old_token_fails_after_fallback_key_is_removed(rotated_keys, monkeypatch):
    payload = {"sub": "42", "type": "user", "token_type": "access", "exp": _future_expiration()}
    token = jwt.encode(payload, USER_OLD_SECRET, algorithm=ALGORITHM)
    monkeypatch.setattr(key_rotation, "JWT_KEY_SETS", _build_key_sets(with_fallbacks=False))

    with pytest.raises(HTTPException) as exc_info:
        TokenManager.decode(token)

    assert exc_info.value.status_code == 401


def _refresh_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine, tables=[Business.__table__, User.__table__, UserRefreshToken.__table__])
    return sessionmaker(bind=engine)()


def _create_user(db):
    user = User(
        email="admin@example.com",
        password_hash="unused",
        role=UserRole.admin,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _legacy_refresh_token(user_id: int, jti: str = "legacy-refresh-jti") -> str:
    return jwt.encode(
        {
            "sub": str(user_id),
            "type": "user",
            "token_type": "refresh",
            "jti": jti,
            "exp": _future_expiration(),
        },
        USER_OLD_SECRET,
        algorithm=ALGORITHM,
    )


def test_refresh_token_signed_with_old_key_is_rotated_to_current_key(rotated_keys):
    db = _refresh_session()
    try:
        user = _create_user(db)
        old_jti = "legacy-refresh-jti"
        old_token = _legacy_refresh_token(user.id, old_jti)
        old_jti_hash = _digest(USER_OLD_SECRET, old_jti)
        db.add(
            UserRefreshToken(
                user_id=user.id,
                jti_hash=old_jti_hash,
                expires_at=_future_expiration(),
                created_at=datetime.now(timezone.utc),
            )
        )
        db.commit()

        result = AuthService(db, object(), object()).refresh(RefreshRequest(refresh_token=old_token))
        new_payload = TokenManager.decode(result.refresh_token)
        new_jti_hash = key_rotation.current_hmac_digest("user", str(new_payload["jti"]))

        old_record = db.scalars(select(UserRefreshToken).where(UserRefreshToken.jti_hash == old_jti_hash)).one()
        new_record = db.scalars(select(UserRefreshToken).where(UserRefreshToken.jti_hash == new_jti_hash)).one()

        assert old_record.revoked_at is not None
        assert old_record.replaced_by_jti_hash == new_jti_hash
        assert new_record.revoked_at is None
        assert jwt.get_unverified_header(result.refresh_token)["kid"] == "user-v2"
        assert TokenManager.decode(result.access_token)["token_type"] == "access"
    finally:
        db.close()


def test_refresh_token_signed_with_removed_key_fails(monkeypatch):
    monkeypatch.setattr(key_rotation, "JWT_KEY_SETS", _build_key_sets(with_fallbacks=False))
    db = _refresh_session()
    try:
        user = _create_user(db)
        old_token = _legacy_refresh_token(user.id)

        with pytest.raises(InvalidTokenError):
            AuthService(db, object(), object()).refresh(RefreshRequest(refresh_token=old_token))
    finally:
        db.close()


def test_admin_csrf_accepts_previous_user_secret_only_during_rotation(rotated_keys, monkeypatch):
    raw = "admin-csrf-token"
    legacy_token = f"{raw}.{_digest(USER_OLD_SECRET, raw)}"

    assert is_valid_csrf_token(create_csrf_token()) is True
    assert is_valid_csrf_token(legacy_token) is True

    monkeypatch.setattr(key_rotation, "JWT_KEY_SETS", _build_key_sets(with_fallbacks=False))

    assert is_valid_csrf_token(legacy_token) is False
