from dataclasses import dataclass
from datetime import datetime, timezone
import hashlib
import hmac

from sqlalchemy import select
from sqlalchemy.orm import Session

from src.core import DataBaseDep, USER_SECRET_KEY
from src.models import User, BusinessIntegration, UserRefreshToken
from src.security import RefreshRequest, TokenManager, verify_hash, create_user_access_token, create_user_refresh_token, create_business_integration_token

class InvalidCredentialError(Exception):
    pass

class InvalidTokenError(Exception):
    pass

class DeactivatedUserError(Exception):
    pass

class DeactivatedLinkError(Exception):
    pass

@dataclass(frozen=True)
class RefreshResult:
    access_token: str
    refresh_token: str

class AuthService:

    def __init__(
        self,
        db: Session,
    ):
        self.db = db

    def _hash_jti(self, jti: str) -> str:
        return hmac.new(
            USER_SECRET_KEY.encode("utf-8"),
            jti.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()

    def _as_aware_datetime(self, value: datetime) -> datetime:
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value

    def _create_persisted_refresh_token(self, user_id: int) -> str:
        refresh_token, jti, expires_at = create_user_refresh_token(user_id)
        self.db.add(
            UserRefreshToken(
                user_id=user_id,
                jti_hash=self._hash_jti(jti),
                expires_at=expires_at,
                created_at=datetime.now(timezone.utc),
            )
        )
        self.db.commit()
        return refresh_token

    def login(self, email: str, password: str):
        stmt = select(User).where(User.email == email)
        user = self.db.scalars(stmt).one_or_none()
        if not user or not user.is_active:
            raise InvalidCredentialError()

        if not verify_hash(password, user.password_hash):
            raise InvalidCredentialError()

        access_token = create_user_access_token(user.id)
        refresh_token = self._create_persisted_refresh_token(user.id)

        return access_token, refresh_token

    def refresh(self, data: RefreshRequest) -> RefreshResult:
        try:
            payload = TokenManager.decode(data.refresh_token)
        except Exception:
            raise InvalidTokenError()

        user_id = payload.get("sub")
        token_type = payload.get("token_type")
        request_type = payload.get("type")
        jti = payload.get("jti")

        if token_type != "refresh" or request_type != "user" or not user_id or not jti:
            raise InvalidTokenError()

        stmt = select(User).where(User.id == int(user_id))
        user = self.db.scalars(stmt).one_or_none()

        if not user or not user.is_active:
            raise DeactivatedUserError()

        now = datetime.now(timezone.utc)
        current_jti_hash = self._hash_jti(str(jti))
        refresh_record = self.db.scalars(
            select(UserRefreshToken).where(
                UserRefreshToken.user_id == user.id,
                UserRefreshToken.jti_hash == current_jti_hash,
            )
        ).one_or_none()

        if not refresh_record:
            raise InvalidTokenError()

        expires_at = self._as_aware_datetime(refresh_record.expires_at)

        if refresh_record.revoked_at is not None or expires_at <= now:
            raise InvalidTokenError()

        access_token = create_user_access_token(user.id)
        new_refresh_token, new_jti, new_expires_at = create_user_refresh_token(user.id)
        new_jti_hash = self._hash_jti(new_jti)

        refresh_record.revoked_at = now
        refresh_record.replaced_by_jti_hash = new_jti_hash
        self.db.add(
            UserRefreshToken(
                user_id=user.id,
                jti_hash=new_jti_hash,
                expires_at=new_expires_at,
                created_at=now,
            )
        )
        self.db.commit()

        return RefreshResult(access_token=access_token, refresh_token=new_refresh_token)

    def revoke_refresh_token(self, refresh_token: str) -> None:
        try:
            payload = TokenManager.decode(refresh_token)
        except Exception:
            return

        if payload.get("type") != "user" or payload.get("token_type") != "refresh" or not payload.get("jti"):
            return

        jti_hash = self._hash_jti(str(payload["jti"]))
        refresh_record = self.db.scalars(
            select(UserRefreshToken).where(UserRefreshToken.jti_hash == jti_hash)
        ).one_or_none()

        if refresh_record and refresh_record.revoked_at is None:
            refresh_record.revoked_at = datetime.now(timezone.utc)
            self.db.commit()

    def get_business_integration_token(self, business_phone: str, integration_id: int):
        stmt = select(BusinessIntegration).where(
            BusinessIntegration.integration_id == integration_id,
            BusinessIntegration.config["n8n"]["phone"].astext == business_phone,
            BusinessIntegration.is_active == True,
        )

        business_integration = self.db.scalars(stmt).first()

        if not business_integration:
            raise DeactivatedLinkError()

        return create_business_integration_token(business_integration.business_id, integration_id)

def get_auth_service(db: DataBaseDep):
    return AuthService(
        db,
    )
