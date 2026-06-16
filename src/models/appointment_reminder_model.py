from datetime import datetime
from enum import Enum as PyEnum
from typing import TYPE_CHECKING, Optional

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    func,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base_model import Base, business_fk, intpk

if TYPE_CHECKING:
    from .appointment_model import Appointment
    from .business_model import Business


class AppointmentReminderStatus(str, PyEnum):
    pending = "pending"
    processing = "processing"
    sent = "sent"
    failed = "failed"
    skipped = "skipped"


class AppointmentReminder(Base):
    __tablename__ = "appointment_reminders"

    __table_args__ = (
        Index(
            "ux_appointment_reminders_upcoming_snapshot",
            "appointment_id",
            "reminder_type",
            "appointment_start_datetime",
            unique=True,
            postgresql_where=text("reminder_type = 'appointment_upcoming'"),
        ),
        Index(
            "ux_appointment_reminders_active_manual_snapshot",
            "appointment_id",
            "reminder_type",
            "appointment_start_datetime",
            unique=True,
            postgresql_where=text(
                "reminder_type = 'appointment_manual' AND status IN ('pending', 'processing')"
            ),
        ),
        CheckConstraint("attempts >= 0", name="ck_appointment_reminders_attempts_non_negative"),
        Index(
            "ix_appointment_reminders_claim",
            "status",
            "scheduled_for",
            "locked_until",
        ),
    )

    id: Mapped[intpk]
    appointment_id: Mapped[int] = mapped_column(
        ForeignKey("appointments.id", ondelete="cascade"),
        nullable=False,
        index=True,
    )
    business_id: Mapped[business_fk]
    reminder_type: Mapped[str] = mapped_column(
        String(40),
        nullable=False,
        default="appointment_upcoming",
        server_default="appointment_upcoming",
    )
    appointment_start_datetime: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    scheduled_for: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    status: Mapped[AppointmentReminderStatus] = mapped_column(
        SAEnum(AppointmentReminderStatus, name="appointmentreminderstatus"),
        nullable=False,
        default=AppointmentReminderStatus.pending,
        server_default=AppointmentReminderStatus.pending.value,
        index=True,
    )
    attempts: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    locked_until: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    failed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    last_error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    external_message_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    appointment: Mapped["Appointment"] = relationship(back_populates="reminders")
    business: Mapped["Business"] = relationship(back_populates="appointment_reminders")
