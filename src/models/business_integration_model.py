from datetime import datetime
from typing import TYPE_CHECKING, Dict, Optional
from sqlalchemy import func, DateTime
from sqlalchemy.ext.mutable import MutableDict
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base_model import Base, business_fk, integration_fk

if TYPE_CHECKING:
    from .business_model import Business
    from .integration_model import Integration

class BusinessIntegration(Base):
    __tablename__ = "business_integrations"

    business_id: Mapped[business_fk] = mapped_column(primary_key=True)
    integration_id: Mapped[integration_fk] = mapped_column(primary_key=True)
    config: Mapped[Optional[Dict]] = mapped_column(MutableDict.as_mutable(JSONB), default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    is_active: Mapped[bool] = mapped_column(nullable=False, default=True)

    business: Mapped["Business"] = relationship(back_populates="business_integrations")
    integration: Mapped["Integration"] = relationship(back_populates="business_integrations")