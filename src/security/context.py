from pydantic import BaseModel
from typing import Literal

class BaseActor(BaseModel):
    type: Literal["user", "integration"]

class UserContext(BaseActor):
    id: int
    email: str
    role: str
    business_id: int | None = None

class IntegrationContext(BaseActor):
    integration_id: int
    business_id: int

class RefreshRequest(BaseModel):
    refresh_token: str