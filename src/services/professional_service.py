from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from src.core import DataBaseDep
from src.models import Professional
from src.utils import normalize_text
from src.repositories import ProfessionalRepository
from src.schemas import ProfessionalCreate, ProfessionalUpdate

class ProfessionalNotFoundError(Exception):
    pass

class ProfessionalAlreadyExistsError(Exception):
    pass

class ProfessionalService:

    def __init__(
        self,
        db: Session,
        professional_repo: ProfessionalRepository,
    ):
        self.db = db
        self.professional_repo = professional_repo

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
            not result
            or not all(item.is_active for item in result)
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
            not result
            or not all(item.is_active for item in result)
            or not all(item.business_id == business_id for item in result)
        ):
            raise ProfessionalNotFoundError()

        return result

    def create(self, business_id: int, data: ProfessionalCreate):
        professional = Professional(
            business_id=business_id,
            name=data.name,
            normalized_name=normalize_text(data.name),
        )

        self.professional_repo.add(self.db, professional)

        try:
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
            raise ProfessionalAlreadyExistsError()

        self.db.refresh(professional)

        return professional

    def update(self, business_id: int, professional_id: int, data: ProfessionalUpdate):
        professional = self._get_valid(business_id, professional_id)

        update_data = data.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            setattr(professional, field, value)

        if "name" in update_data:
            professional.normalized_name = normalize_text(update_data["name"])

        try:
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
            raise ProfessionalAlreadyExistsError()

        self.db.refresh(professional)

        return professional

    def deactivate(self, business_id: int, professional_id: int):
        professional = self._get_valid(business_id, professional_id)

        professional.is_active = False

        self.db.commit()

        return

    def delete(self, business_id: int, professional_id: int):
        professional = self._get_valid(business_id, professional_id)

        self.professional_repo.delete(self.db, professional)
        self.db.commit()

        return


def get_professional_service(db: DataBaseDep):
    return ProfessionalService(
        db,
        ProfessionalRepository(),
    )
