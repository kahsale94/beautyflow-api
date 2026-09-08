from datetime import date, datetime, time
from enum import Enum as PyEnum
from typing import TYPE_CHECKING, Optional

from sqlalchemy import CheckConstraint, Date, DateTime, Enum as SAEnum, ForeignKey, Integer, Text, Time, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base_model import Base, business_fk, intpk

if TYPE_CHECKING:
    from .appointment_model import Appointment
    from .business_model import Business
    from .client_model import Client
    from .service_model import Service


class RecurringScheduleStatus(str, PyEnum):
    active = "active"
    paused = "paused"
    canceled = "canceled"


class RecurringSchedule(Base):
    __tablename__ = "recurring_schedules"

    __table_args__ = (
        CheckConstraint("weekday >= 0 AND weekday <= 6", name="ck_recurring_schedules_valid_weekday"),
        CheckConstraint(
            "effective_until IS NULL OR effective_until >= effective_from",
            name="ck_recurring_schedules_valid_effective_range",
        ),
    )

    id: Mapped[intpk]
    business_id: Mapped[business_fk]
    client_id: Mapped[int] = mapped_column(
        ForeignKey("clients.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    service_id: Mapped[int] = mapped_column(
        ForeignKey("services.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    weekday: Mapped[int] = mapped_column(Integer, nullable=False)
    start_time: Mapped[time] = mapped_column(Time(), nullable=False)
    effective_from: Mapped[date] = mapped_column(Date(), nullable=False)
    effective_until: Mapped[Optional[date]] = mapped_column(Date(), nullable=True)
    status: Mapped[RecurringScheduleStatus] = mapped_column(
        SAEnum(RecurringScheduleStatus, name="recurringschedulestatus"),
        nullable=False,
        default=RecurringScheduleStatus.active,
        server_default=RecurringScheduleStatus.active.value,
        index=True,
    )
    last_materialized_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    last_materialization_error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    business: Mapped["Business"] = relationship(back_populates="recurring_schedules")
    client: Mapped["Client"] = relationship()
    service: Mapped["Service"] = relationship()
    occurrences: Mapped[list["Appointment"]] = relationship(back_populates="series")
