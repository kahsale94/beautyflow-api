from datetime import datetime
from enum import Enum as PyEnum
from typing import TYPE_CHECKING
from sqlalchemy import func, DateTime, Enum as SAEnum
from sqlalchemy.orm import relationship, Mapped, mapped_column

from .base_model import Base, intpk, name_type

if TYPE_CHECKING:
    from .business_model import Business
    from .business_integration_model import BusinessIntegration

class IntegrationType(str, PyEnum):
    automation = "automation"

class Integration(Base):
    __tablename__ = "integrations"

    id: Mapped[intpk]
    name: Mapped[name_type] = mapped_column(nullable=False, unique=True)
    type: Mapped[IntegrationType] = mapped_column(SAEnum(IntegrationType, name="integrationtype"), nullable=False)
    api_token_hash: Mapped[str] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    is_active: Mapped[bool] = mapped_column(nullable=False, default=True, server_default="true")

    businesses: Mapped[list["Business"]] = relationship(secondary="business_integrations", viewonly=True)
    business_integrations: Mapped[list["BusinessIntegration"]] = relationship(back_populates="integration", cascade="all, delete-orphan")