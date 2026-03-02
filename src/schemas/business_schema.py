from datetime import datetime
from pydantic import BaseModel, ConfigDict

class BusinessCreate(BaseModel):
    name: str
    type: str | None = None
    timezone: str

class BusinessUpdate(BaseModel):
    name: str | None = None
    type: str | None = None
    timezone: str | None = None

class BusinessResponse(BaseModel):
    id: int
    name: str
    type: str | None = None
    timezone: str
    created_at: datetime
    is_active: bool

    model_config = ConfigDict(from_attributes=True)