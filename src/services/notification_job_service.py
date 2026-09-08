from datetime import date, datetime, time, timedelta, timezone
from typing import Any
from zoneinfo import ZoneInfo

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from src.core import DataBaseDep
from src.models import NotificationJob
from src.models.business_feature_model import BusinessFeatureKey
from src.models.notification_job_model import NotificationJobStatus
from src.repositories import (
    AppointmentRepository,
    AvailabilityRepository,
    BusinessRepository,
    NotificationJobRepository,
    ProfessionalRepository,
)
from src.services.business_feature_service import BusinessFeatureService, get_business_feature_service


class NotificationJobNotFoundError(Exception):
    pass


class NotificationJobInvalidStateError(Exception):
    pass


class NotificationJobFeatureDisabledError(Exception):
    pass


class NotificationJobService:
    MAX_ATTEMPTS = 3
    LOCK_MINUTES = 15
    WEEKDAYS = (
        "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira",
        "sexta-feira", "sábado", "domingo",
    )

    def __init__(
        self,
        db: Session,
        notification_repo: NotificationJobRepository,
        business_repo: BusinessRepository,
        professional_repo: ProfessionalRepository,
        availability_repo: AvailabilityRepository,
        appointment_repo: AppointmentRepository,
        feature_service: BusinessFeatureService,
    ):
        self.db = db
        self.notification_repo = notification_repo
        self.business_repo = business_repo
        self.professional_repo = professional_repo
        self.availability_repo = availability_repo
        self.appointment_repo = appointment_repo
        self.feature_service = feature_service

    def enqueue(
        self,
        business_id: int,
        notification_type: str,
        dedup_key: str,
        message: str,
        *,
        recipient_phone: str | None = None,
        recipient_email: str | None = None,
        appointment_id: int | None = None,
        professional_id: int | None = None,
        payload: dict[str, Any] | None = None,
        scheduled_for: datetime | None = None,
    ) -> NotificationJob:
        existing = self.notification_repo.get_by_dedup_key(self.db, business_id, dedup_key)
        if existing:
            return existing
        job = NotificationJob(
            business_id=business_id,
            appointment_id=appointment_id,
            professional_id=professional_id,
            notification_type=notification_type,
            dedup_key=dedup_key,
            recipient_phone=recipient_phone,
            recipient_email=recipient_email,
            message=message,
            payload=payload or {},
            scheduled_for=scheduled_for or datetime.now(timezone.utc),
            status=NotificationJobStatus.pending,
        )
        self.notification_repo.add(self.db, job)
        return job

    def enqueue_professional_event(
        self,
        business_id: int,
        professional,
        notification_type: str,
        dedup_key: str,
        message: str,
        *,
        appointment_id: int | None = None,
        payload: dict[str, Any] | None = None,
    ) -> NotificationJob | None:
        if not self.feature_service.is_enabled(
            business_id, BusinessFeatureKey.professional_schedule_notifications
        ):
            return None
        return self.enqueue(
            business_id,
            notification_type,
            dedup_key,
            message,
            recipient_phone=professional.phone,
            recipient_email=professional.email,
            appointment_id=appointment_id,
            professional_id=professional.id,
            payload=payload,
        )

    def enqueue_client_event(
        self,
        business_id: int,
        client,
        notification_type: str,
        dedup_key: str,
        message: str,
        *,
        appointment_id: int | None = None,
        payload: dict[str, Any] | None = None,
    ) -> NotificationJob:
        return self.enqueue(
            business_id,
            notification_type,
            dedup_key,
            message,
            recipient_phone=client.phone,
            recipient_email=getattr(client, "email", None),
            appointment_id=appointment_id,
            payload=payload,
        )

    def queue_professionals_without_appointments(
        self, business_id: int, target_date: date
    ) -> int:
        if not self.feature_service.is_enabled(
            business_id, BusinessFeatureKey.professional_schedule_notifications
        ):
            raise NotificationJobFeatureDisabledError()
        business = self.business_repo.get_by_id(self.db, business_id)
        if not business or business.id != business_id or not business.is_active:
            raise NotificationJobNotFoundError()
        tz = ZoneInfo(business.timezone)
        start = datetime.combine(target_date, time.min).replace(tzinfo=tz)
        end = start + timedelta(days=1)
        created = 0
        for professional in self.professional_repo.get_by_business(self.db, business_id):
            availability = self.availability_repo.get_by_professional_and_weekday(
                self.db, professional.id, target_date.weekday()
            )
            if not availability:
                continue
            appointments = self.appointment_repo.get_scheduled_by_professional_and_date(
                self.db, business_id, professional.id, start, end
            )
            if appointments:
                continue
            dedup = f"professional_no_appointments:{professional.id}:{target_date.isoformat()}"
            if self.notification_repo.get_by_dedup_key(self.db, business_id, dedup):
                continue
            weekday = self.WEEKDAYS[target_date.weekday()]
            self.enqueue_professional_event(
                business_id,
                professional,
                "professional_no_appointments",
                dedup,
                f"Olá, {professional.name}. Você não possui aulas agendadas em {weekday}, {target_date:%d/%m/%Y}.",
                payload={"date": target_date.isoformat(), "weekday": weekday},
            )
            created += 1
        try:
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
        return created

    def claim_due(self, integration_id: int, limit: int = 20) -> list[dict[str, Any]]:
        now = datetime.now(timezone.utc)
        jobs = self.notification_repo.claim_due(
            self.db, integration_id, now, max(1, min(limit, 100)), self.MAX_ATTEMPTS
        )
        for job in jobs:
            job.status = NotificationJobStatus.processing
            job.attempts += 1
            job.locked_until = now + timedelta(minutes=self.LOCK_MINUTES)
            job.last_error = None
        self.db.commit()
        return [self._payload(job) for job in jobs]

    @staticmethod
    def _payload(job: NotificationJob) -> dict[str, Any]:
        return {
            "id": job.id,
            "business_id": job.business_id,
            "notification_type": job.notification_type,
            "appointment_id": job.appointment_id,
            "professional_id": job.professional_id,
            "recipient_phone": job.recipient_phone,
            "recipient_email": job.recipient_email,
            "message": job.message,
            "payload": job.payload or {},
        }

    def get_processing_payload(self, job_id: int, integration_id: int) -> dict[str, Any]:
        job = self.notification_repo.get_by_id_for_integration(
            self.db, job_id, integration_id, for_update=True
        )
        if not job:
            raise NotificationJobNotFoundError()
        if job.status != NotificationJobStatus.processing or job.last_error == "dispatch_in_progress":
            raise NotificationJobInvalidStateError()
        job.last_error = "dispatch_in_progress"
        payload = self._payload(job)
        self.db.commit()
        return payload

    def mark_sent(
        self, job_id: int, integration_id: int, external_message_id: str | None = None
    ) -> None:
        job = self.notification_repo.get_by_id_for_integration(self.db, job_id, integration_id)
        if not job:
            raise NotificationJobNotFoundError()
        if job.status == NotificationJobStatus.sent:
            return
        if job.status != NotificationJobStatus.processing:
            raise NotificationJobInvalidStateError()
        job.status = NotificationJobStatus.sent
        job.sent_at = datetime.now(timezone.utc)
        job.failed_at = None
        job.locked_until = None
        job.last_error = None
        job.external_message_id = external_message_id
        self.db.commit()

    def mark_failed(self, job_id: int, integration_id: int, error: str) -> None:
        job = self.notification_repo.get_by_id_for_integration(self.db, job_id, integration_id)
        if not job:
            raise NotificationJobNotFoundError()
        if job.status == NotificationJobStatus.sent:
            return
        job.failed_at = datetime.now(timezone.utc)
        job.locked_until = None
        job.last_error = error[:2000]
        job.status = (
            NotificationJobStatus.failed
            if job.attempts >= self.MAX_ATTEMPTS
            else NotificationJobStatus.pending
        )
        self.db.commit()

    def mark_indeterminate(self, job_id: int, integration_id: int) -> None:
        job = self.notification_repo.get_by_id_for_integration(self.db, job_id, integration_id)
        if not job:
            raise NotificationJobNotFoundError()
        job.status = NotificationJobStatus.failed
        job.failed_at = datetime.now(timezone.utc)
        job.locked_until = None
        job.attempts = max(job.attempts, self.MAX_ATTEMPTS)
        job.last_error = "provider_send_indeterminate_manual_reconciliation_required"
        self.db.commit()


def get_notification_job_service(db: DataBaseDep):
    return NotificationJobService(
        db,
        NotificationJobRepository(),
        BusinessRepository(),
        ProfessionalRepository(),
        AvailabilityRepository(),
        AppointmentRepository(),
        get_business_feature_service(db),
    )
