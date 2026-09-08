from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

import pytest

from src.models.appointment_model import AppointmentKind, AppointmentStatus
from src.schemas import AppointmentCreate, ProfessionalCreate, ProfessionalUpdate
from src.services.professional_service import ProfessionalCapacityConflictError, ProfessionalService
from src.services.appointment_service import AppointmentAlreadyNoShowError, AppointmentService


class Session:
    def __init__(self):
        self.commits = 0

    def execute(self, statement, params):
        return None

    def commit(self):
        self.commits += 1

    def rollback(self):
        pass

    def refresh(self, item):
        pass


class ProfessionalRepo:
    def __init__(self, professional):
        self.professional = professional

    def get_by_id(self, db, business_id, professional_id):
        if self.professional.business_id == business_id and self.professional.id == professional_id:
            return self.professional
        return None


class AppointmentRepo:
    def __init__(self, appointments):
        self.appointments = appointments

    def get_future_scheduled_by_professional(self, db, business_id, professional_id, now):
        return self.appointments


class Invalidator:
    def invalidate_professional_context(self, professional_id):
        return 1


class AppointmentLifecycleRepo:
    def __init__(self, item):
        self.item = item

    def get_by_id(self, db, business_id, appointment_id):
        if self.item.business_id == business_id and self.item.id == appointment_id:
            return self.item
        return None


class ReminderLifecycle:
    def __init__(self):
        self.skipped = []

    def skip_pending_for_appointment(self, appointment_id, reason):
        self.skipped.append((appointment_id, reason))


def appointment(appointment_id, start_hour, end_hour, lane=1):
    base = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0) + timedelta(days=1)
    return SimpleNamespace(
        id=appointment_id,
        start_datetime=base.replace(hour=start_hour),
        end_datetime=base.replace(hour=end_hour),
        capacity_slot=lane,
    )


def test_new_capacity_and_appointment_semantics_have_safe_defaults():
    professional = ProfessionalCreate(name="Ana", email="ana@example.com", phone="5511999999999")
    appointment_data = AppointmentCreate(
        client_id=1,
        professional_id=2,
        service_id=3,
        start_datetime=datetime.now(timezone.utc) + timedelta(days=1),
    )

    assert professional.simultaneous_capacity == 1
    assert appointment_data.kind == AppointmentKind.standard
    assert AppointmentStatus.no_show.value == "no_show"


def test_capacity_reduction_repacks_future_lanes_when_schedule_fits():
    professional = SimpleNamespace(
        id=7,
        business_id=1,
        is_active=True,
        simultaneous_capacity=3,
        name="Ana",
        email="ana@example.com",
        phone="5511999999999",
    )
    appointments = [appointment(1, 9, 10, 3), appointment(2, 10, 11, 2)]
    service = ProfessionalService(
        Session(), ProfessionalRepo(professional), Invalidator(), AppointmentRepo(appointments)
    )

    service.update(1, 7, ProfessionalUpdate(simultaneous_capacity=1))

    assert professional.simultaneous_capacity == 1
    assert [item.capacity_slot for item in appointments] == [1, 1]


def test_capacity_reduction_rejects_overlapping_future_schedule():
    professional = SimpleNamespace(
        id=7,
        business_id=1,
        is_active=True,
        simultaneous_capacity=3,
        name="Ana",
        email="ana@example.com",
        phone="5511999999999",
    )
    appointments = [appointment(1, 9, 11), appointment(2, 10, 12)]
    service = ProfessionalService(
        Session(), ProfessionalRepo(professional), Invalidator(), AppointmentRepo(appointments)
    )

    with pytest.raises(ProfessionalCapacityConflictError):
        service.update(1, 7, ProfessionalUpdate(simultaneous_capacity=1))

    assert professional.simultaneous_capacity == 3


def test_scheduled_appointment_can_be_marked_no_show_only_once():
    item = SimpleNamespace(
        id=9,
        business_id=1,
        status=AppointmentStatus.scheduled,
        confirmation_pending=False,
    )
    session = Session()
    reminders = ReminderLifecycle()
    service = AppointmentService(
        session,
        AppointmentLifecycleRepo(item),
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        appointment_reminder_service=reminders,
    )

    service.mark_no_show(1, 9)

    assert item.status == AppointmentStatus.no_show
    assert reminders.skipped == [(9, "appointment_no_show")]
    assert session.commits == 1
    with pytest.raises(AppointmentAlreadyNoShowError):
        service.mark_no_show(1, 9)
