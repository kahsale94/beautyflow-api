from pydantic import BaseModel, ConfigDict, EmailStr, Field

from src.models.user_model import UserRole

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    role: UserRole

class UserUpdate(BaseModel):
    email: EmailStr | None = None
    role: UserRole | None = None
    password: str | None = Field(default=None, min_length=8)

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    role: UserRole
    business_id: int | None
    is_active: bool

    model_config = ConfigDict(from_attributes=True)
