from zoneinfo import ZoneInfo
from datetime import datetime, timedelta

from fastapi import APIRouter, Request

from src.dependecies import AppointmentServiceDep, BusinessServiceDep, ClientServiceDep, ProfessionalServiceDep, ServiceServiceDep

from ..templating import render
from ..dependencies import AdminSessionDep

router = APIRouter()

@router.get("/")
def dashboard_page(request: Request, appointment_service: AppointmentServiceDep, client_service: ClientServiceDep, professional_service: ProfessionalServiceDep,
    service_service: ServiceServiceDep, business_service: BusinessServiceDep, session: AdminSessionDep):
    business = business_service.get_by_id(session.business_id)
    tz = ZoneInfo(business.timezone)
    today_start = datetime.now(tz).replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)

    clients = client_service.get_all(session.business_id)
    professionals = professional_service.get_all(session.business_id)
    services = service_service.get_all(session.business_id)
    today_appointments = appointment_service.get_by_period(session.business_id, today_start, today_end)
    clients_by_id = {item.id: item for item in clients}
    professionals_by_id = {item.id: item for item in professionals}
    services_by_id = {item.id: item for item in services}

    return render(
        request,
        "admin/dashboard.html",
        {
            "business": business,
            "clients_count": len(clients),
            "professionals_count": len(professionals),
            "services_count": len(services),
            "today_appointments": today_appointments,
            "clients_by_id": clients_by_id,
            "professionals_by_id": professionals_by_id,
            "services_by_id": services_by_id,
        },
        session=session,
        active="dashboard",
    )