from datetime import time
from pydantic import BaseModel, ConfigDict

class AvailabilityCreate(BaseModel):
    professional_id: int
    weekday: int
    start_time: time
    end_time: time

class AvailabilityUpdate(BaseModel):
    weekday: int | None = None
    start_time: time | None = None
    end_time: time | None = None

class AvailabilityResponse(BaseModel):
    professional_id: int
    weekday: int
    start_time: time
    end_time: time

    model_config = ConfigDict(from_attributes=True)