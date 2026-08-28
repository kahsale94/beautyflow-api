import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : appointments-staging
// Nodes   : 86  |  Connections: 141
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// Webhook                            executeWorkflowTrigger
// DataHandler                        set
// PilatesAction                      switch
// LegacyActionAllowed                if
// RejectPilatesModeAction            code
// GetPendingReplacement              redis                      [onError→out(1)] [creds] [retry]
// ValidatePendingOperation           code
// PendingOperationRouter             switch
// Action                             switch
// Cancel                             httpRequest                [onError→out(1)]
// Post                               httpRequest                [onError→out(1)]
// Patch                              httpRequest                [onError→out(1)]
// Action1                            switch
// CancelForReplacement               if
// AssertReplacementSourceOwnership   code
// SourceAlreadyCanceled              if
// CheckReplacementSuggestions        httpRequest                [onError→out(1)]
// BuildCancelingReplacementState     code
// StoreCancelingReplacementState     redis                      [onError→out(1)] [creds] [retry]
// CancelForReplacement1              httpRequest                [onError→out(1)]
// GetCancelReplacementSource         httpRequest                [onError→out(1)]
// ReconcileCancelReplacementFailure  code
// CancelFailureSourceCanceled        if
// StoreCancelReplacementFailure      redis                      [onError→out(1)] [creds] [retry]
// BuildCanceledReplacementState      code
// StoreCanceledReplacementState      redis                      [onError→out(1)] [creds] [retry]
// StoreSelectedReplacement           redis                      [onError→out(1)] [creds] [retry]
// RecheckReplacementSlot             httpRequest                [onError→out(1)]
// ReplacementSlotAvailable           if
// BuildReplacementCreatingState      code
// StoreReplacementCreating           redis                      [onError→out(1)] [creds] [retry]
// ReleaseLockAfterCreatingStateFailure redis                      [onError→out(1)] [creds] [retry]
// CreatingStatePersistenceFailure    code
// CreatingStateAndLockCleanupFailure code
// AcquireReplacementLock             redis                      [onError→out(1)] [creds] [retry]
// ReplacementLockAcquired            if
// GetReplacementAppointments         httpRequest                [onError→out(1)]
// ReconcileReplacementCreation       code
// ReplacementRecoveryRouter          switch
// StoreReconciledReplacement         redis                      [onError→out(1)] [creds] [retry]
// RefreshReplacementSuggestions      httpRequest                [onError→out(1)]
// PostReplacement                    httpRequest                [onError→out(1)]
// FinalizeReplacementState           code
// StoreCompletedReplacement          redis                      [onError→out(1)] [creds] [retry]
// BuildReplacementConflictState      code
// StoreReplacementConflict           redis                      [onError→out(1)] [creds] [retry]
// ConflictLockReleaseRequired        if
// ReleaseReplacementLockAfterConflict redis                      [onError→out(1)] [creds] [retry]
// DeletePendingReplacement           redis                      [onError→out(1)] [creds] [retry]
// PilatesOperationResult             code
// FinalReturn                        set
// Aggregate                          aggregate
// GetByClient                        httpRequest                [onError→out(1)]
// GetById                            httpRequest                [onError→out(1)]
// Id                                 if
// PreContext                         set
// AppointmentContext                 code
// PrepareEmailNotification           code
// CanSendEmail                       if
// FindSentNotification               gmail                      [onError→out(1)] [creds] [alwaysOutput]
// EmailAlreadySent                   if
// ClaimNotification                  redis                      [onError→out(1)] [creds]
// NotificationClaimed                if
// NotificationAction                 switch
// ConfirmationEmail                  gmail                      [onError→out(1)] [creds]
// UpdateEmail                        gmail                      [onError→out(1)] [creds]
// DeleteEmail                        gmail                      [onError→out(1)] [creds]
// ErrorReport24                      executeWorkflow            [onError→regular]
// ErrorReport26                      executeWorkflow            [onError→regular]
// ErrorReport                        executeWorkflow            [onError→regular]
// ReturnContext                      code
// ErrorReport16                      stopAndError
// ErrorReport18                      stopAndError
// ErrorReport19                      stopAndError
// ErrorReport20                      stopAndError
// ErrorReport21                      stopAndError
// ServiceContext                     executeWorkflow
// ProfessionalContext                executeWorkflow
// ReminderSchedule                   scheduleTrigger
// ClaimReminders                     httpRequest                [onError→out(1)] [creds] [retry]
// SplitReminderClaims                splitOut
// SendReminder                       evolutionApi               [onError→out(1)] [creds] [retry]
// MarkReminderSent                   httpRequest                [onError→out(1)] [creds] [retry]
// MarkReminderFailed                 httpRequest                [onError→out(1)] [creds] [retry]
// ErrorReport17                      stopAndError
// ErrorReport1                       stopAndError
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// Webhook
//    → DataHandler
//      → PilatesAction
//        → GetPendingReplacement
//          → ValidatePendingOperation
//            → PendingOperationRouter
//              → GetById
//                → PreContext
//                  → ProfessionalContext
//                    → ServiceContext
//                      → AppointmentContext
//                        → CancelForReplacement
//                          → AssertReplacementSourceOwnership
//                            → SourceAlreadyCanceled
//                              → CheckReplacementSuggestions
//                                → BuildCanceledReplacementState
//                                  → StoreCanceledReplacementState
//                                    → PilatesOperationResult
//                                   .out(1) → PilatesOperationResult (↩ loop)
//                               .out(1) → PilatesOperationResult (↩ loop)
//                             .out(1) → BuildCancelingReplacementState
//                                → StoreCancelingReplacementState
//                                  → CancelForReplacement1
//                                    → CheckReplacementSuggestions (↩ loop)
//                                   .out(1) → GetCancelReplacementSource
//                                      → ReconcileCancelReplacementFailure
//                                        → CancelFailureSourceCanceled
//                                          → CheckReplacementSuggestions (↩ loop)
//                                         .out(1) → StoreCancelReplacementFailure
//                                            → PilatesOperationResult (↩ loop)
//                                           .out(1) → PilatesOperationResult (↩ loop)
//                                     .out(1) → ReconcileCancelReplacementFailure (↩ loop)
//                                 .out(1) → PilatesOperationResult (↩ loop)
//                         .out(1) → Action1
//                            → PrepareEmailNotification
//                              → CanSendEmail
//                                → FindSentNotification
//                                  → EmailAlreadySent
//                                    → ReturnContext
//                                      → Aggregate
//                                        → FinalReturn
//                                   .out(1) → ClaimNotification
//                                      → NotificationClaimed
//                                        → NotificationAction
//                                          → ConfirmationEmail
//                                            → ReturnContext (↩ loop)
//                                           .out(1) → ErrorReport24
//                                              → ReturnContext (↩ loop)
//                                         .out(1) → UpdateEmail
//                                            → ReturnContext (↩ loop)
//                                           .out(1) → ErrorReport26
//                                              → ReturnContext (↩ loop)
//                                         .out(2) → DeleteEmail
//                                            → ReturnContext (↩ loop)
//                                           .out(1) → ErrorReport
//                                              → ReturnContext (↩ loop)
//                                         .out(3) → ReturnContext (↩ loop)
//                                       .out(1) → ReturnContext (↩ loop)
//                                     .out(1) → NotificationAction (↩ loop)
//                                 .out(1) → ClaimNotification (↩ loop)
//                               .out(1) → ReturnContext (↩ loop)
//                           .out(1) → ReturnContext (↩ loop)
//                           .out(2) → PrepareEmailNotification (↩ loop)
//                           .out(3) → Cancel
//                              → PrepareEmailNotification (↩ loop)
//                             .out(1) → ErrorReport21
//               .out(1) → ErrorReport18
//             .out(1) → StoreSelectedReplacement
//                → PilatesOperationResult (↩ loop)
//               .out(1) → PilatesOperationResult (↩ loop)
//             .out(2) → RecheckReplacementSlot
//                → ReplacementSlotAvailable
//                  → BuildReplacementCreatingState
//                    → AcquireReplacementLock
//                      → ReplacementLockAcquired
//                        → StoreReplacementCreating
//                          → PostReplacement
//                            → FinalizeReplacementState
//                              → StoreCompletedReplacement
//                                → PilatesOperationResult (↩ loop)
//                               .out(1) → PilatesOperationResult (↩ loop)
//                           .out(1) → GetReplacementAppointments
//                              → ReconcileReplacementCreation
//                                → ReplacementRecoveryRouter
//                                  → StoreReconciledReplacement
//                                    → PilatesOperationResult (↩ loop)
//                                   .out(1) → PilatesOperationResult (↩ loop)
//                                 .out(1) → RefreshReplacementSuggestions
//                                    → BuildReplacementConflictState
//                                      → StoreReplacementConflict
//                                        → ConflictLockReleaseRequired
//                                          → ReleaseReplacementLockAfterConflict
//                                            → PilatesOperationResult (↩ loop)
//                                           .out(1) → PilatesOperationResult (↩ loop)
//                                         .out(1) → PilatesOperationResult (↩ loop)
//                                       .out(1) → PilatesOperationResult (↩ loop)
//                                   .out(1) → PilatesOperationResult (↩ loop)
//                                 .out(2) → StoreReconciledReplacement (↩ loop)
//                                 .out(3) → PilatesOperationResult (↩ loop)
//                             .out(1) → PilatesOperationResult (↩ loop)
//                         .out(1) → ReleaseLockAfterCreatingStateFailure
//                            → CreatingStatePersistenceFailure
//                              → PilatesOperationResult (↩ loop)
//                           .out(1) → CreatingStateAndLockCleanupFailure
//                              → PilatesOperationResult (↩ loop)
//                       .out(1) → GetReplacementAppointments (↩ loop)
//                     .out(1) → PilatesOperationResult (↩ loop)
//                 .out(1) → BuildReplacementConflictState (↩ loop)
//               .out(1) → PilatesOperationResult (↩ loop)
//             .out(3) → DeletePendingReplacement
//                → PilatesOperationResult (↩ loop)
//               .out(1) → PilatesOperationResult (↩ loop)
//             .out(4) → PilatesOperationResult (↩ loop)
//             .out(5) → PilatesOperationResult (↩ loop)
//             .out(6) → GetReplacementAppointments (↩ loop)
//         .out(1) → PilatesOperationResult (↩ loop)
//       .out(1) → GetPendingReplacement (↩ loop)
//       .out(2) → GetPendingReplacement (↩ loop)
//       .out(3) → GetPendingReplacement (↩ loop)
//       .out(4) → LegacyActionAllowed
//          → Action
//            → Post
//              → PreContext (↩ loop)
//             .out(1) → ErrorReport20
//           .out(1) → Patch
//              → PreContext (↩ loop)
//             .out(1) → ErrorReport19
//           .out(2) → GetById (↩ loop)
//           .out(3) → Id
//              → GetById (↩ loop)
//             .out(1) → GetByClient
//                → PreContext (↩ loop)
//               .out(1) → ErrorReport16
//         .out(1) → RejectPilatesModeAction
// ReminderSchedule
//    → ClaimReminders
//      → SplitReminderClaims
//        → SendReminder
//          → MarkReminderSent
//           .out(1) → ErrorReport1
//         .out(1) → MarkReminderFailed
//           .out(1) → ErrorReport1 (↩ loop)
//     .out(1) → ErrorReport17
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: '8Zv0enEr5Ktjbay1',
    name: 'appointments-staging',
    active: true,
    isArchived: false,
    tags: ['Kaiky', 'beautyflow-api'],
    settings: {
        executionOrder: 'v1',
        availableInMCP: true,
        binaryMode: 'separate',
        timeSavedMode: 'fixed',
        errorWorkflow: 'BxyJLKjTEcfzV18k',
        timezone: 'America/Sao_Paulo',
        callerPolicy: 'workflowsFromSameOwner',
    },
})
export class AppointmentsStagingWorkflow {
    // =====================================================================
    // CONFIGURATION DES NOEUDS
    // =====================================================================

    @node({
        id: 'b695af3a-c5f0-49d3-a631-c7afaa586a50',
        name: 'webhook',
        type: 'n8n-nodes-base.executeWorkflowTrigger',
        version: 1.1,
        position: [1248, 6896],
    })
    Webhook = {
        workflowInputs: {
            values: [
                {
                    name: 'action',
                },
                {
                    name: 'appointment_id',
                },
                {
                    name: 'professional_id',
                },
                {
                    name: 'service_id',
                },
                {
                    name: 'start_datetime',
                },
                {
                    name: 'replacement_choice',
                },
                {
                    name: 'pilates_mode',
                    type: 'boolean',
                },
                {
                    name: 'client',
                    type: 'object',
                },
                {
                    name: 'business',
                    type: 'object',
                },
                {
                    name: 'api',
                    type: 'object',
                },
            ],
        },
    };

    @node({
        id: '2b4a7c38-c00d-47b6-89ea-eee391be423b',
        name: 'data handler',
        type: 'n8n-nodes-base.set',
        version: 3.4,
        position: [1456, 6896],
    })
    DataHandler = {
        assignments: {
            assignments: [
                {
                    id: '4142f544-89a2-44a1-b42f-4ffe05f8eda0',
                    name: 'data',
                    value: `={{ (() => {
  const clean = (value) => {
    const text = String(value ?? '').trim();
    return !text || ['null', 'undefined'].includes(text.toLowerCase()) ? '' : text;
  };

  const requestedAction = (clean($json.action) || 'get').toLowerCase();
    const action = requestedAction === 'delete' ? 'cancel' : requestedAction;

  return {
    action,
    appointment: {
      id: clean($json.appointment_id),
      start_datetime: clean($json.start_datetime)
    },
    replacement_choice: clean($json.replacement_choice),
    professional: {
      id: clean($json.professional_id)
    },
    service: {
      id: clean($json.service_id)
    }
  };
})() }}`,
                    type: 'object',
                },
                {
                    id: '7e567273-0a6d-4dcc-a373-db6d1faaa838',
                    name: 'client',
                    value: '={{ $json.client }}',
                    type: 'object',
                },
                {
                    id: '22e99ef8-d3c3-49f5-b0e9-cf606c94c4a2',
                    name: 'pilates_mode',
                    value: '={{ $json.pilates_mode === true || String($json.pilates_mode).toLowerCase() === "true" }}',
                    type: 'boolean',
                },
                {
                    id: '4d9cd564-171f-4763-99aa-ed4e9119060d',
                    name: 'business',
                    value: '={{ $json.business }}',
                    type: 'object',
                },
                {
                    id: '064cb0fd-8607-4646-8fc3-91f1ad6e8aac',
                    name: 'api',
                    value: '={{ $json.api }}',
                    type: 'object',
                },
            ],
        },
        options: {},
    };

    @node({
        id: '2e438ed7-d9ca-42d3-959b-6ffeb2b7cc93',
        name: 'pilates action',
        type: 'n8n-nodes-base.switch',
        version: 3.4,
        position: [1664, 6560],
    })
    PilatesAction = {
        rules: {
            values: [
                {
                    conditions: {
                        options: {
                            caseSensitive: true,
                            leftValue: '',
                            typeValidation: 'strict',
                            version: 3,
                        },
                        conditions: [
                            {
                                id: 'e91a0f55-810d-4449-a255-3922020f22d0',
                                leftValue: "={{ $('data handler').first().json.data.action }}",
                                rightValue: 'cancel_for_replacement',
                                operator: {
                                    type: 'string',
                                    operation: 'equals',
                                },
                            },
                        ],
                        combinator: 'and',
                    },
                    renameOutput: true,
                    outputKey: 'CANCEL FOR REPLACEMENT',
                },
                {
                    conditions: {
                        options: {
                            caseSensitive: true,
                            leftValue: '',
                            typeValidation: 'strict',
                            version: 3,
                        },
                        conditions: [
                            {
                                id: '27ccaf25-4e8d-42ad-873c-c131c6a83514',
                                leftValue: "={{ $('data handler').first().json.data.action }}",
                                rightValue: 'select_replacement',
                                operator: {
                                    type: 'string',
                                    operation: 'equals',
                                },
                            },
                        ],
                        combinator: 'and',
                    },
                    renameOutput: true,
                    outputKey: 'SELECT REPLACEMENT',
                },
                {
                    conditions: {
                        options: {
                            caseSensitive: true,
                            leftValue: '',
                            typeValidation: 'strict',
                            version: 3,
                        },
                        conditions: [
                            {
                                id: '4dbe4aaa-88a9-40f9-a90d-6729fb6a46c5',
                                leftValue: "={{ $('data handler').first().json.data.action }}",
                                rightValue: 'post_replacement',
                                operator: {
                                    type: 'string',
                                    operation: 'equals',
                                },
                            },
                        ],
                        combinator: 'and',
                    },
                    renameOutput: true,
                    outputKey: 'POST REPLACEMENT',
                },
                {
                    conditions: {
                        options: {
                            caseSensitive: true,
                            leftValue: '',
                            typeValidation: 'strict',
                            version: 3,
                        },
                        conditions: [
                            {
                                id: 'ab2f67b6-1c6e-40a1-80f3-8ea16f067582',
                                leftValue: "={{ $('data handler').first().json.data.action }}",
                                rightValue: 'abort_replacement',
                                operator: {
                                    type: 'string',
                                    operation: 'equals',
                                },
                            },
                        ],
                        combinator: 'and',
                    },
                    renameOutput: true,
                    outputKey: 'ABORT REPLACEMENT',
                },
            ],
        },
        options: {
            fallbackOutput: 'extra',
            renameFallbackOutput: 'LEGACY',
        },
    };

    @node({
        id: '89e815fb-cec9-4fa6-91f7-cf79fe820720',
        name: 'legacy action allowed?',
        type: 'n8n-nodes-base.if',
        version: 2.3,
        position: [1872, 6800],
    })
    LegacyActionAllowed = {
        conditions: {
            options: {
                caseSensitive: true,
                leftValue: '',
                typeValidation: 'strict',
                version: 3,
            },
            conditions: [
                {
                    id: '319509cf-283a-4025-8ba7-3d3ac82859d0',
                    leftValue:
                        "={{ !$('data handler').first().json.pilates_mode || $('data handler').first().json.data.action === 'get' }}",
                    rightValue: '',
                    operator: {
                        type: 'boolean',
                        operation: 'true',
                        singleValue: true,
                    },
                },
            ],
            combinator: 'and',
        },
        options: {},
    };

    @node({
        id: 'ecad806f-18f4-4d58-856b-dc5c1af8b1c9',
        name: 'reject pilates mode action',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [2080, 6800],
    })
    RejectPilatesModeAction = {
        jsCode: `const action = String($('data handler').first().json.data?.action || '');
return [{ json: {
  success: false,
  action,
  reason: 'action_not_allowed_in_pilates_mode',
  allowed_actions: ['get', 'cancel_for_replacement', 'select_replacement', 'post_replacement', 'abort_replacement'],
} }];`,
    };

    @node({
        id: 'c30a3148-c8c2-48a7-a2a4-90bed87d8996',
        name: 'get pending replacement',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [1872, 6448],
        credentials: { redis: { id: 'yq1GIl0nbdK5QpYm', name: 'beautyflow test' } },
        onError: 'continueErrorOutput',
        retryOnFail: true,
    })
    GetPendingReplacement = {
        operation: 'get',
        propertyName: 'pending_replacement',
        key: "=beautyflow_bot.{{ $('data handler').first().json.api.evo_instance || 'default' }}.{{ $('data handler').first().json.client.remote_jid }}.pending_replacement",
        keyType: 'string',
        options: {},
    };

    @node({
        id: '98431486-1aa7-40bd-b4c0-d612ed9a075d',
        name: 'validate pending operation',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [2080, 6448],
    })
    ValidatePendingOperation = {
        jsCode: `const input = $('data handler').first().json || {};
const action = String(input.data?.action || '');
const businessId = Number(input.business?.id || 0);
const clientId = Number(input.client?.id || 0);
const now = Date.now();
const key = 'beautyflow_bot.' + (input.api?.evo_instance || 'default') + '.' + (input.client?.remote_jid || '') + '.pending_replacement';

let state = null;
try {
  const raw = $input.first().json.pending_replacement;
  state = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : null;
} catch (error) {
  state = null;
}

const expired = Boolean(state?.expires_at && Date.parse(state.expires_at) <= now);
const tenantMatches = Boolean(
  state &&
  Number(state.business_id) === businessId &&
  Number(state.client_id) === clientId
);
const usable = Boolean(state && !expired && tenantMatches);

const result = {
  success: false,
  action,
  decision: 'invalid',
  reason: 'invalid_replacement_state',
  pending_replacement_key: key,
  pending_replacement: usable ? state : null,
};

if (action === 'cancel_for_replacement') {
  const appointmentId = String(input.data?.appointment?.id || '');
  if (!appointmentId) {
    result.reason = 'appointment_id_required';
  } else if (usable && String(state.source_appointment_id) === appointmentId) {
    const status = String(state.status || '');
    const canRetryCancellation = ['canceling', 'cancel_retryable', 'cancel_failed', 'aborted', 'expired'].includes(status);
    result.success = true;
    result.decision = canRetryCancellation ? 'cancel_start' : 'return_state';
    result.reason = canRetryCancellation
      ? 'resume_cancel_for_replacement'
      : (status === 'completed' ? 'replacement_already_completed' : 'replacement_already_pending');
  } else if (usable && !['completed', 'no_candidates', 'cancel_failed', 'aborted', 'expired'].includes(String(state.status || ''))) {
    result.reason = 'another_replacement_is_pending';
  } else {
    result.decision = 'cancel_start';
    result.reason = null;
  }
}

if (action === 'select_replacement') {
  if (!usable || !['awaiting_slot_selection', 'awaiting_confirmation'].includes(String(state?.status || ''))) {
    result.reason = expired ? 'replacement_state_expired' : 'replacement_not_waiting_for_selection';
  } else {
    const choice = String(input.data?.replacement_choice || input.data?.appointment?.start_datetime || '').trim();
    const candidates = Array.isArray(state.candidates) ? state.candidates : [];
    const numericChoice = /^\\d+$/.test(choice) ? Number(choice) : null;
    const selected = candidates.find((candidate) =>
      (numericChoice !== null && Number(candidate.index) === numericChoice) ||
      String(candidate.start_datetime || '') === choice
    );

    if (!selected) {
      result.reason = 'replacement_choice_not_in_candidates';
    } else {
      const nextState = {
        ...state,
        status: 'awaiting_confirmation',
        selected_candidate: selected,
        selected_start_datetime: selected.start_datetime,
        operation_id: String(state.source_appointment_id) + ':' + String(selected.start_datetime),
        selection_message_id: input.client?.message_id || null,
        updated_at: new Date().toISOString(),
        expires_at: new Date(now + 60 * 60 * 1000).toISOString(),
      };
      result.success = true;
      result.decision = 'select_store';
      result.reason = 'replacement_slot_selected_awaiting_confirmation';
      result.pending_replacement = nextState;
      result.pending_replacement_json = JSON.stringify(nextState);
    }
  }
}

if (action === 'post_replacement') {
  if (usable && state.status === 'completed') {
    result.success = true;
    result.decision = 'return_state';
    result.reason = 'replacement_already_completed';
  } else if (usable && state.status === 'creating') {
    result.success = true;
    result.decision = 'post_recover';
    result.reason = 'replacement_creation_in_progress';
  } else if (!usable || state.status !== 'awaiting_confirmation' || !state.selected_start_datetime) {
    result.reason = expired ? 'replacement_state_expired' : 'replacement_not_confirmed';
  } else {
    result.success = true;
    result.decision = 'post_check';
    result.reason = null;
  }
}

if (action === 'abort_replacement') {
  if (usable && ['canceling', 'creating'].includes(String(state.status || ''))) {
    result.success = false;
    result.decision = 'return_state';
    result.reason = 'replacement_operation_in_progress';
  } else {
    result.success = true;
    result.decision = 'abort';
    result.reason = null;
  }
}

return [{ json: result }];`,
    };

    @node({
        id: 'c4e65e67-1eb8-479d-92ab-5f0d557256ea',
        name: 'pending operation router',
        type: 'n8n-nodes-base.switch',
        version: 3.4,
        position: [2288, 6448],
    })
    PendingOperationRouter = {
        rules: {
            values: [
                {
                    conditions: {
                        options: {
                            caseSensitive: true,
                            leftValue: '',
                            typeValidation: 'strict',
                            version: 3,
                        },
                        conditions: [
                            {
                                id: '6201d2df-1ca1-4148-86a1-09d9b398b497',
                                leftValue: '={{ $json.decision }}',
                                rightValue: 'cancel_start',
                                operator: {
                                    type: 'string',
                                    operation: 'equals',
                                },
                            },
                        ],
                        combinator: 'and',
                    },
                    renameOutput: true,
                    outputKey: 'CANCEL START',
                },
                {
                    conditions: {
                        options: {
                            caseSensitive: true,
                            leftValue: '',
                            typeValidation: 'strict',
                            version: 3,
                        },
                        conditions: [
                            {
                                id: 'cf8b2ae6-1941-4760-a847-cf4d804331bf',
                                leftValue: '={{ $json.decision }}',
                                rightValue: 'select_store',
                                operator: {
                                    type: 'string',
                                    operation: 'equals',
                                },
                            },
                        ],
                        combinator: 'and',
                    },
                    renameOutput: true,
                    outputKey: 'SELECT STORE',
                },
                {
                    conditions: {
                        options: {
                            caseSensitive: true,
                            leftValue: '',
                            typeValidation: 'strict',
                            version: 3,
                        },
                        conditions: [
                            {
                                id: '7330527f-0f68-4593-b16f-c7658cedd7e4',
                                leftValue: '={{ $json.decision }}',
                                rightValue: 'post_check',
                                operator: {
                                    type: 'string',
                                    operation: 'equals',
                                },
                            },
                        ],
                        combinator: 'and',
                    },
                    renameOutput: true,
                    outputKey: 'POST CHECK',
                },
                {
                    conditions: {
                        options: {
                            caseSensitive: true,
                            leftValue: '',
                            typeValidation: 'strict',
                            version: 3,
                        },
                        conditions: [
                            {
                                id: '1a959711-ceca-47ca-874e-8a9c340514ce',
                                leftValue: '={{ $json.decision }}',
                                rightValue: 'abort',
                                operator: {
                                    type: 'string',
                                    operation: 'equals',
                                },
                            },
                        ],
                        combinator: 'and',
                    },
                    renameOutput: true,
                    outputKey: 'ABORT',
                },
                {
                    conditions: {
                        options: {
                            caseSensitive: true,
                            leftValue: '',
                            typeValidation: 'strict',
                            version: 3,
                        },
                        conditions: [
                            {
                                id: '16956c50-bfd9-4d23-b676-b044d0cf67cb',
                                leftValue: '={{ $json.decision }}',
                                rightValue: 'return_state',
                                operator: {
                                    type: 'string',
                                    operation: 'equals',
                                },
                            },
                        ],
                        combinator: 'and',
                    },
                    renameOutput: true,
                    outputKey: 'RETURN STATE',
                },
                {
                    conditions: {
                        options: {
                            caseSensitive: true,
                            leftValue: '',
                            typeValidation: 'strict',
                            version: 3,
                        },
                        conditions: [
                            {
                                id: 'd6f3e984-a015-4b01-9413-24bb0bf06f00',
                                leftValue: '={{ $json.decision }}',
                                rightValue: 'invalid',
                                operator: {
                                    type: 'string',
                                    operation: 'equals',
                                },
                            },
                        ],
                        combinator: 'and',
                    },
                    renameOutput: true,
                    outputKey: 'INVALID',
                },
                {
                    conditions: {
                        options: {
                            caseSensitive: true,
                            leftValue: '',
                            typeValidation: 'strict',
                            version: 3,
                        },
                        conditions: [
                            {
                                id: '2509296e-dda0-49f7-8d05-f225b32dd281',
                                leftValue: '={{ $json.decision }}',
                                rightValue: 'post_recover',
                                operator: {
                                    type: 'string',
                                    operation: 'equals',
                                },
                            },
                        ],
                        combinator: 'and',
                    },
                    renameOutput: true,
                    outputKey: 'POST RECOVER',
                },
            ],
        },
        options: {},
    };

    @node({
        id: 'fa8198c4-bfbb-4665-95d2-502c63ac35ca',
        name: 'action',
        type: 'n8n-nodes-base.switch',
        version: 3.4,
        position: [1664, 6864],
    })
    Action = {
        rules: {
            values: [
                {
                    conditions: {
                        options: {
                            caseSensitive: true,
                            leftValue: '',
                            typeValidation: 'loose',
                            version: 3,
                        },
                        conditions: [
                            {
                                id: 'edb3e1d9-c030-457e-8736-852be0e6c9e3',
                                leftValue: "={{ $('data handler').item.json.data.action }}",
                                rightValue: 'post',
                                operator: {
                                    type: 'string',
                                    operation: 'equals',
                                    name: 'filter.operator.equals',
                                },
                            },
                        ],
                        combinator: 'and',
                    },
                    renameOutput: true,
                    outputKey: 'POST',
                },
                {
                    conditions: {
                        options: {
                            caseSensitive: true,
                            leftValue: '',
                            typeValidation: 'loose',
                            version: 3,
                        },
                        conditions: [
                            {
                                leftValue: "={{ $('data handler').item.json.data.action }}",
                                rightValue: 'update',
                                operator: {
                                    type: 'string',
                                    operation: 'equals',
                                },
                                id: 'd5c0a724-d78c-4ebf-b61d-8a647698c685',
                            },
                        ],
                        combinator: 'and',
                    },
                    renameOutput: true,
                    outputKey: 'PATCH',
                },
                {
                    conditions: {
                        options: {
                            caseSensitive: true,
                            leftValue: '',
                            typeValidation: 'loose',
                            version: 3,
                        },
                        conditions: [
                            {
                                id: 'afc83179-c5f5-4b32-8b2b-ac4541eaf40c',
                                leftValue: "={{ $('data handler').item.json.data.action }}",
                                rightValue: 'cancel',
                                operator: {
                                    type: 'string',
                                    operation: 'equals',
                                    name: 'filter.operator.equals',
                                },
                            },
                        ],
                        combinator: 'and',
                    },
                    renameOutput: true,
                    outputKey: 'CANCEL',
                },
                {
                    conditions: {
                        options: {
                            caseSensitive: true,
                            leftValue: '',
                            typeValidation: 'loose',
                            version: 3,
                        },
                        conditions: [
                            {
                                id: '515c42e0-1cc3-474f-b8bd-94312e698da1',
                                leftValue: "={{ $('data handler').item.json.data.action }}",
                                rightValue: 'get',
                                operator: {
                                    type: 'string',
                                    operation: 'equals',
                                    name: 'filter.operator.equals',
                                },
                            },
                        ],
                        combinator: 'and',
                    },
                    renameOutput: true,
                    outputKey: 'GET',
                },
            ],
        },
        looseTypeValidation: true,
        options: {},
    };

    @node({
        id: 'c14a818d-2921-4360-b63d-383d101e6746',
        name: 'cancel',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.3,
        position: [3952, 7024],
        onError: 'continueErrorOutput',
    })
    Cancel = {
        method: 'PATCH',
        url: "={{ $('data handler').item.json.api.url }}/appointments/{{ $('data handler').item.json.data.appointment.id }}/cancel",
        sendHeaders: true,
        headerParameters: {
            parameters: [
                {
                    name: 'Authorization',
                    value: "={{ $('data handler').item.json.api.token }}",
                },
            ],
        },
        options: {
            response: {
                response: {
                    fullResponse: true,
                    responseFormat: 'file',
                },
            },
        },
    };

    @node({
        id: 'e711e37f-f9be-41ae-b20a-eaf7ebcc4e75',
        name: 'post',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.3,
        position: [2272, 6288],
        onError: 'continueErrorOutput',
        retryOnFail: false,
    })
    Post = {
        method: 'POST',
        url: "={{ $('data handler').item.json.api.url }}/appointments/",
        sendHeaders: true,
        headerParameters: {
            parameters: [
                {
                    name: 'Authorization',
                    value: "={{ $('data handler').item.json.api.token }}",
                },
            ],
        },
        sendBody: true,
        bodyParameters: {
            parameters: [
                {
                    name: 'client_id',
                    value: "={{ $('data handler').item.json.client.id }}",
                },
                {
                    name: 'professional_id',
                    value: "={{ $('data handler').item.json.data.professional.id }}",
                },
                {
                    name: 'service_id',
                    value: "={{ $('data handler').item.json.data.service.id }}",
                },
                {
                    name: 'start_datetime',
                    value: "={{ $('data handler').item.json.data.appointment.start_datetime }}",
                },
            ],
        },
        options: {},
    };

    @node({
        id: '45bef9de-96c3-4186-a8a2-cbf7d5de5ec5',
        name: 'patch',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.3,
        position: [2272, 6608],
        onError: 'continueErrorOutput',
        retryOnFail: false,
    })
    Patch = {
        method: 'PUT',
        url: "={{ $('data handler').first().json.api.url }}/appointments/{{ $('data handler').first().json.data.appointment.id }}",
        sendHeaders: true,
        headerParameters: {
            parameters: [
                {
                    name: 'Authorization',
                    value: "={{ $('data handler').first().json.api.token }}",
                },
            ],
        },
        sendBody: true,
        specifyBody: 'json',
        jsonBody: `={{ (() => {
  const data = $('data handler').first().json.data;
  const appointment = $('data handler').first().json.data.appointment;

  return Object.fromEntries(
    Object.entries({
      professional_id: data.professional.id,
      service_id: data.service.id,
      start_datetime: appointment.start_datetime,
    }).filter(([_, value]) => value !== undefined && value !== null && String(value).trim() !== '')
  );
})() }}`,
        options: {},
    };

    @node({
        id: '2034bf2f-1a3f-4859-a1d4-9e4e280f5d3d',
        name: 'action 1',
        type: 'n8n-nodes-base.switch',
        version: 3.4,
        position: [3584, 6864],
    })
    Action1 = {
        rules: {
            values: [
                {
                    conditions: {
                        options: {
                            caseSensitive: true,
                            leftValue: '',
                            typeValidation: 'loose',
                            version: 3,
                        },
                        conditions: [
                            {
                                id: 'edb3e1d9-c030-457e-8736-852be0e6c9e3',
                                leftValue: "={{ $('data handler').first().json.data.action }}",
                                rightValue: 'post',
                                operator: {
                                    type: 'string',
                                    operation: 'equals',
                                    name: 'filter.operator.equals',
                                },
                            },
                        ],
                        combinator: 'and',
                    },
                    renameOutput: true,
                    outputKey: 'POST',
                },
                {
                    conditions: {
                        options: {
                            caseSensitive: true,
                            leftValue: '',
                            typeValidation: 'loose',
                            version: 3,
                        },
                        conditions: [
                            {
                                id: '34d3012c-febb-49f1-afad-08861bdcbb7d',
                                leftValue: "={{ $('data handler').first().json.data.action }}",
                                rightValue: 'get',
                                operator: {
                                    type: 'string',
                                    operation: 'equals',
                                    name: 'filter.operator.equals',
                                },
                            },
                        ],
                        combinator: 'and',
                    },
                    renameOutput: true,
                    outputKey: 'GET',
                },
                {
                    conditions: {
                        options: {
                            caseSensitive: true,
                            leftValue: '',
                            typeValidation: 'loose',
                            version: 3,
                        },
                        conditions: [
                            {
                                leftValue: "={{ $('data handler').first().json.data.action }}",
                                rightValue: 'update',
                                operator: {
                                    type: 'string',
                                    operation: 'equals',
                                },
                                id: 'd5c0a724-d78c-4ebf-b61d-8a647698c685',
                            },
                        ],
                        combinator: 'and',
                    },
                    renameOutput: true,
                    outputKey: 'PATCH',
                },
                {
                    conditions: {
                        options: {
                            caseSensitive: true,
                            leftValue: '',
                            typeValidation: 'loose',
                            version: 3,
                        },
                        conditions: [
                            {
                                id: 'afc83179-c5f5-4b32-8b2b-ac4541eaf40c',
                                leftValue: "={{ $('data handler').first().json.data.action }}",
                                rightValue: 'cancel',
                                operator: {
                                    type: 'string',
                                    operation: 'equals',
                                    name: 'filter.operator.equals',
                                },
                            },
                        ],
                        combinator: 'and',
                    },
                    renameOutput: true,
                    outputKey: 'CANCEL',
                },
            ],
        },
        looseTypeValidation: true,
        options: {
            allMatchingOutputs: false,
        },
    };

    @node({
        id: '24fde13d-494f-4d2f-9e08-b265647b53e1',
        name: 'cancel for replacement?',
        type: 'n8n-nodes-base.if',
        version: 2.3,
        position: [3568, 7120],
    })
    CancelForReplacement = {
        conditions: {
            options: {
                caseSensitive: true,
                leftValue: '',
                typeValidation: 'strict',
                version: 3,
            },
            conditions: [
                {
                    id: '207e24dc-2b28-40e1-8a62-e4b1bb60a7bb',
                    leftValue: "={{ $('data handler').first().json.data.action }}",
                    rightValue: 'cancel_for_replacement',
                    operator: {
                        type: 'string',
                        operation: 'equals',
                    },
                },
            ],
            combinator: 'and',
        },
        options: {},
    };

    @node({
        id: '64f43809-eeef-405a-981b-b20bf818188e',
        name: 'assert replacement source ownership',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [3680, 7184],
    })
    AssertReplacementSourceOwnership = {
        jsCode: `const raw = $('pre-context').first().json.appointment || {};
const input = $('data handler').first().json || {};
const sourceClientId = Number(raw.client_id || 0);
const runtimeClientId = Number(input.client?.id || 0);
const sourceStatus = String(raw.status || '');
const sourceStart = Date.parse(String(raw.start_datetime || ''));
const pending = $('validate pending operation').first().json.pending_replacement || null;

if (!raw.id || String(raw.id) !== String(input.data?.appointment?.id || '')) {
  throw new Error('REPLACEMENT_SOURCE_APPOINTMENT_MISMATCH');
}
if (!sourceClientId || !runtimeClientId || sourceClientId !== runtimeClientId) {
  throw new Error('REPLACEMENT_SOURCE_CLIENT_MISMATCH');
}
const recoverableCanceled = Boolean(
  sourceStatus === 'canceled' &&
  ['canceling', 'cancel_retryable', 'cancel_failed'].includes(String(pending?.status || '')) &&
  String(pending.source_appointment_id || '') === String(raw.id)
);
if (sourceStatus !== 'scheduled' && !recoverableCanceled) {
  throw new Error('REPLACEMENT_SOURCE_NOT_SCHEDULED');
}
if (!Number.isFinite(sourceStart) || sourceStart <= Date.now()) {
  throw new Error('REPLACEMENT_SOURCE_NOT_FUTURE');
}

return [{ json: {
  ...$('appointment context').first().json,
  replacement_source_status: sourceStatus,
  replacement_cancel_recovery: recoverableCanceled,
} }];`,
    };

    @node({
        id: '5218db65-a987-4f4b-8479-9e54be36aa52',
        name: 'source already canceled?',
        type: 'n8n-nodes-base.if',
        version: 2.3,
        position: [3776, 7136],
    })
    SourceAlreadyCanceled = {
        conditions: {
            options: {
                caseSensitive: true,
                leftValue: '',
                typeValidation: 'strict',
                version: 3,
            },
            conditions: [
                {
                    id: 'df496c3c-4bb6-4af9-823a-04dc3787f97c',
                    leftValue: '={{ $json.replacement_cancel_recovery }}',
                    rightValue: '',
                    operator: {
                        type: 'boolean',
                        operation: 'true',
                        singleValue: true,
                    },
                },
            ],
            combinator: 'and',
        },
        options: {},
    };

    @node({
        id: '747b379c-d613-4628-985f-b0d1c6759b84',
        name: 'check replacement suggestions',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.4,
        position: [3776, 7184],
        onError: 'continueErrorOutput',
    })
    CheckReplacementSuggestions = {
        method: 'POST',
        url: "={{ $('data handler').first().json.api.url }}/availabilities/check-and-suggest",
        sendHeaders: true,
        headerParameters: {
            parameters: [
                {
                    name: 'Authorization',
                    value: "={{ $('data handler').first().json.api.token }}",
                },
            ],
        },
        sendBody: true,
        specifyBody: 'json',
        jsonBody: `={{ (() => {
  const appointment = $('appointment context').first().json || {};
  return {
    professional_id: Number(appointment.professional?.id),
    service_id: Number(appointment.service?.id),
    requested_start: appointment.start_datetime,
    max_suggestions: 10,
    search_days_ahead: 7,
    suggest_alternatives_when_available: true
  };
})() }}`,
        options: {},
    };

    @node({
        id: '435921d5-207f-4900-a784-b289fe229fe1',
        name: 'build canceling replacement state',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [3984, 7136],
    })
    BuildCancelingReplacementState = {
        jsCode: `const input = $('data handler').first().json || {};
const appointment = $('appointment context').first().json || {};
const now = new Date();
const candidates = [];

const state = {
  schema_version: 1,
  status: 'canceling',
  business_id: Number(input.business?.id),
  client_id: Number(appointment.client?.id || input.client?.id),
  client_remote_jid: input.client?.remote_jid,
  source_appointment_id: appointment.id,
  service_id: Number(appointment.service?.id),
  professional_id: Number(appointment.professional?.id),
  original_start_datetime: appointment.start_datetime,
  source_appointment: {
    id: appointment.id,
    start_datetime: appointment.start_datetime,
    end_datetime: appointment.end_datetime,
    date: appointment.date,
    weekday: appointment.weekday,
    start_time: appointment.start_time,
    service_name: appointment.service?.name || null,
    professional_name: appointment.professional?.name || null,
  },
  candidates,
  selected_candidate: null,
  selected_start_datetime: null,
  operation_id: String(appointment.id) + ':cancel',
  cancellation_message_id: input.client?.message_id || null,
  created_at: now.toISOString(),
  updated_at: now.toISOString(),
  expires_at: new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
};
const key = 'beautyflow_bot.' + (input.api?.evo_instance || 'default') + '.' + (input.client?.remote_jid || '') + '.pending_replacement';

return [{ json: {
  success: true,
  action: 'cancel_for_replacement',
  reason: 'replacement_cancel_state_persisted',
  suggestions: candidates,
  pending_replacement: state,
  pending_replacement_key: key,
  pending_replacement_json: JSON.stringify(state),
} }];`,
    };

    @node({
        id: '95539ad3-f991-442a-aa5c-50675356e11f',
        name: 'store canceling replacement state',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [4192, 7136],
        credentials: { redis: { id: 'yq1GIl0nbdK5QpYm', name: 'beautyflow test' } },
        onError: 'continueErrorOutput',
        retryOnFail: true,
    })
    StoreCancelingReplacementState = {
        operation: 'set',
        key: '={{ $json.pending_replacement_key }}',
        value: '={{ $json.pending_replacement_json }}',
        expire: true,
        ttl: 3600,
    };

    @node({
        id: '5f950bd7-8b5a-41f6-a1e5-080120d20c92',
        name: 'cancel for replacement',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.4,
        position: [3984, 7184],
        onError: 'continueErrorOutput',
    })
    CancelForReplacement1 = {
        method: 'PATCH',
        url: "={{ $('data handler').first().json.api.url }}/appointments/{{ $('data handler').first().json.data.appointment.id }}/cancel",
        sendHeaders: true,
        headerParameters: {
            parameters: [
                {
                    name: 'Authorization',
                    value: "={{ $('data handler').first().json.api.token }}",
                },
            ],
        },
        options: {
            response: {
                response: {
                    fullResponse: true,
                    responseFormat: 'text',
                },
            },
        },
    };

    @node({
        id: '83bf85d4-cc67-4a1c-88ac-0ab3420d01c8',
        name: 'get cancel replacement source',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.4,
        position: [4192, 7312],
        onError: 'continueErrorOutput',
    })
    GetCancelReplacementSource = {
        url: "={{ $('data handler').first().json.api.url }}/appointments/{{ $('data handler').first().json.data.appointment.id }}",
        sendHeaders: true,
        headerParameters: {
            parameters: [
                {
                    name: 'Authorization',
                    value: "={{ $('data handler').first().json.api.token }}",
                },
            ],
        },
        options: {
            response: {
                response: {
                    fullResponse: true,
                    responseFormat: 'json',
                },
            },
        },
    };

    @node({
        id: '1600b4ae-b407-4833-90a8-197397002898',
        name: 'reconcile cancel replacement failure',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [4400, 7312],
    })
    ReconcileCancelReplacementFailure = {
        jsCode: `const current = $input.first().json || {};
const validated = $('validate pending operation').first().json || {};
let prepared = null;
try { prepared = $('build canceling replacement state').first().json || null; } catch (error) {}
const base = prepared?.pending_replacement || validated.pending_replacement || null;
if (!base) throw new Error('REPLACEMENT_CANCEL_STATE_MISSING_DURING_RECONCILIATION');

const source = current.body && typeof current.body === 'object' ? current.body : (current.error ? {} : current);
const sourceStatus = String(source.status || '');

const extractStatus = (value) => {
  if (!value) return null;
  const direct = Number(value.httpCode || value.statusCode || value.status || value.response?.statusCode || value.response?.status || 0);
  if (Number.isFinite(direct) && direct > 0) return direct;
  const text = String(value.message || value.description || value || '');
  const match = text.match(/(?:status(?:Code)?|http(?:Code)?)\\D{0,8}(\\d{3})/i) || text.match(/\\b(4\\d\\d|5\\d\\d)\\b/);
  return match ? Number(match[1]) : null;
};

let patchError = null;
try { patchError = $('cancel for replacement').first().json.error || null; } catch (error) {}
const patchStatus = extractStatus(patchError);
const now = new Date();

if (sourceStatus === 'canceled') {
  return [{ json: {
    success: true,
    action: 'cancel_for_replacement',
    reason: 'appointment_cancel_reconciled',
    decision: 'finalize',
    appointment: source,
    pending_replacement: base,
    pending_replacement_key: prepared?.pending_replacement_key || validated.pending_replacement_key,
  } }];
}

const deterministicFailure = Boolean(
  (sourceStatus && sourceStatus !== 'scheduled') ||
  (sourceStatus === 'scheduled' && patchStatus !== null && patchStatus >= 400 && patchStatus < 500)
);
const nextStatus = deterministicFailure ? 'cancel_failed' : 'cancel_retryable';
const reason = deterministicFailure
  ? 'appointment_cancel_rejected'
  : (sourceStatus === 'scheduled' ? 'appointment_cancel_retryable' : 'appointment_cancel_status_unknown');
const nextState = {
  ...base,
  status: nextStatus,
  cancel_error_status: patchStatus,
  cancel_source_status: sourceStatus || null,
  cancel_failed_at: now.toISOString(),
  updated_at: now.toISOString(),
  expires_at: new Date(now.getTime() + 5 * 60 * 1000).toISOString(),
};

return [{ json: {
  success: false,
  action: 'cancel_for_replacement',
  reason,
  decision: 'store_failure',
  retryable: !deterministicFailure,
  retry_after_seconds: deterministicFailure ? null : 5,
  appointment: Object.keys(source).length ? source : base.source_appointment,
  suggestions: base.candidates || [],
  pending_replacement: nextState,
  pending_replacement_key: prepared?.pending_replacement_key || validated.pending_replacement_key,
  pending_replacement_json: JSON.stringify(nextState),
} }];`,
    };

    @node({
        id: 'db41038f-e950-473e-b337-da78726ecf8f',
        name: 'cancel failure source canceled?',
        type: 'n8n-nodes-base.if',
        version: 2.3,
        position: [4608, 7312],
    })
    CancelFailureSourceCanceled = {
        conditions: {
            options: {
                caseSensitive: true,
                leftValue: '',
                typeValidation: 'strict',
                version: 3,
            },
            conditions: [
                {
                    id: 'd7ef0759-0b9c-4342-a324-d581758fca1b',
                    leftValue: '={{ $json.decision }}',
                    rightValue: 'finalize',
                    operator: {
                        type: 'string',
                        operation: 'equals',
                    },
                },
            ],
            combinator: 'and',
        },
        options: {},
    };

    @node({
        id: '1d8d78ba-c399-4c68-bbe0-d77fa2a66a48',
        name: 'store cancel replacement failure',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [4816, 7392],
        credentials: { redis: { id: 'yq1GIl0nbdK5QpYm', name: 'beautyflow test' } },
        onError: 'continueErrorOutput',
        retryOnFail: true,
    })
    StoreCancelReplacementFailure = {
        operation: 'set',
        key: '={{ $json.pending_replacement_key }}',
        value: '={{ $json.pending_replacement_json }}',
        expire: true,
        ttl: 300,
    };

    @node({
        id: '487bc9e7-ee7a-4b58-809f-46edfd59cbe4',
        name: 'build canceled replacement state',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [4192, 7184],
    })
    BuildCanceledReplacementState = {
        jsCode: `const appointment = $('appointment context').first().json || {};
const validated = $('validate pending operation').first().json || {};
const availability = $input.first().json || {};
let prepared = null;
try {
  prepared = $('build canceling replacement state').first().json || null;
} catch (error) {
  prepared = null;
}

const base = prepared?.pending_replacement || validated.pending_replacement;
if (!base || !['canceling', 'cancel_retryable', 'cancel_failed'].includes(String(base.status || ''))) {
  throw new Error('REPLACEMENT_CANCEL_STATE_MISSING');
}

const candidates = (Array.isArray(availability.suggestions) ? availability.suggestions : [])
  .filter((slot) => String(slot.start_datetime || '') !== String(appointment.start_datetime || ''))
  .map((slot, index) => ({
    index: index + 1,
    start_datetime: slot.start_datetime,
    end_datetime: slot.end_datetime,
    date: slot.date || null,
    slot_time: slot.slot_time || null,
  }));
const now = new Date();
const state = {
  ...base,
  status: candidates.length ? 'awaiting_slot_selection' : 'no_candidates',
  updated_at: now.toISOString(),
  canceled_at: now.toISOString(),
  expires_at: new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
};

return [{ json: {
  success: true,
  action: 'cancel_for_replacement',
  reason: candidates.length ? 'appointment_canceled_replacement_options_ready' : 'appointment_canceled_no_replacement_options',
  appointment: { ...appointment, status: 'canceled' },
  suggestions: candidates,
  pending_replacement: state,
  pending_replacement_key: prepared?.pending_replacement_key || validated.pending_replacement_key,
  pending_replacement_json: JSON.stringify(state),
} }];`,
    };

    @node({
        id: 'cd225b9d-7e5a-4100-a33d-723ab65ea1e7',
        name: 'store canceled replacement state',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [4400, 7184],
        credentials: { redis: { id: 'yq1GIl0nbdK5QpYm', name: 'beautyflow test' } },
        onError: 'continueErrorOutput',
        retryOnFail: true,
    })
    StoreCanceledReplacementState = {
        operation: 'set',
        key: '={{ $json.pending_replacement_key }}',
        value: '={{ $json.pending_replacement_json }}',
        expire: true,
        ttl: 3600,
    };

    @node({
        id: '22075ed6-44df-40cb-8734-f20658fcdf22',
        name: 'store selected replacement',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [2512, 6320],
        credentials: { redis: { id: 'yq1GIl0nbdK5QpYm', name: 'beautyflow test' } },
        onError: 'continueErrorOutput',
        retryOnFail: true,
    })
    StoreSelectedReplacement = {
        operation: 'set',
        key: '={{ $json.pending_replacement_key }}',
        value: '={{ $json.pending_replacement_json }}',
        expire: true,
        ttl: 3600,
    };

    @node({
        id: '40441bf9-43bf-435f-85a7-b32812a59636',
        name: 'recheck replacement slot',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.4,
        position: [2512, 6400],
        onError: 'continueErrorOutput',
    })
    RecheckReplacementSlot = {
        method: 'POST',
        url: "={{ $('data handler').first().json.api.url }}/availabilities/check-and-suggest",
        sendHeaders: true,
        headerParameters: {
            parameters: [
                {
                    name: 'Authorization',
                    value: "={{ $('data handler').first().json.api.token }}",
                },
            ],
        },
        sendBody: true,
        specifyBody: 'json',
        jsonBody: `={{ (() => {
  const state = $('validate pending operation').first().json.pending_replacement;
  return {
    professional_id: Number(state.professional_id),
    service_id: Number(state.service_id),
    requested_start: state.selected_start_datetime,
    max_suggestions: 3,
    search_days_ahead: 7
  };
})() }}`,
        options: {},
    };

    @node({
        id: '98880a4c-eab1-4568-8545-ec075a4d4d7a',
        name: 'replacement slot available?',
        type: 'n8n-nodes-base.if',
        version: 2.3,
        position: [2720, 6400],
    })
    ReplacementSlotAvailable = {
        conditions: {
            options: {
                caseSensitive: true,
                leftValue: '',
                typeValidation: 'strict',
                version: 3,
            },
            conditions: [
                {
                    id: 'b37927db-61ae-45a1-83d7-fe1742e37dc6',
                    leftValue: '={{ $json.available }}',
                    rightValue: '',
                    operator: {
                        type: 'boolean',
                        operation: 'true',
                        singleValue: true,
                    },
                },
            ],
            combinator: 'and',
        },
        options: {},
    };

    @node({
        id: '4d31038b-417c-49e1-8cfa-f3efdd5885b1',
        name: 'build replacement creating state',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [2928, 6320],
    })
    BuildReplacementCreatingState = {
        jsCode: `const base = $('validate pending operation').first().json;
const input = $('data handler').first().json || {};
const now = new Date();
const operationId = base.pending_replacement.operation_id || (
  String(base.pending_replacement.source_appointment_id) + ':' + String(base.pending_replacement.selected_start_datetime)
);
const lockKey = base.pending_replacement_key + '.lock.source.' + String(base.pending_replacement.source_appointment_id);
const state = {
  ...base.pending_replacement,
  status: 'creating',
  operation_id: operationId,
  replacement_lock_key: lockKey,
  creating_message_id: input.client?.message_id || null,
  creating_at: now.toISOString(),
  updated_at: now.toISOString(),
  expires_at: new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
};
return [{ json: {
  ...base,
  success: true,
  action: 'post_replacement',
  decision: 'creating',
  pending_replacement: state,
  replacement_lock_key: lockKey,
  pending_replacement_json: JSON.stringify(state),
} }];`,
    };

    @node({
        id: '977fbb36-1c55-41ab-a682-c62a3bfe0c0b',
        name: 'store replacement creating',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [3136, 6320],
        credentials: { redis: { id: 'yq1GIl0nbdK5QpYm', name: 'beautyflow test' } },
        onError: 'continueErrorOutput',
        retryOnFail: true,
    })
    StoreReplacementCreating = {
        operation: 'set',
        key: "={{ $('build replacement creating state').first().json.pending_replacement_key }}",
        value: "={{ $('build replacement creating state').first().json.pending_replacement_json }}",
        expire: true,
        ttl: 3600,
    };

    @node({
        id: 'b1743c83-42c0-4216-ab69-ab5a4d6559bf',
        name: 'release lock after creating state failure',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [3344, 6160],
        credentials: { redis: { id: 'yq1GIl0nbdK5QpYm', name: 'beautyflow test' } },
        onError: 'continueErrorOutput',
        retryOnFail: true,
    })
    ReleaseLockAfterCreatingStateFailure = {
        operation: 'delete',
        key: "={{ $('build replacement creating state').first().json.replacement_lock_key }}",
    };

    @node({
        id: 'c76ed5d0-dedc-4f80-b0b4-0e7f09b74a7d',
        name: 'creating state persistence failure',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [3552, 6080],
    })
    CreatingStatePersistenceFailure = {
        jsCode: `const validated = $('validate pending operation').first().json || {};
let detail = 'redis_set_failed';
try {
  const error = $('store replacement creating').first().json.error || {};
  detail = String(error.message || error.description || detail).slice(0, 500);
} catch (error) {}

return [{ json: {
  success: false,
  action: 'post_replacement',
  reason: 'replacement_creating_state_persist_failed',
  retryable: true,
  lock_released: true,
  failure_detail: detail,
  pending_replacement: validated.pending_replacement || null,
  suggestions: validated.pending_replacement?.candidates || [],
} }];`,
    };

    @node({
        id: '56e7e8fd-3c7c-4e1f-8554-e539168e950d',
        name: 'creating state and lock cleanup failure',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [3552, 6160],
    })
    CreatingStateAndLockCleanupFailure = {
        jsCode: `const validated = $('validate pending operation').first().json || {};
const current = $input.first().json || {};
const error = current.error || {};

return [{ json: {
  success: false,
  action: 'post_replacement',
  reason: 'replacement_creating_state_persist_failed_lock_cleanup_failed',
  retryable: true,
  retry_after_seconds: 300,
  lock_released: false,
  failure_detail: String(error.message || error.description || 'redis_lock_delete_failed').slice(0, 500),
  pending_replacement: validated.pending_replacement || null,
  suggestions: validated.pending_replacement?.candidates || [],
} }];`,
    };

    @node({
        id: '1ebf810f-31ed-42ca-b355-9fdca29c0ea7',
        name: 'acquire replacement lock',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [3248, 6240],
        credentials: { redis: { id: 'yq1GIl0nbdK5QpYm', name: 'beautyflow test' } },
        onError: 'continueErrorOutput',
        retryOnFail: true,
    })
    AcquireReplacementLock = {
        operation: 'incr',
        key: "={{ $('build replacement creating state').first().json.replacement_lock_key }}",
        expire: true,
        ttl: 300,
    };

    @node({
        id: '41628af7-d606-4d54-a927-9aeace47e4f7',
        name: 'replacement lock acquired?',
        type: 'n8n-nodes-base.if',
        version: 2.3,
        position: [3456, 6240],
    })
    ReplacementLockAcquired = {
        conditions: {
            options: {
                caseSensitive: true,
                leftValue: '',
                typeValidation: 'strict',
                version: 3,
            },
            conditions: [
                {
                    id: 'ce3e46bb-f132-4da0-9c45-a2f782033167',
                    leftValue: '={{ Number(Object.values($json || {})[0]) }}',
                    rightValue: 1,
                    operator: {
                        type: 'number',
                        operation: 'equals',
                    },
                },
            ],
            combinator: 'and',
        },
        options: {},
    };

    @node({
        id: 'e32bf8a7-4417-47b4-8102-a5c1bf9b5ee5',
        name: 'get replacement appointments',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.4,
        position: [3664, 6480],
        onError: 'continueErrorOutput',
    })
    GetReplacementAppointments = {
        url: "={{ $('data handler').first().json.api.url }}/appointments/",
        sendQuery: true,
        queryParameters: {
            parameters: [
                {
                    name: 'client_id',
                    value: "={{ $('validate pending operation').first().json.pending_replacement.client_id }}",
                },
            ],
        },
        sendHeaders: true,
        headerParameters: {
            parameters: [
                {
                    name: 'Authorization',
                    value: "={{ $('data handler').first().json.api.token }}",
                },
            ],
        },
        options: {
            response: {
                response: {
                    fullResponse: true,
                    responseFormat: 'json',
                },
            },
        },
    };

    @node({
        id: '0b613f1b-0a4f-4fc5-aaf4-f7c65dccd604',
        name: 'reconcile replacement creation',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [3872, 6480],
    })
    ReconcileReplacementCreation = {
        jsCode: `const validated = $('validate pending operation').first().json || {};
let state = validated.pending_replacement || null;
try {
  state = $('build replacement creating state').first().json.pending_replacement || state;
} catch (error) {}

if (!state) {
  throw new Error('REPLACEMENT_STATE_MISSING_DURING_RECONCILIATION');
}

const rows = $input.all().flatMap((item) => {
  const value = item.json || {};
  if (Array.isArray(value)) return value;
  if (Array.isArray(value.body)) return value.body;
  return [value];
});
const sameInstant = (left, right) => {
  const a = Date.parse(String(left || ''));
  const b = Date.parse(String(right || ''));
  return Number.isFinite(a) && Number.isFinite(b) && a === b;
};
const appointment = rows.find((row) =>
  String(row.status || '') === 'scheduled' &&
  Number(row.client_id) === Number(state.client_id) &&
  Number(row.professional_id) === Number(state.professional_id) &&
  Number(row.service_id) === Number(state.service_id) &&
  sameInstant(row.start_datetime, state.selected_start_datetime)
) || null;

let postStatus = null;
try {
  const postError = $('post replacement').first().json.error || {};
  postStatus = Number(postError.httpCode || postError.statusCode || postError.status || 0) || null;
} catch (error) {}

const now = new Date();
let nextState = state;
let success = false;
let reason = 'replacement_creation_in_progress';
let decision = 'wait';

if (appointment) {
  nextState = {
    ...state,
    status: 'completed',
    replacement_appointment_id: appointment.id,
    replacement_appointment: appointment,
    completed_at: now.toISOString(),
    updated_at: now.toISOString(),
    expires_at: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
  };
  success = true;
  reason = 'replacement_creation_reconciled';
  decision = 'complete';
} else if (postStatus === 409) {
  reason = 'replacement_conflict_refresh_required';
  decision = 'refresh_conflict';
} else {
  const creatingAt = Date.parse(String(state.creating_at || ''));
  if (Number.isFinite(creatingAt) && Date.now() - creatingAt >= 5 * 60 * 1000) {
    nextState = {
      ...state,
      status: 'awaiting_confirmation',
      creating_at: null,
      updated_at: now.toISOString(),
      expires_at: new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
    };
    reason = 'replacement_not_found_retry_allowed';
    decision = 'retry';
  }
}

return [{ json: {
  success,
  action: 'post_replacement',
  reason,
  decision,
  appointment,
  source_appointment: nextState.source_appointment,
  pending_replacement: nextState,
  pending_replacement_key: validated.pending_replacement_key,
  pending_replacement_json: JSON.stringify(nextState),
} }];`,
    };

    @node({
        id: '7f3db720-0fac-4c94-9d43-d70eeaf9eeb7',
        name: 'replacement recovery router',
        type: 'n8n-nodes-base.switch',
        version: 3.4,
        position: [4080, 6480],
    })
    ReplacementRecoveryRouter = {
        rules: {
            values: [
                {
                    conditions: {
                        options: {
                            caseSensitive: true,
                            leftValue: '',
                            typeValidation: 'strict',
                            version: 3,
                        },
                        conditions: [
                            {
                                id: 'df387aa0-af6f-4d73-b515-c5da540a5388',
                                leftValue: '={{ $json.decision }}',
                                rightValue: 'complete',
                                operator: {
                                    type: 'string',
                                    operation: 'equals',
                                },
                            },
                        ],
                        combinator: 'and',
                    },
                    renameOutput: true,
                    outputKey: 'COMPLETE',
                },
                {
                    conditions: {
                        options: {
                            caseSensitive: true,
                            leftValue: '',
                            typeValidation: 'strict',
                            version: 3,
                        },
                        conditions: [
                            {
                                id: '0a836df5-fb2e-465f-b80b-0073543e7ae6',
                                leftValue: '={{ $json.decision }}',
                                rightValue: 'refresh_conflict',
                                operator: {
                                    type: 'string',
                                    operation: 'equals',
                                },
                            },
                        ],
                        combinator: 'and',
                    },
                    renameOutput: true,
                    outputKey: 'REFRESH CONFLICT',
                },
                {
                    conditions: {
                        options: {
                            caseSensitive: true,
                            leftValue: '',
                            typeValidation: 'strict',
                            version: 3,
                        },
                        conditions: [
                            {
                                id: 'a18937ba-e89b-4a5a-9c6b-e26128423337',
                                leftValue: '={{ $json.decision }}',
                                rightValue: 'retry',
                                operator: {
                                    type: 'string',
                                    operation: 'equals',
                                },
                            },
                        ],
                        combinator: 'and',
                    },
                    renameOutput: true,
                    outputKey: 'RETRY',
                },
            ],
        },
        options: {
            fallbackOutput: 'extra',
            renameFallbackOutput: 'WAIT',
        },
    };

    @node({
        id: '5a46bffa-fe34-4895-9372-466683c2dbc6',
        name: 'store reconciled replacement',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [4288, 6400],
        credentials: { redis: { id: 'yq1GIl0nbdK5QpYm', name: 'beautyflow test' } },
        onError: 'continueErrorOutput',
        retryOnFail: true,
    })
    StoreReconciledReplacement = {
        operation: 'set',
        key: '={{ $json.pending_replacement_key }}',
        value: '={{ $json.pending_replacement_json }}',
        expire: true,
        ttl: '={{ $json.pending_replacement.status === "completed" ? 86400 : 3600 }}',
    };

    @node({
        id: 'df5cb108-a4a9-4a7c-b823-55c2a15ef668',
        name: 'refresh replacement suggestions',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.4,
        position: [4288, 6560],
        onError: 'continueErrorOutput',
    })
    RefreshReplacementSuggestions = {
        method: 'POST',
        url: "={{ $('data handler').first().json.api.url }}/availabilities/check-and-suggest",
        sendHeaders: true,
        headerParameters: {
            parameters: [
                {
                    name: 'Authorization',
                    value: "={{ $('data handler').first().json.api.token }}",
                },
            ],
        },
        sendBody: true,
        specifyBody: 'json',
        jsonBody: `={{ (() => {
  const state = $('validate pending operation').first().json.pending_replacement;
  return {
    professional_id: Number(state.professional_id),
    service_id: Number(state.service_id),
    requested_start: state.selected_start_datetime,
    max_suggestions: 3,
    search_days_ahead: 7
  };
})() }}`,
        options: {},
    };

    @node({
        id: '0ce86894-49e0-4c49-967b-d95f4e945522',
        name: 'post replacement',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.4,
        position: [3344, 6320],
        onError: 'continueErrorOutput',
    })
    PostReplacement = {
        method: 'POST',
        url: "={{ $('data handler').first().json.api.url }}/appointments/",
        sendHeaders: true,
        headerParameters: {
            parameters: [
                {
                    name: 'Authorization',
                    value: "={{ $('data handler').first().json.api.token }}",
                },
            ],
        },
        sendBody: true,
        specifyBody: 'json',
        jsonBody: `={{ (() => {
  const state = $('build replacement creating state').first().json.pending_replacement;
  return {
    client_id: Number(state.client_id),
    professional_id: Number(state.professional_id),
    service_id: Number(state.service_id),
    start_datetime: state.selected_start_datetime
  };
})() }}`,
        options: {},
    };

    @node({
        id: 'ee46bc4a-bce1-4cf0-89db-82fb56ccc887',
        name: 'finalize replacement state',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [3552, 6320],
    })
    FinalizeReplacementState = {
        jsCode: `const appointment = $input.first().json || {};
const base = $('build replacement creating state').first().json;
const state = {
  ...base.pending_replacement,
  status: 'completed',
  replacement_appointment_id: appointment.id || null,
  replacement_appointment: appointment,
  completed_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};
return [{ json: {
  success: true,
  action: 'post_replacement',
  reason: 'replacement_created',
  appointment,
  source_appointment: state.source_appointment,
  pending_replacement: state,
  pending_replacement_key: base.pending_replacement_key,
  pending_replacement_json: JSON.stringify(state),
} }];`,
    };

    @node({
        id: '31c3a3d7-3dd7-4f9f-8dd7-b90a31148b48',
        name: 'store completed replacement',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [3760, 6320],
        credentials: { redis: { id: 'yq1GIl0nbdK5QpYm', name: 'beautyflow test' } },
        onError: 'continueErrorOutput',
        retryOnFail: true,
    })
    StoreCompletedReplacement = {
        operation: 'set',
        key: '={{ $json.pending_replacement_key }}',
        value: '={{ $json.pending_replacement_json }}',
        expire: true,
        ttl: 86400,
    };

    @node({
        id: 'e998d1db-c6e3-42e7-8398-21b5b17915a3',
        name: 'build replacement conflict state',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [2928, 6480],
    })
    BuildReplacementConflictState = {
        jsCode: `const availability = $input.first().json || {};
const base = $('validate pending operation').first().json;
const previous = base.pending_replacement;
let releaseLock = false;
try {
  releaseLock = Boolean($('refresh replacement suggestions').first());
} catch (error) {}
const candidates = (Array.isArray(availability.suggestions) ? availability.suggestions : [])
  .filter((slot) => String(slot.start_datetime || '') !== String(previous.selected_start_datetime || ''))
  .slice(0, 3)
  .map((slot, index) => ({
    index: index + 1,
    start_datetime: slot.start_datetime,
    end_datetime: slot.end_datetime,
    date: slot.date || null,
    slot_time: slot.slot_time || null,
  }));
const state = {
  ...previous,
  status: candidates.length ? 'awaiting_slot_selection' : 'no_candidates',
  candidates,
  selected_candidate: null,
  selected_start_datetime: null,
  last_conflict_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
};
return [{ json: {
  success: false,
  action: 'post_replacement',
  reason: candidates.length ? 'selected_slot_no_longer_available' : 'selected_slot_unavailable_no_alternatives',
  release_lock: releaseLock,
  suggestions: candidates,
  pending_replacement: state,
  pending_replacement_key: base.pending_replacement_key,
  pending_replacement_json: JSON.stringify(state),
} }];`,
    };

    @node({
        id: '28906d28-2ea4-46ba-a2e1-60af2d16e006',
        name: 'store replacement conflict',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [3136, 6480],
        credentials: { redis: { id: 'yq1GIl0nbdK5QpYm', name: 'beautyflow test' } },
        onError: 'continueErrorOutput',
        retryOnFail: true,
    })
    StoreReplacementConflict = {
        operation: 'set',
        key: '={{ $json.pending_replacement_key }}',
        value: '={{ $json.pending_replacement_json }}',
        expire: true,
        ttl: 3600,
    };

    @node({
        id: '5c68ea08-047f-4ef5-ab90-ed4161751635',
        name: 'conflict lock release required?',
        type: 'n8n-nodes-base.if',
        version: 2.3,
        position: [3248, 6560],
    })
    ConflictLockReleaseRequired = {
        conditions: {
            options: {
                caseSensitive: true,
                leftValue: '',
                typeValidation: 'strict',
                version: 3,
            },
            conditions: [
                {
                    id: '866aa708-39f6-4da9-a4cc-92c46c46bc7c',
                    leftValue: '={{ $json.release_lock }}',
                    rightValue: '',
                    operator: {
                        type: 'boolean',
                        operation: 'true',
                        singleValue: true,
                    },
                },
            ],
            combinator: 'and',
        },
        options: {},
    };

    @node({
        id: '5b78420a-b794-479f-bb8c-05a8d7c4160f',
        name: 'release replacement lock after conflict',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [3344, 6560],
        credentials: { redis: { id: 'yq1GIl0nbdK5QpYm', name: 'beautyflow test' } },
        onError: 'continueErrorOutput',
        retryOnFail: true,
    })
    ReleaseReplacementLockAfterConflict = {
        operation: 'delete',
        key: "={{ $('validate pending operation').first().json.pending_replacement_key + '.lock.source.' + $('validate pending operation').first().json.pending_replacement.source_appointment_id }}",
    };

    @node({
        id: '149efc67-1187-4df1-a68b-00769e4f6dd3',
        name: 'delete pending replacement',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [2512, 6560],
        credentials: { redis: { id: 'yq1GIl0nbdK5QpYm', name: 'beautyflow test' } },
        onError: 'continueErrorOutput',
        retryOnFail: true,
    })
    DeletePendingReplacement = {
        operation: 'delete',
        key: '={{ $json.pending_replacement_key }}',
    };

    @node({
        id: '1ee72551-adb0-48b9-a5e7-a1c6c09dbd50',
        name: 'pilates operation result',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [2720, 6640],
    })
    PilatesOperationResult = {
        jsCode: `const current = $input.first().json || {};
const action = String($('data handler').first().json.data?.action || '');
const readNode = (name) => {
  try { return $(name).first().json || null; } catch (error) { return null; }
};
const candidates = [
  readNode('finalize replacement state'),
  readNode('reconcile replacement creation'),
  readNode('build replacement conflict state'),
  readNode('reconcile cancel replacement failure'),
  readNode('build canceled replacement state'),
  readNode('build replacement creating state'),
  readNode('build canceling replacement state'),
  readNode('validate pending operation'),
].filter(Boolean);
const structured = candidates.find((value) => value.action === action) || candidates[0] || {};
const pending = current.pending_replacement || structured.pending_replacement || null;

if (current.error) {
  return [{ json: {
    success: false,
    action,
    reason: 'replacement_operation_failed',
    error: String(current.error.message || current.error.description || 'unknown_error').slice(0, 500),
    pending_replacement: pending,
    suggestions: pending?.candidates || structured.suggestions || [],
  } }];
}

if (action === 'abort_replacement') {
  return [{ json: {
    success: true,
    action,
    reason: 'replacement_flow_aborted',
    pending_replacement: null,
  } }];
}

return [{ json: {
  ...structured,
  ...current,
  success: current.success ?? structured.success ?? false,
  action,
  reason: current.reason ?? structured.reason ?? null,
  pending_replacement: pending,
  suggestions: current.suggestions ?? structured.suggestions ?? pending?.candidates ?? [],
  appointment: current.appointment ?? structured.appointment ?? pending?.replacement_appointment ?? null,
} }];`,
    };

    @node({
        id: 'b1ab799e-f2e6-42fa-af4e-9f41d174898c',
        name: 'final return',
        type: 'n8n-nodes-base.set',
        version: 3.4,
        position: [5552, 6880],
    })
    FinalReturn = {
        assignments: {
            assignments: [
                {
                    id: '804a7f04-c007-4045-a9f5-34b606a6eea1',
                    name: 'sucess',
                    value: '=true',
                    type: 'boolean',
                },
                {
                    id: '7748568d-748f-4ac6-ab88-fb32197f0806',
                    name: 'appointments',
                    value: `={{ (() => {
  const now = Date.now();
  const appointments = Array.isArray($json.appointments) ? $json.appointments : [];

  return appointments
    .filter((appointment) => {
      const status = String(appointment?.status || '').toLowerCase();
      const start = Date.parse(String(appointment?.start_datetime || ''));
      return status === 'scheduled' && Number.isFinite(start) && start > now;
    })
    .sort((left, right) => Date.parse(left.start_datetime) - Date.parse(right.start_datetime));
})() }}`,
                    type: 'array',
                },
            ],
        },
        options: {},
    };

    @node({
        id: '228d8792-5bc1-41df-84d9-aef0fe8acf71',
        name: 'aggregate',
        type: 'n8n-nodes-base.aggregate',
        version: 1,
        position: [5344, 6880],
    })
    Aggregate = {
        aggregate: 'aggregateAllItemData',
        destinationFieldName: 'appointments',
        options: {},
    };

    @node({
        id: '98af4f77-3e01-43c6-9940-4069abe96e95',
        name: 'get by client',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.3,
        position: [2272, 7248],
        onError: 'continueErrorOutput',
    })
    GetByClient = {
        url: "={{ $('data handler').first().json.api.url }}/appointments/",
        sendQuery: true,
        queryParameters: {
            parameters: [
                {
                    name: 'client_id',
                    value: "={{ $('data handler').first().json.client.id }}",
                },
            ],
        },
        sendHeaders: true,
        headerParameters: {
            parameters: [
                {
                    name: 'Authorization',
                    value: "={{ $('data handler').first().json.api.token }}",
                },
            ],
        },
        options: {},
    };

    @node({
        id: '7899b059-fbea-4884-a44e-9cdda48d3d2c',
        name: 'get by id',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.3,
        position: [2272, 6912],
        onError: 'continueErrorOutput',
    })
    GetById = {
        url: "={{ $('data handler').first().json.api.url }}/appointments/{{ $('data handler').first().json.data.appointment.id }}",
        sendHeaders: true,
        headerParameters: {
            parameters: [
                {
                    name: 'Authorization',
                    value: "={{ $('data handler').first().json.api.token }}",
                },
            ],
        },
        options: {},
    };

    @node({
        id: '6f38066a-9a07-48e4-95fd-25256ab058e0',
        name: 'id?',
        type: 'n8n-nodes-base.if',
        version: 2.3,
        position: [1872, 7088],
    })
    Id = {
        conditions: {
            options: {
                caseSensitive: true,
                leftValue: '',
                typeValidation: 'strict',
                version: 3,
            },
            conditions: [
                {
                    id: 'a7b05632-1078-42fa-ae6f-de3be1db8cde',
                    leftValue: "={{ $('data handler').item.json.data.appointment.id }}",
                    rightValue: '',
                    operator: {
                        type: 'string',
                        operation: 'notEmpty',
                        singleValue: true,
                    },
                },
            ],
            combinator: 'and',
        },
        options: {},
    };

    @node({
        id: 'cea68d7a-e6ff-489a-92ea-fdb6096589ef',
        name: 'pre-context',
        type: 'n8n-nodes-base.set',
        version: 3.4,
        position: [2688, 6896],
    })
    PreContext = {
        assignments: {
            assignments: [
                {
                    id: '79b424a3-a6ce-45db-88aa-b5968a02e34a',
                    name: 'appointment',
                    value: '={{ $json }}',
                    type: 'object',
                },
            ],
        },
        options: {},
    };

    @node({
        id: '44cc6c23-3fc0-4c8c-9e0a-cb418db7fa84',
        name: 'appointment context',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [3376, 6896],
    })
    AppointmentContext = {
        mode: 'runOnceForAllItems',
        jsCode: `const appointments = $('pre-context').all()
  .map((item) => item.json.appointment)
  .filter((appointment) => appointment && typeof appointment === 'object');

const professionalItems = $('professional context').all();
const serviceItems = $('service context').all();

const professionals = professionalItems.flatMap((item) => {
  if (Array.isArray(item.json.professionals)) return item.json.professionals;
  if (item.json.professional && typeof item.json.professional === 'object') return [item.json.professional];
  return [];
});

const services = serviceItems.flatMap((item) => {
  if (Array.isArray(item.json.services)) return item.json.services;
  if (item.json.service && typeof item.json.service === 'object') return [item.json.service];
  return [];
});

const runtime = $('data handler').first().json;
const client = { ...(runtime.client || {}) };
const business = { ...(runtime.business || {}) };
delete client.business_id;

const timezone = business.timezone || 'America/Sao_Paulo';

const safeDate = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d) ? null : d;
};

const formatDate = (date) =>
  date
    ? new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: timezone,
      }).format(date)
    : null;

const formatTime = (date) =>
  date
    ? new Intl.DateTimeFormat('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: timezone,
      }).format(date)
    : null;

const formatWeekday = (date) => {
  if (!date) return null;

  const weekday = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    timeZone: timezone,
  }).format(date);

  return weekday.charAt(0).toUpperCase() + weekday.slice(1);
};

return appointments.map((source) => {
  const base = source[""] && typeof source[""] === 'object' ? source[""] : {};
  const result = { ...base };

  for (const key in source) {
    if (key !== "") result[key] = source[key];
  }

  const professionalId = result.professional_id;
  const serviceId = result.service_id;
  const professional = {
    ...(professionals.find((item) => String(item?.id) === String(professionalId)) || professionals[0] || {}),
  };
  const service = {
    ...(services.find((item) => String(item?.id) === String(serviceId)) || services[0] || {}),
  };

  professional.email = String(professional.email ?? '').trim();
  delete professional.business_id;
  delete professional.is_active;
  delete service.business_id;
  delete service.is_active;

  delete result.business_id;
  delete result.client_id;
  delete result.professional_id;
  delete result.service_id;
  delete result.created_at;

  const startDate = safeDate(result.start_datetime);
  const endDate = safeDate(result.end_datetime);

  return {
    json: {
      ...result,
      date: formatDate(startDate),
      weekday: formatWeekday(startDate),
      start_time: formatTime(startDate),
      end_time: formatTime(endDate),
      professional,
      service,
      client,
      business,
    },
  };
});`,
    };

    @node({
        id: '550ae55d-8250-4e07-bf1c-3c4a0ae3a7c3',
        name: 'prepare email notification',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [4160, 6800],
    })
    PrepareEmailNotification = {
        mode: 'runOnceForEachItem',
        jsCode: `const appointment = $('appointment context').item.json ?? {};
const data = $('data handler').item.json.data ?? {};

const clean = (value) => {
  const normalized = String(value ?? '').trim();
  return !normalized || ['null', 'undefined'].includes(normalized.toLowerCase()) ? '' : normalized;
};

const escapeHtml = (value) => clean(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const action = clean(data.action).toLowerCase();
const workflowScope = clean($workflow.id) || 'unknown-workflow';
const businessId = clean(appointment.business?.id ?? $('data handler').item.json.business?.id);
const appointmentId = clean(appointment.id);
const clientId = clean(appointment.client?.id);
const professionalId = clean(appointment.professional?.id);
const serviceId = clean(appointment.service?.id);
const professionalName = clean(appointment.professional?.name);
const recipient = clean(appointment.professional?.email);
const clientName = clean(appointment.client?.name);
const serviceName = clean(appointment.service?.name);
const date = clean(appointment.date);
const weekday = clean(appointment.weekday);
const startTime = clean(appointment.start_time);
const endTime = clean(appointment.end_time);
const startDatetime = clean(appointment.start_datetime);
const endDatetime = clean(appointment.end_datetime);
const durationMinutes = clean(appointment.service?.duration_minutes);
const businessAddress = clean(appointment.business?.address);
const botName = clean(appointment.business?.name);
const sourceEventId = clean($('data handler').item.json.client?.message_id);

const reasons = [];
if (!['post', 'update', 'cancel'].includes(action)) reasons.push('unsupported_action');
if (!appointmentId) reasons.push('missing_appointment_id');
if (!professionalId) reasons.push('missing_professional_id');
if (!serviceId) reasons.push('missing_service_id');
if (!professionalName) reasons.push('missing_professional_name');
if (!recipient) {
  reasons.push('missing_professional_email');
} else if (recipient.length > 254 || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(recipient)) {
  reasons.push('invalid_professional_email');
}
if (!clientName) reasons.push('missing_client_name');
if (!serviceName) reasons.push('missing_service_name');
if (!date) reasons.push('missing_appointment_date');
if (!startTime) reasons.push('missing_appointment_time');
if (!startDatetime) reasons.push('missing_start_datetime');

const fnv1a = (value) => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
};

const signature = [
  workflowScope,
  businessId,
  action,
  appointmentId,
  clientId,
  professionalId,
  serviceId,
  startDatetime,
  endDatetime,
  recipient,
  sourceEventId,
].join('|');
const signatureHash = fnv1a(signature);
const eventKey = 'beautyflow-notify-' + action + '-' + appointmentId + '-' + signatureHash;
const claimKey = [
  'beautyflow_notify',
  workflowScope,
  businessId || 'unknown-business',
  action,
  appointmentId,
  signatureHash,
].join('.');
const dateLabel = date ? (weekday ? date + ' (' + weekday + ')' : date) : 'Não informada';
const timeLabel = startTime ? (endTime ? startTime + ' - ' + endTime : startTime) : 'Não informado';
const durationLabel = durationMinutes ? durationMinutes + ' min' : 'Não informada';

return {
  json: {
    action,
    workflowScope,
    businessId,
    appointmentId,
    clientId,
    professionalId,
    serviceId,
    professionalName,
    recipient,
    clientName,
    serviceName,
    date,
    weekday,
    startTime,
    endTime,
    startDatetime,
    endDatetime,
    durationMinutes,
    signature,
    eventKey,
    claimKey,
    sourceEventId,
    canSend: reasons.length === 0,
    skipReason: reasons.join(','),
    safe: {
      appointmentId: escapeHtml(appointmentId || 'Não informado'),
      professionalName: escapeHtml(professionalName || 'Profissional'),
      clientName: escapeHtml(clientName || 'Cliente'),
      serviceName: escapeHtml(serviceName || 'Serviço não informado'),
      dateLabel: escapeHtml(dateLabel),
      timeLabel: escapeHtml(timeLabel),
      durationLabel: escapeHtml(durationLabel),
      businessAddress: escapeHtml(businessAddress || 'Não informado'),
      botName: escapeHtml(botName || 'Equipe de agendamento'),
      eventKey: escapeHtml(eventKey),
    },
  },
};`,
    };

    @node({
        id: '88d76e19-24bd-4723-87f9-fb2ea373da2d',
        name: 'can send email?',
        type: 'n8n-nodes-base.if',
        version: 2.3,
        position: [4384, 6800],
    })
    CanSendEmail = {
        conditions: {
            options: {
                caseSensitive: true,
                leftValue: '',
                typeValidation: 'strict',
                version: 3,
            },
            conditions: [
                {
                    id: '8b3f3cc0-07af-4a38-934f-68a2d3d488fe',
                    leftValue: '={{ $json.canSend }}',
                    rightValue: '',
                    operator: {
                        type: 'boolean',
                        operation: 'true',
                        singleValue: true,
                    },
                },
            ],
            combinator: 'and',
        },
        looseTypeValidation: true,
        options: {},
    };

    @node({
        id: 'd12da5d5-fc6d-4bdf-990c-3b9ad66f82de',
        webhookId: 'ba1b2c6c-348d-4461-826d-bc2d4ab308f8',
        name: 'find sent notification',
        type: 'n8n-nodes-base.gmail',
        version: 2.2,
        position: [4608, 6800],
        credentials: { gmailOAuth2: { id: 'KD9KohSq7p0CzQL0', name: 'gmail beautyflow' } },
        onError: 'continueErrorOutput',
        alwaysOutputData: true,
    })
    FindSentNotification = {
        operation: 'getAll',
        limit: 1,
        filters: {
            q: '=in:sent subject:"{{ $(\'prepare email notification\').item.json.eventKey }}"',
        },
    };

    @node({
        id: 'ef02515e-d3a4-4dd9-8ee1-16807aecaaf6',
        name: 'email already sent?',
        type: 'n8n-nodes-base.if',
        version: 2.3,
        position: [4832, 6800],
    })
    EmailAlreadySent = {
        conditions: {
            options: {
                caseSensitive: true,
                leftValue: '',
                typeValidation: 'loose',
                version: 3,
            },
            conditions: [
                {
                    id: '0af85697-d5df-4cef-9708-66604db73276',
                    leftValue: '={{ Boolean($json.id) }}',
                    rightValue: '',
                    operator: {
                        type: 'boolean',
                        operation: 'true',
                        singleValue: true,
                    },
                },
            ],
            combinator: 'and',
        },
        options: {},
    };

    @node({
        id: '6b2e4a31-cc81-4ae5-92a5-010ca14ff823',
        name: 'claim notification',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [5056, 6928],
        credentials: { redis: { id: 'yq1GIl0nbdK5QpYm', name: 'beautyflow test' } },
        onError: 'continueErrorOutput',
    })
    ClaimNotification = {
        operation: 'incr',
        key: "={{ $('prepare email notification').item.json.claimKey }}",
        expire: true,
        ttl: 300,
    };

    @node({
        id: 'b3fa7f27-f5d3-4ee3-95ba-6adab9fdd26c',
        name: 'notification claimed?',
        type: 'n8n-nodes-base.if',
        version: 2.3,
        position: [5280, 6928],
    })
    NotificationClaimed = {
        conditions: {
            options: {
                caseSensitive: true,
                leftValue: '',
                typeValidation: 'strict',
                version: 3,
            },
            conditions: [
                {
                    id: '2d106205-6f75-48a0-92bb-5ad1cc88340d',
                    leftValue: '={{ Number(Object.values($json || {})[0]) }}',
                    rightValue: 1,
                    operator: {
                        type: 'number',
                        operation: 'equals',
                    },
                },
            ],
            combinator: 'and',
        },
        options: {},
    };

    @node({
        id: 'f716b37d-d0bf-49bd-b4be-0b435b491097',
        name: 'notification action',
        type: 'n8n-nodes-base.switch',
        version: 3.4,
        position: [5056, 6800],
    })
    NotificationAction = {
        rules: {
            values: [
                {
                    conditions: {
                        options: {
                            caseSensitive: true,
                            leftValue: '',
                            typeValidation: 'loose',
                            version: 3,
                        },
                        conditions: [
                            {
                                id: '68bb03d6-e996-42af-a4fa-2f4a14602888',
                                leftValue: "={{ $('prepare email notification').item.json.action }}",
                                rightValue: 'post',
                                operator: {
                                    type: 'string',
                                    operation: 'equals',
                                    name: 'filter.operator.equals',
                                },
                            },
                        ],
                        combinator: 'and',
                    },
                    renameOutput: true,
                    outputKey: 'POST',
                },
                {
                    conditions: {
                        options: {
                            caseSensitive: true,
                            leftValue: '',
                            typeValidation: 'loose',
                            version: 3,
                        },
                        conditions: [
                            {
                                id: 'b1385e09-971c-4a3a-a778-b7dad88b5721',
                                leftValue: "={{ $('prepare email notification').item.json.action }}",
                                rightValue: 'update',
                                operator: {
                                    type: 'string',
                                    operation: 'equals',
                                    name: 'filter.operator.equals',
                                },
                            },
                        ],
                        combinator: 'and',
                    },
                    renameOutput: true,
                    outputKey: 'UPDATE',
                },
                {
                    conditions: {
                        options: {
                            caseSensitive: true,
                            leftValue: '',
                            typeValidation: 'loose',
                            version: 3,
                        },
                        conditions: [
                            {
                                id: '6b873880-524c-4bbc-9efa-94b729f45d3b',
                                leftValue: "={{ $('prepare email notification').item.json.action }}",
                                rightValue: 'cancel',
                                operator: {
                                    type: 'string',
                                    operation: 'equals',
                                    name: 'filter.operator.equals',
                                },
                            },
                        ],
                        combinator: 'and',
                    },
                    renameOutput: true,
                    outputKey: 'CANCEL',
                },
            ],
        },
        looseTypeValidation: true,
        options: {
            fallbackOutput: 'extra',
            renameFallbackOutput: 'SKIP',
        },
    };

    @node({
        id: '3b9f10fa-b713-4822-9111-bb6dfbc33fb1',
        webhookId: 'de7e1eb8-bf6b-4f21-8e15-60126484561d',
        name: 'confirmation email',
        type: 'n8n-nodes-base.gmail',
        version: 2.2,
        position: [5280, 6480],
        credentials: { gmailOAuth2: { id: 'KD9KohSq7p0CzQL0', name: 'gmail beautyflow' } },
        onError: 'continueErrorOutput',
    })
    ConfirmationEmail = {
        sendTo: "={{ $('prepare email notification').item.json.recipient }}",
        subject:
            "=Novo agendamento confirmado - {{ $('prepare email notification').item.json.clientName }} - [{{ $('prepare email notification').item.json.eventKey }}]",
        message: `=<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>Novo agendamento confirmado</title></head>
<body style="margin:0;padding:24px;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px;">
    <h1 style="font-size:22px;margin:0 0 24px;">Novo agendamento confirmado</h1>
    <p>Olá, <strong>{{ $('prepare email notification').item.json.safe.professionalName }}</strong>.</p>
    <p>Um novo agendamento foi confirmado em sua agenda.</p>
    <ul>
      <li><strong>ID:</strong> {{ $('prepare email notification').item.json.safe.appointmentId }}</li>
      <li><strong>Cliente:</strong> {{ $('prepare email notification').item.json.safe.clientName }}</li>
      <li><strong>Serviço:</strong> {{ $('prepare email notification').item.json.safe.serviceName }}</li>
      <li><strong>Data:</strong> {{ $('prepare email notification').item.json.safe.dateLabel }}</li>
      <li><strong>Horário:</strong> {{ $('prepare email notification').item.json.safe.timeLabel }}</li>
      <li><strong>Duração:</strong> {{ $('prepare email notification').item.json.safe.durationLabel }}</li>
      <li><strong>Unidade / Local:</strong> {{ $('prepare email notification').item.json.safe.businessAddress }}</li>
    </ul>
    <p>Atenciosamente,<br><strong>{{ $('prepare email notification').item.json.safe.botName }}</strong>.</p>
    <p style="font-size:12px;color:#6b7280;">Referência: {{ $('prepare email notification').item.json.safe.eventKey }}</p>
  </div>
</body>
</html>`,
        options: {
            appendAttribution: true,
        },
    };

    @node({
        id: '148abab5-5795-4ea5-8308-0fa64d91cd86',
        webhookId: '2389cc82-e8d9-493e-b5a3-966e3115e84b',
        name: 'update email',
        type: 'n8n-nodes-base.gmail',
        version: 2.2,
        position: [5280, 6800],
        credentials: { gmailOAuth2: { id: 'KD9KohSq7p0CzQL0', name: 'gmail beautyflow' } },
        onError: 'continueErrorOutput',
    })
    UpdateEmail = {
        sendTo: "={{ $('prepare email notification').item.json.recipient }}",
        subject:
            "=Agendamento atualizado - {{ $('prepare email notification').item.json.clientName }} - [{{ $('prepare email notification').item.json.eventKey }}]",
        message: `=<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>Agendamento atualizado</title></head>
<body style="margin:0;padding:24px;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px;">
    <h1 style="font-size:22px;margin:0 0 24px;">Agendamento atualizado</h1>
    <p>Olá, <strong>{{ $('prepare email notification').item.json.safe.professionalName }}</strong>.</p>
    <p>O agendamento abaixo foi atualizado. Confira os dados atuais:</p>
    <ul>
      <li><strong>ID:</strong> {{ $('prepare email notification').item.json.safe.appointmentId }}</li>
      <li><strong>Cliente:</strong> {{ $('prepare email notification').item.json.safe.clientName }}</li>
      <li><strong>Serviço:</strong> {{ $('prepare email notification').item.json.safe.serviceName }}</li>
      <li><strong>Data:</strong> {{ $('prepare email notification').item.json.safe.dateLabel }}</li>
      <li><strong>Horário:</strong> {{ $('prepare email notification').item.json.safe.timeLabel }}</li>
      <li><strong>Duração:</strong> {{ $('prepare email notification').item.json.safe.durationLabel }}</li>
      <li><strong>Unidade / Local:</strong> {{ $('prepare email notification').item.json.safe.businessAddress }}</li>
    </ul>
    <p>Atenciosamente,<br><strong>{{ $('prepare email notification').item.json.safe.botName }}</strong>.</p>
    <p style="font-size:12px;color:#6b7280;">Referência: {{ $('prepare email notification').item.json.safe.eventKey }}</p>
  </div>
</body>
</html>`,
        options: {
            appendAttribution: true,
        },
    };

    @node({
        id: '24423725-4ff1-4fce-807d-534e55b087d4',
        webhookId: 'd84c55dd-69cb-4485-b3f0-db61a539a855',
        name: 'delete email',
        type: 'n8n-nodes-base.gmail',
        version: 2.2,
        position: [5280, 7120],
        credentials: { gmailOAuth2: { id: 'KD9KohSq7p0CzQL0', name: 'gmail beautyflow' } },
        onError: 'continueErrorOutput',
    })
    DeleteEmail = {
        sendTo: "={{ $('prepare email notification').item.json.recipient }}",
        subject:
            "=Agendamento cancelado - {{ $('prepare email notification').item.json.clientName }} - [{{ $('prepare email notification').item.json.eventKey }}]",
        message: `=<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>Agendamento cancelado</title></head>
<body style="margin:0;padding:24px;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px;">
    <h1 style="font-size:22px;margin:0 0 24px;">Agendamento cancelado</h1>
    <p>Olá, <strong>{{ $('prepare email notification').item.json.safe.professionalName }}</strong>.</p>
    <p>O agendamento abaixo foi cancelado e removido da sua agenda:</p>
    <ul>
      <li><strong>ID:</strong> {{ $('prepare email notification').item.json.safe.appointmentId }}</li>
      <li><strong>Cliente:</strong> {{ $('prepare email notification').item.json.safe.clientName }}</li>
      <li><strong>Serviço:</strong> {{ $('prepare email notification').item.json.safe.serviceName }}</li>
      <li><strong>Data:</strong> {{ $('prepare email notification').item.json.safe.dateLabel }}</li>
      <li><strong>Horário:</strong> {{ $('prepare email notification').item.json.safe.timeLabel }}</li>
      <li><strong>Duração:</strong> {{ $('prepare email notification').item.json.safe.durationLabel }}</li>
      <li><strong>Unidade / Local:</strong> {{ $('prepare email notification').item.json.safe.businessAddress }}</li>
    </ul>
    <p>O horário correspondente está novamente disponível em sua agenda.</p>
    <p>Atenciosamente,<br><strong>{{ $('prepare email notification').item.json.safe.botName }}</strong>.</p>
    <p style="font-size:12px;color:#6b7280;">Referência: {{ $('prepare email notification').item.json.safe.eventKey }}</p>
  </div>
</body>
</html>`,
        options: {
            appendAttribution: true,
        },
    };

    @node({
        id: '86af3316-2d1c-445a-a1a2-69bf101657fe',
        name: 'error report 24',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [5504, 6480],
        onError: 'continueRegularOutput',
    })
    ErrorReport24 = {
        workflowId: {
            __rl: true,
            value: 'BxyJLKjTEcfzV18k',
            mode: 'list',
            cachedResultUrl: '/workflow/BxyJLKjTEcfzV18k',
            cachedResultName: 'error test',
        },
        workflowInputs: {
            mappingMode: 'defineBelow',
            value: {
                error: `={{ {
  workflow: $workflow.id,
  execution: $execution.id,
  type: "external.gmail",
  node: $prevNode.name,
    code: $json.error.status || '',
    description:
  (() => {
    try {
      const part = $json.error.message.split(' - ')[1];
      return JSON.parse(JSON.parse(part)).detail;
    } catch (e) {
      return $json.error.message;
    }
  })()
} }}
`,
                business: `={{ {
  id: $('data handler').first().json.business?.id || '',
  name: $('data handler').first().json.business?.name || '',
  phone: $('data handler').first().json.business?.phone || ''
} }}`,
                client: `={{ {
  remote_jid: $('data handler').first().json.client?.remote_jid || $('webhook').first().json.client?.remote_jid || '',
  message_id: $('data handler').first().json.client?.message_id || $('webhook').first().json.client?.message_id || '',
  message_text: $('data handler').first().json.client?.message_text || $('webhook').first().json.client?.message_text || ''
} }}`,
                api: "={{ ((api) => { const { token, Authorization, authorization, ...safeApi } = api || {}; return safeApi; })($('data handler').first().json.api || {}) }}",
            },
            matchingColumns: [],
            schema: [
                {
                    id: 'error',
                    displayName: 'error',
                    required: false,
                    defaultMatch: false,
                    display: true,
                    canBeUsedToMatch: true,
                    type: 'object',
                    removed: false,
                },
                {
                    id: 'business',
                    displayName: 'business',
                    required: false,
                    defaultMatch: false,
                    display: true,
                    canBeUsedToMatch: true,
                    type: 'object',
                    removed: false,
                },
                {
                    id: 'client',
                    displayName: 'client',
                    required: false,
                    defaultMatch: false,
                    display: true,
                    canBeUsedToMatch: true,
                    type: 'object',
                    removed: false,
                },
                {
                    id: 'api',
                    displayName: 'api',
                    required: false,
                    defaultMatch: false,
                    display: true,
                    canBeUsedToMatch: true,
                    type: 'object',
                    removed: false,
                },
            ],
            attemptToConvertTypes: true,
            convertFieldsToString: true,
        },
        options: {
            waitForSubWorkflow: false,
        },
    };

    @node({
        id: 'f9680d3e-ac6b-43e6-824b-d9063ba60b5f',
        name: 'error report 26',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [5504, 6800],
        onError: 'continueRegularOutput',
    })
    ErrorReport26 = {
        workflowId: {
            __rl: true,
            value: 'BxyJLKjTEcfzV18k',
            mode: 'list',
            cachedResultUrl: '/workflow/BxyJLKjTEcfzV18k',
            cachedResultName: 'error test',
        },
        workflowInputs: {
            mappingMode: 'defineBelow',
            value: {
                error: `={{ {
  workflow: $workflow.id,
  execution: $execution.id,
  type: "external.gmail",
  node: $prevNode.name,
    code: $json.error.status || '',
    description:
  (() => {
    try {
      const part = $json.error.message.split(' - ')[1];
      return JSON.parse(JSON.parse(part)).detail;
    } catch (e) {
      return $json.error.message;
    }
  })()
} }}
`,
                business: `={{ {
  id: $('data handler').first().json.business?.id || '',
  name: $('data handler').first().json.business?.name || '',
  phone: $('data handler').first().json.business?.phone || ''
} }}`,
                client: `={{ {
  remote_jid: $('data handler').first().json.client?.remote_jid || $('webhook').first().json.client?.remote_jid || '',
  message_id: $('data handler').first().json.client?.message_id || $('webhook').first().json.client?.message_id || '',
  message_text: $('data handler').first().json.client?.message_text || $('webhook').first().json.client?.message_text || ''
} }}`,
                api: "={{ ((api) => { const { token, Authorization, authorization, ...safeApi } = api || {}; return safeApi; })($('data handler').first().json.api || {}) }}",
            },
            matchingColumns: [],
            schema: [
                {
                    id: 'error',
                    displayName: 'error',
                    required: false,
                    defaultMatch: false,
                    display: true,
                    canBeUsedToMatch: true,
                    type: 'object',
                    removed: false,
                },
                {
                    id: 'business',
                    displayName: 'business',
                    required: false,
                    defaultMatch: false,
                    display: true,
                    canBeUsedToMatch: true,
                    type: 'object',
                    removed: false,
                },
                {
                    id: 'client',
                    displayName: 'client',
                    required: false,
                    defaultMatch: false,
                    display: true,
                    canBeUsedToMatch: true,
                    type: 'object',
                    removed: false,
                },
                {
                    id: 'api',
                    displayName: 'api',
                    required: false,
                    defaultMatch: false,
                    display: true,
                    canBeUsedToMatch: true,
                    type: 'object',
                    removed: false,
                },
            ],
            attemptToConvertTypes: true,
            convertFieldsToString: true,
        },
        options: {
            waitForSubWorkflow: false,
        },
    };

    @node({
        id: 'f8836ea8-5598-4610-8f1e-30422ae46094',
        name: 'error report',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [5504, 7120],
        onError: 'continueRegularOutput',
    })
    ErrorReport = {
        workflowId: {
            __rl: true,
            value: 'BxyJLKjTEcfzV18k',
            mode: 'list',
            cachedResultUrl: '/workflow/BxyJLKjTEcfzV18k',
            cachedResultName: 'error test',
        },
        workflowInputs: {
            mappingMode: 'defineBelow',
            value: {
                error: `={{ {
  workflow: $workflow.id,
  execution: $execution.id,
  type: "external.gmail",
  node: $prevNode.name,
    code: $json.error.status || '',
    description:
  (() => {
    try {
      const part = $json.error.message.split(' - ')[1];
      return JSON.parse(JSON.parse(part)).detail;
    } catch (e) {
      return $json.error.message;
    }
  })()
} }}
`,
                business: `={{ {
  id: $('data handler').first().json.business?.id || '',
  name: $('data handler').first().json.business?.name || '',
  phone: $('data handler').first().json.business?.phone || ''
} }}`,
                client: `={{ {
  remote_jid: $('data handler').first().json.client?.remote_jid || $('webhook').first().json.client?.remote_jid || '',
  message_id: $('data handler').first().json.client?.message_id || $('webhook').first().json.client?.message_id || '',
  message_text: $('data handler').first().json.client?.message_text || $('webhook').first().json.client?.message_text || ''
} }}`,
                api: "={{ ((api) => { const { token, Authorization, authorization, ...safeApi } = api || {}; return safeApi; })($('data handler').first().json.api || {}) }}",
            },
            matchingColumns: [],
            schema: [
                {
                    id: 'error',
                    displayName: 'error',
                    required: false,
                    defaultMatch: false,
                    display: true,
                    canBeUsedToMatch: true,
                    type: 'object',
                    removed: false,
                },
                {
                    id: 'business',
                    displayName: 'business',
                    required: false,
                    defaultMatch: false,
                    display: true,
                    canBeUsedToMatch: true,
                    type: 'object',
                    removed: false,
                },
                {
                    id: 'client',
                    displayName: 'client',
                    required: false,
                    defaultMatch: false,
                    display: true,
                    canBeUsedToMatch: true,
                    type: 'object',
                    removed: false,
                },
                {
                    id: 'api',
                    displayName: 'api',
                    required: false,
                    defaultMatch: false,
                    display: true,
                    canBeUsedToMatch: true,
                    type: 'object',
                    removed: false,
                },
            ],
            attemptToConvertTypes: true,
            convertFieldsToString: true,
        },
        options: {
            waitForSubWorkflow: false,
        },
    };

    @node({
        id: '69253461-6413-450f-ab8e-bf6cacc2bfa3',
        name: 'return context',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [5136, 6880],
    })
    ReturnContext = {
        mode: 'runOnceForEachItem',
        jsCode: `const action = $('data handler').first().json.data?.action;
const source = action === 'get' ? $json : $('appointment context').item.json;

const result = source[""] ? source[""] : source;

if (action === 'cancel') {
  result.status = 'canceled';
}

return {
  json: result
};`,
    };

    @node({
        id: '0b1ae3e3-bd0c-409d-a5b1-cb61a2b302ae',
        name: 'error report 16',
        type: 'n8n-nodes-base.stopAndError',
        version: 1,
        position: [2272, 7392],
    })
    ErrorReport16 = {
        errorType: 'errorObject',
        errorObject: `={
  "error": {
    "workflow": "{{ $workflow.id }}",
    "execution": "{{ $execution.id }}",
    "type": "internal.api.get_appointment",
    "node": "{{ $prevNode.name }}",
    "code": "{{ $json.error.status || '' }}",
    "description": "{{
(() => {
  try {
    const part = $json.error.message.split(' - ')[1];
    return JSON.parse(JSON.parse(part)).detail;
  } catch (e) {
    return $json.error.message;
  }
})()
}}"
  },
  "business": {
    "id": "{{ $('data handler').first().json.business?.id || '' }}",
    "name": "{{ $('data handler').first().json.business?.name || '' }}",
    "phone": "{{ $('data handler').first().json.business?.phone || '' }}"
  },
  "client": {
    "remote_jid": "{{ $('data handler').first().json.client?.remote_jid || $('webhook').first().json.client?.remote_jid || '' }}",
    "message_id": "{{ $('data handler').first().json.client?.message_id || $('webhook').first().json.client?.message_id || '' }}",
    "message_text": "{{ $('data handler').first().json.client?.message_text || $('webhook').first().json.client?.message_text || '' }}"
  },
  "api": {
    "url": "{{ $('data handler').first().json.api?.url || '' }}",
    "token": "",
    "evo_instance": "{{ $('data handler').first().json.api?.evo_instance || '' }}"
  }
}`,
    };

    @node({
        id: 'dfab9dda-5ca5-4194-9bf1-a8c2266c61ec',
        name: 'error report 18',
        type: 'n8n-nodes-base.stopAndError',
        version: 1,
        position: [2272, 7056],
    })
    ErrorReport18 = {
        errorType: 'errorObject',
        errorObject: `={
  "error": {
    "workflow": "{{ $workflow.id }}",
    "execution": "{{ $execution.id }}",
    "type": "business.appointment_cancel",
    "node": "{{ $prevNode.name }}",
    "code": "{{ $json.error.status || '' }}",
    "description": "{{
(() => {
  try {
    const part = $json.error.message.split(' - ')[1];
    return JSON.parse(JSON.parse(part)).detail;
  } catch (e) {
    return $json.error.message;
  }
})()
}}"
  },
  "business": {
    "id": "{{ $('data handler').first().json.business?.id || '' }}",
    "name": "{{ $('data handler').first().json.business?.name || '' }}",
    "phone": "{{ $('data handler').first().json.business?.phone || '' }}"
  },
  "client": {
    "remote_jid": "{{ $('data handler').first().json.client?.remote_jid || $('webhook').first().json.client?.remote_jid || '' }}",
    "message_id": "{{ $('data handler').first().json.client?.message_id || $('webhook').first().json.client?.message_id || '' }}",
    "message_text": "{{ $('data handler').first().json.client?.message_text || $('webhook').first().json.client?.message_text || '' }}"
  },
  "api": {
    "url": "{{ $('data handler').first().json.api?.url || '' }}",
    "token": "",
    "evo_instance": "{{ $('data handler').first().json.api?.evo_instance || '' }}"
  }
}`,
    };

    @node({
        id: 'd7c1f0b4-0767-4df1-bd82-ba0a81297e41',
        name: 'error report 19',
        type: 'n8n-nodes-base.stopAndError',
        version: 1,
        position: [2272, 6752],
    })
    ErrorReport19 = {
        errorType: 'errorObject',
        errorObject: `={
  "error": {
    "workflow": "{{ $workflow.id }}",
    "execution": "{{ $execution.id }}",
    "type": "business.appointment_update",
    "node": "{{ $prevNode.name }}",
    "code": "{{ $json.error.status || '' }}",
    "description": "{{
(() => {
  try {
    const part = $json.error.message.split(' - ')[1];
    return JSON.parse(JSON.parse(part)).detail;
  } catch (e) {
    return $json.error.message;
  }
})()
}}"
  },
  "business": {
    "id": "{{ $('data handler').first().json.business?.id || '' }}",
    "name": "{{ $('data handler').first().json.business?.name || '' }}",
    "phone": "{{ $('data handler').first().json.business?.phone || '' }}"
  },
  "client": {
    "remote_jid": "{{ $('data handler').first().json.client?.remote_jid || $('webhook').first().json.client?.remote_jid || '' }}",
    "message_id": "{{ $('data handler').first().json.client?.message_id || $('webhook').first().json.client?.message_id || '' }}",
    "message_text": "{{ $('data handler').first().json.client?.message_text || $('webhook').first().json.client?.message_text || '' }}"
  },
  "api": {
    "url": "{{ $('data handler').first().json.api?.url || '' }}",
    "token": "",
    "evo_instance": "{{ $('data handler').first().json.api?.evo_instance || '' }}"
  }
}`,
    };

    @node({
        id: 'bd850abe-d01a-4849-b1d5-e2fa1c97d844',
        name: 'error report 20',
        type: 'n8n-nodes-base.stopAndError',
        version: 1,
        position: [2272, 6432],
    })
    ErrorReport20 = {
        errorType: 'errorObject',
        errorObject: `={
  "error": {
    "workflow": "{{ $workflow.id }}",
    "execution": "{{ $execution.id }}",
    "type": "business.appointment_create",
    "node": "{{ $prevNode.name }}",
    "code": "{{ $json.error.status || '' }}",
    "description": "{{
(() => {
  try {
    const part = $json.error.message.split(' - ')[1];
    return JSON.parse(JSON.parse(part)).detail;
  } catch (e) {
    return $json.error.message;
  }
})()
}}"
  },
  "business": {
    "id": "{{ $('data handler').first().json.business?.id || '' }}",
    "name": "{{ $('data handler').first().json.business?.name || '' }}",
    "phone": "{{ $('data handler').first().json.business?.phone || '' }}"
  },
  "client": {
    "remote_jid": "{{ $('data handler').first().json.client?.remote_jid || $('webhook').first().json.client?.remote_jid || '' }}",
    "message_id": "{{ $('data handler').first().json.client?.message_id || $('webhook').first().json.client?.message_id || '' }}",
    "message_text": "{{ $('data handler').first().json.client?.message_text || $('webhook').first().json.client?.message_text || '' }}"
  },
  "api": {
    "url": "{{ $('data handler').first().json.api?.url || '' }}",
    "token": "",
    "evo_instance": "{{ $('data handler').first().json.api?.evo_instance || '' }}"
  }
}`,
    };

    @node({
        id: '772bdfd1-2030-4f70-a804-645091e78607',
        name: 'error report 21',
        type: 'n8n-nodes-base.stopAndError',
        version: 1,
        position: [4192, 7136],
    })
    ErrorReport21 = {
        errorType: 'errorObject',
        errorObject: `={
  "error": {
    "workflow": "{{ $workflow.id }}",
    "execution": "{{ $execution.id }}",
    "type": "business.appointment_cancel",
    "node": "{{ $prevNode.name }}",
    "code": "{{ $json.error.status || '' }}",
    "description": "{{
(() => {
  try {
    const part = $json.error.message.split(' - ')[1];
    return JSON.parse(JSON.parse(part)).detail;
  } catch (e) {
    return $json.error.message;
  }
})()
}}"
  },
  "business": {
    "id": "{{ $('data handler').first().json.business?.id || '' }}",
    "name": "{{ $('data handler').first().json.business?.name || '' }}",
    "phone": "{{ $('data handler').first().json.business?.phone || '' }}"
  },
  "client": {
    "remote_jid": "{{ $('data handler').first().json.client?.remote_jid || $('webhook').first().json.client?.remote_jid || '' }}",
    "message_id": "{{ $('data handler').first().json.client?.message_id || $('webhook').first().json.client?.message_id || '' }}",
    "message_text": "{{ $('data handler').first().json.client?.message_text || $('webhook').first().json.client?.message_text || '' }}"
  },
  "api": {
    "url": "{{ $('data handler').first().json.api?.url || '' }}",
    "token": "",
    "evo_instance": "{{ $('data handler').first().json.api?.evo_instance || '' }}"
  }
}`,
    };

    @node({
        id: '139093a3-52bf-41fc-bc8e-a4280028529e',
        name: 'service context',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [3152, 6896],
    })
    ServiceContext = {
        workflowId: {
            __rl: true,
            value: 'tPtMFcuYvJPyKHQl',
            mode: 'list',
            cachedResultUrl: '/workflow/tPtMFcuYvJPyKHQl',
            cachedResultName: 'services test',
        },
        workflowInputs: {
            mappingMode: 'defineBelow',
            value: {
                action: 'get',
                service_id: "={{ $('pre-context').first().json.appointment.service_id }}",
                client: "={{ $('data handler').first().json.client }}",
                business: "={{ $('data handler').first().json.business }}",
                api: "={{ $('data handler').first().json.api }}",
            },
            matchingColumns: [],
            schema: [
                {
                    id: 'action',
                    displayName: 'action',
                    required: false,
                    defaultMatch: false,
                    display: true,
                    canBeUsedToMatch: true,
                    type: 'string',
                    removed: false,
                },
                {
                    id: 'service_id',
                    displayName: 'service_id',
                    required: false,
                    defaultMatch: false,
                    display: true,
                    canBeUsedToMatch: true,
                    type: 'string',
                    removed: false,
                },
                {
                    id: 'service_name',
                    displayName: 'service_name',
                    required: false,
                    defaultMatch: false,
                    display: true,
                    canBeUsedToMatch: true,
                    type: 'string',
                    removed: true,
                },
                {
                    id: 'client',
                    displayName: 'client',
                    required: false,
                    defaultMatch: false,
                    display: true,
                    canBeUsedToMatch: true,
                    type: 'object',
                    removed: false,
                },
                {
                    id: 'business',
                    displayName: 'business',
                    required: false,
                    defaultMatch: false,
                    display: true,
                    canBeUsedToMatch: true,
                    type: 'object',
                    removed: false,
                },
                {
                    id: 'api',
                    displayName: 'api',
                    required: false,
                    defaultMatch: false,
                    display: true,
                    canBeUsedToMatch: true,
                    type: 'object',
                    removed: false,
                },
            ],
            attemptToConvertTypes: true,
            convertFieldsToString: true,
        },
        options: {},
    };

    @node({
        id: '5099750b-e5b6-4c01-bffa-b86137ef5aa1',
        name: 'professional context',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [2928, 6896],
    })
    ProfessionalContext = {
        workflowId: {
            __rl: true,
            value: 'rMEHtjR5lFuN97w0',
            mode: 'list',
            cachedResultUrl: '/workflow/rMEHtjR5lFuN97w0',
            cachedResultName: 'professionals test',
        },
        workflowInputs: {
            mappingMode: 'defineBelow',
            value: {
                action: 'get',
                professional_id: "={{ $('pre-context').first().json.appointment.professional_id }}",
                fresh: true,
                client: "={{ $('data handler').first().json.client }}",
                business: "={{ $('data handler').first().json.business }}",
                api: "={{ $('data handler').first().json.api }}",
            },
            matchingColumns: [],
            schema: [
                {
                    id: 'action',
                    displayName: 'action',
                    required: false,
                    defaultMatch: false,
                    display: true,
                    canBeUsedToMatch: true,
                    type: 'string',
                    removed: false,
                },
                {
                    id: 'professional_id',
                    displayName: 'professional_id',
                    required: false,
                    defaultMatch: false,
                    display: true,
                    canBeUsedToMatch: true,
                    type: 'string',
                    removed: false,
                },
                {
                    id: 'professional_name',
                    displayName: 'professional_name',
                    required: false,
                    defaultMatch: false,
                    display: true,
                    canBeUsedToMatch: true,
                    type: 'string',
                    removed: true,
                },
                {
                    id: 'fresh',
                    displayName: 'fresh',
                    required: false,
                    defaultMatch: false,
                    display: true,
                    canBeUsedToMatch: true,
                    type: 'boolean',
                    removed: false,
                },
                {
                    id: 'client',
                    displayName: 'client',
                    required: false,
                    defaultMatch: false,
                    display: true,
                    canBeUsedToMatch: true,
                    type: 'object',
                    removed: false,
                },
                {
                    id: 'business',
                    displayName: 'business',
                    required: false,
                    defaultMatch: false,
                    display: true,
                    canBeUsedToMatch: true,
                    type: 'object',
                    removed: false,
                },
                {
                    id: 'api',
                    displayName: 'api',
                    required: false,
                    defaultMatch: false,
                    display: true,
                    canBeUsedToMatch: true,
                    type: 'object',
                    removed: false,
                },
            ],
            attemptToConvertTypes: true,
            convertFieldsToString: true,
        },
        options: {},
    };

    @node({
        id: 'bc3c170d-05c7-405f-8e69-4cd5ec54afa2',
        name: 'reminder schedule',
        type: 'n8n-nodes-base.scheduleTrigger',
        version: 1.3,
        position: [2624, 7328],
    })
    ReminderSchedule = {
        rule: {
            interval: [
                {
                    field: 'minutes',
                    minutesInterval: 10,
                },
            ],
        },
    };

    @node({
        id: '4a7fe8ad-24b0-4c39-9a48-8d57ade9f436',
        name: 'claim reminders',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.4,
        position: [2848, 7328],
        credentials: { httpBearerAuth: { id: 'GOtlhhje8hFoh3UQ', name: 'n8n beautyflow token - staging' } },
        onError: 'continueErrorOutput',
        retryOnFail: true,
        waitBetweenTries: 1000,
    })
    ClaimReminders = {
        method: 'POST',
        url: 'http://backend-staging:8000/v1/appointment-reminders/claim',
        authentication: 'genericCredentialType',
        genericAuthType: 'httpBearerAuth',
        sendBody: true,
        specifyBody: 'json',
        jsonBody: '={{ { limit: 20 } }}',
        options: {},
    };

    @node({
        id: '324117b5-d786-4ea3-b4aa-3b996ee4b95f',
        name: 'split reminder claims',
        type: 'n8n-nodes-base.splitOut',
        version: 1,
        position: [3072, 7328],
    })
    SplitReminderClaims = {
        fieldToSplitOut: 'reminders',
        options: {},
    };

    @node({
        id: 'c658d37f-3546-4abb-8b0c-999b8fb47ef1',
        name: 'send reminder',
        type: 'n8n-nodes-evolution-api.evolutionApi',
        version: 1,
        position: [3296, 7328],
        credentials: { evolutionApi: { id: 'vlj9dRMZQEffBnHW', name: 'beautyflow - staging' } },
        onError: 'continueErrorOutput',
        retryOnFail: true,
        waitBetweenTries: 1000,
    })
    SendReminder = {
        resource: 'messages-api',
        instanceName: '={{ $json.evolution.instance_name }}',
        remoteJid: '={{ $json.client.remote_jid }}',
        messageText: '={{ $json.message }}',
        options_message: {
            delay: 1000,
        },
    };

    @node({
        id: 'e8f56c53-c0fa-46b1-90c6-3e936d5bfb96',
        name: 'mark reminder sent',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.4,
        position: [3520, 7248],
        credentials: { httpBearerAuth: { id: 'GOtlhhje8hFoh3UQ', name: 'n8n beautyflow token - staging' } },
        onError: 'continueErrorOutput',
        retryOnFail: true,
        waitBetweenTries: 1000,
    })
    MarkReminderSent = {
        method: 'POST',
        url: "=http://backend-staging:8000/v1/appointment-reminders/{{ $('split reminder claims').first().json.id }}/sent",
        authentication: 'genericCredentialType',
        genericAuthType: 'httpBearerAuth',
        sendBody: true,
        specifyBody: 'json',
        jsonBody: `={{ (() => {
  const response = $json || {};
  return {
    external_message_id:
      response.key?.id ||
      response.message?.key?.id ||
      response.data?.key?.id ||
      response.messageId ||
      response.id ||
      ''
  };
})() }}`,
        options: {
            response: {
                response: {
                    fullResponse: true,
                    responseFormat: 'text',
                },
            },
        },
    };

    @node({
        id: '34f28b1f-eaae-48cb-ba9d-163252205b71',
        name: 'mark reminder failed',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.4,
        position: [3520, 7408],
        credentials: { httpBearerAuth: { id: 'GOtlhhje8hFoh3UQ', name: 'n8n beautyflow token - staging' } },
        onError: 'continueErrorOutput',
        retryOnFail: true,
        waitBetweenTries: 1000,
    })
    MarkReminderFailed = {
        method: 'POST',
        url: "=http://backend-staging:8000/v1/appointment-reminders/{{ $('split reminder claims').item.json.id }}/failed",
        authentication: 'genericCredentialType',
        genericAuthType: 'httpBearerAuth',
        sendBody: true,
        specifyBody: 'json',
        jsonBody: `={{ (() => {
  const error = $json.error || {};
  const message =
    error.message ||
    error.description ||
    $json.message ||
    'Evolution send failed';

  return {
    error: String(message).slice(0, 2000)
  };
})() }}`,
        options: {
            response: {
                response: {
                    fullResponse: true,
                    responseFormat: 'text',
                },
            },
        },
    };

    @node({
        id: '26c98fae-a5a1-4200-a09c-438f694e37bf',
        name: 'error report 17',
        type: 'n8n-nodes-base.stopAndError',
        version: 1,
        position: [2848, 7488],
    })
    ErrorReport17 = {
        errorType: 'errorObject',
        errorObject: `={
  "error": {
    "workflow": "{{ $workflow.id }}",
    "execution": "{{ $execution.id }}",
    "type": "internal.api.reminders",
    "node": "{{ $prevNode.name }}",
    "code": "{{ $json.error.status || '' }}",
    "description": "{{
(() => {
  try {
    const part = $json.error.message.split(' - ')[1];
    return JSON.parse(JSON.parse(part)).detail;
  } catch (e) {
    return $json.error.message;
  }
})()
}}"
  }
}`,
    };

    @node({
        id: 'd781dddf-8ad8-458d-8c23-56736f3718ef',
        name: 'error report ',
        type: 'n8n-nodes-base.stopAndError',
        version: 1,
        position: [3760, 7312],
    })
    ErrorReport1 = {
        errorType: 'errorObject',
        errorObject: `={
  "error": {
    "workflow": "{{ $workflow.id }}",
    "execution": "{{ $execution.id }}",
    "type": "internal.api.reminders",
    "node": "{{ $prevNode.name }}",
    "code": "{{ $json.error.status || '' }}",
    "description": "{{
(() => {
  try {
    const part = $json.error.message.split(' - ')[1];
    return JSON.parse(JSON.parse(part)).detail;
  } catch (e) {
    return $json.error.message;
  }
})()
}}"
  }
}`,
    };

    // =====================================================================
    // ROUTAGE ET CONNEXIONS
    // =====================================================================

    @links()
    defineRouting() {
        this.Webhook.out(0).to(this.DataHandler.in(0));
        this.DataHandler.out(0).to(this.PilatesAction.in(0));
        this.PilatesAction.out(0).to(this.GetPendingReplacement.in(0));
        this.PilatesAction.out(1).to(this.GetPendingReplacement.in(0));
        this.PilatesAction.out(2).to(this.GetPendingReplacement.in(0));
        this.PilatesAction.out(3).to(this.GetPendingReplacement.in(0));
        this.PilatesAction.out(4).to(this.LegacyActionAllowed.in(0));
        this.LegacyActionAllowed.out(0).to(this.Action.in(0));
        this.LegacyActionAllowed.out(1).to(this.RejectPilatesModeAction.in(0));
        this.GetPendingReplacement.out(0).to(this.ValidatePendingOperation.in(0));
        this.GetPendingReplacement.out(1).to(this.PilatesOperationResult.in(0));
        this.ValidatePendingOperation.out(0).to(this.PendingOperationRouter.in(0));
        this.PendingOperationRouter.out(0).to(this.GetById.in(0));
        this.PendingOperationRouter.out(1).to(this.StoreSelectedReplacement.in(0));
        this.PendingOperationRouter.out(2).to(this.RecheckReplacementSlot.in(0));
        this.PendingOperationRouter.out(3).to(this.DeletePendingReplacement.in(0));
        this.PendingOperationRouter.out(4).to(this.PilatesOperationResult.in(0));
        this.PendingOperationRouter.out(5).to(this.PilatesOperationResult.in(0));
        this.PendingOperationRouter.out(6).to(this.GetReplacementAppointments.in(0));
        this.Action.out(0).to(this.Post.in(0));
        this.Action.out(1).to(this.Patch.in(0));
        this.Action.out(2).to(this.GetById.in(0));
        this.Action.out(3).to(this.Id.in(0));
        this.Post.out(0).to(this.PreContext.in(0));
        this.Post.out(1).to(this.ErrorReport20.in(0));
        this.Patch.out(0).to(this.PreContext.in(0));
        this.Patch.out(1).to(this.ErrorReport19.in(0));
        this.Cancel.out(0).to(this.PrepareEmailNotification.in(0));
        this.Cancel.out(1).to(this.ErrorReport21.in(0));
        this.Action1.out(0).to(this.PrepareEmailNotification.in(0));
        this.Action1.out(1).to(this.ReturnContext.in(0));
        this.Action1.out(2).to(this.PrepareEmailNotification.in(0));
        this.Action1.out(3).to(this.Cancel.in(0));
        this.PrepareEmailNotification.out(0).to(this.CanSendEmail.in(0));
        this.CanSendEmail.out(0).to(this.FindSentNotification.in(0));
        this.CanSendEmail.out(1).to(this.ReturnContext.in(0));
        this.FindSentNotification.out(0).to(this.EmailAlreadySent.in(0));
        this.FindSentNotification.out(1).to(this.ClaimNotification.in(0));
        this.EmailAlreadySent.out(0).to(this.ReturnContext.in(0));
        this.EmailAlreadySent.out(1).to(this.ClaimNotification.in(0));
        this.ClaimNotification.out(0).to(this.NotificationClaimed.in(0));
        this.ClaimNotification.out(1).to(this.NotificationAction.in(0));
        this.NotificationClaimed.out(0).to(this.NotificationAction.in(0));
        this.NotificationClaimed.out(1).to(this.ReturnContext.in(0));
        this.NotificationAction.out(0).to(this.ConfirmationEmail.in(0));
        this.NotificationAction.out(1).to(this.UpdateEmail.in(0));
        this.NotificationAction.out(2).to(this.DeleteEmail.in(0));
        this.NotificationAction.out(3).to(this.ReturnContext.in(0));
        this.ConfirmationEmail.out(0).to(this.ReturnContext.in(0));
        this.ConfirmationEmail.out(1).to(this.ErrorReport24.in(0));
        this.UpdateEmail.out(0).to(this.ReturnContext.in(0));
        this.UpdateEmail.out(1).to(this.ErrorReport26.in(0));
        this.DeleteEmail.out(0).to(this.ReturnContext.in(0));
        this.DeleteEmail.out(1).to(this.ErrorReport.in(0));
        this.ErrorReport24.out(0).to(this.ReturnContext.in(0));
        this.ErrorReport26.out(0).to(this.ReturnContext.in(0));
        this.ErrorReport.out(0).to(this.ReturnContext.in(0));
        this.Aggregate.out(0).to(this.FinalReturn.in(0));
        this.GetByClient.out(0).to(this.PreContext.in(0));
        this.GetByClient.out(1).to(this.ErrorReport16.in(0));
        this.GetById.out(0).to(this.PreContext.in(0));
        this.GetById.out(1).to(this.ErrorReport18.in(0));
        this.Id.out(0).to(this.GetById.in(0));
        this.Id.out(1).to(this.GetByClient.in(0));
        this.PreContext.out(0).to(this.ProfessionalContext.in(0));
        this.AppointmentContext.out(0).to(this.CancelForReplacement.in(0));
        this.CancelForReplacement.out(0).to(this.AssertReplacementSourceOwnership.in(0));
        this.CancelForReplacement.out(1).to(this.Action1.in(0));
        this.AssertReplacementSourceOwnership.out(0).to(this.SourceAlreadyCanceled.in(0));
        this.SourceAlreadyCanceled.out(0).to(this.CheckReplacementSuggestions.in(0));
        this.SourceAlreadyCanceled.out(1).to(this.BuildCancelingReplacementState.in(0));
        this.CheckReplacementSuggestions.out(0).to(this.BuildCanceledReplacementState.in(0));
        this.CheckReplacementSuggestions.out(1).to(this.PilatesOperationResult.in(0));
        this.BuildCancelingReplacementState.out(0).to(this.StoreCancelingReplacementState.in(0));
        this.StoreCancelingReplacementState.out(0).to(this.CancelForReplacement1.in(0));
        this.StoreCancelingReplacementState.out(1).to(this.PilatesOperationResult.in(0));
        this.CancelForReplacement1.out(0).to(this.CheckReplacementSuggestions.in(0));
        this.CancelForReplacement1.out(1).to(this.GetCancelReplacementSource.in(0));
        this.GetCancelReplacementSource.out(0).to(this.ReconcileCancelReplacementFailure.in(0));
        this.GetCancelReplacementSource.out(1).to(this.ReconcileCancelReplacementFailure.in(0));
        this.ReconcileCancelReplacementFailure.out(0).to(this.CancelFailureSourceCanceled.in(0));
        this.CancelFailureSourceCanceled.out(0).to(this.CheckReplacementSuggestions.in(0));
        this.CancelFailureSourceCanceled.out(1).to(this.StoreCancelReplacementFailure.in(0));
        this.StoreCancelReplacementFailure.out(0).to(this.PilatesOperationResult.in(0));
        this.StoreCancelReplacementFailure.out(1).to(this.PilatesOperationResult.in(0));
        this.BuildCanceledReplacementState.out(0).to(this.StoreCanceledReplacementState.in(0));
        this.StoreCanceledReplacementState.out(0).to(this.PilatesOperationResult.in(0));
        this.StoreCanceledReplacementState.out(1).to(this.PilatesOperationResult.in(0));
        this.StoreSelectedReplacement.out(0).to(this.PilatesOperationResult.in(0));
        this.StoreSelectedReplacement.out(1).to(this.PilatesOperationResult.in(0));
        this.RecheckReplacementSlot.out(0).to(this.ReplacementSlotAvailable.in(0));
        this.RecheckReplacementSlot.out(1).to(this.PilatesOperationResult.in(0));
        this.ReplacementSlotAvailable.out(0).to(this.BuildReplacementCreatingState.in(0));
        this.ReplacementSlotAvailable.out(1).to(this.BuildReplacementConflictState.in(0));
        this.BuildReplacementCreatingState.out(0).to(this.AcquireReplacementLock.in(0));
        this.AcquireReplacementLock.out(0).to(this.ReplacementLockAcquired.in(0));
        this.AcquireReplacementLock.out(1).to(this.PilatesOperationResult.in(0));
        this.ReplacementLockAcquired.out(0).to(this.StoreReplacementCreating.in(0));
        this.ReplacementLockAcquired.out(1).to(this.GetReplacementAppointments.in(0));
        this.StoreReplacementCreating.out(0).to(this.PostReplacement.in(0));
        this.StoreReplacementCreating.out(1).to(this.ReleaseLockAfterCreatingStateFailure.in(0));
        this.ReleaseLockAfterCreatingStateFailure.out(0).to(this.CreatingStatePersistenceFailure.in(0));
        this.ReleaseLockAfterCreatingStateFailure.out(1).to(this.CreatingStateAndLockCleanupFailure.in(0));
        this.CreatingStatePersistenceFailure.out(0).to(this.PilatesOperationResult.in(0));
        this.CreatingStateAndLockCleanupFailure.out(0).to(this.PilatesOperationResult.in(0));
        this.PostReplacement.out(0).to(this.FinalizeReplacementState.in(0));
        this.PostReplacement.out(1).to(this.GetReplacementAppointments.in(0));
        this.FinalizeReplacementState.out(0).to(this.StoreCompletedReplacement.in(0));
        this.StoreCompletedReplacement.out(0).to(this.PilatesOperationResult.in(0));
        this.StoreCompletedReplacement.out(1).to(this.PilatesOperationResult.in(0));
        this.GetReplacementAppointments.out(0).to(this.ReconcileReplacementCreation.in(0));
        this.GetReplacementAppointments.out(1).to(this.PilatesOperationResult.in(0));
        this.ReconcileReplacementCreation.out(0).to(this.ReplacementRecoveryRouter.in(0));
        this.ReplacementRecoveryRouter.out(0).to(this.StoreReconciledReplacement.in(0));
        this.ReplacementRecoveryRouter.out(1).to(this.RefreshReplacementSuggestions.in(0));
        this.ReplacementRecoveryRouter.out(2).to(this.StoreReconciledReplacement.in(0));
        this.ReplacementRecoveryRouter.out(3).to(this.PilatesOperationResult.in(0));
        this.StoreReconciledReplacement.out(0).to(this.PilatesOperationResult.in(0));
        this.StoreReconciledReplacement.out(1).to(this.PilatesOperationResult.in(0));
        this.RefreshReplacementSuggestions.out(0).to(this.BuildReplacementConflictState.in(0));
        this.RefreshReplacementSuggestions.out(1).to(this.PilatesOperationResult.in(0));
        this.BuildReplacementConflictState.out(0).to(this.StoreReplacementConflict.in(0));
        this.StoreReplacementConflict.out(0).to(this.ConflictLockReleaseRequired.in(0));
        this.StoreReplacementConflict.out(1).to(this.PilatesOperationResult.in(0));
        this.ConflictLockReleaseRequired.out(0).to(this.ReleaseReplacementLockAfterConflict.in(0));
        this.ConflictLockReleaseRequired.out(1).to(this.PilatesOperationResult.in(0));
        this.ReleaseReplacementLockAfterConflict.out(0).to(this.PilatesOperationResult.in(0));
        this.ReleaseReplacementLockAfterConflict.out(1).to(this.PilatesOperationResult.in(0));
        this.DeletePendingReplacement.out(0).to(this.PilatesOperationResult.in(0));
        this.DeletePendingReplacement.out(1).to(this.PilatesOperationResult.in(0));
        this.ReturnContext.out(0).to(this.Aggregate.in(0));
        this.ReminderSchedule.out(0).to(this.ClaimReminders.in(0));
        this.ClaimReminders.out(0).to(this.SplitReminderClaims.in(0));
        this.ClaimReminders.out(1).to(this.ErrorReport17.in(0));
        this.SplitReminderClaims.out(0).to(this.SendReminder.in(0));
        this.SendReminder.out(0).to(this.MarkReminderSent.in(0));
        this.SendReminder.out(1).to(this.MarkReminderFailed.in(0));
        this.ServiceContext.out(0).to(this.AppointmentContext.in(0));
        this.ProfessionalContext.out(0).to(this.ServiceContext.in(0));
        this.MarkReminderSent.out(1).to(this.ErrorReport1.in(0));
        this.MarkReminderFailed.out(1).to(this.ErrorReport1.in(0));
    }
}
