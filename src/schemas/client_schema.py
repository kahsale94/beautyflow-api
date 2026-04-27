from pydantic import BaseModel, ConfigDict

from .base_schema import phone_type, name_type

class ClientCreate(BaseModel):
    phone: phone_type
    name: name_type | None = None

class ClientUpdate(BaseModel):
    name: name_type | None = None
    phone: phone_type | None = None

class ClientResponse(BaseModel):
    id: int
    name: name_type | None = None
    phone: phone_type
    business_id: int

    model_config = ConfigDict(from_attributes=True)