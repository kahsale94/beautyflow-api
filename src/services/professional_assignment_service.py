from dataclasses import dataclass
from datetime import datetime
from fractions import Fraction

from sqlalchemy.orm import Session

from src.repositories import (
    AppointmentRepository,
    AvailabilityRepository,
    ProfessionalRepository,
    ScheduleBlockRepository,
)
from src.services.scheduling_lock import acquire_schedule_locks


@dataclass(frozen=True)
class ProfessionalCapacityCandidate:
    professional_id: int
    capacity: int
    occupied: int
    available_slots: tuple[int, ...]

    @property
    def remaining(self) -> int:
        return len(self.available_slots)

    @property
    def relative_occupancy(self) -> Fraction:
        return Fraction(self.occupied, self.capacity)


@dataclass(frozen=True)
class CapacitySnapshot:
    total_capacity: int
    occupied: int
    remaining_capacity: int
    professionals: tuple[ProfessionalCapacityCandidate, ...]


@dataclass(frozen=True)
class ProfessionalAssignment:
    professional_id: int
    capacity_slot: int
    snapshot: CapacitySnapshot


class NoProfessionalCapacityError(Exception):
    pass


class ProfessionalAssignmentService:
    def __init__(
        self,
        db: Session,
        professional_repo: ProfessionalRepository,
        availability_repo: AvailabilityRepository,
        appointment_repo: AppointmentRepository,
        schedule_block_repo: ScheduleBlockRepository,
    ):
        self.db = db
        self.professional_repo = professional_repo
        self.availability_repo = availability_repo
        self.appointment_repo = appointment_repo
        self.schedule_block_repo = schedule_block_repo

    def _eligible_professionals(
        self,
        business_id: int,
        service_id: int,
        professional_ids: set[int] | None = None,
        excluded_professional_ids: set[int] | None = None,
    ):
        professionals = self.professional_repo.get_eligible_for_service(
            self.db,
            business_id,
            service_id,
        )
        excluded = excluded_professional_ids or set()
        return [
            professional
            for professional in professionals
            if professional.business_id == business_id
            and professional.is_active
            and professional.id not in excluded
            and (professional_ids is None or professional.id in professional_ids)
        ]

    def snapshot(
        self,
        business_id: int,
        service_id: int,
        start_datetime: datetime,
        end_datetime: datetime,
        *,
        use_configured_capacity: bool,
        professional_ids: set[int] | None = None,
        excluded_professional_ids: set[int] | None = None,
        exclude_appointment_id: int | None = None,
    ) -> CapacitySnapshot:
        candidates: list[ProfessionalCapacityCandidate] = []
        for professional in self._eligible_professionals(
            business_id,
            service_id,
            professional_ids,
            excluded_professional_ids,
        ):
            availability = self.availability_repo.get_by_professional_and_weekday(
                self.db,
                professional.id,
                start_datetime.weekday(),
            )
            if not availability:
                continue
            local_start = start_datetime.astimezone(start_datetime.tzinfo)
            local_end = end_datetime.astimezone(start_datetime.tzinfo)
            if local_end.date() != local_start.date():
                continue
            if not (
                availability.start_time <= local_start.time()
                and local_end.time() <= availability.end_time
            ):
                continue
            if self.schedule_block_repo.get_active_by_professional_period(
                self.db,
                business_id,
                professional.id,
                start_datetime,
                end_datetime,
            ):
                continue

            appointments = self.appointment_repo.get_scheduled_overlapping(
                self.db,
                business_id,
                professional.id,
                start_datetime,
                end_datetime,
            )
            if exclude_appointment_id is not None:
                appointments = [item for item in appointments if item.id != exclude_appointment_id]

            capacity = professional.simultaneous_capacity if use_configured_capacity else 1
            occupied_slots = {
                int(getattr(item, "capacity_slot", 1) or 1)
                for item in appointments
                if int(getattr(item, "capacity_slot", 1) or 1) <= capacity
            }
            available_slots = tuple(slot for slot in range(1, capacity + 1) if slot not in occupied_slots)
            candidates.append(
                ProfessionalCapacityCandidate(
                    professional_id=professional.id,
                    capacity=capacity,
                    occupied=len(appointments),
                    available_slots=available_slots,
                )
            )

        total_capacity = sum(item.capacity for item in candidates)
        occupied = sum(item.occupied for item in candidates)
        remaining = sum(item.remaining for item in candidates)
        return CapacitySnapshot(
            total_capacity=total_capacity,
            occupied=occupied,
            remaining_capacity=remaining,
            professionals=tuple(candidates),
        )

    def assign(
        self,
        business_id: int,
        service_id: int,
        start_datetime: datetime,
        end_datetime: datetime,
        *,
        use_configured_capacity: bool,
        professional_ids: set[int] | None = None,
        excluded_professional_ids: set[int] | None = None,
        exclude_appointment_id: int | None = None,
        locks_already_acquired: bool = False,
    ) -> ProfessionalAssignment:
        eligible = self._eligible_professionals(
            business_id,
            service_id,
            professional_ids,
            excluded_professional_ids,
        )
        if not locks_already_acquired:
            acquire_schedule_locks(self.db, business_id, [item.id for item in eligible])

        snapshot = self.snapshot(
            business_id,
            service_id,
            start_datetime,
            end_datetime,
            use_configured_capacity=use_configured_capacity,
            professional_ids=professional_ids,
            excluded_professional_ids=excluded_professional_ids,
            exclude_appointment_id=exclude_appointment_id,
        )
        available = [item for item in snapshot.professionals if item.available_slots]
        if not available:
            raise NoProfessionalCapacityError()

        selected = min(
            available,
            key=lambda item: (item.relative_occupancy, item.professional_id),
        )
        return ProfessionalAssignment(
            professional_id=selected.professional_id,
            capacity_slot=selected.available_slots[0],
            snapshot=snapshot,
        )
