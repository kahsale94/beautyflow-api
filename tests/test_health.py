from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def read_source(relative_path: str) -> str:
    return (ROOT / relative_path).read_text(encoding="utf-8")

def test_health_routes_exist_and_are_registered():
    health_source = read_source("src/api/health_routes.py")
    main_source = read_source("src/main.py")

    assert '@router.get("/health/live")' in health_source
    assert '@router.get("/health/ready")' in health_source
    assert "_check_db" in health_source
    assert "_check_redis" in health_source
    assert "_check_migration_head" in health_source
    assert "app.include_router(health_router)" in main_source

def test_docker_uses_live_healthcheck_without_request_log_noise():
    compose_source = read_source("docker-compose.yml")
    logging_source = read_source("src/middlewares/logging.py")

    assert "/health/live" in compose_source
    assert '"/health/live"' in logging_source
    assert "EXCLUDED_PATHS" in logging_source
    assert "TRUSTED_PROXY_IPS" in compose_source
