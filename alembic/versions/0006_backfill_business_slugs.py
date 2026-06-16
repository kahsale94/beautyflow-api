"""backfill business slugs

Revision ID: 0006_backfill_business_slugs
Revises: 0005_add_evolution_instances
Create Date: 2026-06-15 00:00:00.000000
"""
from typing import Sequence, Union
import re
import unicodedata

from alembic import op
import sqlalchemy as sa


revision: str = "0006_backfill_business_slugs"
down_revision: Union[str, None] = "0005_add_evolution_instances"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

MAX_SLUG_LENGTH = 80


def _slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFD", value.lower().strip())
    normalized = "".join(
        char for char in normalized
        if unicodedata.category(char) != "Mn"
    )
    slug = re.sub(r"[^a-z0-9]+", "-", normalized)
    slug = re.sub(r"-+", "-", slug).strip("-")
    return slug[:MAX_SLUG_LENGTH].strip("-") or "empresa"


def _slug_with_suffix(base_slug: str, suffix: int) -> str:
    suffix_text = f"-{suffix}"
    max_base_length = MAX_SLUG_LENGTH - len(suffix_text)
    return f"{base_slug[:max_base_length].rstrip('-')}{suffix_text}"


def upgrade() -> None:
    connection = op.get_bind()
    rows = connection.execute(
        sa.text("SELECT id, name, slug FROM businesses ORDER BY id")
    ).mappings().all()
    used_slugs = {
        str(row["slug"])
        for row in rows
        if row["slug"]
    }

    for row in rows:
        if row["slug"]:
            continue

        base_slug = _slugify(str(row["name"] or f"empresa-{row['id']}"))
        candidate = base_slug
        suffix = 2

        while candidate in used_slugs:
            candidate = _slug_with_suffix(base_slug, suffix)
            suffix += 1

        used_slugs.add(candidate)
        connection.execute(
            sa.text("UPDATE businesses SET slug = :slug WHERE id = :id"),
            {"slug": candidate, "id": row["id"]},
        )


def downgrade() -> None:
    # This data repair is intentionally not reversed; previous slug values are
    # not distinguishable from generated values after the migration runs.
    return None
