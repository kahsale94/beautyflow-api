from fastapi import APIRouter

from .user_routes import router as user_router
from .auth_routes import router as auth_router
from .client_routes import router as client_router
from .service_routes import router as service_router
from .business_routes import router as business_router
from .integration_routes import router as integration_router
from .appointment_routes import router as appointment_router
from .availability_routes import router as availability_router
from .professional_routes import router as professional_router
from .business_integration_routes import router as business_integration_router

router = APIRouter()

router.include_router(auth_router)
router.include_router(user_router)
router.include_router(client_router)
router.include_router(service_router)
router.include_router(business_router)
router.include_router(appointment_router)
router.include_router(integration_router)
router.include_router(availability_router)
router.include_router(professional_router)
router.include_router(business_integration_router)