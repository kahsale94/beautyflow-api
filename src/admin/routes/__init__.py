from fastapi import APIRouter

from .auth import router as auth_router
from .dashboard import router as dashboard_router
from .businesses import router as businesses_router
from .clients import router as clients_router
from .services import router as services_router
from .professionals import router as professionals_router
from .appointments import router as appointments_router
from .business import router as business_router
from .users import router as users_router
from .integrations import router as integrations_router
from .account import router as account_router

router = APIRouter(prefix="/admin", tags=["Admin"])

router.include_router(auth_router)
router.include_router(dashboard_router)
router.include_router(businesses_router)
router.include_router(clients_router)
router.include_router(services_router)
router.include_router(professionals_router)
router.include_router(appointments_router)
router.include_router(business_router)
router.include_router(users_router)
router.include_router(integrations_router)
router.include_router(account_router)