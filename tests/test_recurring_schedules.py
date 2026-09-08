from datetime import date, datetime, time, timedelta, timezone
from types import SimpleNamespace

import pytest

from src.models.recurring_schedule_model import RecurringScheduleStatus
from src.services.recurring_schedule_service import (
    RecurringScheduleFeatureDisabledError,
    RecurringScheduleService,
)


class Session:
    def add(self, item):
        pass

    def commit(self):
        pass

    def rollback(self):
        pass

    def refresh(self, item):
        pass


class Features:
    def __init__(self, enabled=True):
        self.enabled = enabled

    def is_enabled(self, business_id, feature_key):
        return self.enabled


class Businesses:
    def __init__(self, business):
        self.business = business

    def get_by_id(self, db, business_id):
        return self.business if self.business.id == business_id else None


class Related:
    def get_by_id(self, db, business_id, entity_id):
        return SimpleNamespace(id=entity_id, business_id=business_id, is_active=True)


class Recurrences:
    def __init__(self, series):
        self.series = series
        self.occurrences = {}

    def get_by_id(self, db, business_id, series_id, for_update=False):
        if self.series.business_id == business_id and self.series.id == series_id:
            return self.series
        return None

    def get_by_business(self, db, business_id, client_id=None, status=None):
        if self.series.business_id != business_id:
            return []
        return [self.series]

    def get_occurrence(self, db, business_id, series_id, occurrence_start):
        return self.occurrences.get((business_id, series_id, occurrence_start))

    def get_future_scheduled_occurrences(self, db, business_id, series_id, now):
        return []


class Appointments:
    def __init__(self, recurrences):
        self.recurrences = recurrences
        self.created = []

    def create(self, business_id, data, *, series_id, occurrence_start, force_automatic):
        item = SimpleNamespace(id=len(self.created) + 1)
        self.recurrences.occurrences[(business_id, series_id, occurrence_start)] = item
        self.created.append((business_id, data, series_id, occurrence_start, force_automatic))
        return item


def recurring_service(enabled=True):
    today = date.today()
    first_date = today + timedelta(days=1)
    series = SimpleNamespace(
        id=10,
        business_id=1,
        client_id=2,
        service_id=3,
        weekday=first_date.weekday(),
        start_time=time(9),
        effective_from=first_date,
        effective_until=first_date + timedelta(days=14),
        status=RecurringScheduleStatus.active,
        last_materialized_at=None,
        last_materialization_error=None,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    business = SimpleNamespace(
        id=1,
        is_active=True,
        timezone="America/Sao_Paulo",
        maximum_schedule_days=30,
    )
    recurrences = Recurrences(series)
    appointments = Appointments(recurrences)
    service = RecurringScheduleService(
        Session(),
        recurrences,
        Businesses(business),
        Related(),
        Related(),
        Features(enabled),
        appointments,
    )
    return service, series, appointments


def test_materialization_is_timezone_aware_automatic_and_idempotent():
    service, series, appointments = recurring_service()

    first = service.materialize(1, series.id)
    second = service.materialize(1, series.id)

    assert first.created == 3
    assert second.created == 0
    assert second.skipped_existing == 3
    assert all(item[3].tzinfo is not None for item in appointments.created)
    assert all(item[4] is True for item in appointments.created)
    assert series.last_materialization_error is None


def test_recurring_operations_are_feature_gated():
    service, _series, _appointments = recurring_service(enabled=False)

    with pytest.raises(RecurringScheduleFeatureDisabledError):
        service.list(1)


def test_recurring_repository_queries_are_tenant_scoped():
    source = open("src/repositories/recurring_schedule_repo.py", encoding="utf-8").read()

    assert source.count("RecurringSchedule.business_id == business_id") >= 2
    assert "Appointment.business_id == business_id" in source
    assert "AppointmentStatus.scheduled" in source
