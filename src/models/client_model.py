from typing import TYPE_CHECKING, Optional
from sqlalchemy import UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base_model import Base, intpk, business_fk

if TYPE_CHECKING:
    from .business_model import Business
    from .appointment_model import Appointment

class Client(Base):
    __tablename__ = "clients"

    __table_args__ = (UniqueConstraint("business_id", "phone", name="uq_client_business_phone"),)

    id: Mapped[intpk]
    name: Mapped[Optional[str]]
    name_wpp: Mapped[str] = mapped_column(nullable=False)
    phone: Mapped[str] = mapped_column(nullable=False)
    business_id: Mapped[business_fk]

    business: Mapped["Business"] = relationship(back_populates="clients")
    appointments: Mapped[list["Appointment"]] = relationship(back_populates="client", cascade="all, delete-orphan")