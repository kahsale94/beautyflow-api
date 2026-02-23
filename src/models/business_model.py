from sqlalchemy import func
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy.orm import relationship, Mapped, mapped_column
from .base_model import Base, intpk

if TYPE_CHECKING:
    from service_model import Service
    from appointment_model import Appointment
    from professional_model import Professional

class Business(Base):
    __tablename__ = "businesses"

    id: Mapped[intpk]
    name: Mapped[str] = mapped_column(nullable=False, unique=True)
    type: Mapped[Optional[str]]
    timezone: Mapped[str] = mapped_column(nullable=False, default="UTC-03:00")
    created_at: Mapped[datetime] = mapped_column(default=func.now())
    api_key: Mapped[str] = mapped_column(nullable=False, unique=True)
    is_active: Mapped[bool] = mapped_column(nullable=False, default=True)

    appointments: Mapped[list["Appointment"]] = relationship(back_populates="business", cascade="all, delete-orphan")
    professionals: Mapped[list["Professional"]] = relationship(back_populates="business", cascade="all, delete-orphan")
    services: Mapped[list["Service"]] = relationship(back_populates="business", cascade="all, delete-orphan")