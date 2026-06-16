from datetime import datetime, timedelta, timezone
from typing import Any
from zoneinfo import ZoneInfo

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from src.core import DataBaseDep
from src.models import Appointment, AppointmentReminder, Business
from src.models.appointment_model import AppointmentStatus
from src.models.appointment_reminder_model import AppointmentReminderStatus
from src.repositories import AppointmentReminderRepository


class AppointmentReminderNotFoundError(Exception):
    pass


class AppointmentReminderInvalidStateError(Exception):
    pass


class AppointmentReminderService:
    REMINDER_TYPE_UPCOMING = "appointment_upcoming"
    REMINDER_TYPE_MANUAL = "appointment_manual"
    DEFAULT_LIMIT = 20
    MAX_LIMIT = 100
    MAX_ATTEMPTS = 3
    LOCK_MINUTES = 15

    WEEKDAYS = [
        "segunda-feira",
        "terça-feira",
        "quarta-feira",
        "quinta-feira",
        "sexta-feira",
        "sábado",
        "domingo",
    ]

    def __init__(
        self,
        db: Session,
        appointment_reminder_repo: AppointmentReminderRepository,
    ):
        self.db = db
        self.appointment_reminder_repo = appointment_reminder_repo

    def _now(self) -> datetime:
        return datetime.now(timezone.utc)

    def _limit(self, limit: int | None) -> int:
        if limit is None:
            return self.DEFAULT_LIMIT

        return max(1, min(limit, self.MAX_LIMIT))

    def _calculate_scheduled_for(self, appointment: Appointment, business: Business) -> datetime:
        reminder_hours = (business.cancel_limit_hours or 0) + 6
        return appointment.start_datetime - timedelta(hours=reminder_hours)

    def _is_schedulable(self, appointment: Appointment, now: datetime | None = None) -> bool:
        now = now or self._now()
        return bool(
            appointment.status == AppointmentStatus.scheduled
            and not appointment.confirmation_pending
            and appointment.start_datetime > now
        )

    def schedule_for_appointment(
        self,
        appointment: Appointment,
        business: Business,
    ) -> AppointmentReminder | None:
        if not self._is_schedulable(appointment):
            return None

        scheduled_for = self._calculate_scheduled_for(appointment, business)
        existing = self.appointment_reminder_repo.get_by_appointment_snapshot(
            self.db,
            appointment.id,
            self.REMINDER_TYPE_UPCOMING,
            appointment.start_datetime,
        )

        if existing and existing.status == AppointmentReminderStatus.sent:
            return existing

        if existing:
            previous_status = existing.status
            existing.business_id = appointment.business_id
            existing.scheduled_for = scheduled_for
            existing.status = AppointmentReminderStatus.pending
            existing.locked_until = None
            existing.sent_at = None
            existing.failed_at = None
            existing.last_error = None
            if previous_status in (
                AppointmentReminderStatus.failed,
                AppointmentReminderStatus.skipped,
            ):
                existing.attempts = 0
            return existing

        reminder = AppointmentReminder(
            appointment_id=appointment.id,
            business_id=appointment.business_id,
            reminder_type=self.REMINDER_TYPE_UPCOMING,
            appointment_start_datetime=appointment.start_datetime,
            scheduled_for=scheduled_for,
            status=AppointmentReminderStatus.pending,
        )
        self.appointment_reminder_repo.add(self.db, reminder)
        return reminder

    def get_latest_for_appointment(
        self,
        business_id: int,
        appointment_id: int,
        reminder_type: str | None = None,
    ) -> AppointmentReminder | None:
        return self.appointment_reminder_repo.get_latest_by_appointment(
            self.db,
            business_id,
            appointment_id,
            reminder_type,
        )

    def get_history_for_appointment(
        self,
        business_id: int,
        appointment_id: int,
        limit: int = 5,
    ) -> list[AppointmentReminder]:
        return list(
            self.appointment_reminder_repo.get_by_appointment(
                self.db,
                business_id,
                appointment_id,
                limit=limit,
            )
        )

    def _get_active_manual_for_appointment(
        self,
        appointment: Appointment,
        *,
        for_update: bool = False,
    ) -> AppointmentReminder | None:
        return self.appointment_reminder_repo.get_active_by_appointment_snapshot(
            self.db,
            appointment.id,
            self.REMINDER_TYPE_MANUAL,
            appointment.start_datetime,
            for_update=for_update,
        )

    def get_active_manual_for_appointment(self, appointment: Appointment) -> AppointmentReminder | None:
        return self._get_active_manual_for_appointment(appointment)

    def manual_unavailable_reason(
        self,
        appointment: Appointment,
        business: Business,
        active_manual_reminder: AppointmentReminder | None = None,
    ) -> str | None:
        now = self._now()
        if appointment.status == AppointmentStatus.canceled:
            return "Agendamento cancelado não pode receber lembrete."
        if appointment.status == AppointmentStatus.completed:
            return "Agendamento concluído não pode receber lembrete."
        if appointment.status != AppointmentStatus.scheduled:
            return "Apenas agendamentos ativos podem receber lembrete."
        if appointment.confirmation_pending:
            return "Confirme o agendamento antes de enviar lembrete."
        if appointment.start_datetime <= now:
            return "Agendamento passado não pode receber lembrete."

        instance = getattr(business, "evolution_instance", None)
        if not instance or not getattr(instance, "instance_name", None):
            return "Conecte o WhatsApp da empresa antes de enviar lembrete."

        instance_state = str(getattr(instance, "state", "") or "").lower()
        if instance_state and instance_state not in {"open", "connected"}:
            return "WhatsApp da empresa ainda não está conectado."

        active_manual_reminder = active_manual_reminder or self.get_active_manual_for_appointment(appointment)
        if active_manual_reminder:
            return "Já existe um lembrete manual na fila para esse horário."

        return None

    def schedule_manual_for_appointment(
        self,
        appointment: Appointment,
        business: Business,
    ) -> AppointmentReminder:
        active_manual_reminder = self._get_active_manual_for_appointment(
            appointment,
            for_update=True,
        )
        unavailable_reason = self.manual_unavailable_reason(
            appointment,
            business,
            active_manual_reminder=active_manual_reminder,
        )
        if unavailable_reason:
            raise AppointmentReminderInvalidStateError(unavailable_reason)

        now = self._now()
        reminder = AppointmentReminder(
            appointment_id=appointment.id,
            business_id=appointment.business_id,
            reminder_type=self.REMINDER_TYPE_MANUAL,
            appointment_start_datetime=appointment.start_datetime,
            scheduled_for=now,
            status=AppointmentReminderStatus.pending,
        )
        self.appointment_reminder_repo.add(self.db, reminder)
        try:
            self.db.commit()
        except IntegrityError as exc:
            self.db.rollback()
            raise AppointmentReminderInvalidStateError(
                "Já existe um lembrete manual na fila para esse horário."
            ) from exc

        return reminder

    def skip_pending_for_appointment(self, appointment_id: int, reason: str = "appointment_changed") -> None:
        reminders = self.appointment_reminder_repo.get_pending_for_appointment(self.db, appointment_id)
        for reminder in reminders:
            reminder.status = AppointmentReminderStatus.skipped
            reminder.locked_until = None
            reminder.last_error = reason

    def recalculate_pending_for_business(self, business: Business) -> None:
        reminders = self.appointment_reminder_repo.get_pending_for_business(self.db, business.id)
        now = self._now()

        for reminder in reminders:
            appointment = reminder.appointment
            if not self._is_schedulable(appointment, now):
                reminder.status = AppointmentReminderStatus.skipped
                reminder.locked_until = None
                reminder.last_error = "appointment_no_longer_schedulable"
                continue

            reminder.appointment_start_datetime = appointment.start_datetime
            reminder.scheduled_for = self._calculate_scheduled_for(appointment, business)
            reminder.locked_until = None
            reminder.last_error = None

    def _skip_invalid_due(self, integration_id: int, now: datetime, limit: int) -> None:
        reminders = self.appointment_reminder_repo.get_due_invalid(
            self.db,
            integration_id,
            now,
            limit,
        )
        for reminder in reminders:
            reminder.status = AppointmentReminderStatus.skipped
            reminder.locked_until = None
            reminder.last_error = "appointment_no_longer_schedulable"

    def _claim_blocking_error(self, reminder: AppointmentReminder) -> str | None:
        appointment = reminder.appointment
        business = reminder.business

        if not appointment.client.phone:
            return "client_phone_missing"

        if not business.evolution_instance or not business.evolution_instance.instance_name:
            return "evolution_instance_missing"

        return None

    def _mark_terminal_failed(
        self,
        reminder: AppointmentReminder,
        now: datetime,
        error: str,
    ) -> None:
        reminder.status = AppointmentReminderStatus.failed
        reminder.attempts += 1
        reminder.locked_until = None
        reminder.failed_at = now
        reminder.last_error = error[:2000]

    def _format_start(self, appointment: Appointment, business: Business) -> dict[str, str]:
        try:
            business_tz = ZoneInfo(business.timezone)
        except Exception:
            business_tz = timezone.utc

        start = appointment.start_datetime.astimezone(business_tz)
        return {
            "date": start.strftime("%d/%m/%Y"),
            "time": start.strftime("%H:%M"),
            "weekday": self.WEEKDAYS[start.weekday()],
        }

    def _build_message(self, reminder: AppointmentReminder) -> str:
        appointment = reminder.appointment
        business = reminder.business
        start = self._format_start(appointment, business)
        client_name = appointment.client.name or "tudo bem"
        service_name = appointment.service.name
        professional_name = appointment.professional.name

        return (
            f"Olá, {client_name}! Passando para lembrar do seu agendamento "
            f"na {business.name}: {service_name} com {professional_name}, "
            f"{start['weekday']} ({start['date']}) às {start['time']}."
        )

    def _to_claim_payload(self, reminder: AppointmentReminder) -> dict[str, Any]:
        appointment = reminder.appointment
        business = reminder.business
        client = appointment.client
        start = self._format_start(appointment, business)

        return {
            "id": reminder.id,
            "appointment_id": appointment.id,
            "reminder_type": reminder.reminder_type,
            "scheduled_for": reminder.scheduled_for,
            "appointment_start_datetime": appointment.start_datetime,
            "appointment": {
                "id": appointment.id,
                "start_datetime": appointment.start_datetime,
                "date": start["date"],
                "time": start["time"],
                "weekday": start["weekday"],
                "service": {
                    "id": appointment.service.id,
                    "name": appointment.service.name,
                },
                "professional": {
                    "id": appointment.professional.id,
                    "name": appointment.professional.name,
                },
            },
            "business": {
                "id": business.id,
                "name": business.name,
                "timezone": business.timezone,
                "phone": business.phone,
            },
            "client": {
                "id": client.id,
                "name": client.name,
                "phone": client.phone,
                "remote_jid": f"{client.phone}@s.whatsapp.net",
            },
            "evolution": {
                "instance_name": business.evolution_instance.instance_name,
            },
            "message": self._build_message(reminder),
        }

    def claim_due(self, integration_id: int, limit: int | None = None) -> list[dict[str, Any]]:
        claim_limit = self._limit(limit)
        now = self._now()
        lock_until = now + timedelta(minutes=self.LOCK_MINUTES)

        self._skip_invalid_due(integration_id, now, claim_limit)
        reminders = self.appointment_reminder_repo.claim_due(
            self.db,
            integration_id,
            now,
            claim_limit,
            self.MAX_ATTEMPTS,
        )

        claimed: list[AppointmentReminder] = []
        for reminder in reminders:
            blocking_error = self._claim_blocking_error(reminder)
            if blocking_error:
                self._mark_terminal_failed(reminder, now, blocking_error)
                continue

            reminder.status = AppointmentReminderStatus.processing
            reminder.attempts += 1
            reminder.locked_until = lock_until
            reminder.last_error = None
            claimed.append(reminder)

        self.db.commit()

        return [self._to_claim_payload(reminder) for reminder in claimed]

    def mark_sent(
        self,
        reminder_id: int,
        integration_id: int,
        external_message_id: str | None = None,
    ) -> None:
        reminder = self.appointment_reminder_repo.get_by_id_for_integration(
            self.db,
            reminder_id,
            integration_id,
        )
        if not reminder:
            raise AppointmentReminderNotFoundError()

        if reminder.status == AppointmentReminderStatus.sent:
            return

        if reminder.status != AppointmentReminderStatus.processing:
            raise AppointmentReminderInvalidStateError()

        reminder.status = AppointmentReminderStatus.sent
        reminder.sent_at = self._now()
        reminder.failed_at = None
        reminder.locked_until = None
        reminder.last_error = None
        reminder.external_message_id = external_message_id
        self.db.commit()

    def mark_failed(
        self,
        reminder_id: int,
        integration_id: int,
        error: str,
    ) -> None:
        reminder = self.appointment_reminder_repo.get_by_id_for_integration(
            self.db,
            reminder_id,
            integration_id,
        )
        if not reminder:
            raise AppointmentReminderNotFoundError()

        if reminder.status == AppointmentReminderStatus.sent:
            return

        now = self._now()
        reminder.failed_at = now
        reminder.locked_until = None
        reminder.last_error = error[:2000]
        reminder.status = (
            AppointmentReminderStatus.failed
            if reminder.attempts >= self.MAX_ATTEMPTS
            else AppointmentReminderStatus.pending
        )
        self.db.commit()


def get_appointment_reminder_service(db: DataBaseDep):
    return AppointmentReminderService(
        db,
        AppointmentReminderRepository(),
    )
