from datetime import datetime
from enum import Enum as PyEnum
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum as SAEnum, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base_model import Base, business_fk, client_fk, intpk

if TYPE_CHECKING:
    from .appointment_model import Appointment
    from .business_model import Business
    from .client_model import Client


class ReplacementEntitlementStatus(str, PyEnum):
    available = "available"
    used = "used"
    expired = "expired"
    forfeited = "forfeited"


class ReplacementEntitlementReason(str, PyEnum):
    client_cancellation = "client_cancellation"
    professional_unavailable = "professional_unavailable"
    business_unavailable = "business_unavailable"
    manual = "manual"


class ReplacementEntitlement(Base):
    __tablename__ = "replacement_entitlements"
    __table_args__ = (
        UniqueConstraint("source_appointment_id", name="uq_replacement_entitlements_source_appointment"),
    )

    id: Mapped[intpk]
    business_id: Mapped[business_fk]
    client_id: Mapped[client_fk]
    source_appointment_id: Mapped[int] = mapped_column(
        ForeignKey("appointments.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    status: Mapped[ReplacementEntitlementStatus] = mapped_column(
        SAEnum(ReplacementEntitlementStatus, name="replacemententitlementstatus"),
        nullable=False,
        default=ReplacementEntitlementStatus.available,
        server_default=ReplacementEntitlementStatus.available.value,
        index=True,
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    reason: Mapped[ReplacementEntitlementReason] = mapped_column(
        SAEnum(ReplacementEntitlementReason, name="replacemententitlementreason"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    business: Mapped["Business"] = relationship(back_populates="replacement_entitlements")
    client: Mapped["Client"] = relationship()
    source_appointment: Mapped["Appointment"] = relationship(
        foreign_keys=[source_appointment_id], back_populates="generated_replacement_entitlement"
    )
    replacement_appointment: Mapped["Appointment | None"] = relationship(
        foreign_keys="Appointment.replacement_entitlement_id",
        back_populates="replacement_entitlement",
        uselist=False,
    )
