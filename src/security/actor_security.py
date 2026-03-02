from typing import Union
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from fastapi import Depends, HTTPException

from .token import TokenManager
from .oauth import oauth2_scheme
from src.models import User, Integration
from .context import UserContext, IntegrationContext
from src.core import get_db, ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class ActorSecurity:

    @staticmethod
    def password_hash(password: str) -> str:
        return pwd_context.hash(password)

    @staticmethod
    def verify_password(password: str, password_hash: str) -> bool:
        return pwd_context.verify(password, password_hash)

    @staticmethod
    def create_user_access_token(user_id: int) -> str:
        payload = {
            "sub": str(user_id),
            "type": "user",
            "token_type": "access",
            "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
        }

        return TokenManager.encode(payload)

    @staticmethod
    def create_user_refresh_token(user_id: int) -> str:
        payload = {
            "sub": str(user_id),
            "type": "user",
            "token_type": "refresh",
            "exp": datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
        }

        return TokenManager.encode(payload)

    @staticmethod
    def create_integration_token(integration_id: int, business_id: int, name: str) -> str:
        payload = {
            "sub": str(integration_id),
            "business_id": business_id,
            "name": name,
            "type": "integration",
            "token_type": "access",
            "exp": datetime.now(timezone.utc) + timedelta(days=365),
        }

        return TokenManager.encode(payload)

    @staticmethod
    def get_current_actor(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> Union[UserContext, IntegrationContext]:
        payload = TokenManager.decode(token)

        actor_type = payload.get("type")
        token_type = payload.get("token_type")

        if token_type != "access":
            raise HTTPException(status_code=401, detail="Token inválido")

        if actor_type == "user":

            user_id = int(payload.get("sub"))
            if not user_id:
                raise HTTPException(status_code=401, detail="Token inválido")

            user = db.get(User, user_id)

            if not user or not user.is_active:
                raise HTTPException(status_code=401, detail="Usuário não encontrado")

            return UserContext(
                type = "user",
                id = user.id,
                email = user.email,
                role = user.role,
                business_id = user.business_id,
            )
        
        if actor_type == "integration":

            integration_id = int(payload.get("sub"))
            business_id = payload.get("business_id")

            integration = db.get(Integration, integration_id)

            if not integration or not business_id:
                raise HTTPException(status_code=401, detail="Token inválido")

            return IntegrationContext(
                type = "integration",
                integration_id = integration_id,
                business_id = int(business_id),
            )

        raise HTTPException(status_code=401, detail="Token inválido")