from pydantic import BaseModel, ConfigDict

class ProfessionalServiceCreate(BaseModel):
    professional_id: int
    service_id: int

class ProfessionalServiceResponse(BaseModel):
    professional_id: int
    service_id: int

    model_config = ConfigDict(from_attributes=True)