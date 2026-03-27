from typing import Literal
from pydantic import BaseModel, EmailStr

from src.models.user_model import UserRole

class BaseActor(BaseModel):
    type: Literal["user", "integration", "business_integration"]

class UserContext(BaseActor):
    id: int
    email: EmailStr
    role: UserRole
    business_id: int | None = None
    is_active: bool

class BusinessIntegrationContext(BaseActor):
    integration_id: int
    business_id: int

class IntegrationContext(BaseActor):
    id: int

class RefreshRequest(BaseModel):
    refresh_token: str