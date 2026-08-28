from __future__ import annotations

import inspect
import re
from datetime import datetime, time, timedelta, timezone
from pathlib import Path
from types import SimpleNamespace
from zoneinfo import ZoneInfo

import pytest
from sqlalchemy.exc import IntegrityError

from src.api.v1.appointment_routes import cancel_appointment
from src.models import Appointment
from src.schemas import AppointmentCreate, AvailabilityCheckAndSuggestRequest
from src.schemas.appointment_schema import AppointmentStatus
from src.services.appointment_service import (
    AppointmentClientCancellationDisabledError,
    AppointmentNotFoundError,
    AppointmentService,
    AppointmentTimeConflictError,
)
from src.services.availability_service import AvailabilityService


BUSINESS_ID = 7
PROFESSIONAL_ID = 2
SERVICE_ID = 5
MARIA_ID = 11
TZ = ZoneInfo("America/Sao_Paulo")
ROOT = Path(__file__).resolve().parents[1]


class _ConstraintViolation(Exception):
    def __init__(self) -> None:
        self.diag = SimpleNamespace(
            constraint_name="ex_appointments_business_professional_time_conflict"
        )


class _FakeDb:
    def __init__(self, appointments: list) -> None:
        self.appointments = appointments
        self.pending = None
        self.commits = 0
        self.rollbacks = 0

    def execute(self, statement, parameters):
        return None

    def flush(self) -> None:
        if self.pending is None:
            return

        candidate = self.pending
        for existing in self.appointments:
            overlaps = (
                existing.business_id == candidate.business_id
                and existing.professional_id == candidate.professional_id
                and existing.status == AppointmentStatus.scheduled
                and candidate.start_datetime < existing.end_datetime
                and candidate.end_datetime > existing.start_datetime
            )
            if overlaps:
                raise IntegrityError("INSERT", {}, _ConstraintViolation())

        candidate.id = max((item.id for item in self.appointments), default=0) + 1
        candidate.created_at = datetime.now(timezone.utc)
        self.appointments.append(candidate)
        self.pending = None

    def commit(self) -> None:
        self.commits += 1

    def rollback(self) -> None:
        self.rollbacks += 1
        self.pending = None

    def refresh(self, instance) -> None:
        return None


class _AppointmentRepo:
    def __init__(self, appointments: list) -> None:
        self.appointments = appointments

    def add(self, db: _FakeDb, appointment: Appointment) -> None:
        db.pending = appointment

    def get_by_id(self, db, business_id: int, appointment_id: int):
        return next(
            (
                item
                for item in self.appointments
                if item.id == appointment_id and item.business_id == business_id
            ),
            None,
        )

    def get_scheduled_by_professional_and_date(
        self, db, business_id, professional_id, start_of_day, end_of_day
    ):
        return [
            item
            for item in self.appointments
            if item.business_id == business_id
            and item.professional_id == professional_id
            and item.status == AppointmentStatus.scheduled
            and item.start_datetime < end_of_day
            and item.end_datetime > start_of_day
        ]


class _EntityRepo:
    def __init__(self, entity) -> None:
        self.entity = entity

    def get_by_id(self, db, business_id: int, entity_id: int):
        if self.entity.business_id == business_id and self.entity.id == entity_id:
            return self.entity
        return None


class _BusinessRepo:
    def __init__(self, business) -> None:
        self.business = business

    def get_by_id(self, db, business_id: int):
        return self.business if self.business.id == business_id else None


class _AvailabilityRepo:
    def __init__(self, professional_id: int, windows: dict[int, tuple[time, time]]) -> None:
        self.professional_id = professional_id
        self.windows = windows

    def get_by_professional_and_weekday(self, db, professional_id: int, weekday: int):
        window = self.windows.get(weekday)
        if professional_id != self.professional_id or window is None:
            return None
        return SimpleNamespace(
            professional_id=professional_id,
            weekday=weekday,
            start_time=window[0],
            end_time=window[1],
        )


class _ProfessionalServiceRepo:
    def get_by_ids(self, db, professional_id: int, service_id: int):
        if professional_id == PROFESSIONAL_ID and service_id == SERVICE_ID:
            return SimpleNamespace(
                professional_id=professional_id,
                service_id=service_id,
            )
        return None


class _ScheduleBlockRepo:
    def get_active_by_professional_and_date(
        self, db, business_id, professional_id, start_of_day, end_of_day
    ):
        return []

    def get_active_by_professional_period(
        self, db, business_id, professional_id, start_datetime, end_datetime
    ):
        return []


def _appointment(
    appointment_id: int,
    client_id: int,
    start_datetime: datetime,
    status: AppointmentStatus = AppointmentStatus.scheduled,
):
    return SimpleNamespace(
        id=appointment_id,
        business_id=BUSINESS_ID,
        client_id=client_id,
        professional_id=PROFESSIONAL_ID,
        service_id=SERVICE_ID,
        start_datetime=start_datetime,
        end_datetime=start_datetime + timedelta(hours=1),
        created_at=start_datetime - timedelta(days=7),
        status=status,
        confirmation_pending=False,
    )


def _next_monday() -> datetime:
    now = datetime.now(TZ)
    days_ahead = (7 - now.weekday()) or 7
    return datetime.combine(
        now.date() + timedelta(days=days_ahead),
        time(0, 0),
        tzinfo=TZ,
    )


def _build_services(*, allow_client_cancel: bool = True):
    monday = _next_monday()
    target_tuesday = monday + timedelta(days=1, hours=10)
    occupied_thursday = monday + timedelta(days=3, hours=10)

    business = SimpleNamespace(
        id=BUSINESS_ID,
        timezone=TZ.key,
        slot_interval_minutes=60,
        minimum_notice_minutes=0,
        maximum_schedule_days=30,
        booking_enabled=True,
        allow_client_cancel=allow_client_cancel,
        cancel_limit_hours=0,
        appointment_confirmation_required=False,
        is_active=True,
    )
    professional = SimpleNamespace(
        id=PROFESSIONAL_ID,
        business_id=BUSINESS_ID,
        business=business,
        is_active=True,
    )
    service = SimpleNamespace(
        id=SERVICE_ID,
        business_id=BUSINESS_ID,
        duration_minutes=60,
        is_active=True,
    )
    client = SimpleNamespace(id=MARIA_ID, business_id=BUSINESS_ID, is_active=True)
    appointments = [
        _appointment(101, MARIA_ID, target_tuesday),
        _appointment(102, MARIA_ID, occupied_thursday),
    ]
    appointment_repo = _AppointmentRepo(appointments)
    db = _FakeDb(appointments)
    availability_repo = _AvailabilityRepo(
        PROFESSIONAL_ID,
        {
            1: (time(10, 0), time(11, 0)),
            2: (time(14, 0), time(15, 0)),
            3: (time(9, 0), time(11, 0)),
            4: (time(11, 0), time(12, 0)),
        },
    )
    professional_repo = _EntityRepo(professional)
    service_repo = _EntityRepo(service)
    client_repo = _EntityRepo(client)
    business_repo = _BusinessRepo(business)
    professional_service_repo = _ProfessionalServiceRepo()
    schedule_block_repo = _ScheduleBlockRepo()

    availability_service = AvailabilityService(
        db,
        availability_repo,
        professional_repo,
        appointment_repo,
        service_repo,
        professional_service_repo,
        schedule_block_repo,
    )
    appointment_service = AppointmentService(
        db,
        appointment_repo,
        professional_repo,
        service_repo,
        availability_repo,
        client_repo,
        business_repo,
        professional_service_repo,
        schedule_block_repo,
    )
    return SimpleNamespace(
        db=db,
        business=business,
        appointments=appointments,
        target=appointments[0],
        occupied=appointments[1],
        availability_service=availability_service,
        appointment_service=appointment_service,
        monday=monday,
    )


def _suggestion_request(target_start: datetime):
    return AvailabilityCheckAndSuggestRequest(
        professional_id=PROFESSIONAL_ID,
        service_id=SERVICE_ID,
        requested_start=target_start,
        max_suggestions=3,
        search_days_ahead=3,
    )


def test_cancel_suggest_and_replace_flow_preserves_conflict_rules():
    scenario = _build_services()
    request = _suggestion_request(scenario.target.start_datetime)

    before_cancel = scenario.availability_service.check_and_suggest(
        BUSINESS_ID, request
    )

    assert before_cancel.available is False
    assert [item.start_datetime for item in before_cancel.suggestions] == [
        scenario.monday + timedelta(days=2, hours=14),
        scenario.monday + timedelta(days=3, hours=9),
        scenario.monday + timedelta(days=4, hours=11),
    ]
    assert scenario.occupied.start_datetime not in {
        item.start_datetime for item in before_cancel.suggestions
    }

    scenario.appointment_service.cancel(
        BUSINESS_ID,
        scenario.target.id,
        enforce_client_policy=True,
    )

    assert scenario.target.status == AppointmentStatus.canceled

    # A busca precisa acontecer antes do cancelamento: depois dele o horario
    # original reaparece livre e o contrato retorna suggestions vazio.
    after_cancel = scenario.availability_service.check_and_suggest(
        BUSINESS_ID, request
    )
    assert after_cancel.available is True
    assert after_cancel.suggestions == []

    chosen_start = before_cancel.suggestions[1].start_datetime
    created = scenario.appointment_service.create(
        BUSINESS_ID,
        AppointmentCreate(
            client_id=MARIA_ID,
            professional_id=PROFESSIONAL_ID,
            service_id=SERVICE_ID,
            start_datetime=chosen_start,
        ),
    )

    assert created.start_datetime == chosen_start
    assert created.status == AppointmentStatus.scheduled

    with pytest.raises(AppointmentTimeConflictError):
        scenario.appointment_service.create(
            BUSINESS_ID,
            AppointmentCreate(
                client_id=MARIA_ID,
                professional_id=PROFESSIONAL_ID,
                service_id=SERVICE_ID,
                start_datetime=scenario.occupied.start_datetime,
            ),
        )

    assert scenario.db.rollbacks == 1


def test_client_cancellation_is_tenant_scoped_and_policy_gated():
    scenario = _build_services(allow_client_cancel=False)

    with pytest.raises(AppointmentNotFoundError):
        scenario.appointment_service.cancel(
            BUSINESS_ID + 1,
            scenario.target.id,
            enforce_client_policy=True,
        )

    with pytest.raises(AppointmentClientCancellationDisabledError):
        scenario.appointment_service.cancel(
            BUSINESS_ID,
            scenario.target.id,
            enforce_client_policy=True,
        )

    assert scenario.target.status == AppointmentStatus.scheduled
    assert scenario.db.commits == 0


def test_business_integration_cancel_route_enforces_client_policy():
    calls = []
    service = SimpleNamespace(
        cancel=lambda business_id, appointment_id, enforce_client_policy: calls.append(
            (business_id, appointment_id, enforce_client_policy)
        )
    )

    cancel_appointment(
        appointment_id=101,
        business_id=BUSINESS_ID,
        service=service,
        actor=SimpleNamespace(type="business_integration"),
    )

    assert calls == [(BUSINESS_ID, 101, True)]
    assert "reason" not in inspect.signature(cancel_appointment).parameters
    assert set(AppointmentCreate.model_fields) == {
        "client_id",
        "professional_id",
        "service_id",
        "start_datetime",
    }


def test_pilates_staging_sql_is_idempotent_non_destructive_and_demo_ready():
    sql = (ROOT / "scripts" / "demo_pilates_staging.sql").read_text(
        encoding="utf-8"
    )

    assert not re.search(r"^\s*(DELETE|TRUNCATE|DROP)\b", sql, re.MULTILINE)
    assert "INSERT INTO business_integrations" not in sql
    assert "business_integration.is_active = true" in sql
    assert "'automation'::integrationtype" in sql
    assert "v_business_id    integer := NULL" in sql
    assert "v_integration_id integer := NULL" in sql
    assert "v_confirm_dedicated_tenant boolean := false" in sql
    assert "v_confirm_dedicated_tenant IS NOT TRUE" in sql
    assert "v_maria_phone = '5511999999999'" in sql
    assert "lower(evolution_instance.state) IN ('open', 'connected')" in sql
    assert "A empresa % nao esta limpa/dedicada ao roteiro" in sql
    assert "Ha aula ativa da Ana em um horario de reposicao" in sql
    assert "candidate_occurrences" in sql
    assert "occurrence.start_at + interval '60 minutes' <= now()" in sql
    assert "WHERE a.business_id = <ID>" in sql
    assert "studio-movimento-pilates-demo" not in sql
    assert "booking_enabled" in sql
    assert "v_week_anchor" in sql
    assert "generate_series(0, 2)" in sql
    assert "'completed'::appointmentstatus" in sql
    assert "'scheduled'::appointmentstatus" in sql
    assert "(v_maria_id,   v_ana_id,     1, time '10:00')" in sql
    assert "(v_maria_id,   v_ana_id,     3, time '10:00')" in sql
    assert "(v_ana_id,     2, time '14:00', time '15:00')" in sql
    assert "(v_ana_id,     3, time '09:00', time '11:00')" in sql
    assert "(v_ana_id,     4, time '11:00', time '12:00')" in sql
    assert "INSERT INTO appointment_reminders" not in sql
