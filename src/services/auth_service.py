from sqlalchemy import select
from sqlalchemy.orm import Session

from src.core import DataBaseDep
from src.models import User, BusinessIntegration
from src.security import RefreshRequest, TokenManager, verify_hash, create_user_access_token, create_user_refresh_token, create_business_integration_token

class InvalidCredentialError(Exception):
    pass

class InvalidTokenError(Exception):
    pass

class DeactivatedUserError(Exception):
    pass

class DeactivatedLinkError(Exception):
    pass

class AuthService:

    def __init__(
        self,
        db: Session,
    ):
        self.db = db

    def login(self, email: str, password: str):
        stmt = select(User).where(User.email == email)
        user = self.db.scalars(stmt).one_or_none()
        if not user:
            raise InvalidCredentialError()

        if not verify_hash(password, user.password_hash):
            raise InvalidCredentialError()

        access_token = create_user_access_token(user.id)
        refresh_token = create_user_refresh_token(user.id)

        return access_token, refresh_token
    
    def refresh(self, data: RefreshRequest):
        try:
            payload = TokenManager.decode(data.refresh_token)
        except Exception:
            raise InvalidTokenError()

        user_id = payload.get("sub")
        token_type = payload.get("token_type")
        request_type = payload.get("type")

        stmt = select(User).where(User.id == int(user_id))
        user = self.db.scalars(stmt).one_or_none()

        if (
            not user
            or not user.is_active
        ):
            raise DeactivatedUserError()

        if (
            token_type != "refresh"
            or request_type != "user"
        ):
            raise InvalidTokenError()

        return create_user_access_token(user.id)

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