from datetime import datetime
from enum import Enum as PyEnum
from typing import Any, TYPE_CHECKING

from sqlalchemy import CheckConstraint, DateTime, Enum as SAEnum, ForeignKey, Index, Integer, String, Text, UniqueConstraint, func, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.mutable import MutableDict
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base_model import Base, business_fk, intpk

if TYPE_CHECKING:
    from .appointment_model import Appointment
    from .business_model import Business
    from .professional_model import Professional


class NotificationJobStatus(str, PyEnum):
    pending = "pending"
    processing = "processing"
    sent = "sent"
    failed = "failed"


class NotificationJob(Base):
    __tablename__ = "notification_jobs"
    __table_args__ = (
        UniqueConstraint("business_id", "dedup_key", name="uq_notification_jobs_business_dedup"),
        CheckConstraint("attempts >= 0", name="ck_notification_jobs_attempts_non_negative"),
        Index("ix_notification_jobs_claim", "status", "scheduled_for", "locked_until"),
    )

    id: Mapped[intpk]
    business_id: Mapped[business_fk]
    appointment_id: Mapped[int | None] = mapped_column(
        ForeignKey("appointments.id", ondelete="SET NULL"), nullable=True, index=True
    )
    professional_id: Mapped[int | None] = mapped_column(
        ForeignKey("professionals.id", ondelete="SET NULL"), nullable=True, index=True
    )
    notification_type: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    dedup_key: Mapped[str] = mapped_column(String(255), nullable=False)
    recipient_phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    recipient_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    payload: Mapped[dict[str, Any]] = mapped_column(
        MutableDict.as_mutable(JSONB), nullable=False, default=dict, server_default=text("'{}'::jsonb")
    )
    scheduled_for: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    status: Mapped[NotificationJobStatus] = mapped_column(
        SAEnum(NotificationJobStatus, name="notificationjobstatus"),
        nullable=False,
        default=NotificationJobStatus.pending,
        server_default=NotificationJobStatus.pending.value,
        index=True,
    )
    attempts: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    locked_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    failed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    external_message_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    business: Mapped["Business"] = relationship(back_populates="notification_jobs")
    appointment: Mapped["Appointment | None"] = relationship()
    professional: Mapped["Professional | None"] = relationship()
