from sqlalchemy import text
from sqlalchemy.orm import Session


def acquire_schedule_lock(db: Session, business_id: int, professional_id: int) -> None:
    db.execute(
        text("SELECT pg_advisory_xact_lock(:business_id, :professional_id)"),
        {
            "business_id": business_id,
            "professional_id": professional_id,
        },
    )
