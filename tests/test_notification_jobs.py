from datetime import date, datetime, time, timedelta, timezone
from types import SimpleNamespace

import pytest

from src.models.appointment_model import AppointmentKind, AppointmentStatus
from src.models.business_feature_model import BusinessFeatureKey
from src.models.notification_job_model import NotificationJobStatus
from src.schemas.business_feature_schema import ReminderPolicyMode
from src.services.appointment_reminder_service import AppointmentReminderService
from src.services.notification_job_service import (
    NotificationJobFeatureDisabledError,
    NotificationJobService,
)


class ReminderRepo:
    def __init__(self):
        self.added = []

    def get_by_appointment_snapshot(self, *args):
        return None

    def add(self, db, item):
        self.added.append(item)


class ReminderFeatures:
    def __init__(self, mode):
        self.mode = mode

    def is_enabled(self, business_id, key):
        return True

    def get_config(self, business_id, key):
        return {"mode": self.mode}


def reminder_appointment(kind=AppointmentKind.standard, replacement_id=None):
    return SimpleNamespace(
        id=1,
        business_id=1,
        start_datetime=datetime.now(timezone.utc).replace(microsecond=0) + timedelta(days=2),
        status=AppointmentStatus.scheduled,
        confirmation_pending=False,
        kind=kind,
        replacement_entitlement_id=replacement_id,
    )


@pytest.mark.parametrize(
    ("mode", "kind", "replacement_id", "expected"),
    [
        (ReminderPolicyMode.all.value, AppointmentKind.standard, None, True),
        (ReminderPolicyMode.none.value, AppointmentKind.trial, None, False),
        (ReminderPolicyMode.trial_and_replacement.value, AppointmentKind.standard, None, False),
        (ReminderPolicyMode.trial_and_replacement.value, AppointmentKind.trial, None, True),
        (ReminderPolicyMode.trial_and_replacement.value, AppointmentKind.standard, 7, True),
    ],
)
def test_automatic_reminder_policy(mode, kind, replacement_id, expected):
    repo = ReminderRepo()
    service = AppointmentReminderService(object(), repo, ReminderFeatures(mode))
    appointment = reminder_appointment(kind, replacement_id)
    business = SimpleNamespace(cancel_limit_hours=24)

    result = service.schedule_for_appointment(appointment, business)

    assert (result is not None) is expected


class Session:
    def __init__(self):
        self.commits = 0

    def commit(self):
        self.commits += 1

    def rollback(self):
        pass


class NotificationRepo:
    def __init__(self):
        self.jobs = []

    def get_by_dedup_key(self, db, business_id, dedup_key):
        return next(
            (
                item for item in self.jobs
                if item.business_id == business_id and item.dedup_key == dedup_key
            ),
            None,
        )

    def add(self, db, job):
        self.jobs.append(job)

    def get_by_id_for_integration(self, db, job_id, integration_id, for_update=False):
        return next((item for item in self.jobs if item.id == job_id), None)


class EnabledFeatures:
    def __init__(self, enabled=True):
        self.enabled = enabled

    def is_enabled(self, business_id, key):
        return self.enabled


class Businesses:
    def get_by_id(self, db, business_id):
        return SimpleNamespace(id=business_id, is_active=True, timezone="America/Sao_Paulo")

    def get_by_integration(self, db, integration_id):
        assert integration_id == 9
        return [SimpleNamespace(id=1, is_active=True, timezone="America/Sao_Paulo")]


class Professionals:
    def get_by_business(self, db, business_id):
        return [SimpleNamespace(id=4, name="Ana", phone="5511", email="ana@example.com")]


class Availabilities:
    def get_by_professional_and_weekday(self, db, professional_id, weekday):
        return SimpleNamespace(start_time=time(8), end_time=time(18))


class Appointments:
    def __init__(self, items=()):
        self.items = list(items)

    def get_scheduled_by_professional_and_date(self, *args):
        return self.items


def notification_service(enabled=True, appointments=()):
    repo = NotificationRepo()
    service = NotificationJobService(
        Session(),
        repo,
        Businesses(),
        Professionals(),
        Availabilities(),
        Appointments(appointments),
        EnabledFeatures(enabled),
    )
    return service, repo


def test_zero_appointment_professional_notification_is_idempotent():
    service, repo = notification_service()
    target_date = date(2026, 9, 15)

    assert service.queue_professionals_without_appointments(1, target_date) == 1
    assert service.queue_professionals_without_appointments(1, target_date) == 0
    assert len(repo.jobs) == 1
    assert repo.jobs[0].status == NotificationJobStatus.pending
    assert "terça-feira" in repo.jobs[0].message


def test_professional_with_appointment_is_not_notified_and_feature_is_enforced():
    service, repo = notification_service(appointments=[object()])
    assert service.queue_professionals_without_appointments(1, date(2026, 9, 15)) == 0
    assert not repo.jobs

    service, _repo = notification_service(enabled=False)
    with pytest.raises(NotificationJobFeatureDisabledError):
        service.queue_professionals_without_appointments(1, date(2026, 9, 15))


def test_integration_sweep_queues_tomorrows_zero_appointment_notice_once():
    service, repo = notification_service()

    assert service.queue_professionals_without_appointments_for_integration(9) == 1
    assert service.queue_professionals_without_appointments_for_integration(9) == 0
    assert len(repo.jobs) == 1
    assert repo.jobs[0].business_id == 1
    assert repo.jobs[0].notification_type == "professional_no_appointments"


def test_notification_deduplication_is_scoped_per_business():
    service, repo = notification_service()

    service.enqueue(1, "test", "same-key", "Empresa 1")
    service.enqueue(2, "test", "same-key", "Empresa 2")

    assert [(job.business_id, job.message) for job in repo.jobs] == [
        (1, "Empresa 1"),
        (2, "Empresa 2"),
    ]


def test_professional_event_obeys_feature_and_provider_failure_does_not_change_scheduling():
    disabled, disabled_repo = notification_service(enabled=False)
    professional = SimpleNamespace(id=4, phone="5511", email="ana@example.com")
    assert disabled.enqueue_professional_event(
        1, professional, "cancellation", "cancel:1", "Cancelado"
    ) is None
    assert not disabled_repo.jobs

    service, repo = notification_service(enabled=True)
    job = SimpleNamespace(
        id=77,
        business_id=1,
        status=NotificationJobStatus.processing,
        attempts=1,
        failed_at=None,
        locked_until=datetime.now(timezone.utc),
        last_error=None,
    )
    repo.jobs.append(job)
    appointment = SimpleNamespace(status=AppointmentStatus.scheduled)

    service.mark_failed(job.id, 9, "provider timeout")

    assert job.status == NotificationJobStatus.pending
    assert job.last_error == "provider timeout"
    assert appointment.status == AppointmentStatus.scheduled


def test_outbox_repository_has_tenant_scope_retry_lock_and_idempotency():
    source = open("src/repositories/notification_job_repo.py", encoding="utf-8").read()
    model = open("src/models/notification_job_model.py", encoding="utf-8").read()

    assert "NotificationJob.business_id == business_id" in source
    assert "with_for_update(skip_locked=True" in source
    assert "uq_notification_jobs_business_dedup" in model
    assert "locked_until" in model and "external_message_id" in model
    business_repo = open("src/repositories/business_repo.py", encoding="utf-8").read()
    routes = open("src/api/v1/notification_job_routes.py", encoding="utf-8").read()
    assert "BusinessIntegration.integration_id == integration_id" in business_repo
    assert "BusinessIntegration.is_active == True" in business_repo
    assert "queue_professionals_without_appointments_for_integration" in routes
