from datetime import time
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base_model import Base, business_fk

if TYPE_CHECKING:
    from .business_model import Business


class BusinessOpeningHour(Base):
    __tablename__ = "business_opening_hours"

    __table_args__ = (
        CheckConstraint("weekday >= 0 AND weekday <= 6", name="valid_business_opening_weekday"),
        CheckConstraint("start_time < end_time", name="valid_business_opening_time_range"),
    )

    business_id: Mapped[business_fk] = mapped_column(primary_key=True)
    weekday: Mapped[int] = mapped_column(primary_key=True)
    start_time: Mapped[time] = mapped_column(nullable=False)
    end_time: Mapped[time] = mapped_column(nullable=False)

    business: Mapped["Business"] = relationship(back_populates="opening_hours")
