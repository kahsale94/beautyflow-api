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
    max_suggestions: int = Field(default=3, ge=1, le=10)
    search_days_ahead: int | None = Field(default=None, ge=0, le=60)

class AvailabilitySuggestionResponse(BaseModel):
    start_datetime: datetime
    end_datetime: datetime
    date: date
    slot_time: time

class AvailabilityCheckAndSuggestResponse(BaseModel):
    requested_start: datetime
    requested_end: datetime
    available: bool
    reason: str | None = None
    suggestions: list[AvailabilitySuggestionResponse] = Field(default_factory=list)

class AvailabilityResponse(BaseModel):
    professional_id: int
    weekday: int = Field(ge=0, le=6)
    start_time: time
    end_time: time

    model_config = ConfigDict(from_attributes=True)
