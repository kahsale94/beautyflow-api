from typing import TYPE_CHECKING
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base_model import Base, professional_fk, service_fk

if TYPE_CHECKING:
    from service_model import Service
    from professional_model import Professional

class ProfessionalService(Base):
    __tablename__ = "professional_services"

    professional_id: Mapped[professional_fk] = mapped_column(primary_key=True)
    service_id: Mapped[service_fk] = mapped_column(primary_key=True)

    professional: Mapped["Professional"] = relationship(back_populates="professional_services")
    service: Mapped["Service"] = relationship(back_populates="professional_services")