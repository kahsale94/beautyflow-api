from datetime import date, datetime, time

from pydantic import BaseModel, ConfigDict, Field


class AvailabilityCreate(BaseModel):
    professional_id: int
    weekday: int = Field(ge=0, le=6)
    start_time: time
    end_time: time

class AvailabilityUpdate(BaseModel):
    start_time: time | None = None
    end_time: time | None = None

class AvailabilitySlotsResponse(BaseModel):
    slot_time: time

class AvailabilityCheckAndSuggestRequest(BaseModel):
    professional_id: int
    service_id: int
    requested_start: datetime
    client_id: int | None = None
    exclude_appointment_id: int | None = None
    max_suggestions: int = Field(default=3, ge=1, le=10)
    search_days_ahead: int | None = Field(default=None, ge=0, le=60)

class AvailabilitySuggestionResponse(BaseModel):
    start_datetime: datetime
    end_datetime: datetime
    date: date
    slot_time: time
    weekday: str

class AvailabilityCheckAndSuggestResponse(BaseModel):
    requested_start: datetime
    requested_end: datetime
    available: bool
    reason: str | None = None
    suggestions: list[AvailabilitySuggestionResponse] = Field(default_factory=list)


class ProfessionalCapacityResponse(BaseModel):
    professional_id: int
    capacity: int
    occupied: int
    remaining_capacity: int


class StudioAvailabilityCheckRequest(BaseModel):
    service_id: int
    requested_start: datetime
    client_id: int | None = None
    exclude_appointment_id: int | None = None
    max_suggestions: int = Field(default=3, ge=1, le=10)
    search_days_ahead: int | None = Field(default=None, ge=0, le=60)


class StudioAvailabilityCheckResponse(BaseModel):
    requested_start: datetime
    requested_end: datetime
    weekday: str
    available: bool
    reason: str
    total_capacity: int
    occupied: int
    remaining_capacity: int
    professionals: list[ProfessionalCapacityResponse] = Field(default_factory=list)
    suggestions: list[AvailabilitySuggestionResponse] = Field(default_factory=list)

class AvailabilityResponse(BaseModel):
    professional_id: int
    weekday: int = Field(ge=0, le=6)
    start_time: time
    end_time: time

    model_config = ConfigDict(from_attributes=True)
