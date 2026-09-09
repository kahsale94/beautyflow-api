from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from src.core import DataBaseDep
from src.models import AppointmentKind, RecurringSchedule
from src.models.appointment_model import AppointmentStatus
from src.models.business_feature_model import BusinessFeatureKey
from src.models.recurring_schedule_model import RecurringScheduleStatus
from src.repositories import (
    BusinessRepository,
    ClientRepository,
    RecurringScheduleRepository,
    ServiceRepository,
)
from src.schemas import AppointmentCreate
from src.schemas.recurring_schedule_schema import (
    RecurringMaterializationConflict,
    RecurringMaterializationResponse,
    RecurringMaterializationSweepResponse,
    RecurringScheduleCreate,
    RecurringScheduleResponse,
    RecurringScheduleUpdate,
)
from src.services.appointment_service import (
    AppointmentBlockedByScheduleBlockError,
    AppointmentInvalidSlotIntervalError,
    AppointmentMaximumScheduleWindowError,
    AppointmentMinimumNoticeError,
    AppointmentService,
    AppointmentTimeConflictError,
    BusinessNotAvailableForBookingError,
    ClientNotFoundError,
    DatetimeFormatError,
    InvalidBusinessTimezoneError,
    ProfessionalNotAvailableError,
    ProfessionalServiceMismatchError,
    ServiceNotAvailableError,
    get_appointment_service,
)
from src.services.business_feature_service import BusinessFeatureService, get_business_feature_service


class RecurringScheduleNotFoundError(Exception):
    pass


class RecurringScheduleFeatureDisabledError(Exception):
    pass


class RecurringScheduleInvalidStateError(Exception):
    pass


class RecurringScheduleRelatedEntityError(Exception):
    pass


class RecurringScheduleService:
    WEEKDAYS = (
        "segunda-feira",
        "terça-feira",
        "quarta-feira",
        "quinta-feira",
        "sexta-feira",
        "sábado",
        "domingo",
    )

    def __init__(
        self,
        db: Session,
        recurring_repo: RecurringScheduleRepository,
        business_repo: BusinessRepository,
        client_repo: ClientRepository,
        service_repo: ServiceRepository,
        feature_service: BusinessFeatureService,
        appointment_service: AppointmentService,
    ):
        self.db = db
        self.recurring_repo = recurring_repo
        self.business_repo = business_repo
        self.client_repo = client_repo
        self.service_repo = service_repo
        self.feature_service = feature_service
        self.appointment_service = appointment_service

    def _require_feature(self, business_id: int) -> None:
        if not self.feature_service.is_enabled(business_id, BusinessFeatureKey.recurring_schedules):
            raise RecurringScheduleFeatureDisabledError()

    def _get_business(self, business_id: int):
        business = self.business_repo.get_by_id(self.db, business_id)
        if not business or business.id != business_id or not business.is_active:
            raise RecurringScheduleNotFoundError()
        return business

    def _validate_related(self, business_id: int, client_id: int, service_id: int) -> None:
        client = self.client_repo.get_by_id(self.db, business_id, client_id)
        service = self.service_repo.get_by_id(self.db, business_id, service_id)
        if (
            not client
            or not client.is_active
            or client.business_id != business_id
            or not service
            or not service.is_active
            or service.business_id != business_id
        ):
            raise RecurringScheduleRelatedEntityError()

    def _get_series(self, business_id: int, series_id: int, *, for_update: bool = False):
        series = self.recurring_repo.get_by_id(self.db, business_id, series_id, for_update=for_update)
        if not series or series.business_id != business_id:
            raise RecurringScheduleNotFoundError()
        return series

    def _response(self, series: RecurringSchedule) -> RecurringScheduleResponse:
        return RecurringScheduleResponse(
            id=series.id,
            business_id=series.business_id,
            client_id=series.client_id,
            service_id=series.service_id,
            weekday=series.weekday,
            weekday_name=self.WEEKDAYS[series.weekday],
            start_time=series.start_time,
            effective_from=series.effective_from,
            effective_until=series.effective_until,
            status=series.status,
            last_materialized_at=series.last_materialized_at,
            last_materialization_error=series.last_materialization_error,
            created_at=series.created_at,
            updated_at=series.updated_at,
        )

    def list(
        self,
        business_id: int,
        *,
        client_id: int | None = None,
        status: RecurringScheduleStatus | None = None,
    ) -> list[RecurringScheduleResponse]:
        self._require_feature(business_id)
        self._get_business(business_id)
        return [
            self._response(item)
            for item in self.recurring_repo.get_by_business(
                self.db, business_id, client_id=client_id, status=status
            )
        ]

    def get(self, business_id: int, series_id: int) -> RecurringScheduleResponse:
        self._require_feature(business_id)
        return self._response(self._get_series(business_id, series_id))

    def create(self, business_id: int, data: RecurringScheduleCreate) -> RecurringScheduleResponse:
        self._require_feature(business_id)
        self._get_business(business_id)
        self._validate_related(business_id, data.client_id, data.service_id)
        series = RecurringSchedule(
            business_id=business_id,
            client_id=data.client_id,
            service_id=data.service_id,
            weekday=data.weekday,
            start_time=data.start_time,
            effective_from=data.effective_from,
            effective_until=data.effective_until,
            status=RecurringScheduleStatus.active,
        )
        self.recurring_repo.add(self.db, series)
        self.db.commit()
        self.db.refresh(series)
        self.materialize(business_id, series.id)
        self.db.refresh(series)
        return self._response(series)

    def _cancel_future_occurrences(self, business_id: int, series_id: int) -> None:
        now = datetime.now(timezone.utc)
        for appointment in self.recurring_repo.get_future_scheduled_occurrences(
            self.db, business_id, series_id, now
        ):
            appointment.status = AppointmentStatus.canceled
            self.appointment_service._skip_pending_reminders(
                appointment.id, reason="recurring_schedule_changed"
            )

    def update(
        self,
        business_id: int,
        series_id: int,
        data: RecurringScheduleUpdate,
    ) -> RecurringScheduleResponse:
        self._require_feature(business_id)
        series = self._get_series(business_id, series_id, for_update=True)
        if series.status == RecurringScheduleStatus.canceled:
            raise RecurringScheduleInvalidStateError()
        update_data = data.model_dump(exclude_unset=True)
        final_client = update_data.get("client_id", series.client_id)
        final_service = update_data.get("service_id", series.service_id)
        self._validate_related(business_id, final_client, final_service)
        final_from = update_data.get("effective_from", series.effective_from)
        final_until = update_data.get("effective_until", series.effective_until)
        if final_until is not None and final_until < final_from:
            raise ValueError("Vigência final anterior à vigência inicial.")

        self._cancel_future_occurrences(business_id, series_id)
        for field, value in update_data.items():
            setattr(series, field, value)
        self.db.commit()
        self.materialize(business_id, series_id)
        series = self._get_series(business_id, series_id)
        return self._response(series)

    def pause(self, business_id: int, series_id: int) -> RecurringScheduleResponse:
        self._require_feature(business_id)
        series = self._get_series(business_id, series_id, for_update=True)
        if series.status != RecurringScheduleStatus.active:
            raise RecurringScheduleInvalidStateError()
        series.status = RecurringScheduleStatus.paused
        self.db.commit()
        return self._response(series)

    def resume(self, business_id: int, series_id: int) -> RecurringScheduleResponse:
        self._require_feature(business_id)
        series = self._get_series(business_id, series_id, for_update=True)
        if series.status != RecurringScheduleStatus.paused:
            raise RecurringScheduleInvalidStateError()
        series.status = RecurringScheduleStatus.active
        self.db.commit()
        self.materialize(business_id, series_id)
        return self._response(self._get_series(business_id, series_id))

    def cancel(self, business_id: int, series_id: int) -> RecurringScheduleResponse:
        self._require_feature(business_id)
        series = self._get_series(business_id, series_id, for_update=True)
        if series.status == RecurringScheduleStatus.canceled:
            raise RecurringScheduleInvalidStateError()
        self._cancel_future_occurrences(business_id, series_id)
        series.status = RecurringScheduleStatus.canceled
        self.db.commit()
        return self._response(series)

    def _occurrence_dates(self, series: RecurringSchedule, business) -> list[date]:
        today = datetime.now(ZoneInfo(business.timezone)).date()
        start = max(today, series.effective_from)
        end = today + timedelta(days=business.maximum_schedule_days or 30)
        if series.effective_until is not None:
            end = min(end, series.effective_until)
        if start > end:
            return []
        offset = (series.weekday - start.weekday()) % 7
        current = start + timedelta(days=offset)
        dates = []
        while current <= end:
            dates.append(current)
            current += timedelta(days=7)
        return dates

    def materialize(self, business_id: int, series_id: int) -> RecurringMaterializationResponse:
        self._require_feature(business_id)
        business = self._get_business(business_id)
        series = self._get_series(business_id, series_id)
        if series.status != RecurringScheduleStatus.active:
            raise RecurringScheduleInvalidStateError()
        tz = ZoneInfo(business.timezone)
        created = 0
        skipped = 0
        conflicts: list[RecurringMaterializationConflict] = []

        for occurrence_date in self._occurrence_dates(series, business):
            occurrence_start = datetime.combine(occurrence_date, series.start_time).replace(tzinfo=tz)
            if self.recurring_repo.get_occurrence(
                self.db, business_id, series.id, occurrence_start
            ):
                skipped += 1
                continue
            try:
                self.appointment_service.create(
                    business_id,
                    AppointmentCreate(
                        client_id=series.client_id,
                        service_id=series.service_id,
                        start_datetime=occurrence_start,
                        kind=AppointmentKind.standard,
                    ),
                    series_id=series.id,
                    occurrence_start=occurrence_start,
                    force_automatic=True,
                )
                created += 1
            except IntegrityError:
                self.db.rollback()
                if self.recurring_repo.get_occurrence(
                    self.db, business_id, series.id, occurrence_start
                ):
                    skipped += 1
                    continue
                conflicts.append(
                    RecurringMaterializationConflict(
                        occurrence_start=occurrence_start,
                        reason="database_conflict",
                    )
                )
            except (
                AppointmentTimeConflictError,
                AppointmentBlockedByScheduleBlockError,
                AppointmentInvalidSlotIntervalError,
                AppointmentMaximumScheduleWindowError,
                AppointmentMinimumNoticeError,
                BusinessNotAvailableForBookingError,
                ClientNotFoundError,
                DatetimeFormatError,
                InvalidBusinessTimezoneError,
                ProfessionalNotAvailableError,
                ProfessionalServiceMismatchError,
                ServiceNotAvailableError,
                ValueError,
            ) as exc:
                self.db.rollback()
                reason = (
                    "capacity_or_schedule_block_conflict"
                    if isinstance(
                        exc,
                        (
                            AppointmentTimeConflictError,
                            AppointmentBlockedByScheduleBlockError,
                            ProfessionalNotAvailableError,
                        ),
                    )
                    else "scheduling_rule_conflict"
                )
                conflicts.append(
                    RecurringMaterializationConflict(
                        occurrence_start=occurrence_start,
                        reason=reason,
                    )
                )

        series = self._get_series(business_id, series_id, for_update=True)
        series.last_materialized_at = datetime.now(timezone.utc)
        if len(conflicts) == 1:
            series.last_materialization_error = (
                "1 ocorrência não pôde ser criada; revise agenda, disponibilidade e capacidade."
            )
        elif conflicts:
            series.last_materialization_error = (
                f"{len(conflicts)} ocorrências não puderam ser criadas; revise agenda, disponibilidade e capacidade."
            )
        else:
            series.last_materialization_error = None
        self.db.commit()
        return RecurringMaterializationResponse(
            series_id=series_id,
            created=created,
            skipped_existing=skipped,
            conflicts=conflicts,
        )

    def materialize_due_for_integration(
        self, integration_id: int
    ) -> RecurringMaterializationSweepResponse:
        businesses = self.business_repo.get_by_integration(self.db, integration_id)
        series_processed = 0
        created = 0
        skipped_existing = 0
        conflicts = 0

        for business in businesses:
            if not self.feature_service.is_enabled(
                business.id, BusinessFeatureKey.recurring_schedules
            ):
                continue
            active_series = self.recurring_repo.get_by_business(
                self.db,
                business.id,
                status=RecurringScheduleStatus.active,
            )
            for series in active_series:
                result = self.materialize(business.id, series.id)
                series_processed += 1
                created += result.created
                skipped_existing += result.skipped_existing
                conflicts += len(result.conflicts)

        return RecurringMaterializationSweepResponse(
            businesses_scanned=len(businesses),
            series_processed=series_processed,
            created=created,
            skipped_existing=skipped_existing,
            conflicts=conflicts,
        )


def get_recurring_schedule_service(db: DataBaseDep):
    return RecurringScheduleService(
        db,
        RecurringScheduleRepository(),
        BusinessRepository(),
        ClientRepository(),
        ServiceRepository(),
        get_business_feature_service(db),
        get_appointment_service(db),
    )
