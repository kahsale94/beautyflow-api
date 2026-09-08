from datetime import datetime

from pydantic import BaseModel, ConfigDict

from src.models.replacement_entitlement_model import (
    ReplacementEntitlementReason,
    ReplacementEntitlementStatus,
)
from src.schemas.appointment_schema import AppointmentResponse


class ReplacementEntitlementCreate(BaseModel):
    source_appointment_id: int
    reason: ReplacementEntitlementReason = ReplacementEntitlementReason.manual


class ReplacementBookingCreate(BaseModel):
    start_datetime: datetime
    professional_id: int | None = None


class ReplacementEntitlementResponse(BaseModel):
    id: int
    business_id: int
    client_id: int
    source_appointment_id: int
    replacement_appointment_id: int | None = None
    status: ReplacementEntitlementStatus
    expires_at: datetime
    reason: ReplacementEntitlementReason
    created_at: datetime
    used_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class ReplacementUseResponse(BaseModel):
    entitlement: ReplacementEntitlementResponse
    appointment: AppointmentResponse
