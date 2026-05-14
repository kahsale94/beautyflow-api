from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field

from .base_schema import name_type

class ServiceCreate(BaseModel):
    name: name_type
    duration_minutes: int = Field(gt=0, examples=[60])
    price: Decimal = Field(gt=0, examples=[Decimal("99.90")])

class ServiceUpdate(BaseModel):
    name: name_type | None = None
    duration_minutes: int | None = Field(gt=0, default=None, examples=[60])
    price: Decimal | None = Field(gt=0, default=None, examples=[Decimal("99.90")])

class ServiceResponse(BaseModel):
    id: int
    business_id: int
    name: name_type
    duration_minutes: int = Field(examples=[60])
    price: Decimal = Field(examples=[Decimal("99.90")])
    is_active: bool

    model_config = ConfigDict(from_attributes=True)