from pydantic import BaseModel, ConfigDict

class ServiceCreate(BaseModel):
    name: str
    duration_minutes: int
    price: float

class ServiceUpdate(BaseModel):
    name: str | None = None
    duration_minutes: int | None = None
    price: float | None = None

class ServiceResponse(BaseModel):
    id: int
    business_id: int
    name: str
    duration_minutes: int
    price: float
    is_active: bool

    model_config = ConfigDict(from_attributes=True)