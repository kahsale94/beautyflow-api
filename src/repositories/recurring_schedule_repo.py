from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from src.models import Appointment, RecurringSchedule
from src.models.appointment_model import AppointmentStatus
from src.models.recurring_schedule_model import RecurringScheduleStatus


class RecurringScheduleRepository:
    def add(self, db: Session, series: RecurringSchedule) -> None:
        db.add(series)

    def get_by_id(
        self,
        db: Session,
        business_id: int,
        series_id: int,
        *,
        for_update: bool = False,
    ) -> RecurringSchedule | None:
        stmt = select(RecurringSchedule).where(
            RecurringSchedule.business_id == business_id,
            RecurringSchedule.id == series_id,
        )
        if for_update:
            stmt = stmt.with_for_update()
        return db.scalars(stmt).one_or_none()

    def get_by_business(
        self,
        db: Session,
        business_id: int,
        *,
        client_id: int | None = None,
        status: RecurringScheduleStatus | None = None,
    ) -> list[RecurringSchedule]:
        stmt = select(RecurringSchedule).where(RecurringSchedule.business_id == business_id)
        if client_id is not None:
            stmt = stmt.where(RecurringSchedule.client_id == client_id)
        if status is not None:
            stmt = stmt.where(RecurringSchedule.status == status)
        stmt = stmt.order_by(RecurringSchedule.weekday, RecurringSchedule.start_time, RecurringSchedule.id)
        return list(db.scalars(stmt).all())

    def get_occurrence(
        self,
        db: Session,
        business_id: int,
        series_id: int,
        occurrence_start: datetime,
    ) -> Appointment | None:
        stmt = select(Appointment).where(
            Appointment.business_id == business_id,
            Appointment.series_id == series_id,
            Appointment.occurrence_start == occurrence_start,
        )
        return db.scalars(stmt).one_or_none()

    def get_future_scheduled_occurrences(
        self,
        db: Session,
        business_id: int,
        series_id: int,
        now: datetime,
    ) -> list[Appointment]:
        stmt = (
            select(Appointment)
            .where(
                Appointment.business_id == business_id,
                Appointment.series_id == series_id,
                Appointment.status == AppointmentStatus.scheduled,
                Appointment.start_datetime > now,
            )
            .order_by(Appointment.start_datetime, Appointment.id)
            .with_for_update()
        )
        return list(db.scalars(stmt).all())
