from datetime import datetime
from decimal import Decimal
from zoneinfo import ZoneInfo
from typing import Any

def form_value(form: Any, key: str, default: str | None = None) -> str | None:
    value = form.get(key)
    if value is None:
        return default
    value = str(value).strip()
    return value if value != "" else default

def form_int(form: Any, key: str, default: int | None = None) -> int | None:
    value = form_value(form, key)
    if value is None:
        return default
    return int(value)

def form_decimal(form: Any, key: str, default: Decimal | None = None) -> Decimal | None:
    value = form_value(form, key)
    if value is None:
        return default
    return Decimal(value.replace(",", "."))

def form_bool(form: Any, key: str) -> bool:
    return form.get(key) in {"on", "true", "1", "yes", "sim"}

def local_datetime_from_form(value: str, timezone_name: str) -> datetime:
    # input datetime-local: YYYY-MM-DDTHH:MM
    parsed = datetime.fromisoformat(value)
    if parsed.tzinfo is not None:
        return parsed
    return parsed.replace(tzinfo=ZoneInfo(timezone_name))