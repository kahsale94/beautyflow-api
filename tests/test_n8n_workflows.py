import re
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
        assert (
            "preserve_conversation_meta" in source
            or "...previousMeta" in source
        )
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


def test_main_workflow_does_not_hardcode_an_individual_whatsapp_jid():
    source = (ROOT / "workflows/main-prod.workflow.ts").read_text(encoding="utf-8")

    assert re.search(r"\b\d{12,15}@s\.whatsapp\.net\b", source) is None


def test_appointment_email_notifications_use_fresh_recipient_and_redis_claim():
    for name, source in workflow_source_items("appointments"):
        assert "fresh: true" in source
        assert "operation: 'reply'" not in source
        assert "threadId:" not in source
        assert source.count("sendTo: \"={{ $('prepare email notification').item.json.recipient }}\"") == 3
        assert "name: 'gmail beautyflow'" in source

        assert "const workflowScope = clean($workflow.id)" in source
        assert "businessId" in source
        assert "recipient," in source
        assert "sourceEventId," in source
        assert "const claimKey = [" in source
        assert "operation: 'incr'" in source
        assert "ttl: 300" in source
        assert "this.FindSentNotification.out(1).to(this.ClaimNotification.in(0))" in source
        assert "this.EmailAlreadySent.out(1).to(this.ClaimNotification.in(0))" in source
        assert "this.ClaimNotification.out(1).to(this.NotificationAction.in(0))" in source

        expected_redis_credential = "beautyflow prod" if "-prod." in name else "beautyflow test"
        assert f"name: '{expected_redis_credential}'" in source


def test_staging_pilates_flow_filters_future_occurrences_and_suggests_after_cancel():
    main_source = (ROOT / "workflows/main-staging.workflow.ts").read_text(encoding="utf-8")
    appointments_source = (ROOT / "workflows/appointments-staging.workflow.ts").read_text(encoding="utf-8")

    assert "return status === 'scheduled' && Number.isFinite(start) && start > now" in main_source
    assert "return status === 'scheduled' && Number.isFinite(start) && start > now" in appointments_source
    appointment_context = appointments_source[
        appointments_source.index("    AppointmentContext = {"):
        appointments_source.index("    PrepareEmailNotification = {")
    ]
    assert "mode: 'runOnceForAllItems'" in appointment_context
    assert "$('pre-context').all()" in appointment_context
    assert "return appointments.map((source) =>" in appointment_context
    assert "const source = action === 'get' ? $json" in appointments_source
    assert "const checkExistingClasses =" in main_source
    assert r"[\\s\\S]{0,60}" in main_source
    assert "} else if (checkExistingClasses) {" in main_source
    assert "várias aulas recorrentes no mesmo dia da semana" in main_source
    assert "ocorrência scheduled futura mais próxima" not in main_source
    assert "REPLACEMENT_SOURCE_NOT_FUTURE" in appointments_source
    assert "suggest_alternatives_when_available: true" in appointments_source
    assert "max_suggestions: 10" in appointments_source
    assert ".slice(0, 3)" not in appointments_source[
        appointments_source.index("    BuildCanceledReplacementState = {"):
        appointments_source.index("    StoreCanceledReplacementState = {")
    ]

    cancel_call = "this.CancelForReplacement1.out(0).to(this.CheckReplacementSuggestions.in(0))"
    suggestion_result = "this.CheckReplacementSuggestions.out(0).to(this.BuildCanceledReplacementState.in(0))"
    assert cancel_call in appointments_source
    assert suggestion_result in appointments_source
    assert "this.CancelForReplacement1.out(0).to(this.BuildCanceledReplacementState.in(0))" not in appointments_source


def test_professional_workflows_support_fresh_reads_and_redis_error_fallback():
    for source in workflow_sources("professionals"):
        assert "name: 'fresh'" in source
        assert "FreshId" in source
        assert "this.FreshId.out(0).to(this.GetById.in(0))" in source
        assert "this.FreshId.out(1).to(this.GetContext1.in(0))" in source
        assert "this.ErrorReport25.out(0).to(this.GetById.in(0))" in source
        assert "this.ErrorReport23.out(0).to(this.GetByName.in(0))" in source
        assert source.count("onError: 'continueRegularOutput'") >= 2

        get_by_name_start = source.index("    GetByName = {")
        get_by_id_start = source.index("    GetById = {")
        assert "fullResponse: true" in source[get_by_name_start:get_by_id_start]
