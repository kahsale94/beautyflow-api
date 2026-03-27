from enum import Enum as PyEnum
from typing import TYPE_CHECKING
from sqlalchemy import Enum as SAEnum
from sqlalchemy import UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base_model import Base, intpk, business_fk

if TYPE_CHECKING:
    from .business_model import Business

class UserRole(str, PyEnum):
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    USER = "user"

class User(Base):
    __tablename__ = "users"

    __table_args__ = (UniqueConstraint("business_id", "email", name="uq_user_business_email"),)

    id: Mapped[intpk]
    business_id: Mapped[business_fk] = mapped_column(nullable=True)
    email: Mapped[str] = mapped_column(nullable=False)
    password_hash: Mapped[str] = mapped_column(nullable=False)
    role: Mapped[UserRole] = mapped_column(SAEnum(UserRole, name="userrole"), nullable=False)
    is_active: Mapped[bool] = mapped_column(nullable=False, default=True)

    business: Mapped["Business"] = relationship(back_populates="users")