from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import DateTime, String, UniqueConstraint, func

from .base_model import Base, business_fk, integration_fk, intpk

if TYPE_CHECKING:
    from .business_model import Business
    from .integration_model import Integration


class EvolutionInstance(Base):
    __tablename__ = "evolution_instances"
    __table_args__ = (
        UniqueConstraint("business_id", name="uq_evolution_instance_business"),
        UniqueConstraint("instance_name", name="uq_evolution_instance_name"),
    )

    id: Mapped[intpk]
    business_id: Mapped[business_fk]
    integration_id: Mapped[integration_fk]
    instance_name: Mapped[str] = mapped_column(String(100), nullable=False)
    instance_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    state: Mapped[str] = mapped_column(String(32), nullable=False, default="new", server_default="new")
    connected_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    business: Mapped["Business"] = relationship(back_populates="evolution_instance")
    integration: Mapped["Integration"] = relationship(back_populates="evolution_instances")
