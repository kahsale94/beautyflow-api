from fastapi import APIRouter, Request

from src.utils import form_int
from src.dependecies import BusinessServiceDep
from src.services.business_service import BusinessNotFoundError

from ..dependencies import SuperAdminSessionDep, validate_csrf
from ..templating import render, redirect_with_flash, set_business_cookie

router = APIRouter(prefix="/businesses", tags=["Admin ➔ Businesses"])

@router.get("")
def businesses_page(request: Request, business_service: BusinessServiceDep, session: SuperAdminSessionDep):
    businesses = business_service.get_all()

    return render(
        request,
        "admin/businesses/index.html",
        {"businesses": businesses},
        session=session,
        active="businesses",
    )

@router.post("/select")
async def select_business_action(request: Request, business_service: BusinessServiceDep,  session: SuperAdminSessionDep):
    await validate_csrf(request)
    form = await request.form()

    try:
        business_id = form_int(form, "business_id")
        if business_id is None:
            raise ValueError()
        business_service.get_by_id(business_id)
    except (TypeError, ValueError, BusinessNotFoundError):
        return redirect_with_flash("/admin/businesses", "Empresa inválida ou inativa.", "error")

    response = redirect_with_flash("/admin", "Empresa selecionada com sucesso.")
    set_business_cookie(response, business_id)

    return response
