from datetime import time, datetime
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

class AvailabilityResponse(BaseModel):
    professional_id: int
    weekday: int = Field(ge=0, le=6)
    start_time: time
    end_time: time

    model_config = ConfigDict(from_attributes=True)