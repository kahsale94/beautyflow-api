from datetime import datetime, timedelta, timezone
from concurrent.futures import ThreadPoolExecutor
from threading import Barrier, Lock
from types import SimpleNamespace

import pytest

from src.models.appointment_model import Appointment, AppointmentKind, AppointmentStatus
from src.models.replacement_entitlement_model import (
    ReplacementEntitlementReason,
    ReplacementEntitlementStatus,
)
from src.schemas import AppointmentResponse, ReplacementBookingCreate
from src.services.replacement_entitlement_service import (
    ReplacementEntitlementExpiredError,
    ReplacementEntitlementIneligibleError,
    ReplacementEntitlementInvalidStateError,
    ReplacementEntitlementService,
)


class Session:
    def __init__(self):
        self.commits = 0

    def flush(self):
        pass

    def commit(self):
        self.commits += 1

    def refresh(self, item):
        pass


class Features:
    def is_enabled(self, business_id, feature_key):
        return True

    def get_config(self, business_id, feature_key):
        return {"expiration_days": 30}


class Businesses:
    business = SimpleNamespace(
        id=1,
        is_active=True,
        timezone="America/Sao_Paulo",
        allow_client_cancel=True,
        cancel_limit_hours=2,
    )

    def get_by_id(self, db, business_id):
        return self.business if business_id == 1 else None


class AppointmentRepo:
    def __init__(self, source):
        self.items = {source.id: source}

    def get_by_id(self, db, business_id, appointment_id, for_update=False):
        item = self.items.get(appointment_id)
        return item if item and item.business_id == business_id else None


class Entitlements:
    def __init__(self):
        self.items = {}

    def add(self, db, item):
        item.id = len(self.items) + 50
        item.created_at = datetime.now(timezone.utc)
        item.used_at = None
        item.replacement_appointment = None
        self.items[item.id] = item

    def get_by_source(self, db, business_id, source_appointment_id, for_update=False):
        return next(
            (
                item for item in self.items.values()
                if item.business_id == business_id
                and item.source_appointment_id == source_appointment_id
            ),
            None,
        )

    def get_by_id(self, db, business_id, entitlement_id, for_update=False):
        item = self.items.get(entitlement_id)
        return item if item and item.business_id == business_id else None

    def get_expired_available(self, db, business_id, now):
        return [
            item for item in self.items.values()
            if item.business_id == business_id
            and item.status == ReplacementEntitlementStatus.available
            and item.expires_at <= now
        ]

    def get_by_business(self, db, business_id, client_id=None, status=None):
        return [item for item in self.items.values() if item.business_id == business_id]


class AppointmentService:
    def __init__(self, repo, entitlements):
        self.repo = repo
        self.entitlements = entitlements
        self.skipped = []

    def _skip_pending_reminders(self, appointment_id, reason):
        self.skipped.append((appointment_id, reason))

    def create(self, business_id, data, **kwargs):
        appointment_id = max(self.repo.items) + 1
        model = Appointment(
            id=appointment_id,
            business_id=business_id,
            client_id=data.client_id,
            professional_id=data.professional_id or 9,
            service_id=data.service_id,
            start_datetime=data.start_datetime,
            end_datetime=data.start_datetime + timedelta(hours=1),
            status=AppointmentStatus.scheduled,
            confirmation_pending=False,
            capacity_slot=1,
            kind=AppointmentKind.standard,
            series_id=None,
            occurrence_start=None,
            replacement_entitlement_id=kwargs["replacement_entitlement_id"],
        )
        model.created_at = datetime.now(timezone.utc)
        self.repo.items[appointment_id] = model
        self.entitlements.items[kwargs["replacement_entitlement_id"]].replacement_appointment = model
        return SimpleNamespace(id=appointment_id)

    def _validate_return(self, model, business_tz):
        return AppointmentResponse.model_validate(model)


def source(status=AppointmentStatus.canceled, series_id=7):
    return SimpleNamespace(
        id=10,
        business_id=1,
        client_id=2,
        service_id=3,
        start_datetime=datetime.now(timezone.utc) + timedelta(days=2),
        status=status,
        series_id=series_id,
        replacement_entitlement_id=None,
    )


def service(source_appointment=None):
    source_appointment = source_appointment or source()
    appointment_repo = AppointmentRepo(source_appointment)
    entitlements = Entitlements()
    appointment_service = AppointmentService(appointment_repo, entitlements)
    return ReplacementEntitlementService(
        Session(),
        entitlements,
        appointment_repo,
        Businesses(),
        Features(),
        appointment_service,
    ), entitlements


def test_entitlement_creation_is_idempotent_per_source_and_has_configured_expiration():
    replacement_service, _repo = service()

    first = replacement_service.grant_for_appointment(
        1, 10, ReplacementEntitlementReason.manual
    )
    second = replacement_service.grant_for_appointment(
        1, 10, ReplacementEntitlementReason.manual
    )

    assert first.id == second.id
    assert first.status == ReplacementEntitlementStatus.available
    assert timedelta(days=29) < first.expires_at - datetime.now(timezone.utc) <= timedelta(days=30)


def test_entitlement_consumption_is_single_use_and_links_appointment_atomically():
    replacement_service, _repo = service()
    entitlement = replacement_service.grant_for_appointment(
        1, 10, ReplacementEntitlementReason.manual
    )
    booking = ReplacementBookingCreate(
        start_datetime=datetime.now(timezone.utc) + timedelta(days=4)
    )

    used = replacement_service.use(1, entitlement.id, booking)

    assert used.entitlement.status == ReplacementEntitlementStatus.used
    assert used.appointment.replacement_entitlement_id == entitlement.id
    with pytest.raises(ReplacementEntitlementInvalidStateError):
        replacement_service.use(1, entitlement.id, booking)


def test_concurrent_consumers_cannot_use_the_same_entitlement_twice():
    transaction_lock = Lock()
    start_together = Barrier(2)

    class LockingSession(Session):
        def __init__(self):
            super().__init__()
            self.owns_lock = False

        def acquire_row_lock(self):
            transaction_lock.acquire()
            self.owns_lock = True

        def release_row_lock(self):
            if self.owns_lock:
                self.owns_lock = False
                transaction_lock.release()

        def commit(self):
            super().commit()
            self.release_row_lock()

    class LockingEntitlements(Entitlements):
        def get_by_id(self, db, business_id, entitlement_id, for_update=False):
            if for_update:
                start_together.wait(timeout=2)
                db.acquire_row_lock()
            return super().get_by_id(db, business_id, entitlement_id, for_update=for_update)

    source_appointment = source()
    appointment_repo = AppointmentRepo(source_appointment)
    entitlements = LockingEntitlements()
    bootstrap_session = Session()
    bootstrap_service = ReplacementEntitlementService(
        bootstrap_session,
        entitlements,
        appointment_repo,
        Businesses(),
        Features(),
        AppointmentService(appointment_repo, entitlements),
    )
    entitlement = bootstrap_service.grant_for_appointment(
        1, source_appointment.id, ReplacementEntitlementReason.manual
    )
    booking = ReplacementBookingCreate(
        start_datetime=datetime.now(timezone.utc) + timedelta(days=4)
    )

    sessions = [LockingSession(), LockingSession()]
    services = [
        ReplacementEntitlementService(
            session,
            entitlements,
            appointment_repo,
            Businesses(),
            Features(),
            AppointmentService(appointment_repo, entitlements),
        )
        for session in sessions
    ]

    def consume(index):
        try:
            services[index].use(1, entitlement.id, booking)
            return "used"
        except ReplacementEntitlementInvalidStateError:
            return "already_used"
        finally:
            sessions[index].release_row_lock()

    with ThreadPoolExecutor(max_workers=2) as executor:
        outcomes = list(executor.map(consume, range(2)))

    assert sorted(outcomes) == ["already_used", "used"]
    replacement_appointments = [
        item
        for item in appointment_repo.items.values()
        if getattr(item, "replacement_entitlement_id", None) == entitlement.id
    ]
    assert len(replacement_appointments) == 1


def test_expired_and_no_show_sources_cannot_generate_replacement_cycles():
    replacement_service, repo = service(source(status=AppointmentStatus.no_show))
    with pytest.raises(ReplacementEntitlementIneligibleError):
        replacement_service.grant_for_appointment(
            1, 10, ReplacementEntitlementReason.manual
        )

    replacement_service, repo = service()
    entitlement = replacement_service.grant_for_appointment(
        1, 10, ReplacementEntitlementReason.manual
    )
    repo.items[entitlement.id].expires_at = datetime.now(timezone.utc) - timedelta(seconds=1)
    with pytest.raises(ReplacementEntitlementExpiredError):
        replacement_service.use(
            1,
            entitlement.id,
            ReplacementBookingCreate(
                start_datetime=datetime.now(timezone.utc) + timedelta(days=4)
            ),
        )
    assert repo.items[entitlement.id].status == ReplacementEntitlementStatus.expired


def test_repository_and_locking_queries_are_business_scoped():
    source_text = open("src/repositories/replacement_entitlement_repo.py", encoding="utf-8").read()

    assert source_text.count("ReplacementEntitlement.business_id == business_id") >= 4
    assert source_text.count("with_for_update") >= 3
