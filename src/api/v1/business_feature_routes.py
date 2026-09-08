from fastapi import APIRouter, HTTPException

from src.dependecies import AdminDep, BusinessFeatureServiceDep, BusinessScopeDep, UserOrBusinessIntegrationDep
from src.models.business_feature_model import BusinessFeatureKey
from src.schemas.business_feature_schema import BusinessFeatureResponse, BusinessFeaturesResponse, BusinessFeatureUpdate
from src.services.business_feature_service import (
    BusinessFeatureConfigError,
    BusinessFeatureNotFoundError,
)


router = APIRouter(prefix="/business-features", tags=["V1 ➔ Business Features"])


@router.get("/", response_model=BusinessFeaturesResponse)
def get_business_features(
    business_id: BusinessScopeDep,
    service: BusinessFeatureServiceDep,
    actor: UserOrBusinessIntegrationDep,
):
    return BusinessFeaturesResponse(features=service.get_all(business_id))


@router.put("/{feature_key}", response_model=BusinessFeatureResponse)
def update_business_feature(
    feature_key: BusinessFeatureKey,
    data: BusinessFeatureUpdate,
    business_id: BusinessScopeDep,
    service: BusinessFeatureServiceDep,
    admin: AdminDep,
):
    try:
        return service.set_feature(business_id, feature_key, data)
    except BusinessFeatureNotFoundError:
        raise HTTPException(status_code=404, detail="Empresa ou recurso não encontrado.")
    except BusinessFeatureConfigError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
