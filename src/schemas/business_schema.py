from datetime import datetime
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError
from pydantic import BaseModel, ConfigDict, field_validator, Field

from .base_schema import name_type
from src.models.business_model import BusinessType

class BusinessCreate(BaseModel):
    name: name_type
    type: BusinessType
    timezone: str = Field(examples=["America/Sao_Paulo"])

    @field_validator("timezone")
    @classmethod
    def validate_timezone(cls, value: str) -> str:
        try:
            ZoneInfo(value)
        except ZoneInfoNotFoundError:
            raise ValueError("Timezone inválido. Use um timezone IANA válido, ex: America/Sao_Paulo")

        return value

class BusinessUpdate(BaseModel):
    name: name_type | None = None
    type: BusinessType | None = None
    timezone: str | None = Field(default=None, examples=["America/Sao_Paulo"])

    @field_validator("timezone")
    @classmethod
    def validate_timezone(cls, value: str | None) -> str | None:
        if value is None:
            return value

        try:
            ZoneInfo(value)
        except ZoneInfoNotFoundError:
            raise ValueError("Timezone inválido. Use um timezone IANA válido, ex: America/Sao_Paulo")

        return value

class BusinessResponse(BaseModel):
    id: int
    name: name_type
    type: BusinessType
    timezone: str = Field(examples=["America/Sao_Paulo"])
    created_at: datetime
    is_active: bool

    model_config = ConfigDict(from_attributes=True)