from pydantic import BaseModel, ConfigDict

from src.models import UserRole

class UserCreate(BaseModel):
    email: str
    password: str
    role: UserRole

class UserUpdate(BaseModel):
    email: str | None = None
    password: str | None = None
    role: UserRole | None = None

class UserResponse(BaseModel):
    id: int
    email: str
    role: UserRole

    model_config = ConfigDict(from_attributes=True)