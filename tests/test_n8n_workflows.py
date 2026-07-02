from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def workflow_source_items(workflow_family: str) -> list[tuple[str, str]]:
    workflows_dir = ROOT / "workflows"
    prod_workflow = workflows_dir / f"{workflow_family}-prod.workflow.ts"
    assert prod_workflow.exists(), f"Missing required production workflow: {prod_workflow.relative_to(ROOT)}"

    return [
        (path.name, path.read_text(encoding="utf-8"))
        for path in sorted(workflows_dir.glob(f"{workflow_family}-*.workflow.ts"))
    ]


def workflow_sources(workflow_family: str) -> list[str]:
    return [source for _, source in workflow_source_items(workflow_family)]


def test_main_workflows_use_backend_attendance_decision():
    for source in workflow_sources("main"):
        assert "business.attendance_status" in source
        assert "attendance_allowed" in source
        assert "$json.attendance.allowed" in source
        assert "inside_business_hours" in source


def test_business_context_workflows_version_cached_payload():
    for name, source in workflow_source_items("businesses"):
        assert "business?.cache_version === 3" in source
        assert "cache_version: 3" in source
        assert "attendance_plan: business.attendance_plan" in source
        assert "attendance_status: business.attendance_status" in source
        assert "payment_methods: paymentMethods" in source
        assert "payment_method_labels: paymentMethodLabels" in source


def test_main_workflows_answer_payment_faq_with_labels():
    for source in workflow_sources("main"):
        assert "business.payment_method_labels" in source
        assert "paymentMethodLabelsByValue" in source
        assert "Sim, aceitamos" in source
        assert "No momento, não temos" in source


def test_main_workflows_configure_audio_binary_property():
    for source in workflow_sources("main"):
        assert "binaryPropertyName: 'data'" in source


def test_daily_cache_cleanup_workflows_target_context_caches_and_legacy_context_keys():
    expected_patterns = [
        "beautyflow_bot.*.*.business_context",
        "beautyflow_bot.*.*.*.service_context",
        "beautyflow_bot.*.*.*.professional_context",
        "beautyflow_bot.*.*.client_context",
        "beautyflow_bot.*.business_context",
        "beautyflow_bot.*.*.service_context",
        "beautyflow_bot.*.*.professional_context",
        "beautyflow_bot.*.client_context",
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
        assert "outside_hours_context" not in source
        assert "conversation_meta" not in source


def test_main_workflows_have_conversation_act_guard_and_meta():
    for source in workflow_sources("main"):
        assert "name: 'conversation act guard'" in source
        assert "conversation_meta" in source
        assert "last_response_type" in source
        assert "last_interaction_act" in source
        assert "preserve_conversation_meta" in source
        assert "name: 'check appointments response'" in source
        assert "$('conversation act guard').item.json.route" in source


def test_conversation_redis_keys_are_instance_scoped():
    old_key_fragments = [
        "beautyflow_bot.120363410124491446@g.us.state",
        "beautyflow_bot.120363410124491446@g.us.chat_memory",
        "beautyflow_bot.120363410124491446@g.us.chat_buffer",
        "beautyflow_bot.{{ $('data handler').item.json.client.remote_jid }}",
        "beautyflow_bot.{{ $('data handler').first().json.client.remote_jid }}",
        "sessionKey: '=beautyflow_bot.{{ $json.client.remote_jid }}",
    ]

    for source in workflow_sources("main"):
        assert "evo.instance || 'default'" in source
        assert "$json.api.evo_instance || \"default\"" in source
        assert ".conversation_meta" in source
        assert ".outside_hours_context" in source
        for old_fragment in old_key_fragments:
            assert old_fragment not in source

    for source in workflow_sources("clients"):
        assert "api.evo_instance || 'default'" in source
        assert ".state" in source
        assert ".chat_memory" in source
        assert ".chat_buffer" in source
        for old_fragment in old_key_fragments:
            assert old_fragment not in source


def test_pending_state_workflows_scan_instance_scoped_outside_hours_context():
    for source in workflow_sources("pending state"):
        assert "keyPattern: 'beautyflow_bot.*.*.outside_hours_context'" in source
