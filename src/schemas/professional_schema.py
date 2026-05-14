from pydantic import BaseModel, ConfigDict

from .base_schema import name_type

class ProfessionalCreate(BaseModel):
    name: name_type
    email: str

class ProfessionalUpdate(BaseModel):
    name: name_type | None = None
    email: str | None = None

class ProfessionalResponse(BaseModel):
    id: int
    name: name_type
    email: str
    business_id: int
    is_active: bool

    model_config = ConfigDict(from_attributes=True)