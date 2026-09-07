from typing import TYPE_CHECKING, Optional

from sqlalchemy import UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base_model import Base, intpk, business_fk, name_type, phone_type

if TYPE_CHECKING:
    from .business_model import Business
    from .appointment_model import Appointment
    from .contact_model import Contact

class Client(Base):
    __tablename__ = "clients"

    __table_args__ = (
        UniqueConstraint("business_id", "phone", name="uq_client_business_phone"),
        UniqueConstraint("id", "business_id", name="uq_clients_id_business"),
    )

    id: Mapped[intpk]
    name: Mapped[Optional[name_type]] = mapped_column(nullable=True)
    phone: Mapped[phone_type] = mapped_column(nullable=False, index=True)
    business_id: Mapped[business_fk]
    is_active: Mapped[bool] = mapped_column(nullable=False, default=True, server_default="true")

    business: Mapped["Business"] = relationship(back_populates="clients")
    appointments: Mapped[list["Appointment"]] = relationship(back_populates="client", cascade="all, delete-orphan")
    contact: Mapped[Optional["Contact"]] = relationship(
        back_populates="client", uselist=False, overlaps="business,contacts"
    )
