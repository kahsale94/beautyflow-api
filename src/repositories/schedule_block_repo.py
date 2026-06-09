from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from src.models import ScheduleBlock
from src.models.schedule_block_model import ScheduleBlockStatus


class ScheduleBlockRepository:

    def add(self, db: Session, schedule_block: ScheduleBlock):
        db.add(schedule_block)

    def delete(self, db: Session, schedule_block: ScheduleBlock):
        db.delete(schedule_block)

    def get_by_id(self, db: Session, business_id: int, schedule_block_id: int):
        stmt = select(ScheduleBlock).where(
            ScheduleBlock.business_id == business_id,
            ScheduleBlock.id == schedule_block_id,
        )
        return db.scalars(stmt).one_or_none()

    def get_active_by_business_period(self, db: Session, business_id: int, start_datetime: datetime, end_datetime: datetime, professional_id: int | None = None):
        stmt = select(ScheduleBlock).where(
            ScheduleBlock.business_id == business_id,
            ScheduleBlock.status == ScheduleBlockStatus.active,
            ScheduleBlock.start_datetime < end_datetime,
            ScheduleBlock.end_datetime > start_datetime,
        )

        if professional_id is not None:
            stmt = stmt.where(ScheduleBlock.professional_id == professional_id)

        stmt = stmt.order_by(ScheduleBlock.start_datetime)
        return db.scalars(stmt).all()

    def get_active_by_professional_period(self, db: Session, business_id: int, professional_id: int, start_datetime: datetime, end_datetime: datetime):
        stmt = (select(ScheduleBlock).where(
            ScheduleBlock.business_id == business_id,
            ScheduleBlock.professional_id == professional_id,
            ScheduleBlock.status == ScheduleBlockStatus.active,
            ScheduleBlock.start_datetime < end_datetime,
            ScheduleBlock.end_datetime > start_datetime,
            )
            .order_by(ScheduleBlock.start_datetime)
        )
        return db.scalars(stmt).all()

    def get_active_by_professional_and_date(self, db: Session, business_id: int, professional_id: int, start_of_day: datetime, end_of_day: datetime):
        return self.get_active_by_professional_period(
            db,
            business_id,
            professional_id,
            start_of_day,
            end_of_day,
        )
