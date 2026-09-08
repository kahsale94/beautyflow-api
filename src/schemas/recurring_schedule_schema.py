from datetime import date, datetime, time

from pydantic import BaseModel, ConfigDict, Field, model_validator

from src.models.recurring_schedule_model import RecurringScheduleStatus


class RecurringScheduleCreate(BaseModel):
    client_id: int
    service_id: int
    weekday: int = Field(ge=0, le=6)
    start_time: time
    effective_from: date
    effective_until: date | None = None

    @model_validator(mode="after")
    def validate_effective_range(self):
        if self.effective_until is not None and self.effective_until < self.effective_from:
            raise ValueError("effective_until deve ser igual ou posterior a effective_from")
        return self


class RecurringScheduleUpdate(BaseModel):
    client_id: int | None = None
    service_id: int | None = None
    weekday: int | None = Field(default=None, ge=0, le=6)
    start_time: time | None = None
    effective_from: date | None = None
    effective_until: date | None = None


class RecurringScheduleResponse(BaseModel):
    id: int
    business_id: int
    client_id: int
    service_id: int
    weekday: int
    weekday_name: str
    start_time: time
    effective_from: date
    effective_until: date | None = None
    status: RecurringScheduleStatus
    last_materialized_at: datetime | None = None
    last_materialization_error: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RecurringMaterializationConflict(BaseModel):
    occurrence_start: datetime
    reason: str


class RecurringMaterializationResponse(BaseModel):
    series_id: int
    created: int
    skipped_existing: int
    conflicts: list[RecurringMaterializationConflict] = Field(default_factory=list)
