from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

import pytest
from starlette.requests import Request

from src.api import health_routes
from src.schemas import UserUpdate
from src.admin.routes.auth import login_page
from src.services import user_service as user_service_module
from src.services.appointment_service import (AppointmentCancellationDeadlineError, AppointmentClientCancellationDisabledError,
    AppointmentConfirmationPendingError, AppointmentService,
)
from src.services.user_service import UserService


class FakeSession:
    def __init__(self):
        self.commits = 0
        self.refreshed = []
        self.executed = []

    def commit(self):
        self.commits += 1

    def refresh(self, value):
        self.refreshed.append(value)

    def execute(self, statement):
        self.executed.append(statement)

class UserRepositoryStub:
    def __init__(self, user):
        self.user = user

    def get_by_id(self, db, business_id, user_id):
        return self.user

def appointment_service_for(appointment, business):
    service = AppointmentService.__new__(AppointmentService)
    service.db = FakeSession()
    service._get_appointment_or_raise = lambda business_id, appointment_id: appointment
    service._get_business_or_raise = lambda business_id: business
    service._get_business_timezone = lambda business_id: timezone.utc
    service._commit_or_raise_conflict = service.db.commit
    return service

def test_user_update_hashes_new_password(monkeypatch):
    user = SimpleNamespace(
        id=1,
        business_id=10,
        email="old@example.com",
        password_hash="old-hash",
        role="admin",
        is_active=True,
    )
    db = FakeSession()
    service = UserService(db, UserRepositoryStub(user))
    monkeypatch.setattr(user_service_module, "hash", lambda value: f"hashed:{value}")

    service.update(10, 1, UserUpdate(password="new-password"))

    assert user.password_hash == "hashed:new-password"
    assert db.commits == 1
    assert len(db.executed) == 1

def test_pending_appointment_cannot_be_completed():
    appointment = SimpleNamespace(status="scheduled", confirmation_pending=True)
    business = SimpleNamespace(allow_client_cancel=True, cancel_limit_hours=24)
    service = appointment_service_for(appointment, business)

    with pytest.raises(AppointmentConfirmationPendingError):
        service.complete(1, 1)

def test_appointment_slot_alignment_matches_generated_clock_slots():
    service = AppointmentService.__new__(AppointmentService)
    suggested_slot = datetime(2026, 6, 8, 9, 15, tzinfo=timezone.utc)

    assert service._is_aligned_to_slot(suggested_slot, 15) is True
    assert service._is_aligned_to_slot(
        datetime(2026, 6, 8, 9, 5, tzinfo=timezone.utc),
        15,
    ) is False

def test_confirm_clears_pending_flag():
    appointment = SimpleNamespace(status="scheduled", confirmation_pending=True)
    business = SimpleNamespace(allow_client_cancel=True, cancel_limit_hours=24)
    service = appointment_service_for(appointment, business)

    service.confirm(1, 1)

    assert appointment.confirmation_pending is False
    assert service.db.commits == 1

def test_client_cancellation_respects_business_toggle():
    appointment = SimpleNamespace(
        status="scheduled",
        start_datetime=datetime.now(timezone.utc) + timedelta(days=2),
    )
    business = SimpleNamespace(allow_client_cancel=False, cancel_limit_hours=24)
    service = appointment_service_for(appointment, business)

    with pytest.raises(AppointmentClientCancellationDisabledError):
        service.cancel(1, 1, enforce_client_policy=True)

def test_client_cancellation_respects_deadline():
    appointment = SimpleNamespace(
        status="scheduled",
        start_datetime=datetime.now(timezone.utc) + timedelta(hours=2),
    )
    business = SimpleNamespace(allow_client_cancel=True, cancel_limit_hours=24)
    service = appointment_service_for(appointment, business)

    with pytest.raises(AppointmentCancellationDeadlineError):
        service.cancel(1, 1, enforce_client_policy=True)

def test_readiness_errors_do_not_expose_exception_details(monkeypatch):
    class BrokenEngine:
        def connect(self):
            raise RuntimeError("postgresql://secret-host/private")

    monkeypatch.setattr(health_routes, "engine", BrokenEngine())

    ok, error = health_routes._check_db()

    assert ok is False
    assert error == "unavailable"

def test_admin_login_template_renders_with_current_starlette_api():
    from src.main import app

    request = Request(
        {
            "type": "http",
            "http_version": "1.1",
            "method": "GET",
            "scheme": "http",
            "path": "/admin/login",
            "raw_path": b"/admin/login",
            "query_string": b"",
            "headers": [],
            "client": ("testclient", 50000),
            "server": ("testserver", 80),
            "root_path": "",
            "app": app,
        }
    )

    response = login_page(request)

    assert response.status_code == 200
    assert b"Beautyflow" in response.body
