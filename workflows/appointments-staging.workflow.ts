import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : appointments-staging
// Nodes   : 41  |  Connections: 57
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// Webhook                            executeWorkflowTrigger
// DataHandler                        set
// Action                             switch
// Cancel                             httpRequest                [onError→out(1)]
// Post                               httpRequest                [onError→out(1)]
// Patch                              httpRequest                [onError→out(1)]
// Action1                            switch
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
// SendReminder                       httpRequest                [onError→out(1)] [creds]
// ErrorReport17                      stopAndError
// ErrorReport1                       stopAndError
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// Webhook
//    → DataHandler
//      → Action
//        → Post
//          → PreContext
//            → ProfessionalContext
//              → ServiceContext
//                → AppointmentContext
//                  → Action1
//                    → PrepareEmailNotification
//                      → CanSendEmail
//                        → FindSentNotification
//                          → EmailAlreadySent
//                            → ReturnContext
//                              → Aggregate
//                                → FinalReturn
//                           .out(1) → ClaimNotification
//                              → NotificationClaimed
//                                → NotificationAction
//                                  → ConfirmationEmail
//                                    → ReturnContext (↩ loop)
//                                   .out(1) → ErrorReport24
//                                      → ReturnContext (↩ loop)
//                                 .out(1) → UpdateEmail
//                                    → ReturnContext (↩ loop)
//                                   .out(1) → ErrorReport26
//                                      → ReturnContext (↩ loop)
//                                 .out(2) → DeleteEmail
//                                    → ReturnContext (↩ loop)
//                                   .out(1) → ErrorReport
//                                      → ReturnContext (↩ loop)
//                                 .out(3) → ReturnContext (↩ loop)
//                               .out(1) → ReturnContext (↩ loop)
//                             .out(1) → NotificationAction (↩ loop)
//                         .out(1) → ClaimNotification (↩ loop)
//                       .out(1) → ReturnContext (↩ loop)
//                   .out(1) → ReturnContext (↩ loop)
//                   .out(2) → PrepareEmailNotification (↩ loop)
//                   .out(3) → Cancel
//                      → PrepareEmailNotification (↩ loop)
//                     .out(1) → ErrorReport21
//         .out(1) → ErrorReport20
//       .out(1) → Patch
//          → PreContext (↩ loop)
//         .out(1) → ErrorReport19
//       .out(2) → GetById
//          → PreContext (↩ loop)
//         .out(1) → ErrorReport18
//       .out(3) → Id
//          → GetById (↩ loop)
//         .out(1) → GetByClient
//            → PreContext (↩ loop)
//           .out(1) → ErrorReport16
// ReminderSchedule
//    → ClaimReminders
//      → SplitReminderClaims
//        → SendReminder
//         .out(1) → ErrorReport1
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
    projectId: 'UVYVLJNFC5m6HlJG',
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
        id: '3d49ec35-c336-4d5a-aad8-5bda26340e89',
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
        id: 'd9393947-1c79-447e-9b62-44226a908602',
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
        id: '957f3db0-9084-42c4-bf2b-b94df4536d8c',
        name: 'appointment context',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [3376, 6896],
    })
    AppointmentContext = {
        mode: 'runOnceForEachItem',
        jsCode: `// 🔹 Fonte principal
const source = $('pre-context').item.json.appointment;

// 🔹 Flatten do campo ""
const base = source[""] ? source[""] : {};
const result = { ...base };

for (const key in source) {
  if (key !== "") {
    result[key] = source[key];
  }
}

// 🔹 Buscar dados externos (com fallback)
let professional = {};
let service = {};
let client = {};
let business = {};

try {
  const raw = $('professional context').item.json.professionals?.[0] ?? {};
  professional = { ...raw };
  professional.email = String(professional.email ?? '').trim();
  delete professional.business_id;
  delete professional.is_active;
} catch (e) {}

try {
  const raw = $('service context').item.json.services[0];
  service = { ...raw };
  delete service.business_id;
  delete service.is_active;
} catch (e) {}

try {
  const raw = $('data handler').item.json.client;
  client = { ...raw };
  delete client.business_id;
} catch (e) {}

try {
  business = $('data handler').item.json.business;
} catch (e) {}

const timezone = business?.timezone || 'America/Sao_Paulo';

// 🔹 Remove campos do appointment
delete result.business_id;
delete result.client_id;
delete result.professional_id;
delete result.service_id;
delete result.created_at;

// 🔹 Helpers seguros (anti erro de data)
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

// 🔹 Datas seguras
const startDate = safeDate(result.start_datetime);
const endDate = safeDate(result.end_datetime);

// 🔹 RETORNO (⚠️ objeto, não array)
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
  }
};`,
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
    "connection_key": "{{ $('data handler').first().json.api?.connection_key || '' }}"
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
    "connection_key": "{{ $('data handler').first().json.api?.connection_key || '' }}"
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
    "connection_key": "{{ $('data handler').first().json.api?.connection_key || '' }}"
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
    "connection_key": "{{ $('data handler').first().json.api?.connection_key || '' }}"
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
    "connection_key": "{{ $('data handler').first().json.api?.connection_key || '' }}"
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
        type: 'n8n-nodes-base.httpRequest',
        version: 4.4,
        position: [3296, 7328],
        credentials: { httpBearerAuth: { id: 'GOtlhhje8hFoh3UQ', name: 'n8n beautyflow token - staging' } },
        onError: 'continueErrorOutput',
    })
    SendReminder = {
        method: 'POST',
        url: '=http://backend-staging:8000/v1/appointment-reminders/{{ $json.id }}/dispatch',
        authentication: 'genericCredentialType',
        genericAuthType: 'httpBearerAuth',
        options: {},
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
        this.DataHandler.out(0).to(this.Action.in(0));
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
        this.Aggregate.out(0).to(this.FinalReturn.in(0));
        this.GetByClient.out(0).to(this.PreContext.in(0));
        this.GetByClient.out(1).to(this.ErrorReport16.in(0));
        this.GetById.out(0).to(this.PreContext.in(0));
        this.GetById.out(1).to(this.ErrorReport18.in(0));
        this.Id.out(0).to(this.GetById.in(0));
        this.Id.out(1).to(this.GetByClient.in(0));
        this.PreContext.out(0).to(this.ProfessionalContext.in(0));
        this.AppointmentContext.out(0).to(this.Action1.in(0));
        this.ReturnContext.out(0).to(this.Aggregate.in(0));
        this.ReminderSchedule.out(0).to(this.ClaimReminders.in(0));
        this.ClaimReminders.out(0).to(this.SplitReminderClaims.in(0));
        this.ClaimReminders.out(1).to(this.ErrorReport17.in(0));
        this.SplitReminderClaims.out(0).to(this.SendReminder.in(0));
        this.SendReminder.out(1).to(this.ErrorReport1.in(0));
        this.ErrorReport24.out(0).to(this.ReturnContext.in(0));
        this.ErrorReport26.out(0).to(this.ReturnContext.in(0));
        this.ErrorReport.out(0).to(this.ReturnContext.in(0));
        this.ServiceContext.out(0).to(this.AppointmentContext.in(0));
        this.ProfessionalContext.out(0).to(this.ServiceContext.in(0));
    }
}
