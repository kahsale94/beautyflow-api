from enum import Enum as PyEnum
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field

from src.models.business_feature_model import BusinessFeatureKey


class ProfessionalAssignmentMode(str, PyEnum):
    automatic = "automatic"


class ReminderPolicyMode(str, PyEnum):
    all = "all"
    trial_and_replacement = "trial_and_replacement"
    none = "none"


class StrictFeatureConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")


class EmptyFeatureConfig(StrictFeatureConfig):
    pass


class CapacityBasedBookingConfig(StrictFeatureConfig):
    professional_assignment: Literal[ProfessionalAssignmentMode.automatic] = ProfessionalAssignmentMode.automatic


class ReplacementClassesConfig(StrictFeatureConfig):
    expiration_days: Annotated[int, Field(ge=1, le=365)] = 30


class ReminderPolicyConfig(StrictFeatureConfig):
    mode: ReminderPolicyMode = ReminderPolicyMode.all


FeatureConfig = EmptyFeatureConfig | CapacityBasedBookingConfig | ReplacementClassesConfig | ReminderPolicyConfig


class BusinessFeatureUpdate(BaseModel):
    enabled: bool | None = None
    config: FeatureConfig | None = None


class BusinessFeatureResponse(BaseModel):
    feature_key: BusinessFeatureKey
    enabled: bool
    config: dict[str, object]

    model_config = ConfigDict(from_attributes=True)


class BusinessFeaturesResponse(BaseModel):
    features: list[BusinessFeatureResponse]
