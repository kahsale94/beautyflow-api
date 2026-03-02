from datetime import datetime
from sqlalchemy import func, DateTime
from typing import TYPE_CHECKING
from sqlalchemy.orm import relationship, Mapped, mapped_column

from .base_model import Base, intpk, business_fk, professional_fk, service_fk

if TYPE_CHECKING:
    from .service_model import Service
    from .business_model import Business
    from .professional_model import Professional

class Appointment(Base):
    __tablename__ = "appointments"

    id: Mapped[intpk]
    business_id: Mapped[business_fk]
    professional_id: Mapped[professional_fk]
    service_id: Mapped[service_fk]
    client_name: Mapped[str] = mapped_column(nullable=False)
    client_phone: Mapped[str] = mapped_column(nullable=False)
    start_datetime: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_datetime: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    status: Mapped[str] = mapped_column(nullable=False, default="scheduled")

    service: Mapped["Service"] = relationship(back_populates="appointments")
    business: Mapped["Business"] = relationship(back_populates="appointments")
    professional: Mapped["Professional"] = relationship(back_populates="appointments")