from pydantic import BaseModel, ConfigDict, EmailStr

from .base_schema import name_type

class ProfessionalCreate(BaseModel):
    name: name_type
    email: EmailStr

class ProfessionalUpdate(BaseModel):
    name: name_type | None = None
    email: EmailStr | None = None

class ProfessionalResponse(BaseModel):
    id: int
    name: name_type
    email: EmailStr
    business_id: int
    is_active: bool

    model_config = ConfigDict(from_attributes=True)