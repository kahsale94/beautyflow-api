from datetime import datetime
from enum import Enum as PyEnum
from typing import TYPE_CHECKING
from sqlalchemy import Enum as SAEnum, func, DateTime
from sqlalchemy.orm import relationship, Mapped, mapped_column

from .base_model import Base, intpk, name_type

if TYPE_CHECKING:
    from .user_model import User
    from .client_model import Client
    from .service_model import Service
    from .appointment_model import Appointment
    from .integration_model import Integration
    from .professional_model import Professional
    from .business_integration_model import BusinessIntegration

class BusinessType(str, PyEnum):
    barbershop = "barbershop"
    salon = "salon"
    clinic = "clinic"

class Business(Base):
    __tablename__ = "businesses"

    id: Mapped[intpk]
    name: Mapped[name_type] = mapped_column(nullable=False, unique=True)
    type: Mapped[BusinessType] = mapped_column(SAEnum(BusinessType, name="businesstype"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    timezone: Mapped[str] = mapped_column(nullable=False)
    is_active: Mapped[bool] = mapped_column(nullable=False, default=True, server_default="true")

    appointments: Mapped[list["Appointment"]] = relationship(back_populates="business", cascade="all, delete-orphan")
    professionals: Mapped[list["Professional"]] = relationship(back_populates="business", cascade="all, delete-orphan")
    services: Mapped[list["Service"]] = relationship(back_populates="business", cascade="all, delete-orphan")
    users: Mapped[list["User"]] = relationship(back_populates="business", cascade="all, delete-orphan")
    clients: Mapped[list["Client"]] = relationship(back_populates="business", cascade="all, delete-orphan")

    integrations: Mapped[list["Integration"]] = relationship(secondary="business_integrations", viewonly=True)
    business_integrations: Mapped[list["BusinessIntegration"]] = relationship(back_populates="business", cascade="all, delete-orphan")