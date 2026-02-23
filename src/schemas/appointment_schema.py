from datetime import datetime
from pydantic import BaseModel, ConfigDict

class AppointmentCreate(BaseModel):
    professional_id: int
    business_id: int
    service_id: int
    client_name: str
    client_phone: str
    start_datetime: datetime
    end_datetime: datetime

class AppointmentUpdate(BaseModel):
    professional_id: int | None = None
    service_id: int | None = None
    start_datetime: datetime | None = None
    end_datetime: datetime | None = None
    status: str | None = None

class AppointmentResponse(BaseModel):
    id: int
    professional_id: int
    business_id: int
    service_id: int
    client_name: str
    client_phone: str
    start_datetime: datetime
    end_datetime: datetime
    created_at: datetime
    status: str

    model_config = ConfigDict(from_attributes=True)