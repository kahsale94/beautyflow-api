from dataclasses import dataclass

import httpx

from src.utils.address import format_cep, normalize_cep


VIACEP_BASE_URL = "https://viacep.com.br/ws"


class CepLookupError(ValueError):
    pass

class CepNotFoundError(CepLookupError):
    pass

class CepServiceUnavailableError(CepLookupError):
    pass

@dataclass(frozen=True)
class CepAddress:
    cep: str
    formatted_cep: str
    street: str | None
    neighborhood: str | None
    city: str | None
    state: str | None

def _parse_viacep_payload(payload, cep: str) -> CepAddress:
    if not isinstance(payload, dict):
        raise CepServiceUnavailableError("A API de CEP retornou uma resposta inesperada.")

    if payload.get("erro"):
        raise CepNotFoundError("CEP não encontrado.")

    returned_cep = normalize_cep(str(payload.get("cep") or cep))
    if returned_cep is None:
        raise CepServiceUnavailableError("A API de CEP retornou uma resposta sem CEP.")

    city = str(payload.get("localidade") or "").strip() or None
    state = str(payload.get("uf") or "").strip().upper() or None
    if not city or not state:
        raise CepNotFoundError("CEP não encontrado.")

    return CepAddress(
        cep=returned_cep,
        formatted_cep=format_cep(returned_cep) or returned_cep,
        street=str(payload.get("logradouro") or "").strip() or None,
        neighborhood=str(payload.get("bairro") or "").strip() or None,
        city=city,
        state=state,
    )

def lookup_cep(value: str | None, *, timeout: float = 5.0) -> CepAddress | None:
    cep = normalize_cep(value)
    if cep is None:
        return None

    try:
        with httpx.Client(timeout=timeout) as client:
            response = client.get(f"{VIACEP_BASE_URL}/{cep}/json/")
            response.raise_for_status()
            payload = response.json()
    except CepLookupError:
        raise
    except (httpx.HTTPError, ValueError) as exc:
        raise CepServiceUnavailableError("Não foi possível consultar a API de CEP no momento.") from exc

    return _parse_viacep_payload(payload, cep)

async def lookup_cep_async(value: str | None, *, timeout: float = 5.0) -> CepAddress | None:
    cep = normalize_cep(value)
    if cep is None:
        return None

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.get(f"{VIACEP_BASE_URL}/{cep}/json/")
            response.raise_for_status()
            payload = response.json()
    except CepLookupError:
        raise
    except (httpx.HTTPError, ValueError) as exc:
        raise CepServiceUnavailableError("Não foi possível consultar a API de CEP no momento.") from exc

    return _parse_viacep_payload(payload, cep)
