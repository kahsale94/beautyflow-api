from datetime import datetime, timezone

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from src.core import DataBaseDep
from src.models import Professional
from src.repositories import AppointmentRepository, ProfessionalRepository
from src.utils import normalize_text, normalize_phone
from src.schemas import ProfessionalCreate, ProfessionalUpdate
from src.services.redis_cache_invalidator import RedisCacheInvalidator
from src.services.scheduling_lock import acquire_schedule_lock

class ProfessionalNotFoundError(Exception):
    pass

class ProfessionalAlreadyExistsError(Exception):
    pass

class ProfessionalCapacityConflictError(Exception):
    pass

class ProfessionalService:

    def __init__(
        self,
        db: Session,
        professional_repo: ProfessionalRepository,
        cache_invalidator: RedisCacheInvalidator | None = None,
        appointment_repo: AppointmentRepository | None = None,
    ):
        self.db = db
        self.professional_repo = professional_repo
        self.cache_invalidator = cache_invalidator or RedisCacheInvalidator()
        self.appointment_repo = appointment_repo or AppointmentRepository()

    def _repack_future_capacity(self, business_id: int, professional: Professional, new_capacity: int) -> None:
        acquire_schedule_lock(self.db, business_id, professional.id)
        appointments = self.appointment_repo.get_future_scheduled_by_professional(
            self.db,
            business_id,
            professional.id,
            datetime.now(timezone.utc),
        )
        lanes: list[list] = [[] for _ in range(new_capacity)]
        for appointment in appointments:
            assigned_lane = None
            for index, lane_items in enumerate(lanes, start=1):
                if all(
                    existing.end_datetime <= appointment.start_datetime
                    or existing.start_datetime >= appointment.end_datetime
                    for existing in lane_items
                ):
                    assigned_lane = index
                    lane_items.append(appointment)
                    break
            if assigned_lane is None:
                raise ProfessionalCapacityConflictError()
            appointment.capacity_slot = assigned_lane

    def _get_valid(self, business_id: int, professional_id: int) -> Professional:
        professional = self.professional_repo.get_by_id(self.db, business_id, professional_id)
        if (
            not professional
            or not professional.is_active
            or professional.business_id != business_id
        ):
            raise ProfessionalNotFoundError()

        return professional

    def get_all(self, business_id: int):
        result = self.professional_repo.get_by_business(self.db, business_id)
        if (
            not all(item.is_active for item in result)
            or not all(item.business_id == business_id for item in result)
        ):
            raise ProfessionalNotFoundError()

        return result

    def get_by_id(self, business_id: int, professional_id: int):
        return self._get_valid(business_id, professional_id)

    def get_by_name(self, business_id: int, professional_name: str):
        normalized_name = normalize_text(professional_name)

        result = self.professional_repo.get_by_name(self.db, business_id, normalized_name)
        if (
            not all(item.is_active for item in result)
            or not all(item.business_id == business_id for item in result)
        ):
            raise ProfessionalNotFoundError()

        return result

    def create(self, business_id: int, data: ProfessionalCreate):
        phone = normalize_phone(data.phone)
        name = normalize_text(data.name)

        professional = Professional(
            business_id = business_id,
            name = data.name,
            email = str(data.email),
            phone = phone,
            normalized_name = name,
            simultaneous_capacity = data.simultaneous_capacity,
        )

        self.professional_repo.add(self.db, professional)

        try:
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
            raise ProfessionalAlreadyExistsError()

        self.cache_invalidator.invalidate_professional_context(professional.id)
        self.db.refresh(professional)

        return professional

    def update(self, business_id: int, professional_id: int, data: ProfessionalUpdate):
        professional = self._get_valid(business_id, professional_id)

        update_data = data.model_dump(exclude_unset=True)

        new_capacity = update_data.get("simultaneous_capacity")
        if new_capacity is not None and new_capacity < professional.simultaneous_capacity:
            self._repack_future_capacity(business_id, professional, new_capacity)

        if "email" in update_data and update_data["email"] is not None:
            update_data["email"] = str(update_data["email"])

        if "phone" in update_data and update_data["phone"] is not None:
            update_data["phone"] = normalize_phone(update_data["phone"])
            
        for field, value in update_data.items():
            setattr(professional, field, value)

        if "name" in update_data:
            professional.normalized_name = normalize_text(update_data["name"])

        try:
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
            raise ProfessionalAlreadyExistsError()

        self.cache_invalidator.invalidate_professional_context(professional_id)
        self.db.refresh(professional)

        return professional

    def deactivate(self, business_id: int, professional_id: int):
        professional = self._get_valid(business_id, professional_id)

        professional.is_active = False

        self.db.commit()
        self.cache_invalidator.invalidate_professional_context(professional_id)

        return

    def delete(self, business_id: int, professional_id: int):
        return self.deactivate(business_id, professional_id)


def get_professional_service(db: DataBaseDep):
    return ProfessionalService(
        db,
        ProfessionalRepository(),
        RedisCacheInvalidator(),
        AppointmentRepository(),
    )
