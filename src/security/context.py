from pydantic import BaseModel
from typing import Literal

class BaseActor(BaseModel):
    type: Literal["user", "integration", "business_integration"]

class UserContext(BaseActor):
    id: int
    email: str
    role: str
    business_id: int | None = None

class BusinessIntegrationContext(BaseActor):
    integration_id: int
    business_id: int

class IntegrationContext(BaseActor):
    id: int
    token: str

class RefreshRequest(BaseModel):
    refresh_token: str