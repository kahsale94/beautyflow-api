import httpx
from time import monotonic
from pydantic import ValidationError
from fastapi import APIRouter, HTTPException, Query, Request

from src.schemas import BusinessUpdate
from src.dependecies import BusinessServiceDep
from src.models.business_model import BusinessType
from src.utils import form_bool, form_int, form_value
from src.services.business_service import BusinessAlreadyExistsError, BusinessNotFoundError

from ..templating import render, redirect_with_flash
from ..dependencies import AdminSessionDep, validate_csrf

router = APIRouter(prefix="/business", tags=["Admin ➔ Business"])

IBGE_LOCALIDADES_BASE_URL = "https://servicodados.ibge.gov.br/api/v1/localidades"
IBGE_CACHE_TTL_SECONDS = 60 * 60 * 24

PREFERRED_TIMEZONES: tuple[str, ...] = (
    "America/Sao_Paulo",
    "America/Manaus",
    "America/Cuiaba",
    "America/Rio_Branco",
    "America/Noronha",
    "UTC",
)

_options_cache: dict[str, tuple[float, list[dict[str, str]]]] = {}

def _get_cached_options(cache_key: str) -> list[dict[str, str]] | None:
    cached = _options_cache.get(cache_key)
    if not cached:
        return None

    expires_at, items = cached
    if expires_at <= monotonic():
        _options_cache.pop(cache_key, None)
        return None

    return items

def _set_cached_options(cache_key: str, items: list[dict[str, str]]) -> list[dict[str, str]]:
    _options_cache[cache_key] = (monotonic() + IBGE_CACHE_TTL_SECONDS, items)
    return items


def _normalize_state_options(payload) -> list[dict[str, str]]:
    states = []
    for item in payload if isinstance(payload, list) else []:
        uf = str(item.get("sigla") or "").strip().upper()
        name = str(item.get("nome") or "").strip()
        if uf and name:
            states.append({"uf": uf, "name": name})

    return sorted(states, key=lambda item: item["name"])

def _normalize_city_options(payload) -> list[dict[str, str]]:
    cities = []
    for item in payload if isinstance(payload, list) else []:
        name = str(item.get("nome") or "").strip()
        if name:
            cities.append({"name": name})

    return sorted(cities, key=lambda item: item["name"])

async def _fetch_ibge_options(
    cache_key: str,
    path: str,
    normalizer,
) -> list[dict[str, str]]:
    cached = _get_cached_options(cache_key)
    if cached is not None:
        return cached

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(f"{IBGE_LOCALIDADES_BASE_URL}/{path}", params={"orderBy": "nome"})
            response.raise_for_status()
            payload = response.json()
    except (httpx.HTTPError, ValueError) as exc:
        raise HTTPException(
            status_code=502,
            detail="Não foi possível consultar a API de localidades do IBGE.",
        ) from exc

    return _set_cached_options(cache_key, normalizer(payload))


def _timezone_options() -> list[str]:
    timezones = set(available_timezones())
    preferred = [timezone for timezone in PREFERRED_TIMEZONES if timezone in timezones]
    remaining = sorted(timezone for timezone in timezones if timezone not in preferred)

    return preferred + remaining


@router.get("/options/timezones")
def business_timezone_options(session: AdminSessionDep):
    return {"items": _timezone_options()}


@router.get("/options/states")
async def business_state_options(session: AdminSessionDep):
    states = await _fetch_ibge_options("states", "estados", _normalize_state_options)
    return {"items": states}


@router.get("/options/cities")
async def business_city_options(session: AdminSessionDep, state: str = Query(..., min_length=2, max_length=2)):
    uf = state.strip().upper()
    if not uf.isalpha():
        raise HTTPException(status_code=400, detail="Estado inválido.")

    cities = await _fetch_ibge_options(f"cities:{uf}", f"estados/{uf}/municipios", _normalize_city_options)
    return {"items": cities}

@router.get("")
def business_settings_page(request: Request, service: BusinessServiceDep, session: AdminSessionDep):
    business = service.get_by_id(session.business_id)

    return render(
        request,
        "admin/business/settings.html",
        {"business": business, "business_types": list(BusinessType)},
        session=session,
        active="business",
    )

@router.post("")
async def update_business_settings_action(request: Request, service: BusinessServiceDep, session: AdminSessionDep):
    await validate_csrf(request)
    form = await request.form()
    try:
        data = BusinessUpdate(
            name=form_value(form, "name"),
            slug=form_value(form, "slug"),
            type=form_value(form, "type"),
            timezone=form_value(form, "timezone"),
            phone=form_value(form, "phone"),
            email=form_value(form, "email"),
            address=form_value(form, "address"),
            city=form_value(form, "city"),
            state=form_value(form, "state"),
            description=form_value(form, "description"),
            booking_enabled=form_bool(form, "booking_enabled"),
            slot_interval_minutes=form_int(form, "slot_interval_minutes"),
            minimum_notice_minutes=form_int(form, "minimum_notice_minutes"),
            maximum_schedule_days=form_int(form, "maximum_schedule_days"),
            allow_client_cancel=form_bool(form, "allow_client_cancel"),
            cancel_limit_hours=form_int(form, "cancel_limit_hours"),
            appointment_confirmation_required=form_bool(form, "appointment_confirmation_required"),
        )
        service.update(session.business_id, data)

    except ValidationError:
        return redirect_with_flash("/admin/business", "Dados inválidos. Verifique os campos da empresa.", "error")
    
    except BusinessNotFoundError:
        return redirect_with_flash("/admin/business", "Empresa não encontrada.", "error")
    
    except BusinessAlreadyExistsError:
        return redirect_with_flash("/admin/business", "Já existe empresa com esse nome ou slug.", "error")

    return redirect_with_flash("/admin/business", "Dados da empresa atualizados.")