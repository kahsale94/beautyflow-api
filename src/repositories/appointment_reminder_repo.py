from datetime import datetime

from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Session, joinedload

from src.models import Appointment, AppointmentReminder, Business, BusinessIntegration
from src.models.appointment_model import AppointmentStatus
from src.models.appointment_reminder_model import AppointmentReminderStatus


class AppointmentReminderRepository:

    def add(self, db: Session, reminder: AppointmentReminder) -> None:
        db.add(reminder)

    def get_by_appointment_snapshot(
        self,
        db: Session,
        appointment_id: int,
        reminder_type: str,
        appointment_start_datetime: datetime,
    ):
        stmt = select(AppointmentReminder).where(
            AppointmentReminder.appointment_id == appointment_id,
            AppointmentReminder.reminder_type == reminder_type,
            AppointmentReminder.appointment_start_datetime == appointment_start_datetime,
        )
        return db.scalars(stmt).one_or_none()

    def get_latest_by_appointment(
        self,
        db: Session,
        business_id: int,
        appointment_id: int,
        reminder_type: str | None = None,
    ):
        stmt = select(AppointmentReminder).where(
            AppointmentReminder.business_id == business_id,
            AppointmentReminder.appointment_id == appointment_id,
        )
        if reminder_type is not None:
            stmt = stmt.where(AppointmentReminder.reminder_type == reminder_type)

        stmt = stmt.order_by(
            AppointmentReminder.created_at.desc(),
            AppointmentReminder.id.desc(),
        ).limit(1)
        return db.scalars(stmt).one_or_none()

    def get_by_appointment(
        self,
        db: Session,
        business_id: int,
        appointment_id: int,
        limit: int = 5,
    ):
        stmt = (
            select(AppointmentReminder)
            .where(
                AppointmentReminder.business_id == business_id,
                AppointmentReminder.appointment_id == appointment_id,
            )
            .order_by(
                AppointmentReminder.created_at.desc(),
                AppointmentReminder.id.desc(),
            )
            .limit(limit)
        )
        return db.scalars(stmt).all()

    def get_active_by_appointment_snapshot(
        self,
        db: Session,
        appointment_id: int,
        reminder_type: str,
        appointment_start_datetime: datetime,
        *,
        for_update: bool = False,
    ):
        stmt = (
            select(AppointmentReminder)
            .where(
                AppointmentReminder.appointment_id == appointment_id,
                AppointmentReminder.reminder_type == reminder_type,
                AppointmentReminder.appointment_start_datetime == appointment_start_datetime,
                AppointmentReminder.status.in_(
                    [
                        AppointmentReminderStatus.pending,
                        AppointmentReminderStatus.processing,
                    ]
                ),
            )
            .order_by(
                AppointmentReminder.created_at.desc(),
                AppointmentReminder.id.desc(),
            )
            .limit(1)
        )
        if for_update:
            stmt = stmt.with_for_update()

        return db.scalars(stmt).one_or_none()

    def get_by_id_for_integration(self, db: Session, reminder_id: int, integration_id: int):
        stmt = (
            select(AppointmentReminder)
            .join(
                BusinessIntegration,
                and_(
                    BusinessIntegration.business_id == AppointmentReminder.business_id,
                    BusinessIntegration.integration_id == integration_id,
                    BusinessIntegration.is_active == True,
                ),
            )
            .where(AppointmentReminder.id == reminder_id)
        )
        return db.scalars(stmt).one_or_none()

    def get_pending_for_appointment(self, db: Session, appointment_id: int):
        stmt = (
            select(AppointmentReminder)
            .where(
                AppointmentReminder.appointment_id == appointment_id,
                AppointmentReminder.status.in_(
                    [
                        AppointmentReminderStatus.pending,
                        AppointmentReminderStatus.processing,
                    ]
                ),
            )
            .with_for_update()
        )
        return db.scalars(stmt).all()

    def get_pending_for_business(self, db: Session, business_id: int):
        stmt = (
            select(AppointmentReminder)
            .join(Appointment, Appointment.id == AppointmentReminder.appointment_id)
            .where(
                AppointmentReminder.business_id == business_id,
                AppointmentReminder.status == AppointmentReminderStatus.pending,
            )
            .options(joinedload(AppointmentReminder.appointment))
            .with_for_update()
        )
        return db.scalars(stmt).all()

    def get_due_invalid(
        self,
        db: Session,
        integration_id: int,
        now: datetime,
        limit: int,
    ):
        active_statuses = [
            AppointmentReminderStatus.pending,
            AppointmentReminderStatus.processing,
        ]
        stmt = (
            select(AppointmentReminder)
            .join(Appointment, Appointment.id == AppointmentReminder.appointment_id)
            .join(
                BusinessIntegration,
                and_(
                    BusinessIntegration.business_id == AppointmentReminder.business_id,
                    BusinessIntegration.integration_id == integration_id,
                    BusinessIntegration.is_active == True,
                ),
            )
            .where(
                AppointmentReminder.status.in_(active_statuses),
                AppointmentReminder.scheduled_for <= now,
                or_(
                    Appointment.status != AppointmentStatus.scheduled,
                    Appointment.confirmation_pending == True,
                    Appointment.start_datetime <= now,
                ),
            )
            .order_by(AppointmentReminder.scheduled_for, AppointmentReminder.id)
            .limit(limit)
            .with_for_update(skip_locked=True)
        )
        return db.scalars(stmt).all()

    def claim_due(
        self,
        db: Session,
        integration_id: int,
        now: datetime,
        limit: int,
        max_attempts: int,
    ):
        claimable_status = or_(
            AppointmentReminder.status == AppointmentReminderStatus.pending,
            and_(
                AppointmentReminder.status == AppointmentReminderStatus.processing,
                or_(
                    AppointmentReminder.locked_until == None,
                    AppointmentReminder.locked_until <= now,
                ),
            ),
        )
        stmt = (
            select(AppointmentReminder)
            .join(Appointment, Appointment.id == AppointmentReminder.appointment_id)
            .join(Business, Business.id == AppointmentReminder.business_id)
            .join(
                BusinessIntegration,
                and_(
                    BusinessIntegration.business_id == AppointmentReminder.business_id,
                    BusinessIntegration.integration_id == integration_id,
                    BusinessIntegration.is_active == True,
                ),
            )
            .where(
                claimable_status,
                AppointmentReminder.scheduled_for <= now,
                AppointmentReminder.attempts < max_attempts,
                Appointment.status == AppointmentStatus.scheduled,
                Appointment.confirmation_pending == False,
                Appointment.start_datetime > now,
                Business.is_active == True,
            )
            .options(
                joinedload(AppointmentReminder.business).joinedload(Business.evolution_instance),
                joinedload(AppointmentReminder.appointment).joinedload(Appointment.client),
                joinedload(AppointmentReminder.appointment).joinedload(Appointment.professional),
                joinedload(AppointmentReminder.appointment).joinedload(Appointment.service),
            )
            .order_by(AppointmentReminder.scheduled_for, AppointmentReminder.id)
            .limit(limit)
            .with_for_update(skip_locked=True, of=AppointmentReminder)
        )
        return db.scalars(stmt).all()
