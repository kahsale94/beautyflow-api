from datetime import datetime, timedelta, timezone
from decimal import Decimal
from types import SimpleNamespace

from src.models.appointment_model import AppointmentStatus
from src.models.business_feature_model import BusinessFeatureKey
from src.models.schedule_block_model import ScheduleBlockReason
from src.schemas import ScheduleBlockCreate
from src.services.professional_assignment_service import NoProfessionalCapacityError
from src.services.schedule_block_service import ScheduleBlockService


class Session:
    def __init__(self):
        self.locks = []
        self.commits = 0

    def execute(self, statement, params):
        self.locks.append(params["professional_id"])

    def flush(self):
        pass

    def commit(self):
        self.commits += 1

    def rollback(self):
        pass

    def refresh(self, item):
        item.id = item.id or 80
        item.created_at = getattr(item, "created_at", None) or datetime.now(timezone.utc)


class Blocks:
    def __init__(self):
        self.added = None

    def add(self, db, block):
        self.added = block

    def get_active_by_professional_period(self, *args):
        return []


class Appointments:
    def __init__(self, items):
        self.items = items

    def get_scheduled_overlapping(self, db, business_id, professional_id, start, end, for_update=False):
        assert for_update is True
        return [item for item in self.items if item.professional_id == professional_id]


class Professionals:
    def __init__(self, items):
        self.items = items

    def get_by_id(self, db, business_id, professional_id):
        return next((item for item in self.items if item.id == professional_id), None)

    def get_by_business(self, db, business_id):
        return list(self.items)


class Businesses:
    def get_by_id(self, db, business_id):
        return SimpleNamespace(id=business_id, is_active=True, timezone="America/Sao_Paulo")


class Assignment:
    def __init__(self):
        self.calls = 0

    def assign(self, *args, **kwargs):
        self.calls += 1
        if self.calls > 2:
            raise NoProfessionalCapacityError()
        return SimpleNamespace(professional_id=2, capacity_slot=self.calls)


class Features:
    def is_enabled(self, business_id, key):
        return key in {
            BusinessFeatureKey.capacity_based_booking,
            BusinessFeatureKey.replacement_classes,
            BusinessFeatureKey.professional_schedule_notifications,
        }


class Replacements:
    def __init__(self):
        self.sources = []

    def grant_for_appointment(self, business_id, appointment_id, reason, commit=False):
        assert commit is False
        self.sources.append(appointment_id)
        return SimpleNamespace(id=100 + appointment_id)


class Notifications:
    def __init__(self):
        self.professional = []
        self.client = []

    def enqueue_professional_event(self, *args, **kwargs):
        self.professional.append((args, kwargs))

    def enqueue_client_event(self, *args, **kwargs):
        self.client.append((args, kwargs))


def appointment(appointment_id):
    start = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0) + timedelta(days=2)
    return SimpleNamespace(
        id=appointment_id,
        business_id=1,
        client_id=appointment_id + 10,
        client=SimpleNamespace(id=appointment_id + 10, phone=f"55119999999{appointment_id}"),
        professional_id=1,
        service_id=5,
        start_datetime=start,
        end_datetime=start + timedelta(hours=1),
        capacity_slot=appointment_id,
        status=AppointmentStatus.scheduled,
        replacement_entitlement_id=None,
    )


def test_explicit_block_reallocates_maximum_and_only_cancels_unplaced_students():
    db = Session()
    blocks = Blocks()
    appointments = [appointment(1), appointment(2), appointment(3)]
    professionals = [
        SimpleNamespace(id=1, business_id=1, is_active=True, name="A", phone="5511", email="a@example.com"),
        SimpleNamespace(id=2, business_id=1, is_active=True, name="B", phone="5522", email="b@example.com"),
    ]
    replacements = Replacements()
    notifications = Notifications()
    service = ScheduleBlockService(
        db,
        blocks,
        Appointments(appointments),
        Professionals(professionals),
        Businesses(),
        Assignment(),
        Features(),
        replacements,
        notifications,
    )

    result = service.create_with_reallocation(
        1,
        ScheduleBlockCreate(
            professional_id=1,
            start_datetime=appointments[0].start_datetime,
            duration_hours=Decimal("1"),
            reason=ScheduleBlockReason.sick,
        ),
    )

    assert result.reassigned_appointment_ids == [1, 2]
    assert result.canceled_appointment_ids == [3]
    assert result.replacement_entitlement_ids == [103]
    assert [item.professional_id for item in appointments] == [2, 2, 1]
    assert appointments[2].status == AppointmentStatus.canceled
    assert replacements.sources == [3]
    assert len(notifications.client) == 1
    assert db.locks == [1, 2]
    assert db.commits == 1
    assert blocks.added is not None


def test_traditional_block_operation_still_rejects_existing_appointments():
    source = open("src/services/schedule_block_service.py", encoding="utf-8").read()

    assert "def create(self, business_id: int, data: ScheduleBlockCreate)" in source
    assert "def create_with_reallocation" in source
    assert "raise ScheduleBlockAppointmentConflictError()" in source
