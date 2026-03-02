from pydantic import BaseModel, ConfigDict

class ClientCreate(BaseModel):
    phone: str
    name: str | None = None
    name_wpp: str

class ClientUpdate(BaseModel):
    name: str | None = None
    name_wpp: str | None = None
    phone: str | None = None

class ClientResponse(BaseModel):
    id: int
    name: str | None = None
    name_wpp: str
    phone: str
    business_id: int

    model_config = ConfigDict(from_attributes=True)