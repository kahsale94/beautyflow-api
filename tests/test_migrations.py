from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

def read_source(relative_path: str) -> str:
    return (ROOT / relative_path).read_text(encoding="utf-8")

def test_single_clean_initial_migration_exists():
    versions = ROOT / "alembic" / "versions"
    migration_files = sorted(path.name for path in versions.glob("*.py"))

    assert migration_files == [
        "0001_initial_clean_schema.py",
        "0002_add_schedule_blocks.py",
        "0003_production_hardening.py",
        "0004_add_client_phone_index.py",
        "0005_add_evolution_instances.py",
        "0006_backfill_business_slugs.py",
        "0007_add_appointment_reminders.py",
        "0008_add_business_opening_hours.py",
        "0009_structured_business_hours.py",
        "0010_add_business_attendance.py",
    ]

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

    source = read_source("alembic/versions/0002_add_schedule_blocks.py")
    assert 'revision: str = "0002_add_schedule_blocks"' in source
    assert 'down_revision: Union[str, None] = "0001_initial_clean_schema"' in source
    assert "schedule_blocks" in source
    assert "scheduleblockreason" in source
    assert "scheduleblockstatus" in source
    assert "ex_schedule_blocks_business_professional_time_conflict" in source

    source = read_source("alembic/versions/0003_production_hardening.py")
    assert 'revision: str = "0003_production_hardening"' in source
    assert 'down_revision: Union[str, None] = "0002_add_schedule_blocks"' in source
    assert "uq_business_phone" in source
    assert "confirmation_pending" in source

    source = read_source("alembic/versions/0004_add_client_phone_index.py")
    assert 'revision: str = "0004_add_client_phone_index"' in source
    assert 'down_revision: Union[str, None] = "0003_production_hardening"' in source
    assert "ix_clients_phone" in source

    source = read_source("alembic/versions/0005_add_evolution_instances.py")
    assert 'revision: str = "0005_add_evolution_instances"' in source
    assert 'down_revision: Union[str, None] = "0004_add_client_phone_index"' in source
    assert "evolution_instances" in source
    assert "uq_evolution_instance_business" in source
    assert "uq_evolution_instance_name" in source

    source = read_source("alembic/versions/0006_backfill_business_slugs.py")
    assert 'revision: str = "0006_backfill_business_slugs"' in source
    assert 'down_revision: Union[str, None] = "0005_add_evolution_instances"' in source
    assert "SELECT id, name, slug FROM businesses" in source
    assert "UPDATE businesses SET slug = :slug WHERE id = :id" in source

    source = read_source("alembic/versions/0007_add_appointment_reminders.py")
    assert 'revision: str = "0007_add_appointment_reminders"' in source
    assert 'down_revision: Union[str, None] = "0006_backfill_business_slugs"' in source
    assert "appointment_reminders" in source
    assert "appointmentreminderstatus" in source
    assert "ux_appointment_reminders_upcoming_snapshot" in source
    assert "reminder_type = 'appointment_upcoming'" in source
    assert "ux_appointment_reminders_active_manual_snapshot" in source
    assert "ix_appointment_reminders_claim" in source

    source = read_source("alembic/versions/0008_add_business_opening_hours.py")
    assert 'revision: str = "0008_add_business_opening_hours"' in source
    assert 'down_revision: Union[str, None] = "0007_add_appointment_reminders"' in source
    assert "business_opening_hours" in source
    assert "valid_business_opening_weekday" in source

    source = read_source("alembic/versions/0009_structured_business_hours.py")
    assert 'revision: str = "0009_structured_business_hours"' in source
    assert 'down_revision: Union[str, None] = "0008_add_business_opening_hours"' in source
    assert "business_opening_hours" in source
    assert "inspector.has_table" in source

    source = read_source("alembic/versions/0010_add_business_attendance.py")
    assert 'revision: str = "0010_add_business_attendance"' in source
    assert 'down_revision: Union[str, None] = "0009_structured_business_hours"' in source
    assert "businessattendanceplan" in source
    assert "attendance_plan" in source
