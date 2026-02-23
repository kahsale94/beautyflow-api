from sqlalchemy.orm import Session
from src.models.professional_model import Professional
from src.schemas.professional_schema import ProfessionalCreate, ProfessionalUpdate
from src.repositories.professional_repo import ProfessionalRepository
from src.repositories.business_repo import BusinessRepository

class ProfessionalNotFoundError(Exception):
    pass

class BusinessNotFoundError(Exception):
    pass

class ProfessionalService:

    def __init__(self):
        self.professional_repo = ProfessionalRepository()
        self.business_repo = BusinessRepository()

    def create_professional(self, db: Session, data: ProfessionalCreate):

        business = self.business_repo.get_by_id(db, data.business_id)
        if not business or not business.is_active:
            raise BusinessNotFoundError()

        professional = Professional(
            business_id=data.business_id,
            name=data.name,
        )

        self.professional_repo.add(db, professional)

        db.commit()
        db.refresh(professional)

        return professional

    def get_professional(self, db: Session, professional_id: int | None = None):

        if professional_id is None:
            return self.professional_repo.get_all(db)

        professional = self.professional_repo.get_by_id(db, professional_id)

        if not professional:
            raise ProfessionalNotFoundError()

        return professional

    def update_professional(self, db: Session, professional_id: int, data: ProfessionalUpdate):

        professional = self.professional_repo.get_by_id(db, professional_id)

        if not professional:
            raise ProfessionalNotFoundError()

        if data.business_id is not None:
            business = self.business_repo.get_by_id(db, data.business_id)
            if not business or not business.is_active:
                raise BusinessNotFoundError()

        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(professional, field, value)

        db.commit()
        db.refresh(professional)

        return professional

    def delete_professional(self, db: Session, professional_id: int):

        professional = self.professional_repo.get_by_id(db, professional_id)

        if not professional:
            raise ProfessionalNotFoundError()

        self.professional_repo.delete(db, professional)

        db.commit()