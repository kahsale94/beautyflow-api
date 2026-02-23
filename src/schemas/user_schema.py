from pydantic import BaseModel, ConfigDict

class UserCreate(BaseModel):
    email: str
    senha: str
    role: str

class UserResponse(BaseModel):
    id: int
    email: str
    role: str

    model_config = ConfigDict(from_attributes=True)