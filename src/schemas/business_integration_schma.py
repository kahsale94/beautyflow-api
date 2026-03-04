from datetime import datetime
from pydantic import BaseModel, ConfigDict

class BusinessIntegrationResponse(BaseModel):
    business_id: int
    integration_id: int
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)