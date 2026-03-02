from pydantic import BaseModel, ConfigDict

class ProfessionalCreate(BaseModel):
    name: str

class ProfessionalUpdate(BaseModel):
    name: str | None = None
    is_active: bool | None = None

class ProfessionalResponse(BaseModel):
    id: int
    name: str
    business_id: int
    is_active: bool

    model_config = ConfigDict(from_attributes=True)