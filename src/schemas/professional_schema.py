from pydantic import BaseModel, ConfigDict, EmailStr, Field

from .base_schema import name_type, phone_type

class ProfessionalCreate(BaseModel):
    name: name_type
    email: EmailStr = Field(examples=["example@gmail.com"])
    phone: phone_type = Field(examples=["5511900000000"])

class ProfessionalUpdate(BaseModel):
    name: name_type | None = None
    email: EmailStr | None = Field(default=None, examples=["example@gmail.com"])
    phone: phone_type | None = Field(default=None, examples=["5511900000000"])

class ProfessionalResponse(BaseModel):
    id: int
    name: name_type
    email: EmailStr = Field(examples=["example@gmail.com"])
    phone: phone_type = Field(examples=["5511900000000"])
    business_id: int
    is_active: bool

    model_config = ConfigDict(from_attributes=True)