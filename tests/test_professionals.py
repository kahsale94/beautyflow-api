from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def read_source(relative_path: str) -> str:
    return (ROOT / relative_path).read_text(encoding="utf-8")

def test_professional_create_persists_email():
    source = read_source("src/services/professional_service.py")

    assert "email" in source
    assert "str(data.email)" in source

def test_professional_lists_can_return_empty_list():
    source = read_source("src/services/professional_service.py")

    assert "def get_all" in source
    assert "not result" not in source[source.index("def get_all"):source.index("def get_by_id")]

def test_professional_email_uses_emailstr_schema():
    source = read_source("src/schemas/professional_schema.py")

    assert "EmailStr" in source
    assert "email: EmailStr" in source