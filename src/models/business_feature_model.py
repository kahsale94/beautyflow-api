from datetime import datetime
from enum import Enum as PyEnum
from typing import TYPE_CHECKING, Any

from sqlalchemy import Boolean, DateTime, Enum as SAEnum, JSON, UniqueConstraint, func, text
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base_model import Base, business_fk, intpk

if TYPE_CHECKING:
    from .business_model import Business


class BusinessFeatureKey(str, PyEnum):
    capacity_based_booking = "capacity_based_booking"
    recurring_schedules = "recurring_schedules"
    replacement_classes = "replacement_classes"
    trial_appointments = "trial_appointments"
    professional_schedule_notifications = "professional_schedule_notifications"
    reminder_policy = "reminder_policy"


class BusinessFeature(Base):
    __tablename__ = "business_features"

    __table_args__ = (
        UniqueConstraint("business_id", "feature_key", name="uq_business_features_business_key"),
    )

    id: Mapped[intpk]
    business_id: Mapped[business_fk]
    feature_key: Mapped[BusinessFeatureKey] = mapped_column(
        SAEnum(
            BusinessFeatureKey,
            name="businessfeaturekey",
            native_enum=False,
            create_constraint=True,
            validate_strings=True,
        ),
        nullable=False,
        index=True,
    )
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    config: Mapped[dict[str, Any]] = mapped_column(
        JSON().with_variant(postgresql.JSONB(), "postgresql"),
        nullable=False,
        default=dict,
        server_default=text("'{}'::jsonb"),
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    business: Mapped["Business"] = relationship(back_populates="features")
