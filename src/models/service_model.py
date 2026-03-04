from typing import TYPE_CHECKING
from sqlalchemy import Numeric, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base_model import Base, intpk, business_fk

if TYPE_CHECKING:
    from .business_model import Business
    from .appointment_model import Appointment
    from .professional_model import Professional
    from .professional_service_model import ProfessionalService

class Service(Base):
    __tablename__ = "services"

    __table_args__ = (UniqueConstraint("business_id", "name",  name="uq_service_business_name"),)

    id: Mapped[intpk]
    business_id: Mapped[business_fk]
    name: Mapped[str] = mapped_column(nullable=False)
    duration_minutes: Mapped[int] = mapped_column(nullable=False)
    price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    is_active: Mapped[bool] = mapped_column(nullable=False, default=True)

    business: Mapped["Business"] = relationship(back_populates="services")
    appointments: Mapped[list["Appointment"]] = relationship(back_populates="service", cascade="all, delete-orphan")

    professionals: Mapped[list["Professional"]] = relationship(secondary="professional_services", viewonly=True)
    professional_services: Mapped[list["ProfessionalService"]] = relationship(back_populates="service", cascade="all, delete-orphan")