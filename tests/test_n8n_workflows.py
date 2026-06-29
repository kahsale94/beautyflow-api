from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def workflow_sources(workflow_family: str) -> list[str]:
    workflows_dir = ROOT / "workflows"
    prod_workflow = workflows_dir / f"{workflow_family}-prod.workflow.ts"
    assert prod_workflow.exists(), f"Missing required production workflow: {prod_workflow.relative_to(ROOT)}"

    return [
        path.read_text(encoding="utf-8")
        for path in sorted(workflows_dir.glob(f"{workflow_family}-*.workflow.ts"))
    ]


def test_main_workflows_use_backend_attendance_decision():
    for source in workflow_sources("main"):
        assert "business.attendance_status" in source
        assert "attendance_allowed" in source
        assert "$json.attendance.allowed" in source
        assert "inside_business_hours" in source


def test_business_context_workflows_version_cached_payload():
    for source in workflow_sources("businesses"):
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

    for source in workflow_sources("cache-cleanup"):
        assert "field: 'days'" in source
        assert "triggerAtHour: 3" in source
        assert "operation: 'delete'" in source
        for pattern in expected_patterns:
            assert pattern in source

        assert "chat_memory" not in source
        assert "chat_buffer" not in source
        assert ".state" not in source
