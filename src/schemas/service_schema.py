from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field

from .base_schema import name_type

class ServiceCreate(BaseModel):
    name: name_type
    duration_minutes: int = Field(gt=0)
    price: Decimal = Field(gt=0)

class ServiceUpdate(BaseModel):
    name: name_type | None = None
    duration_minutes: int | None = None
    price: Decimal | None = None

class ServiceResponse(BaseModel):
    id: int
    business_id: int
    name: name_type
    duration_minutes: int
    price: Decimal
    is_active: bool

    model_config = ConfigDict(from_attributes=True)