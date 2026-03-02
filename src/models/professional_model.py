from typing import TYPE_CHECKING
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base_model import Base, intpk, business_fk

if TYPE_CHECKING:
    from .service_model import Service
    from .business_model import Business
    from .appointment_model import Appointment
    from .availability_model import Availability
    from .professional_service_model import ProfessionalService

class Professional(Base):
    __tablename__ = "professionals"

    id: Mapped[intpk]
    business_id: Mapped[business_fk]
    name: Mapped[str] = mapped_column(nullable=False)
    is_active: Mapped[bool] = mapped_column(nullable=False, default=True)

    business: Mapped["Business"] = relationship(back_populates="professionals")
    appointments: Mapped[list["Appointment"]] = relationship(back_populates="professional", cascade="all, delete-orphan")
    availabilities: Mapped[list["Availability"]] = relationship(back_populates="professional", cascade="all, delete-orphan")

    services: Mapped[list["Service"]] = relationship(secondary="professional_services", viewonly=True)
    professional_services: Mapped[list["ProfessionalService"]] = relationship(back_populates="professional", cascade="all, delete-orphan")