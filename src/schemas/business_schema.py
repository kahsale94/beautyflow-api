from datetime import datetime
from zoneinfo import ZoneInfo
from pydantic import BaseModel, ConfigDict, field_validator

from .base_schema import name_type
from src.models.business_model import BusinessType

class BusinessCreate(BaseModel):
    name: name_type
    type: BusinessType
    timezone: str

    @field_validator("timezone")
    def validate_timezone(cls, v):
        ZoneInfo(v)
        return v

class BusinessUpdate(BaseModel):
    name: name_type | None = None
    type: BusinessType | None = None
    timezone: str | None = None

class BusinessResponse(BaseModel):
    id: int
    name: name_type
    type: BusinessType
    timezone: str
    created_at: datetime
    is_active: bool

    model_config = ConfigDict(from_attributes=True)