from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, Field


class NotificationJobClaimRequest(BaseModel):
    limit: int = Field(default=20, ge=1, le=100)


class NotificationJobClaimItem(BaseModel):
    id: int
    business_id: int
    notification_type: str
    appointment_id: int | None = None
    professional_id: int | None = None
    recipient_phone: str | None = None
    recipient_email: str | None = None
    message: str
    payload: dict[str, Any]


class NotificationJobClaimResponse(BaseModel):
    jobs: list[NotificationJobClaimItem]


class NotificationJobFailedRequest(BaseModel):
    error: str = Field(min_length=1, max_length=2000)


class NotificationJobSentRequest(BaseModel):
    external_message_id: str | None = None


class ProfessionalNoAppointmentsRequest(BaseModel):
    date: date
