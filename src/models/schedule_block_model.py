from datetime import datetime
from enum import Enum as PyEnum
from typing import TYPE_CHECKING

from sqlalchemy.sql import text
from sqlalchemy.dialects.postgresql import ExcludeConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Boolean, CheckConstraint, DateTime, Enum as SAEnum, func

from .base_model import Base, business_fk, intpk, professional_fk

if TYPE_CHECKING:
    from .business_model import Business
    from .professional_model import Professional


class ScheduleBlockReason(str, PyEnum):
    lunch = "lunch"
    day_off = "day_off"
    vacation = "vacation"
    sick = "sick"

class ScheduleBlockStatus(str, PyEnum):
    active = "active"
    canceled = "canceled"

class ScheduleBlock(Base):
    __tablename__ = "schedule_blocks"

    __table_args__ = (
        CheckConstraint("start_datetime < end_datetime", name="ck_schedule_blocks_valid_datetime_range"),
        ExcludeConstraint(
            ("business_id", "="),
            ("professional_id", "="),
            (text("tstzrange(start_datetime, end_datetime, '[)')"), "&&"),
            where=text("status = 'active'"),
            using="gist",
            name="ex_schedule_blocks_business_professional_time_conflict",
        ),
    )

    id: Mapped[intpk]
    business_id: Mapped[business_fk]
    professional_id: Mapped[professional_fk]
    start_datetime: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_datetime: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    all_day: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    reason: Mapped[ScheduleBlockReason] = mapped_column(SAEnum(ScheduleBlockReason, name="scheduleblockreason"), nullable=False)
    status: Mapped[ScheduleBlockStatus] = mapped_column(
        SAEnum(ScheduleBlockStatus, name="scheduleblockstatus"),
        nullable=False,
        default=ScheduleBlockStatus.active,
        server_default=ScheduleBlockStatus.active.value,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    business: Mapped["Business"] = relationship(back_populates="schedule_blocks")
    professional: Mapped["Professional"] = relationship(back_populates="schedule_blocks")