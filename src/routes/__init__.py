from fastapi import FastAPI
from .auth_routes import router as auth_router
from .appointment_routes import router as appointment_router
from .availability_routes import router as availability_router
from .business_routes import router as business_router
from .professional_routes import router as professional_router
from .service_routes import router as service_router
from .user_routes import router as user_router
# from .n8n_routes import router as n8n_router


def register_routers(app: FastAPI):
    routers = [
        auth_router,
        appointment_router,
        availability_router,
        business_router,
        professional_router,
        service_router,
        user_router,
        # n8n_router,
    ]

    for router in routers:
        app.include_router(router)