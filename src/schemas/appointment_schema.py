from datetime import datetime

from pydantic import BaseModel, ConfigDict

from src.models.appointment_model import AppointmentKind, AppointmentStatus


class AppointmentCreate(BaseModel):
    client_id: int
    professional_id: int | None = None
    service_id: int
    start_datetime: datetime
    kind: AppointmentKind = AppointmentKind.standard

class AppointmentUpdate(BaseModel):
    client_id: int | None = None
    professional_id: int | None = None
    service_id: int | None = None
    start_datetime: datetime | None = None
    kind: AppointmentKind | None = None

class AppointmentResponse(BaseModel):
    id: int
    client_id: int
    professional_id: int
    service_id: int
    business_id: int
    start_datetime: datetime
    end_datetime: datetime
    created_at: datetime
    status: AppointmentStatus
    confirmation_pending: bool
    capacity_slot: int
    kind: AppointmentKind
    series_id: int | None = None
    occurrence_start: datetime | None = None

    model_config = ConfigDict(from_attributes=True)
