
import re
import unicodedata

def normalize_text(text: str) -> str:
    text = text.lower().strip()
    text = unicodedata.normalize("NFD", text)

    text = "".join(
        char for char in text
        if unicodedata.category(char) != "Mn"
    )

    return text

def normalize_phone(phone: str) -> str:
    if not isinstance(phone, str) or not phone.strip():
        raise ValueError("Telefone inválido")

    phone = re.sub(r"\D", "", phone)

    if phone.startswith("55") and len(phone) == 13:
        return phone

    if len(phone) == 11:
        return "55" + phone

    if len(phone) == 10:
        return "55" + phone[:2] + "9" + phone[2:]

    if len(phone) < 10 or len(phone) > 13:
        raise ValueError("Telefone inválido")

    return phone
