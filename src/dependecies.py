from typing import Annotated
from fastapi import Depends

from src.services.user_service import UserService, get_user_service
from src.services.auth_service import AuthService, get_auth_service
from src.services.client_service import ClientService, get_client_service
from src.services.service_service import ServiceService, get_service_service
from src.services.business_service import BusinessService, get_business_service
from src.services.appointment_service import AppointmentService, get_appointment_service
from src.services.integration_service import IntegrationService, get_integration_service
from src.services.availability_service import AvailabilityService, get_availability_service
from src.services.professional_service import ProfessionalService, get_professional_service
from src.services.business_integration_service import BusinessIntegrationService, get_business_integration_service
from src.security import require_user, require_super_admin, UserContext, get_business_scope, require_admin, IntegrationContext, require_integration

BusinessScopeDep = Annotated[int, Depends(get_business_scope)]

IntegrationDep = Annotated[IntegrationContext, Depends(require_integration)]
AdminDep = Annotated[UserContext, Depends(require_admin)]
CurrentUserDep = Annotated[UserContext, Depends(require_user)]
SuperAdminDep = Annotated[UserContext, Depends(require_super_admin)]

UserServiceDep = Annotated[UserService, Depends(get_user_service)]
AuthServiceDep = Annotated[AuthService, Depends(get_auth_service)]
ClientServiceDep = Annotated[ClientService, Depends(get_client_service)]
ServiceServiceDep = Annotated[ServiceService, Depends(get_service_service)]
BusinessServiceDep = Annotated[BusinessService, Depends(get_business_service)]
AppointmentServiceDep = Annotated[AppointmentService, Depends(get_appointment_service)]
IntegrationServiceDep = Annotated[IntegrationService, Depends(get_integration_service)]
AvailabilityServiceDep = Annotated[AvailabilityService, Depends(get_availability_service)]
ProfessionalServiceDep = Annotated[ProfessionalService, Depends(get_professional_service)]
BusinessIntegrationServiceDep = Annotated[BusinessIntegrationService, Depends(get_business_integration_service)]