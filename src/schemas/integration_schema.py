from datetime import datetime
from pydantic import BaseModel, ConfigDict

from .base_schema import name_type
from src.models.integration_model import IntegrationType

class IntegrationCreate(BaseModel):
    name: name_type
    type: IntegrationType

class IntegrationUpdate(BaseModel):
    name: name_type | None = None
    type: IntegrationType | None = None

class IntegrationResponse(BaseModel):
    id: int
    name: name_type
    type: IntegrationType
    created_at: datetime
    is_active: bool

    model_config = ConfigDict(from_attributes=True)

class IntegrationCreateResponse(BaseModel):
    id: int
    name: name_type
    type: IntegrationType
    api_token: str | None = None
    created_at: datetime
    is_active: bool

    model_config = ConfigDict(from_attributes=True)