from datetime import datetime
from pydantic import BaseModel, ConfigDict

class IntegrationCreate(BaseModel):
    name: str
    type: str | None = None

class IntegrationUpdate(BaseModel):
    name: str | None = None
    type: str | None = None

class IntegrationResponse(BaseModel):
    id: int
    name: str
    type: str | None = None
    created_at: datetime
    is_active: bool

    model_config = ConfigDict(from_attributes=True)