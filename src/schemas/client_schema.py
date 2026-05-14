from pydantic import BaseModel, ConfigDict, Field

from .base_schema import phone_type, name_type

class ClientCreate(BaseModel):
    name: name_type | None = None
    phone: phone_type = Field(examples=["5511900000000"])

class ClientUpdate(BaseModel):
    name: name_type | None = None
    phone: phone_type | None = Field(default=None, examples=["5511900000000"])

class ClientResponse(BaseModel):
    id: int
    name: name_type | None = None
    phone: phone_type = Field(examples=["5511900000000"])
    business_id: int

    model_config = ConfigDict(from_attributes=True)