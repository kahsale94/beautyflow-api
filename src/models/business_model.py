from datetime import datetime
from zoneinfo import ZoneInfo
from enum import Enum as PyEnum
from typing import TYPE_CHECKING, Optional

from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy import Enum as SAEnum, func, DateTime, String, Text, Integer, Boolean, UniqueConstraint

from .base_model import Base, intpk, name_type, phone_type

if TYPE_CHECKING:
    from .user_model import User
    from .client_model import Client
    from .service_model import Service
    from .appointment_model import Appointment
    from .schedule_block_model import ScheduleBlock
    from .integration_model import Integration
    from .professional_model import Professional
    from .business_opening_hour_model import BusinessOpeningHour
    from .appointment_reminder_model import AppointmentReminder
    from .business_integration_model import BusinessIntegration
    from .evolution_instance_model import EvolutionInstance


class BusinessType(str, PyEnum):
    barbershop = "barbershop"
    salon = "salon"
    clinic = "clinic"

class BusinessAttendancePlan(str, PyEnum):
    business_hours = "business_hours"
    after_hours = "after_hours"
    always = "always"

class Business(Base):
    __tablename__ = "businesses"

    __table_args__ = (
        UniqueConstraint("name", name="uq_business_name"),
        UniqueConstraint("slug", name="uq_business_slug"),
        UniqueConstraint("phone", name="uq_business_phone"),
    )

    id: Mapped[intpk]
    name: Mapped[name_type] = mapped_column(nullable=False)
    slug: Mapped[Optional[str]] = mapped_column(String(80), nullable=True, index=True)
    type: Mapped[BusinessType] = mapped_column(SAEnum(BusinessType, name="businesstype"), nullable=False)
    attendance_plan: Mapped[BusinessAttendancePlan] = mapped_column(
        SAEnum(BusinessAttendancePlan, name="businessattendanceplan"),
        nullable=False,
        default=BusinessAttendancePlan.business_hours,
        server_default=BusinessAttendancePlan.business_hours.value,
    )
    timezone: Mapped[str] = mapped_column(nullable=False)

    phone: Mapped[phone_type] = mapped_column(nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    state: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    booking_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="true")
    slot_interval_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=15, server_default="15")
    minimum_notice_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    maximum_schedule_days: Mapped[int] = mapped_column(Integer, nullable=False, default=30, server_default="30")
    allow_client_cancel: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="true")
    cancel_limit_hours: Mapped[int] = mapped_column(Integer, nullable=False, default=24, server_default="24")
    appointment_confirmation_required: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    is_active: Mapped[bool] = mapped_column(nullable=False, default=True, server_default="true")

    appointments: Mapped[list["Appointment"]] = relationship(back_populates="business", cascade="all, delete-orphan")
    appointment_reminders: Mapped[list["AppointmentReminder"]] = relationship(back_populates="business", cascade="all, delete-orphan")
    schedule_blocks: Mapped[list["ScheduleBlock"]] = relationship(back_populates="business", cascade="all, delete-orphan")
    opening_hours: Mapped[list["BusinessOpeningHour"]] = relationship(
        back_populates="business",
        cascade="all, delete-orphan",
        order_by="BusinessOpeningHour.weekday",
    )
    professionals: Mapped[list["Professional"]] = relationship(back_populates="business", cascade="all, delete-orphan")
    services: Mapped[list["Service"]] = relationship(back_populates="business", cascade="all, delete-orphan")
    users: Mapped[list["User"]] = relationship(back_populates="business", cascade="all, delete-orphan")
    clients: Mapped[list["Client"]] = relationship(back_populates="business", cascade="all, delete-orphan")

    integrations: Mapped[list["Integration"]] = relationship(secondary="business_integrations", viewonly=True)
    business_integrations: Mapped[list["BusinessIntegration"]] = relationship(back_populates="business", cascade="all, delete-orphan")
    evolution_instance: Mapped[Optional["EvolutionInstance"]] = relationship(
        back_populates="business",
        cascade="all, delete-orphan",
        uselist=False,
    )

    def is_open_at(self, reference: datetime | None = None) -> bool:
        business_tz = ZoneInfo(self.timezone)
        local_reference = reference.astimezone(business_tz) if reference else datetime.now(business_tz)
        current_time = local_reference.time().replace(second=0, microsecond=0)
        current_weekday = local_reference.weekday()

        return any(
            opening_hour.weekday == current_weekday
            and opening_hour.start_time <= current_time < opening_hour.end_time
            for opening_hour in (self.opening_hours or [])
        )

    def attendance_status_at(self, reference: datetime | None = None) -> dict[str, object]:
        business_is_open = self.is_open_at(reference)
        plan = self.attendance_plan or BusinessAttendancePlan.business_hours

        if plan == BusinessAttendancePlan.always:
            allowed = True
            block_reason = None
        elif plan == BusinessAttendancePlan.after_hours:
            allowed = not business_is_open
            block_reason = None if allowed else "inside_business_hours"
        else:
            allowed = business_is_open
            block_reason = None if allowed else "outside_business_hours"

        business_tz = ZoneInfo(self.timezone)
        checked_at = reference.astimezone(business_tz) if reference else datetime.now(business_tz)

        return {
            "plan": plan.value,
            "business_is_open": business_is_open,
            "allowed": allowed,
            "block_reason": block_reason,
            "checked_at": checked_at.isoformat(),
        }

    @property
    def business_is_open(self) -> bool:
        return self.is_open_at()

    @property
    def attendance_allowed(self) -> bool:
        return bool(self.attendance_status_at()["allowed"])

    @property
    def attendance_block_reason(self) -> str | None:
        reason = self.attendance_status_at()["block_reason"]
        return str(reason) if reason else None

    @property
    def attendance_status(self) -> dict[str, object]:
        return self.attendance_status_at()
