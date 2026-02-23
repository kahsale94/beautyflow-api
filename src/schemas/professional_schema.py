from pydantic import BaseModel, ConfigDict

class ProfessionalCreate(BaseModel):
    business_id: int
    name: str

class ProfessionalUpdate(BaseModel):
    business_id: int | None = None
    name: str | None = None
    is_active: bool | None = None

class ProfessionalResponse(BaseModel):
    id: int
    business_id: int
    name: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)