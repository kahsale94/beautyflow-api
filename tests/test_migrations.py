from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def read_source(relative_path: str) -> str:
    return (ROOT / relative_path).read_text(encoding="utf-8")

def test_single_clean_initial_migration_exists():
    versions = ROOT / "alembic" / "versions"
    migration_files = sorted(path.name for path in versions.glob("*.py"))

    assert migration_files == ["0001_initial_clean_schema.py"]

    source = read_source("alembic/versions/0001_initial_clean_schema.py")
    assert 'revision: str = "0001_initial_clean_schema"' in source
    assert "down_revision" in source and "None" in source
    assert "CREATE EXTENSION IF NOT EXISTS btree_gist" in source
    assert "CREATE EXTENSION IF NOT EXISTS pg_trgm" in source
    assert "CREATE EXTENSION IF NOT EXISTS unaccent" in source
    assert "uq_user_email" in source
    assert "uq_user_business_email" not in source
    assert "clients" in source and "is_active" in source
    assert "ex_appointments_business_professional_time_conflict" in source
