from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def read_source(relative_path: str) -> str:
    return (ROOT / relative_path).read_text(encoding="utf-8")


def test_main_workflows_use_backend_attendance_decision():
    for workflow in ("main-prod", "main-staging"):
        source = read_source(f"workflows/{workflow}.workflow.ts")

        assert "business.attendance_status" in source
        assert "attendance_allowed" in source
        assert "$json.attendance.allowed" in source
        assert "inside_business_hours" in source


def test_business_context_workflows_version_cached_payload():
    for workflow in ("businesses-prod", "businesses-staging"):
        source = read_source(f"workflows/{workflow}.workflow.ts")

        assert "business?.cache_version === 2" in source
        assert "cache_version: 2" in source
        assert "attendance_plan: business.attendance_plan" in source
        assert "attendance_status: business.attendance_status" in source


def test_daily_cache_cleanup_workflows_only_target_context_caches():
    expected_patterns = [
        "beautyflow_bot.*.business_context",
        "beautyflow_bot.*.*.service_context",
        "beautyflow_bot.*.*.professional_context",
        "beautyflow_bot.*.client_context",
        "beautyflow_bot.*.outside_hours_context",
    ]

    for workflow in ("cache-cleanup-prod", "cache-cleanup-staging"):
        source = read_source(f"workflows/{workflow}.workflow.ts")

        assert "field: 'days'" in source
        assert "triggerAtHour: 3" in source
        assert "operation: 'delete'" in source
        for pattern in expected_patterns:
            assert pattern in source

        assert "chat_memory" not in source
        assert "chat_buffer" not in source
        assert ".state" not in source
