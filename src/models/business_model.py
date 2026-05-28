from datetime import datetime
from enum import Enum as PyEnum
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Enum as SAEnum, func, DateTime, String, Text, Integer, Boolean
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
    slug: Mapped[Optional[str]] = mapped_column(String(80), nullable=True, unique=True, index=True)
    type: Mapped[BusinessType] = mapped_column(SAEnum(BusinessType, name="businesstype"), nullable=False)
    timezone: Mapped[str] = mapped_column(nullable=False)

    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    state: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    booking_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="true")
    slot_interval_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=15, server_default="15")
    minimum_notice_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    maximum_schedule_days: Mapped[int] = mapped_column(Integer, nullable=False, default=30, server_default="30")
    allow_client_cancel: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="true")
    cancel_limit_hours: Mapped[int] = mapped_column(Integer, nullable=False, default=24, server_default="24")
    appointment_confirmation_required: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    is_active: Mapped[bool] = mapped_column(nullable=False, default=True, server_default="true")

    appointments: Mapped[list["Appointment"]] = relationship(back_populates="business", cascade="all, delete-orphan")
    professionals: Mapped[list["Professional"]] = relationship(back_populates="business", cascade="all, delete-orphan")
    services: Mapped[list["Service"]] = relationship(back_populates="business", cascade="all, delete-orphan")
    users: Mapped[list["User"]] = relationship(back_populates="business", cascade="all, delete-orphan")
    clients: Mapped[list["Client"]] = relationship(back_populates="business", cascade="all, delete-orphan")

    integrations: Mapped[list["Integration"]] = relationship(secondary="business_integrations", viewonly=True)
    business_integrations: Mapped[list["BusinessIntegration"]] = relationship(back_populates="business", cascade="all, delete-orphan")