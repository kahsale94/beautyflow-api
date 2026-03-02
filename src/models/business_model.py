from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import func, DateTime
from sqlalchemy.orm import relationship, Mapped, mapped_column

from .base_model import Base, intpk

if TYPE_CHECKING:
    from .user_model import User
    from .client_model import Client
    from .service_model import Service
    from .appointment_model import Appointment
    from .integration_model import Integration
    from .professional_model import Professional
    from .business_integration_model import BusinessIntegration

class Business(Base):
    __tablename__ = "businesses"

    id: Mapped[intpk]
    name: Mapped[str] = mapped_column(nullable=False)
    type: Mapped[Optional[str]]
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    timezone: Mapped[str] = mapped_column(nullable=False, index=True)
    is_active: Mapped[bool] = mapped_column(nullable=False, default=True)

    appointments: Mapped[list["Appointment"]] = relationship(back_populates="business", cascade="all, delete-orphan")
    professionals: Mapped[list["Professional"]] = relationship(back_populates="business", cascade="all, delete-orphan")
    services: Mapped[list["Service"]] = relationship(back_populates="business", cascade="all, delete-orphan")
    users: Mapped[list["User"]] = relationship(back_populates="business", cascade="all, delete-orphan")
    clients: Mapped[list["Client"]] = relationship(back_populates="business", cascade="all, delete-orphan")

    integrations: Mapped[list["Integration"]] = relationship(secondary="business_integrations", viewonly=True)
    business_integrations: Mapped[list["BusinessIntegration"]] = relationship(back_populates="business", cascade="all, delete-orphan")