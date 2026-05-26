import re
from datetime import datetime
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from pydantic import BaseModel, ConfigDict, field_validator, Field, EmailStr

from .base_schema import name_type
from src.models.business_model import BusinessType

def validate_slug_value(value: str | None) -> str | None:
    if value is None:
        return value

    if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", value):
        raise ValueError("Slug inválido. Use apenas letras minúsculas, números e hífens.")

    return value

class BusinessCreate(BaseModel):
    name: name_type
    type: BusinessType
    timezone: str = Field(examples=["America/Sao_Paulo"])

    slug: str | None = None
    phone: str | None = None
    email: EmailStr | None = None
    address: str | None = None
    city: str | None = None
    state: str | None = None
    description: str | None = None

    booking_enabled: bool = True
    slot_interval_minutes: int = Field(default=15, gt=0, le=240)
    minimum_notice_minutes: int = Field(default=0, ge=0)
    maximum_schedule_days: int = Field(default=30, ge=1, le=365)
    allow_client_cancel: bool = True
    cancel_limit_hours: int = Field(default=24, ge=0)
    appointment_confirmation_required: bool = False

    @field_validator("timezone")
    @classmethod
    def validate_timezone(cls, value: str) -> str:
        try:
            ZoneInfo(value)
        except ZoneInfoNotFoundError:
            raise ValueError("Timezone inválido. Use um timezone IANA válido, ex: America/Sao_Paulo")

        return value

    @field_validator("slug")
    @classmethod
    def validate_slug(cls, value: str | None) -> str | None:
        return validate_slug_value(value)

class BusinessUpdate(BaseModel):
    name: name_type | None = None
    type: BusinessType | None = None
    timezone: str | None = Field(default=None, examples=["America/Sao_Paulo"])

    slug: str | None = None
    phone: str | None = None
    email: EmailStr | None = None
    address: str | None = None
    city: str | None = None
    state: str | None = None
    description: str | None = None

    booking_enabled: bool | None = None
    slot_interval_minutes: int | None = Field(default=None, gt=0, le=240)
    minimum_notice_minutes: int | None = Field(default=None, ge=0)
    maximum_schedule_days: int | None = Field(default=None, ge=1, le=365)
    allow_client_cancel: bool | None = None
    cancel_limit_hours: int | None = Field(default=None, ge=0)
    appointment_confirmation_required: bool | None = None

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

    @field_validator("slug")
    @classmethod
    def validate_slug(cls, value: str | None) -> str | None:
        return validate_slug_value(value)

class BusinessResponse(BaseModel):
    id: int
    name: name_type
    slug: str | None = None
    type: BusinessType
    timezone: str = Field(examples=["America/Sao_Paulo"])
    created_at: datetime
    is_active: bool

    phone: str | None = None
    email: EmailStr | None = None
    address: str | None = None
    city: str | None = None
    state: str | None = None
    description: str | None = None

    booking_enabled: bool
    slot_interval_minutes: int
    minimum_notice_minutes: int
    maximum_schedule_days: int
    allow_client_cancel: bool
    cancel_limit_hours: int
    appointment_confirmation_required: bool

    model_config = ConfigDict(from_attributes=True)