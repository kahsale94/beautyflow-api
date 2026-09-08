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


def workflow_body(source: str) -> str:
    """Ignore the generated workflow map so assertions inspect executable nodes only."""
    return source[source.index("export class ") :]


def test_main_workflows_use_backend_attendance_decision():
    for source in workflow_sources("main"):
        assert "business.attendance_status" in source
        assert "attendance_allowed" in source
        assert "$json.attendance.allowed" in source
        assert "inside_business_hours" in source


def test_business_context_workflows_version_cached_payload():
    for name, source in workflow_source_items("businesses"):
        expected_version = 4 if "-staging." in name else 3
        assert f"business?.cache_version === {expected_version}" in source
        assert f"cache_version: {expected_version}" in source
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

    for name, source in workflow_source_items("main"):
        if "-staging." in name:
            assert "whatsapp.connection_key || 'default'" in source
            assert "$json.api.connection_key || \"default\"" in source
        else:
            assert "evo.instance || 'default'" in source
            assert "$json.api.evo_instance || \"default\"" in source
        assert ".conversation_meta" in source
        assert ".outside_hours_context" in source
        for old_fragment in old_key_fragments:
            assert old_fragment not in source

    for name, source in workflow_source_items("clients"):
        expected_scope = "api.connection_key || 'default'" if "-staging." in name else "api.evo_instance || 'default'"
        assert expected_scope in source
        assert ".state" in source
        assert ".chat_memory" in source
        assert ".chat_buffer" in source
        for old_fragment in old_key_fragments:
            assert old_fragment not in source


def test_staging_workflows_use_the_provider_neutral_messaging_gateway():
    staging_sources = [
        path.read_text(encoding="utf-8")
        for path in sorted((ROOT / "workflows").glob("*-staging.workflow.ts"))
    ]

    if not staging_sources:
        return
    for source in staging_sources:
        assert "n8n-nodes-evolution-api" not in source
        assert "X-Evolution-Instance" not in source
        assert "X-Business-Phone" not in source
        assert "external.evo.send_message" not in source

    combined = "\n".join(staging_sources)
    assert "/whatsapp/messages" in combined
    assert "X-WhatsApp-Connection" in combined


def test_staging_main_accepts_wrapped_normalized_webhook_contract():
    source = workflow_body(
        (ROOT / "workflows/main-staging.workflow.ts").read_text(encoding="utf-8")
    )

    assert "$json.body?.connection_key" in source
    assert "$json.body?.contact?.phone" in source
    assert "$json.body?.message?.text" in source
    assert "$json.body?.message?.audio?.base64" in source
    assert "$json.body?.message?.audio?.mime_type" in source
    assert "name: 'X-WhatsApp-Connection'" in source
    assert "/whatsapp/messages" in source


def test_staging_contact_ownership_precedes_business_context_and_classifier():
    source = workflow_body((ROOT / "workflows/main-staging.workflow.ts").read_text(encoding="utf-8"))

    assert "/whatsapp/contacts/resolve" in source
    assert "this.ApiContext.out(0).to(this.ResolveContactOwnership.in(0))" in source
    assert "this.ResolveContactOwnership.out(0).to(this.OwnershipAllowsBot.in(0))" in source
    assert "this.OwnershipAllowsBot.out(0).to(this.BusinessContext.in(0))" in source
    assert "this.ApiContext.out(0).to(this.BusinessContext.in(0))" not in source
    assert "PERSONAL_OR_HUMAN" not in source
    assert "HUMAN_HANDOFF_REQUEST" in source
    assert "PERSONAL_CONTEXT" in source
    assert "this.MessageClassifier.out(0).to(this.ActivateHumanTakeover.in(0))" in source
    assert "this.MessageClassifier.out(9).to(this.CommercialSpamAudit.in(0))" in source
    assert "this.MessageClassifier.out(9).to(this.ActivateHumanTakeover.in(0))" not in source
    assert "this.MessageClassifier.out(10).to(this.PersonalContextApplies.in(0))" in source
    assert "this.PersonalContextApplies.out(0).to(this.End.in(0))" in source
    assert "this.PersonalContextApplies.out(1).to(this.TrashResponse.in(0))" in source
    assert "contact.bot_policy }}\",\n                    rightValue: 'AUTO'" in source
    assert "personal_block" not in source
    assert "pessoal ou pedido de atendimento humano" not in source


def test_staging_covercut_identity_never_fabricates_a_whatsapp_jid():
    source = workflow_body((ROOT / "workflows/main-staging.workflow.ts").read_text(encoding="utf-8"))

    assert "'contact:' + ($json.body?.contact?.id" in source
    assert "'user:' + ($json.body?.contact?.user_id" in source
    assert "contact.provider_user_id" in source
    assert "contact_id: $('resolve contact ownership').first().json.contact.id" in source
    assert "? { to: $('data handler').first().json.client.phone }" in source
    assert "{ recipient: $('resolve contact ownership').first().json.contact.provider_user_id }" in source

    test_harness = workflow_body(
        (ROOT / "workflows/test-staging.workflow.ts").read_text(encoding="utf-8")
    )
    covercut_fixture = test_harness.split("function covercutBody", 1)[1].split("const common", 1)[0]
    assert "user_id: 'test-covercut-bsuid-900001'" in covercut_fixture
    assert "phone: String(remoteJid).split('@')[0]" not in covercut_fixture
    assert "wa_id: String(remoteJid).split('@')[0]" not in covercut_fixture


def test_clients_staging_requests_contact_info_before_phone_dependent_api_calls():
    source = workflow_body((ROOT / "workflows/clients-staging.workflow.ts").read_text(encoding="utf-8"))

    assert "name: 'has client phone?'" in source
    assert "type: 'request_contact_info'" in source
    assert "recipient: $('data handler').first().json.client.provider_user_id" in source
    assert "this.DataHandler.out(0).to(this.HasClientPhone.in(0))" in source
    assert "this.HasClientPhone.out(0).to(this.Switch_.in(0))" in source
    assert "this.HasClientPhone.out(1).to(this.RequestContactInfo.in(0))" in source
    assert "const derivedPhone = remoteJid.includes('@')" in source


def test_staging_pending_and_error_outbound_support_bsuid_and_last_mile_ownership():
    pending = workflow_body(
        (ROOT / "workflows/pending state-staging.workflow.ts").read_text(encoding="utf-8")
    )
    error = workflow_body(
        (ROOT / "workflows/error-staging.workflow.ts").read_text(encoding="utf-8")
    )
    main = workflow_body(
        (ROOT / "workflows/main-staging.workflow.ts").read_text(encoding="utf-8")
    )

    assert "? { recipient: $json.client.provider_user_id }" in pending
    assert "{ contact_id: $json.client.contact_id }" in pending
    assert "provider_user_id: $('data handler').item.json.client.provider_user_id" in pending
    assert "const hasDeliverableIdentity = Boolean(" in pending
    assert "? { recipient: $('data handler').first().json.client.provider_user_id }" in error
    assert "{ contact_id: $('data handler').first().json.client.contact_id }" in error
    assert "provider_user_id: contact.provider_user_id" in main


def test_staging_spam_and_human_takeover_state_are_independent():
    staging = "\n".join(
        path.read_text(encoding="utf-8")
        for path in sorted((ROOT / "workflows").glob("*-staging.workflow.ts"))
    )
    assert "personal_block" not in staging
    assert ".commercial_spam" in staging
    assert "human_takeover" in staging


def test_staging_demo_customizations_are_removed():
    main = workflow_body(
        (ROOT / "workflows/main-staging.workflow.ts").read_text(encoding="utf-8")
    )
    appointments = workflow_body(
        (ROOT / "workflows/appointments-staging.workflow.ts").read_text(encoding="utf-8")
    )
    executable = main + appointments

    for demo_marker in [
        "Pilates",
        "pilates_mode",
        "pending_replacement",
        "120363410124491446@g.us",
        "ExistingStudentFound",
        "GetPendingReplacementMain",
        "existing_only",
    ]:
        assert demo_marker not in executable

    assert 'Allowed actions:' in main
    assert '- "get": retrieve customer appointments.' in main
    assert '- "post": create a new appointment.' in main
    assert "this.ValidateClassification.out(0).to(this.ConversationActGuard.in(0))" in main
    assert "this.AiAgent.uses({" in main
    for tool in ["Appointments", "Professionals", "Availabilities", "Services"]:
        assert f"this.{tool}.output" in main


def test_staging_test_harness_covers_both_inbound_provider_contracts():
    source = workflow_body(
        (ROOT / "workflows/test-staging.workflow.ts").read_text(encoding="utf-8")
    )

    assert "function evolutionBody(" in source
    assert "function covercutBody(" in source
    assert "provider: 'covercut'" in source
    assert "connection_key: connectionKey" in source
    assert "Connection key override" in source


def test_staging_main_composes_feature_aware_prompt_and_domain_tools():
    source = workflow_body(
        (ROOT / "workflows/main-staging.workflow.ts").read_text(encoding="utf-8")
    )

    assert "const modules = {" in source
    assert "Object.values(modules).filter(Boolean).join" in source
    assert "features.capacity_based_booking === true" in source
    assert "features.recurring_schedules === true" in source
    assert "features.replacement_classes === true" in source
    assert "features.trial_appointments === true" in source
    assert "Every date shown to the client must include the weekday" in source
    assert "value: 'RsEC18urVBX7Kf6N'" in source
    assert "value: 'PwsI7k9PNKMowO6v'" in source
    assert "this.RecurringSchedules.output" in source
    assert "this.ReplacementEntitlements.output" in source


def test_staging_scheduling_workflows_delegate_capacity_to_backend():
    appointments = workflow_body(
        (ROOT / "workflows/appointments-staging.workflow.ts").read_text(encoding="utf-8")
    )
    availabilities = workflow_body(
        (ROOT / "workflows/availabilities-staging.workflow.ts").read_text(encoding="utf-8")
    )
    professionals = workflow_body(
        (ROOT / "workflows/professionals-staging.workflow.ts").read_text(encoding="utf-8")
    )

    assert "kind: data.data.appointment.kind || 'standard'" in appointments
    assert "professional_id: data.data.professional.id" in appointments
    assert "Object.fromEntries(Object.entries" in appointments
    assert "/no-show" in appointments
    assert "studio/check-and-suggest" in availabilities
    assert "studio_capacity" in availabilities
    assert "weekday" in availabilities
    assert "simultaneous_capacity" in professionals


def test_new_staging_domain_workflows_are_backend_authoritative():
    recurring_path = ROOT / "workflows/recurring-schedules-staging.workflow.ts"
    replacement_path = ROOT / "workflows/replacement-entitlements-staging.workflow.ts"
    notifications_path = ROOT / "workflows/notification-jobs-staging.workflow.ts"

    recurring = workflow_body(recurring_path.read_text(encoding="utf-8"))
    replacement = workflow_body(replacement_path.read_text(encoding="utf-8"))
    notifications = workflow_body(notifications_path.read_text(encoding="utf-8"))

    for action in ["list", "get", "create", "update", "pause", "resume", "cancel"]:
        assert f"rightValue: '{action}'" in recurring
    assert "/recurring-schedules/" in recurring
    assert "client_id" in recurring

    for action in ["list", "get", "cancel_with_replacement", "use"]:
        assert f"rightValue: '{action}'" in replacement
    assert "/replacement-entitlements/" in replacement
    assert "name: 'status'" in replacement
    assert "value: 'available'" in replacement

    assert "field: 'minutes'" in notifications
    assert "/notification-jobs/claim" in notifications
    assert "/notification-jobs/{{ $json.id }}/dispatch" in notifications
    assert "n8n beautyflow token - staging" in notifications


def test_production_workflows_remain_on_the_legacy_evolution_path():
    production = (ROOT / "workflows/main-prod.workflow.ts").read_text(encoding="utf-8")

    assert "n8n-nodes-evolution-api.evolutionApi" in production
    assert "X-Evolution-Instance" in production


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
