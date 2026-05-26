from sqlalchemy import select
from sqlalchemy.orm import Session

from src.models import ProfessionalService


class ProfessionalServiceRepository:
    def add(self, db: Session, professional_service: ProfessionalService):
        db.add(professional_service)

    def delete(self, db: Session, professional_service: ProfessionalService):
        db.delete(professional_service)

    def get_by_ids(self, db: Session, professional_id: int, service_id: int):
        stmt = select(ProfessionalService).where(
            ProfessionalService.professional_id == professional_id,
            ProfessionalService.service_id == service_id,
        )
        return db.scalars(stmt).one_or_none()

    def get_by_professional(self, db: Session, professional_id: int):
        stmt = select(ProfessionalService).where(
            ProfessionalService.professional_id == professional_id,
        )
        return db.scalars(stmt).all()

    def get_by_service(self, db: Session, service_id: int):
        stmt = select(ProfessionalService).where(
            ProfessionalService.service_id == service_id,
        )
        return db.scalars(stmt).all()
