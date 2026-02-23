from datetime import time
from typing import TYPE_CHECKING
from sqlalchemy import UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base_model import Base, professional_fk

if TYPE_CHECKING:
    from professional_model import Professional

class Availability(Base):
    __tablename__ = "availabilities"

    __table_args__ = (
        UniqueConstraint("professional_id", "weekday", name="uq_professional_weekday"),)

    professional_id: Mapped[professional_fk] = mapped_column(primary_key=True)
    weekday: Mapped[int] = mapped_column(nullable=False)
    start_time: Mapped[time] = mapped_column(nullable=False)
    end_time: Mapped[time] = mapped_column(nullable=False)

    professional: Mapped["Professional"] = relationship(back_populates="availabilities")