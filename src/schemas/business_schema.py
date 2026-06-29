import re
from datetime import datetime, time
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from pydantic import BaseModel, ConfigDict, field_validator, Field, EmailStr, model_validator

from .base_schema import name_type, phone_type
from src.models.business_model import BusinessAttendancePlan, BusinessType
from src.utils import normalize_cep


def validate_slug_value(value: str | None) -> str | None:
    if value is None:
        return value

    if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", value):
        raise ValueError("Slug inválido. Use apenas letras minúsculas, números e hífens.")

    return value

class BusinessCreate(BaseModel):
    name: name_type
    type: BusinessType
    attendance_plan: BusinessAttendancePlan = BusinessAttendancePlan.business_hours
    timezone: str = Field(examples=["America/Sao_Paulo"])

    slug: str | None = None
    phone: phone_type = Field(examples=["5511900000000"])
    email: EmailStr | None = None
    cep: str | None = None
    address: str | None = None
    city: str | None = None
    state: str | None = None
    description: str | None = None
    opening_hours: list["BusinessOpeningHourCreate"] = Field(default_factory=list)

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

    @field_validator("cep")
    @classmethod
    def validate_cep(cls, value: str | None) -> str | None:
        return normalize_cep(value)

class BusinessUpdate(BaseModel):
    name: name_type | None = None
    type: BusinessType | None = None
    attendance_plan: BusinessAttendancePlan | None = None
    timezone: str | None = Field(default=None, examples=["America/Sao_Paulo"])

    slug: str | None = None
    phone: phone_type | None = Field(default=None, examples=["5511900000000"])
    email: EmailStr | None = None
    cep: str | None = None
    address: str | None = None
    city: str | None = None
    state: str | None = None
    description: str | None = None
    opening_hours: list["BusinessOpeningHourCreate"] | None = None

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

    @field_validator("cep")
    @classmethod
    def validate_cep(cls, value: str | None) -> str | None:
        return normalize_cep(value)

class BusinessOpeningHourCreate(BaseModel):
    weekday: int = Field(ge=0, le=6)
    start_time: time
    end_time: time

    @model_validator(mode="after")
    def validate_time_range(self):
        if self.start_time >= self.end_time:
            raise ValueError("Horário inicial deve ser menor que o horário final.")

        return self

class BusinessOpeningHourResponse(BaseModel):
    business_id: int
    weekday: int = Field(ge=0, le=6)
    start_time: time
    end_time: time

    model_config = ConfigDict(from_attributes=True)

class BusinessAttendanceStatusResponse(BaseModel):
    plan: BusinessAttendancePlan
    business_is_open: bool
    allowed: bool
    block_reason: str | None = None
    checked_at: str

class BusinessResponse(BaseModel):
    id: int
    name: name_type
    slug: str | None = None
    type: BusinessType
    attendance_plan: BusinessAttendancePlan
    timezone: str = Field(examples=["America/Sao_Paulo"])
    created_at: datetime
    is_active: bool

    phone: phone_type
    email: EmailStr | None = None
    address: str | None = None
    city: str | None = None
    state: str | None = None
    description: str | None = None
    opening_hours: list[BusinessOpeningHourResponse] = Field(default_factory=list)

    booking_enabled: bool
    slot_interval_minutes: int
    minimum_notice_minutes: int
    maximum_schedule_days: int
    allow_client_cancel: bool
    cancel_limit_hours: int
    appointment_confirmation_required: bool
    business_is_open: bool
    attendance_allowed: bool
    attendance_block_reason: str | None = None
    attendance_status: BusinessAttendanceStatusResponse

    model_config = ConfigDict(from_attributes=True)
