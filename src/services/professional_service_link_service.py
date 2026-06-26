from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from src.core import DataBaseDep
from src.models import ProfessionalService
from src.repositories import ProfessionalRepository, ServiceRepository, ProfessionalServiceRepository
from src.schemas import ProfessionalServiceCreate
from src.services.redis_cache_invalidator import RedisCacheInvalidator

class ProfessionalServiceLinkNotFoundError(Exception):
    pass

class ProfessionalServiceLinkAlreadyExistsError(Exception):
    pass

class ProfessionalServiceLinkInvalidBusinessError(Exception):
    pass

class ProfessionalServiceLinkService:
    def __init__(
        self,
        db: Session,
        professional_repo: ProfessionalRepository,
        service_repo: ServiceRepository,
        professional_service_repo: ProfessionalServiceRepository,
        cache_invalidator: RedisCacheInvalidator | None = None,
    ):
        self.db = db
        self.professional_repo = professional_repo
        self.service_repo = service_repo
        self.professional_service_repo = professional_service_repo
        self.cache_invalidator = cache_invalidator or RedisCacheInvalidator()

    def _validate_professional_and_service(self, business_id: int, professional_id: int, service_id: int):
        professional = self.professional_repo.get_by_id(self.db, business_id, professional_id)
        service = self.service_repo.get_by_id(self.db, business_id, service_id)

        if (
            not professional
            or not professional.is_active
            or professional.business_id != business_id
        ):
            raise ProfessionalServiceLinkInvalidBusinessError()

        if (
            not service
            or not service.is_active
            or service.business_id != business_id
        ):
            raise ProfessionalServiceLinkInvalidBusinessError()

        return professional, service

    def professional_can_perform_service(self, business_id: int, professional_id: int, service_id: int) -> bool:
        self._validate_professional_and_service(business_id, professional_id, service_id)
        link = self.professional_service_repo.get_by_ids(self.db, professional_id, service_id)
        return link is not None

    def get_by_professional(self, business_id: int, professional_id: int):
        professional = self.professional_repo.get_by_id(self.db, business_id, professional_id)
        if (
            not professional
            or not professional.is_active
            or professional.business_id != business_id
        ):
            raise ProfessionalServiceLinkInvalidBusinessError()

        return self.professional_service_repo.get_by_professional(self.db, professional_id)

    def get_by_service(self, business_id: int, service_id: int):
        service = self.service_repo.get_by_id(self.db, business_id, service_id)
        if (
            not service
            or not service.is_active
            or service.business_id != business_id
        ):
            raise ProfessionalServiceLinkInvalidBusinessError()

        return self.professional_service_repo.get_by_service(self.db, service_id)

    def create(self, business_id: int, data: ProfessionalServiceCreate):
        self._validate_professional_and_service(
            business_id,
            data.professional_id,
            data.service_id,
        )

        professional_service = ProfessionalService(
            professional_id=data.professional_id,
            service_id=data.service_id,
        )

        self.professional_service_repo.add(self.db, professional_service)

        try:
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
            raise ProfessionalServiceLinkAlreadyExistsError()

        self.db.refresh(professional_service)
        self.cache_invalidator.invalidate_professional_context()
        self.cache_invalidator.invalidate_service_context()

        return professional_service

    def delete(self, business_id: int, professional_id: int, service_id: int):
        self._validate_professional_and_service(business_id, professional_id, service_id)

        professional_service = self.professional_service_repo.get_by_ids(
            self.db,
            professional_id,
            service_id,
        )

        if not professional_service:
            raise ProfessionalServiceLinkNotFoundError()

        self.professional_service_repo.delete(self.db, professional_service)
        self.db.commit()
        self.cache_invalidator.invalidate_professional_context()
        self.cache_invalidator.invalidate_service_context()

        return

def get_professional_service_link_service(db: DataBaseDep):
    return ProfessionalServiceLinkService(
        db,
        ProfessionalRepository(),
        ServiceRepository(),
        ProfessionalServiceRepository(),
        RedisCacheInvalidator(),
    )
