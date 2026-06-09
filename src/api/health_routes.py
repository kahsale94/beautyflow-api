import logging
from pathlib import Path

from sqlalchemy import text
from fastapi import APIRouter, status
from starlette.responses import JSONResponse

from src.core import REDIS_URL
from src.core.database import engine


router = APIRouter(tags=["Health"])
logger = logging.getLogger("beautyflow.health")

def _check_db() -> tuple[bool, str | None]:
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return True, None
    except Exception:
        logger.exception("Database readiness check failed")
        return False, "unavailable"

def _check_redis() -> tuple[bool, str | None]:
    if not REDIS_URL:
        return True, "not_configured"

    try:
        import redis
        client = redis.from_url(REDIS_URL, socket_connect_timeout=2, socket_timeout=2)
        client.ping()
        client.close()
        return True, None
    except Exception:
        logger.exception("Redis readiness check failed")
        return False, "unavailable"

def _check_migration_head() -> tuple[bool, dict]:
    try:
        from alembic.config import Config
        from alembic.runtime.migration import MigrationContext
        from alembic.script import ScriptDirectory

        project_root = Path(__file__).resolve().parents[2]
        alembic_ini = project_root / "alembic.ini"

        config = Config(str(alembic_ini))
        config.set_main_option("script_location", str(project_root / "alembic"))

        script = ScriptDirectory.from_config(config)
        expected_head = script.get_current_head()

        with engine.connect() as connection:
            context = MigrationContext.configure(connection)
            current_revision = context.get_current_revision()

        return current_revision == expected_head, {
            "current_revision": current_revision,
            "expected_head": expected_head,
        }
    except Exception:
        logger.exception("Migration readiness check failed")
        return False, {"error": "unavailable"}

@router.get("/health/live")
def live():
    return {"status": "ok"}

@router.get("/health/ready")
def ready():
    db_ok, db_error = _check_db()
    redis_ok, redis_error = _check_redis()
    migration_ok, migration_details = _check_migration_head()

    checks = {
        "db": {"ok": db_ok, "error": db_error},
        "redis": {"ok": redis_ok, "error": redis_error},
        "migration": {"ok": migration_ok, **migration_details},
    }

    ok = db_ok and redis_ok and migration_ok

    return JSONResponse(
        status_code=status.HTTP_200_OK if ok else status.HTTP_503_SERVICE_UNAVAILABLE,
        content={"status": "ok" if ok else "degraded", "checks": checks},
    )
