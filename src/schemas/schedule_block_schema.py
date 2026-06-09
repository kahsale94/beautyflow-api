from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from src.models.schedule_block_model import ScheduleBlockReason, ScheduleBlockStatus


class ScheduleBlockCreate(BaseModel):
    professional_id: int
    start_datetime: datetime
    duration_hours: Decimal | None = Field(default=None, gt=0, le=24)
    all_day: bool = False
    reason: ScheduleBlockReason

    @model_validator(mode="after")
    def validate_duration_for_partial_block(self):
        if not self.all_day and self.duration_hours is None:
            raise ValueError("duration_hours é obrigatório quando all_day é falso")
        return self

class ScheduleBlockResponse(BaseModel):
    id: int
    business_id: int
    professional_id: int
    start_datetime: datetime
    end_datetime: datetime
    all_day: bool
    reason: ScheduleBlockReason
    status: ScheduleBlockStatus
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)