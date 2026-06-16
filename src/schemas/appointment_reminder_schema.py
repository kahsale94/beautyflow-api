from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class AppointmentReminderClaimRequest(BaseModel):
    limit: int = Field(default=20, ge=1, le=100)


class AppointmentReminderBusinessPayload(BaseModel):
    id: int
    name: str
    timezone: str
    phone: str


class AppointmentReminderClientPayload(BaseModel):
    id: int
    name: str | None = None
    phone: str
    remote_jid: str


class AppointmentReminderEvolutionPayload(BaseModel):
    instance_name: str


class AppointmentReminderServicePayload(BaseModel):
    id: int
    name: str


class AppointmentReminderProfessionalPayload(BaseModel):
    id: int
    name: str


class AppointmentReminderAppointmentPayload(BaseModel):
    id: int
    start_datetime: datetime
    date: str
    time: str
    weekday: str
    service: AppointmentReminderServicePayload
    professional: AppointmentReminderProfessionalPayload


class AppointmentReminderClaimItem(BaseModel):
    id: int
    appointment_id: int
    reminder_type: str
    scheduled_for: datetime
    appointment_start_datetime: datetime
    appointment: AppointmentReminderAppointmentPayload
    business: AppointmentReminderBusinessPayload
    client: AppointmentReminderClientPayload
    evolution: AppointmentReminderEvolutionPayload
    message: str


class AppointmentReminderClaimResponse(BaseModel):
    reminders: list[AppointmentReminderClaimItem]


class AppointmentReminderSentRequest(BaseModel):
    external_message_id: str | None = None


class AppointmentReminderFailedRequest(BaseModel):
    error: str = Field(min_length=1, max_length=2000)


class AppointmentReminderResponse(BaseModel):
    id: int
    appointment_id: int
    business_id: int
    reminder_type: str
    appointment_start_datetime: datetime
    scheduled_for: datetime
    status: str
    attempts: int
    locked_until: datetime | None = None
    sent_at: datetime | None = None
    failed_at: datetime | None = None
    last_error: str | None = None
    external_message_id: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
