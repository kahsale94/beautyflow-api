from sqlalchemy import select
from sqlalchemy.orm import Session

from src.models import EvolutionInstance


class EvolutionInstanceRepository:

    def add(self, db: Session, instance: EvolutionInstance) -> None:
        db.add(instance)

    def delete(self, db: Session, instance: EvolutionInstance) -> None:
        db.delete(instance)

    def get_by_business(self, db: Session, business_id: int):
        stmt = select(EvolutionInstance).where(EvolutionInstance.business_id == business_id)
        return db.scalars(stmt).one_or_none()

    def get_by_instance_name(self, db: Session, instance_name: str):
        stmt = select(EvolutionInstance).where(EvolutionInstance.instance_name == instance_name)
        return db.scalars(stmt).one_or_none()
