"""fix appointment conflict constraint name

Revision ID: e7a1c2d3f4b5
Revises: 287d9cbe2ac9
Create Date: 2026-05-26 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "e7a1c2d3f4b5"
down_revision: Union[str, Sequence[str], None] = "287d9cbe2ac9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("""
        ALTER TABLE appointments
        DROP CONSTRAINT IF EXISTS ex_appointments_professional_time_conflict
    """)

    op.execute("""
        ALTER TABLE appointments
        DROP CONSTRAINT IF EXISTS ex_appointments_business_professional_time_conflict
    """)

    op.execute("CREATE EXTENSION IF NOT EXISTS btree_gist")

    op.execute("""
        ALTER TABLE appointments
        ADD CONSTRAINT ex_appointments_business_professional_time_conflict
        EXCLUDE USING gist (
            business_id WITH =,
            professional_id WITH =,
            tstzrange(start_datetime, end_datetime, '[)') WITH &&
        )
        WHERE (status = 'scheduled')
    """)


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("""
        ALTER TABLE appointments
        DROP CONSTRAINT IF EXISTS ex_appointments_business_professional_time_conflict
    """)

    op.execute("""
        ALTER TABLE appointments
        ADD CONSTRAINT ex_appointments_professional_time_conflict
        EXCLUDE USING gist (
            business_id WITH =,
            professional_id WITH =,
            tstzrange(start_datetime, end_datetime, '[)') WITH &&
        )
        WHERE (status = 'scheduled')
    """)
