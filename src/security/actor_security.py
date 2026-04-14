from typing import Union
from datetime import datetime, timedelta, timezone
from sqlalchemy import select
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from fastapi import Depends, HTTPException

from .token import TokenManager
from .oauth import oauth2_scheme
from src.models import User, Integration, BusinessIntegration
from .context import UserContext, IntegrationContext, BusinessIntegrationContext
from src.core import (
    get_db, USER_ACCESS_TOKEN_EXPIRE_MINUTES, USER_REFRESH_TOKEN_EXPIRE_DAYS, 
    INTEGRATION_TOKEN_EXPIRE_DAYS, BUSINESS_INTEGRATION_TOKEN_EXPIRE_MINUTES, 
    USER_SECRET_KEY, INTEGRATION_SECRET_KEY, BUSINESS_INTEGRATION_SECRET_KEY
    )

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class ActorSecurity:

    @staticmethod
    def hash(secret: str) -> str:
        return pwd_context.hash(secret)

    @staticmethod
    def verify_hash(secret: str, secret_hash: str) -> bool:
        return pwd_context.verify(secret, secret_hash)

    @staticmethod
    def create_user_access_token(user_id: int) -> str:
        payload = {
            "sub": str(user_id),
            "type": "user",
            "token_type": "access",
            "exp": datetime.now(timezone.utc) + timedelta(minutes=USER_ACCESS_TOKEN_EXPIRE_MINUTES),
        }

        return TokenManager.encode(payload, USER_SECRET_KEY)

    @staticmethod
    def create_user_refresh_token(user_id: int) -> str:
        payload = {
            "sub": str(user_id),
            "type": "user",
            "token_type": "refresh",
            "exp": datetime.now(timezone.utc) + timedelta(days=USER_REFRESH_TOKEN_EXPIRE_DAYS),
        }

        return TokenManager.encode(payload, USER_SECRET_KEY)

    @staticmethod
    def create_integration_token(integration_id: int) -> str:      
        payload = {
            "sub": str(integration_id),
            "type": "integration",
            "token_type": "access",
            "exp": datetime.now(timezone.utc) + timedelta(days=INTEGRATION_TOKEN_EXPIRE_DAYS),
        }

        return TokenManager.encode(payload, INTEGRATION_SECRET_KEY)
    
    @staticmethod
    def create_business_integration_token(business_id: int, integration_id: int) -> str:
        payload = {
            "sub": str(integration_id),
            "business_id": business_id,
            "type": "business_integration",
            "token_type": "access",
            "exp": datetime.now(timezone.utc) + timedelta(minutes=BUSINESS_INTEGRATION_TOKEN_EXPIRE_MINUTES),
        }

        return TokenManager.encode(payload, BUSINESS_INTEGRATION_SECRET_KEY)

    @staticmethod
    def get_current_actor(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> Union[UserContext, BusinessIntegrationContext, IntegrationContext]:
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
            if(
                not user
                or not user.is_active
            ):
                raise HTTPException(status_code=401, detail="Usuário não encontrado")

            return UserContext(
                type = "user",
                id = user.id,
                email = user.email,
                role = user.role,
                business_id = user.business_id,
                is_active = user.is_active,
            )
        
        if actor_type == "integration":

            integration_id = int(payload.get("sub"))

            stmt = select(Integration).where(
                Integration.id == integration_id,
                Integration.is_active == True,
            )

            result = db.scalar(stmt)
            if not result:
                raise HTTPException(status_code=401, detail="Integração inválida")

            return IntegrationContext(
                type = "integration",
                id = integration_id,
            )
        
        if actor_type == "business_integration":

            integration_id = int(payload.get("sub"))
            business_id = payload.get("business_id")

            stmt = select(BusinessIntegration).where(
                BusinessIntegration.integration_id == integration_id,
                BusinessIntegration.business_id == business_id,
                BusinessIntegration.is_active == True,
            )

            result = db.scalar(stmt)
            if not result:
                raise HTTPException(status_code=401, detail="Integração inválida para Empresa!")

            return BusinessIntegrationContext(
                type = "business_integration",
                integration_id = integration_id,
                business_id = int(business_id),
            )

        raise HTTPException(status_code=401, detail="Token inválido")