
import re

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from src.core import DataBaseDep
from src.clients import CepLookupError, lookup_cep
from src.models import Business, BusinessOpeningHour
from src.utils import normalize_phone, normalize_text
from src.schemas import BusinessCreate, BusinessUpdate
from src.repositories import AppointmentReminderRepository, BusinessRepository
from src.services.appointment_reminder_service import AppointmentReminderService
from src.services.redis_cache_invalidator import RedisCacheInvalidator

class BusinessNotFoundError(Exception):
    pass

class BusinessAlreadyExistsError(Exception):
    pass

class BusinessService:
    MAX_SLUG_LENGTH = 80

    def __init__(
        self,
        db: Session,
        business_repo: BusinessRepository,
        appointment_reminder_service: AppointmentReminderService | None = None,
        cache_invalidator: RedisCacheInvalidator | None = None,
    ):
        self.db = db
        self.business_repo = business_repo
        self.appointment_reminder_service = appointment_reminder_service
        self.cache_invalidator = cache_invalidator or RedisCacheInvalidator()

    def _get_valid(self, business_id: int):
        business = self.business_repo.get_by_id(self.db, business_id)
        if (
            not business
            or not business.is_active
        ):
            raise BusinessNotFoundError()

        return business

    def get_all(self):
        result = self.business_repo.get_all(self.db)
        if (
            not all(item.is_active for item in result)
        ):
            raise BusinessNotFoundError()

        return result

    def get_by_slug(self, business_name: str):
        result = self.business_repo.get_by_slug(self.db, business_name)

        return result

    def get_by_id(self, business_id: int):
        return self._get_valid(business_id)

    @classmethod
    def _slugify(cls, value: str) -> str:
        normalized = normalize_text(value)
        slug = re.sub(r"[^a-z0-9]+", "-", normalized)
        slug = re.sub(r"-+", "-", slug).strip("-")
        return slug[:cls.MAX_SLUG_LENGTH].strip("-") or "empresa"

    @classmethod
    def _slug_with_suffix(cls, base_slug: str, suffix: int) -> str:
        suffix_text = f"-{suffix}"
        max_base_length = cls.MAX_SLUG_LENGTH - len(suffix_text)
        return f"{base_slug[:max_base_length].rstrip('-')}{suffix_text}"

    def _generate_unique_slug(self, preferred_slug: str) -> str:
        base_slug = self._slugify(preferred_slug)
        candidate = base_slug
        suffix = 2

        while self.business_repo.get_by_exact_slug(self.db, candidate):
            candidate = self._slug_with_suffix(base_slug, suffix)
            suffix += 1

        return candidate

    def _normalize_opening_hour_items(self, items):
        normalized = []
        weekdays = set()

        for item in items or []:
            weekday = item.get("weekday") if isinstance(item, dict) else item.weekday
            start_time = item.get("start_time") if isinstance(item, dict) else item.start_time
            end_time = item.get("end_time") if isinstance(item, dict) else item.end_time

            if weekday in weekdays:
                raise ValueError("Dia duplicado no horário de funcionamento.")

            if start_time >= end_time:
                raise ValueError("Horário inicial deve ser menor que o horário final.")

            weekdays.add(weekday)
            normalized.append(
                {
                    "weekday": weekday,
                    "start_time": start_time,
                    "end_time": end_time,
                }
            )

        return sorted(normalized, key=lambda item: item["weekday"])

    def _replace_opening_hours(self, business, items) -> None:
        opening_hours = self._normalize_opening_hour_items(items)
        opening_hours_by_weekday = {item["weekday"]: item for item in opening_hours}
        current_items = list(getattr(business, "opening_hours", []) or [])
        current_by_weekday = {item.weekday: item for item in current_items}

        for weekday, current in current_by_weekday.items():
            if weekday not in opening_hours_by_weekday:
                business.opening_hours.remove(current)

        for item in opening_hours:
            current = current_by_weekday.get(item["weekday"])
            if current:
                current.start_time = item["start_time"]
                current.end_time = item["end_time"]
            else:
                business.opening_hours.append(
                    BusinessOpeningHour(
                        weekday=item["weekday"],
                        start_time=item["start_time"],
                        end_time=item["end_time"],
                    )
                )

    def _validate_cep_if_present(self, cep: str | None) -> None:
        if not cep:
            return

        try:
            lookup_cep(cep)
        except CepLookupError as exc:
            raise ValueError(str(exc) or "CEP inválido.") from exc

    def create(self, data: BusinessCreate):
        if not data.phone:
            raise ValueError("Telefone da empresa é obrigatório")

        phone = normalize_phone(data.phone)
        slug = data.slug or self._generate_unique_slug(data.name)
        opening_hours = self._normalize_opening_hour_items(data.opening_hours)
        self._validate_cep_if_present(data.cep)

        business = Business(
            name = data.name,
            slug = slug,
            type = data.type,
            attendance_plan = data.attendance_plan,
            timezone = data.timezone,
            phone = phone,
            email = str(data.email) if data.email else None,
            address = data.address,
            city = data.city,
            state = data.state,
            description = data.description,
            booking_enabled = data.booking_enabled,
            slot_interval_minutes = data.slot_interval_minutes,
            minimum_notice_minutes = data.minimum_notice_minutes,
            maximum_schedule_days = data.maximum_schedule_days,
            allow_client_cancel = data.allow_client_cancel,
            cancel_limit_hours = data.cancel_limit_hours,
            appointment_confirmation_required = data.appointment_confirmation_required,
        )
        business.opening_hours = [
            BusinessOpeningHour(
                weekday=item["weekday"],
                start_time=item["start_time"],
                end_time=item["end_time"],
            )
            for item in opening_hours
        ]

        self.business_repo.add(self.db, business)

        try:
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
            raise BusinessAlreadyExistsError()

        self.db.refresh(business)
        self.cache_invalidator.invalidate_business_context(business.phone)

        return business

    def update(self, business_id: int, data: BusinessUpdate):
        business = self._get_valid(business_id)
        previous_phone = getattr(business, "phone", None)

        update_data = data.model_dump(exclude_unset=True)
        opening_hours = update_data.pop("opening_hours", None)
        cep = update_data.pop("cep", None)
        previous_cancel_limit_hours = getattr(business, "cancel_limit_hours", None)

        self._validate_cep_if_present(cep)

        if update_data.get("slug") is None:
            update_data.pop("slug", None)

        if not business.slug and "slug" not in update_data:
            update_data["slug"] = self._generate_unique_slug(
                update_data.get("name") or business.name
            )

        if "email" in update_data and update_data["email"] is not None:
            update_data["email"] = str(update_data["email"])

        if "phone" in update_data and update_data["phone"] is not None:
            update_data["phone"] = normalize_phone(update_data["phone"])

        for field, value in update_data.items():
            setattr(business, field, value)

        if opening_hours is not None:
            self._replace_opening_hours(business, opening_hours)

        if (
            "cancel_limit_hours" in update_data
            and update_data["cancel_limit_hours"] != previous_cancel_limit_hours
            and self.appointment_reminder_service
        ):
            self.appointment_reminder_service.recalculate_pending_for_business(business)

        try:
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
            raise BusinessAlreadyExistsError()

        self.db.refresh(business)
        if previous_phone:
            self.cache_invalidator.invalidate_business_context(previous_phone)

        current_phone = getattr(business, "phone", None)
        if current_phone and current_phone != previous_phone:
            self.cache_invalidator.invalidate_business_context(current_phone)

        return business

    def deactivate(self, business_id: int):
        business = self._get_valid(business_id)
        previous_phone = getattr(business, "phone", None)

        business.is_active = False

        self.db.commit()
        if previous_phone:
            self.cache_invalidator.invalidate_business_context(previous_phone)

        return

    def delete(self, business_id: int):
        return self.deactivate(business_id)

def get_business_service(db: DataBaseDep):
    return BusinessService(
        db,
        BusinessRepository(),
        AppointmentReminderService(db, AppointmentReminderRepository()),
        RedisCacheInvalidator(),
    )
