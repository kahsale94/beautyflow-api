"""make appointment overlap protection capacity-lane aware

Revision ID: 0017_capacity_lane
Revises: 0016_appointment_capacity
Create Date: 2026-09-08 00:20:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0017_capacity_lane"
down_revision: Union[str, None] = "0016_appointment_capacity"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


OLD_CONSTRAINT = "ex_appointments_business_professional_time_conflict"
NEW_CONSTRAINT = "ex_appointments_business_professional_capacity_time_conflict"


def upgrade() -> None:
    op.drop_constraint(OLD_CONSTRAINT, "appointments", type_="exclude")
    op.create_exclude_constraint(
        NEW_CONSTRAINT,
        "appointments",
        ("business_id", "="),
        ("professional_id", "="),
        ("capacity_slot", "="),
        (sa.text("tstzrange(start_datetime, end_datetime, '[)')"), "&&"),
        where=sa.text("status = 'scheduled'"),
        using="gist",
    )


def downgrade() -> None:
    op.execute(
        sa.text(
            """
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1
                    FROM appointments a
                    JOIN appointments b
                      ON a.id < b.id
                     AND a.business_id = b.business_id
                     AND a.professional_id = b.professional_id
                     AND a.status = 'scheduled'
                     AND b.status = 'scheduled'
                     AND tstzrange(a.start_datetime, a.end_datetime, '[)')
                         && tstzrange(b.start_datetime, b.end_datetime, '[)')
                ) THEN
                    RAISE EXCEPTION 'Cannot downgrade capacity lanes while scheduled overlaps exist';
                END IF;
            END $$;
            """
        )
    )
    op.drop_constraint(NEW_CONSTRAINT, "appointments", type_="exclude")
    op.create_exclude_constraint(
        OLD_CONSTRAINT,
        "appointments",
        ("business_id", "="),
        ("professional_id", "="),
        (sa.text("tstzrange(start_datetime, end_datetime, '[)')"), "&&"),
        where=sa.text("status = 'scheduled'"),
        using="gist",
    )
