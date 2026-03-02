from sqlalchemy.orm import Session

from src.core import DataBaseDep
from src.models import Professional
from src.schemas import ProfessionalCreate, ProfessionalUpdate
from src.repositories import ProfessionalRepository, BusinessRepository

class ProfessionalNotFoundError(Exception):
    pass

class ProfessionalService:

    def __init__(
        self,
        db: Session,
        business_repo: BusinessRepository,
        professional_repo: ProfessionalRepository,
    ):
        self.db = db
        self.business_repo = business_repo
        self.professional_repo = professional_repo

    def create_professional(self, business_id: int, data: ProfessionalCreate):
        professional = Professional(
            business_id = business_id,
            name = data.name,
        )

        self.professional_repo.add(self.db, professional)

        self.db.commit()
        self.db.refresh(professional)

        return professional

    def get_professional(self, business_id: int, professional_id: int | None = None):
        if professional_id is None:
            return self.professional_repo.get_by_business(self.db, business_id)

        professional = self.professional_repo.get_by_id(self.db, professional_id)
        if not professional or professional.business_id != business_id:
            raise ProfessionalNotFoundError()

        return professional

    def update_professional(self, business_id: int, professional_id: int, data: ProfessionalUpdate):    
        professional = self.professional_repo.get_by_id(self.db, professional_id)
        if not professional or not professional.is_active or professional.business_id != business_id:
            raise ProfessionalNotFoundError()

        update_data = data.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            setattr(professional, field, value)

        self.db.commit()
        self.db.refresh(professional)

        return professional

    def delete_professional(self, business_id: int, professional_id: int):
        professional = self.professional_repo.get_by_id(self.db, professional_id)
        if not professional or professional.business_id != business_id:
            raise ProfessionalNotFoundError()

        self.professional_repo.delete(self.db, professional)

        self.db.commit()

def get_professional_service(db: DataBaseDep):
    return ProfessionalService(
        db,
        BusinessRepository(),
        ProfessionalRepository(),    
    )