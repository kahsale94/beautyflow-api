from typing import Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class BusinessIntegrationCreate(BaseModel):
    integration_id: int
    config: Dict[str, Any] | None = None

class BusinessIntegrationUpdate(BaseModel):
    config: Dict[str, Any] | None = None

class BusinessIntegrationResponse(BaseModel):
    business_id: int
    integration_id: int
    config: Dict[str, Any] | None = None
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)