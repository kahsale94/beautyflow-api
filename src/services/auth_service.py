from sqlalchemy import select
from sqlalchemy.orm import Session

from src.models import User
from src.security import ActorSecurity, RefreshRequest, TokenManager

class InvalidCredentialError(Exception):
    pass

class InvalidTokenError(Exception):
    pass

class DeactivatedUserError(Exception):
    pass

class AuthService:

    @staticmethod
    def login(db: Session, email: str, password: str):
        stmt = select(User).where(User.email == email)
        user = db.scalars(stmt).first()

        if not user:
            raise InvalidCredentialError()

        if not ActorSecurity.verify_password(password, user.password_hash):
            raise InvalidCredentialError()

        access_token = ActorSecurity.create_user_access_token(user.id)
        refresh_token = ActorSecurity.create_user_refresh_token(user.id)

        return access_token, refresh_token
    
    @staticmethod
    def refresh(db: Session, data: RefreshRequest):
        try:
            payload = TokenManager.decode(data.refresh_token)
        except Exception:
            raise InvalidTokenError()

        if payload.get("token_type") != "refresh":
            raise InvalidTokenError()

        if payload.get("type") != "user":
            raise InvalidTokenError()

        user_id = payload.get("sub")

        stmt = select(User).where(User.id == int(user_id))
        user = db.scalars(stmt).first()

        if not user:
            raise InvalidTokenError()

        if not user.is_active:
            raise DeactivatedUserError()

        return ActorSecurity.create_user_access_token(user.id)        
        
def get_auth_service():
    return AuthService()