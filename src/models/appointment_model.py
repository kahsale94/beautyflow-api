from datetime import datetime
from enum import Enum as PyEnum
from typing import TYPE_CHECKING
from sqlalchemy import func, DateTime, Enum as SAEnum
from sqlalchemy.orm import relationship, Mapped, mapped_column

from .base_model import Base, intpk, business_fk, professional_fk, service_fk, client_fk

if TYPE_CHECKING:
    from .client_model import Client
    from .service_model import Service
    from .business_model import Business
    from .professional_model import Professional

class AppointmentStatus(str, PyEnum):
    scheduled = "scheduled"
    canceled = "canceled"
    completed = "completed"

class Appointment(Base):
    __tablename__ = "appointments"

    id: Mapped[intpk]
    cliente_id: Mapped[client_fk]
    professional_id: Mapped[professional_fk]
    service_id: Mapped[service_fk]
    business_id: Mapped[business_fk]
    start_datetime: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_datetime: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    status: Mapped[AppointmentStatus] = mapped_column(SAEnum(AppointmentStatus, name="appointmentstatus"), nullable=False, default="scheduled")

    client: Mapped["Client"] = relationship(back_populates="appointments")
    professional: Mapped["Professional"] = relationship(back_populates="appointments")
    service: Mapped["Service"] = relationship(back_populates="appointments")
    business: Mapped["Business"] = relationship(back_populates="appointments")