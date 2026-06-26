import re
from dataclasses import dataclass


CEP_FORMAT_RE = re.compile(r"^\d{5}-?\d{3}$")
ADDRESS_WITH_NUMBER_RE = re.compile(r"^(?P<street>.+?),\s*(?P<number>(?:\d+[A-Za-z]?|[Ss]/?[Nn])(?:\s.*)?)$")

@dataclass(frozen=True)
class AddressParts:
    street: str
    number: str

def normalize_cep(value: str | None) -> str | None:
    if value is None:
        return None

    raw_value = str(value).strip()
    if not raw_value:
        return None
    if not CEP_FORMAT_RE.fullmatch(raw_value):
        raise ValueError("CEP inválido. Informe 8 números, com ou sem máscara.")

    return raw_value.replace("-", "")

def format_cep(value: str | None) -> str | None:
    digits = normalize_cep(value)
    if digits is None:
        return None
    return f"{digits[:5]}-{digits[5:]}"

def split_address_number(address: str | None) -> AddressParts:
    raw_address = str(address or "").strip()
    if not raw_address:
        return AddressParts(street="", number="")

    match = ADDRESS_WITH_NUMBER_RE.fullmatch(raw_address)
    if not match:
        return AddressParts(street=raw_address, number="")

    return AddressParts(
        street=match.group("street").strip(),
        number=match.group("number").strip(),
    )

def join_address_number(street: str | None, number: str | None) -> str | None:
    normalized_street = str(street or "").strip()
    normalized_number = str(number or "").strip()

    if normalized_number and not normalized_street:
        raise ValueError("Informe a rua antes do número do estabelecimento.")

    if normalized_street and normalized_number:
        return f"{normalized_street}, {normalized_number}"
    if normalized_street:
        return normalized_street

    return None
