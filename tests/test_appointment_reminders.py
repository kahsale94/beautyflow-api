from datetime import datetime, timedelta, timezone
from pathlib import Path
from types import SimpleNamespace

from src.models.appointment_model import AppointmentStatus
from src.services.appointment_reminder_service import AppointmentReminderService


ROOT = Path(__file__).resolve().parents[1]


def read_source(relative_path: str) -> str:
    return (ROOT / relative_path).read_text(encoding="utf-8")


class ReminderRepositoryStub:
    def __init__(self):
        self.added = None

    def get_by_appointment_snapshot(self, db, appointment_id, reminder_type, appointment_start_datetime):
        return None

    def add(self, db, reminder):
        self.added = reminder


class FakeSession:
    def __init__(self):
        self.commits = 0

    def commit(self):
        self.commits += 1


class ManualReminderRepositoryStub:
    def __init__(self):
        self.added = None

    def get_active_by_appointment_snapshot(self, db, appointment_id, reminder_type, appointment_start_datetime, *, for_update=False):
        return None

    def add(self, db, reminder):
        self.added = reminder


def test_reminder_schedule_uses_cancel_limit_plus_six_hours():
    repo = ReminderRepositoryStub()
    service = AppointmentReminderService(SimpleNamespace(), repo)
    start_datetime = datetime.now(timezone.utc) + timedelta(days=3)
    appointment = SimpleNamespace(
        id=10,
        business_id=2,
        start_datetime=start_datetime,
        status=AppointmentStatus.scheduled,
        confirmation_pending=False,
    )
    business = SimpleNamespace(id=2, cancel_limit_hours=24)

    reminder = service.schedule_for_appointment(appointment, business)

    assert reminder is repo.added
    assert reminder.scheduled_for == start_datetime - timedelta(hours=30)
    assert reminder.appointment_start_datetime == start_datetime


def test_manual_reminder_is_queued_for_immediate_claim():
    db = FakeSession()
    repo = ManualReminderRepositoryStub()
    service = AppointmentReminderService(db, repo)
    now = datetime.now(timezone.utc)
    service._now = lambda: now
    appointment = SimpleNamespace(
        id=11,
        business_id=2,
        start_datetime=now + timedelta(days=1),
        status=AppointmentStatus.scheduled,
        confirmation_pending=False,
    )
    business = SimpleNamespace(
        id=2,
        evolution_instance=SimpleNamespace(
            instance_name="beautyflow-test-2",
            state="open",
        ),
    )

    reminder = service.schedule_manual_for_appointment(appointment, business)

    assert reminder is repo.added
    assert reminder.reminder_type == service.REMINDER_TYPE_MANUAL
    assert reminder.scheduled_for == now
    assert reminder.appointment_start_datetime == appointment.start_datetime
    assert db.commits == 1


def test_appointment_service_controls_reminder_lifecycle():
    source = read_source("src/services/appointment_service.py")

    assert "_schedule_reminder_if_needed(appointment, business)" in source
    assert 'reason="appointment_rescheduled"' in source
    assert 'reason="appointment_completed"' in source
    assert 'reason="appointment_canceled"' in source
    assert 'reason="appointment_deleted"' in source
    assert "AppointmentReminderService(db, AppointmentReminderRepository())" in source


def test_appointment_reminder_internal_api_uses_integration_scope():
    route_source = read_source("src/api/v1/appointment_reminder_routes.py")
    api_source = read_source("src/api/v1/__init__.py")
    dependency_source = read_source("src/dependecies.py")

    assert 'prefix="/appointment-reminders"' in route_source
    assert '"/claim"' in route_source
    assert '"/{reminder_id}/sent"' in route_source
    assert '"/{reminder_id}/failed"' in route_source
    assert "IntegrationDep" in route_source
    assert "AppointmentReminderServiceDep" in dependency_source
    assert "appointment_reminder_router" in api_source


def test_appointment_reminder_outbox_has_retry_lock_and_audit_fields():
    model_source = read_source("src/models/appointment_reminder_model.py")
    repo_source = read_source("src/repositories/appointment_reminder_repo.py")
    service_source = read_source("src/services/appointment_reminder_service.py")
    business_source = read_source("src/services/business_service.py")
    migration_source = read_source("alembic/versions/0007_add_appointment_reminders.py")

    assert "class AppointmentReminderStatus" in model_source
    assert "locked_until" in model_source
    assert "sent_at" in model_source
    assert "failed_at" in model_source
    assert "external_message_id" in model_source
    assert "with_for_update(skip_locked=True" in repo_source
    assert "AppointmentReminderStatus.processing" in service_source
    assert "MAX_ATTEMPTS = 3" in service_source
    assert "claim_due" in service_source
    assert "mark_sent" in service_source
    assert "mark_failed" in service_source
    assert "REMINDER_TYPE_MANUAL" in service_source
    assert "schedule_manual_for_appointment" in service_source
    assert "recalculate_pending_for_business" in business_source
    assert "ux_appointment_reminders_upcoming_snapshot" in migration_source
    assert "reminder_type = 'appointment_upcoming'" in migration_source
    assert "ux_appointment_reminders_active_manual_snapshot" in migration_source
    assert "reminder_type = 'appointment_manual' AND status IN ('pending', 'processing')" in migration_source


def test_admin_modal_exposes_reminder_status_and_manual_send():
    route_source = read_source("src/admin/routes/appointments.py")
    details_template = read_source("src/templates/admin/appointments/_details.html")
    css_source = read_source("src/static/admin/css/admin.css")

    assert "AppointmentReminderServiceDep" in route_source
    assert "send_manual_reminder_action" in route_source
    assert "schedule_manual_for_appointment" in route_source
    assert "manual_reminder_disabled_reason" in route_source
    assert "Lembrete automático" in details_template
    assert "Último lembrete" in details_template
    assert "reminder_history" in details_template
    assert "/reminders/manual" in details_template
    assert "manual_reminder_button_label" in details_template
    assert ".badge.sent" in css_source
    assert ".badge.failed" in css_source
    assert ".reminder-history" in css_source


def test_appointments_workflow_claims_and_sends_reminders():
    workflow_source = read_source("workflows/appointments-prod.workflow.ts")

    assert "ReminderSchedule" in workflow_source
    assert "ClaimReminders" in workflow_source
    assert "SplitReminderClaims" in workflow_source
    assert "SendReminder" in workflow_source
    assert "MarkReminderSent" in workflow_source
    assert "MarkReminderFailed" in workflow_source
    assert "/appointment-reminders/claim" in workflow_source
    assert "/appointment-reminders/{{" in workflow_source
    assert "split reminder claims" in workflow_source
    assert "/sent" in workflow_source
    assert "/failed" in workflow_source
    assert "httpBearerAuth" in workflow_source
    assert "n8n beautyflow token - prod" in workflow_source
    assert "Evolution Credential - Kaiky" in workflow_source
