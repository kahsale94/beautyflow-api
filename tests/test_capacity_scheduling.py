from datetime import datetime, time, timedelta
from types import SimpleNamespace
from zoneinfo import ZoneInfo

import pytest

from src.services.professional_assignment_service import (
    NoProfessionalCapacityError,
    ProfessionalAssignmentService,
)


class Session:
    def __init__(self):
        self.locked = []

    def execute(self, statement, params):
        self.locked.append(params["professional_id"])


class Professionals:
    def __init__(self, items):
        self.items = items

    def get_eligible_for_service(self, db, business_id, service_id):
        return [item for item in self.items if item.business_id == business_id and service_id in item.service_ids]


class Availabilities:
    def get_by_professional_and_weekday(self, db, professional_id, weekday):
        return SimpleNamespace(start_time=time(8), end_time=time(18))


class Appointments:
    def __init__(self, by_professional):
        self.by_professional = by_professional

    def get_scheduled_overlapping(self, db, business_id, professional_id, start, end):
        return list(self.by_professional.get(professional_id, []))


class Blocks:
    def __init__(self, blocked=()):
        self.blocked = set(blocked)

    def get_active_by_professional_period(self, db, business_id, professional_id, start, end):
        return [object()] if professional_id in self.blocked else []


def professional(professional_id, capacity=3, active=True, service_ids=(5,)):
    return SimpleNamespace(
        id=professional_id,
        business_id=1,
        simultaneous_capacity=capacity,
        is_active=active,
        service_ids=set(service_ids),
    )


def booked(appointment_id, lane):
    return SimpleNamespace(id=appointment_id, capacity_slot=lane)


def period():
    tz = ZoneInfo("America/Sao_Paulo")
    start = datetime.now(tz).replace(hour=9, minute=0, second=0, microsecond=0) + timedelta(days=1)
    return start, start + timedelta(hours=1)


def service(professionals, appointments, blocks=()):
    session = Session()
    return session, ProfessionalAssignmentService(
        session,
        Professionals(professionals),
        Availabilities(),
        Appointments(appointments),
        Blocks(blocks),
    )


def test_two_professionals_capacity_three_expose_six_studio_slots_and_balance_by_ratio():
    session, assignment_service = service(
        [professional(2), professional(1)],
        {1: [booked(1, 1), booked(2, 2)], 2: [booked(3, 1)]},
    )
    start, end = period()

    result = assignment_service.assign(1, 5, start, end, use_configured_capacity=True)

    assert result.snapshot.total_capacity == 6
    assert result.snapshot.occupied == 3
    assert result.snapshot.remaining_capacity == 3
    assert result.professional_id == 2
    assert result.capacity_slot == 2
    assert session.locked == [1, 2]


def test_schedule_block_removes_entire_professional_capacity():
    _session, assignment_service = service(
        [professional(1), professional(2)],
        {2: [booked(3, 1)]},
        blocks={1},
    )
    start, end = period()

    snapshot = assignment_service.snapshot(1, 5, start, end, use_configured_capacity=True)

    assert snapshot.total_capacity == 3
    assert snapshot.occupied == 1
    assert snapshot.remaining_capacity == 2
    assert [item.professional_id for item in snapshot.professionals] == [2]


def test_inactive_and_service_incompatible_professionals_do_not_contribute():
    _session, assignment_service = service(
        [professional(1), professional(2, active=False), professional(3, service_ids=(9,))],
        {},
    )
    start, end = period()

    snapshot = assignment_service.snapshot(1, 5, start, end, use_configured_capacity=True)

    assert snapshot.total_capacity == 3
    assert [item.professional_id for item in snapshot.professionals] == [1]


def test_fourth_overlap_is_rejected_after_three_lanes_are_occupied():
    _session, assignment_service = service(
        [professional(1)],
        {1: [booked(1, 1), booked(2, 2), booked(3, 3)]},
    )
    start, end = period()

    with pytest.raises(NoProfessionalCapacityError):
        assignment_service.assign(1, 5, start, end, use_configured_capacity=True)


def test_feature_off_capacity_math_keeps_one_professional_one_client_behavior():
    _session, assignment_service = service(
        [professional(1, capacity=5)],
        {1: [booked(1, 1)]},
    )
    start, end = period()

    snapshot = assignment_service.snapshot(1, 5, start, end, use_configured_capacity=False)

    assert snapshot.total_capacity == 1
    assert snapshot.remaining_capacity == 0
