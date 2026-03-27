from datetime import datetime
from enum import Enum as PyEnum
from typing import TYPE_CHECKING

from sqlalchemy.sql import text
from sqlalchemy.dialects.postgresql import ExcludeConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import CheckConstraint, DateTime, Enum as SAEnum, func

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

    __table_args__ = (
        CheckConstraint("start_datetime < end_datetime", name="ck_appointments_valid_datetime_range",),
        ExcludeConstraint(("business_id", "="),("professional_id", "="),(text("tstzrange(start_datetime, end_datetime, '[)')"),"&&",),
            where=text("status = 'scheduled'"),
            using="gist",
            name="ex_appointments_professional_time_conflict",
        ),
    )

    id: Mapped[intpk]
    client_id: Mapped[client_fk]
    professional_id: Mapped[professional_fk]
    service_id: Mapped[service_fk]
    business_id: Mapped[business_fk]
    start_datetime: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_datetime: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    status: Mapped[AppointmentStatus] = mapped_column(SAEnum(AppointmentStatus, name="appointmentstatus"), nullable=False, default=AppointmentStatus.scheduled, server_default=AppointmentStatus.scheduled.value)

    client: Mapped["Client"] = relationship(back_populates="appointments")
    professional: Mapped["Professional"] = relationship(back_populates="appointments")
    service: Mapped["Service"] = relationship(back_populates="appointments")
    business: Mapped["Business"] = relationship(back_populates="appointments")