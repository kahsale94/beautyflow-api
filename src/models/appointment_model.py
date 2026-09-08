from datetime import datetime
from enum import Enum as PyEnum
from typing import TYPE_CHECKING

from sqlalchemy.sql import text
from sqlalchemy.dialects.postgresql import ExcludeConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Boolean, CheckConstraint, DateTime, Enum as SAEnum, ForeignKey, Integer, func, Index

from .base_model import Base, intpk, business_fk, professional_fk, service_fk, client_fk

if TYPE_CHECKING:
    from .client_model import Client
    from .service_model import Service
    from .business_model import Business
    from .professional_model import Professional
    from .appointment_reminder_model import AppointmentReminder
    from .recurring_schedule_model import RecurringSchedule
    from .replacement_entitlement_model import ReplacementEntitlement


class AppointmentStatus(str, PyEnum):
    scheduled = "scheduled"
    canceled = "canceled"
    completed = "completed"
    no_show = "no_show"


class AppointmentKind(str, PyEnum):
    standard = "standard"
    trial = "trial"

class Appointment(Base):
    __tablename__ = "appointments"

    __table_args__ = (
        CheckConstraint("start_datetime < end_datetime", name="ck_appointments_valid_datetime_range",),
        CheckConstraint("capacity_slot >= 1", name="ck_appointments_capacity_slot_positive"),
        ExcludeConstraint(("business_id", "="),("professional_id", "="),("capacity_slot", "="),(text("tstzrange(start_datetime, end_datetime, '[)')"),"&&",),
            where=text("status = 'scheduled'"),
            using="gist",
            name="ex_appointments_business_professional_capacity_time_conflict",
        ),
        Index(
            "uq_appointments_series_occurrence_start",
            "series_id",
            "occurrence_start",
            unique=True,
            postgresql_where=text("series_id IS NOT NULL"),
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
    confirmation_pending: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    capacity_slot: Mapped[int] = mapped_column(Integer, nullable=False, default=1, server_default="1")
    kind: Mapped[AppointmentKind] = mapped_column(
        SAEnum(AppointmentKind, name="appointmentkind"),
        nullable=False,
        default=AppointmentKind.standard,
        server_default=AppointmentKind.standard.value,
    )
    series_id: Mapped[int | None] = mapped_column(
        ForeignKey("recurring_schedules.id", ondelete="RESTRICT"), nullable=True, index=True
    )
    occurrence_start: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    replacement_entitlement_id: Mapped[int | None] = mapped_column(
        ForeignKey("replacement_entitlements.id", ondelete="RESTRICT"), nullable=True, unique=True, index=True
    )

    client: Mapped["Client"] = relationship(back_populates="appointments")
    professional: Mapped["Professional"] = relationship(back_populates="appointments")
    service: Mapped["Service"] = relationship(back_populates="appointments")
    business: Mapped["Business"] = relationship(back_populates="appointments")
    reminders: Mapped[list["AppointmentReminder"]] = relationship(back_populates="appointment", cascade="all, delete-orphan")
    series: Mapped["RecurringSchedule | None"] = relationship(back_populates="occurrences")
    replacement_entitlement: Mapped["ReplacementEntitlement | None"] = relationship(
        foreign_keys=[replacement_entitlement_id], back_populates="replacement_appointment"
    )
    generated_replacement_entitlement: Mapped["ReplacementEntitlement | None"] = relationship(
        foreign_keys="ReplacementEntitlement.source_appointment_id",
        back_populates="source_appointment",
        uselist=False,
    )
