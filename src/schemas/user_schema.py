from pydantic import BaseModel, ConfigDict, EmailStr

from src.models.user_model import UserRole

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: UserRole

class UserUpdate(BaseModel):
    email: EmailStr | None = None
    password: str | None = None
    role: UserRole | None = None

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    role: UserRole
    business_id: int | None
    is_active: bool

    model_config = ConfigDict(from_attributes=True)