from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import func, DateTime
from sqlalchemy.orm import relationship, Mapped, mapped_column

from .base_model import Base, intpk

if TYPE_CHECKING:
    from .business_model import Business
    from .business_integration_model import BusinessIntegration

class Integration(Base):
    __tablename__ = "integrations"

    id: Mapped[intpk]
    name: Mapped[str] = mapped_column(nullable=False)
    type: Mapped[Optional[str]]
    api_token_hash: Mapped[Optional[str]]
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    is_active: Mapped[bool] = mapped_column(nullable=False, default=True)

    businesses: Mapped[list["Business"]] = relationship(secondary="business_integrations", viewonly=True)
    business_integrations: Mapped[list["BusinessIntegration"]] = relationship(back_populates="integration", cascade="all, delete-orphan")