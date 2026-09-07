import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : pending state-staging
// Nodes   : 15  |  Connections: 14
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// Webhook                            executeWorkflowTrigger
// BackToGetName                      executeWorkflow
// PendingState                       switch
// DataHandler                        set
// OutsideHoursResumeSchedule         scheduleTrigger
// GetOutsideHoursContextKeys         redis                      [creds]
// SplitOutsideHoursContextKeys       splitOut
// GetOutsideHoursContext             redis                      [creds]
// PrepareOutsideHoursResume          code
// GetOutsideHoursState               redis                      [creds]
// ShouldResumeOutsideHours           if
// SendOutsideHoursResume             httpRequest
// DeleteOutsideHoursContext          redis                      [creds] [retry]
// ShouldDeleteOutsideHoursState      if
// DeleteOutsideHoursState            redis                      [creds] [retry]
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// Webhook
//    → DataHandler
//      → PendingState
//        → BackToGetName
// OutsideHoursResumeSchedule
//    → GetOutsideHoursContextKeys
//      → SplitOutsideHoursContextKeys
//        → GetOutsideHoursContext
//          → PrepareOutsideHoursResume
//            → GetOutsideHoursState
//              → ShouldResumeOutsideHours
//                → SendOutsideHoursResume
//                  → DeleteOutsideHoursContext
//                    → ShouldDeleteOutsideHoursState
//                      → DeleteOutsideHoursState
//               .out(1) → DeleteOutsideHoursContext (↩ loop)
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: 'VJhji9bH9TjYZy06',
    name: 'pending state-staging',
    active: true,
    isArchived: false,
    tags: ['Kaiky', 'beautyflow-api'],
    settings: {
        executionOrder: 'v1',
        binaryMode: 'separate',
        timeSavedMode: 'fixed',
        errorWorkflow: 'BxyJLKjTEcfzV18k',
        timezone: 'America/Sao_Paulo',
        callerPolicy: 'workflowsFromSameOwner',
        availableInMCP: true,
    },
})
export class PendingStateStagingWorkflow {
    // =====================================================================
    // CONFIGURATION DES NOEUDS
    // =====================================================================

    @node({
        id: '1de7b4d3-ddba-4a0d-bd7d-dbc6a063fc7b',
        name: 'webhook',
        type: 'n8n-nodes-base.executeWorkflowTrigger',
        version: 1.1,
        position: [-304, 16],
    })
    Webhook = {
        workflowInputs: {
            values: [
                {
                    name: 'state',
                },
                {
                    name: 'business',
                    type: 'object',
                },
                {
                    name: 'client',
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
        id: '392114e0-497f-42d6-9ac3-5610d3b65e96',
        name: 'back to get name',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [320, 16],
    })
    BackToGetName = {
        workflowId: {
            __rl: true,
            value: 'el3GeDHzGRJaidKi',
            mode: 'list',
            cachedResultUrl: '/workflow/el3GeDHzGRJaidKi',
            cachedResultName: 'clients test',
        },
        workflowInputs: {
            mappingMode: 'defineBelow',
            value: {
                action: 'name',
                business: `={{ {
  id: $('data handler').item.json.business.id,
  name: $('data handler').item.json.business.name
} }}`,
                api: `={{ {
  url: $('data handler').item.json.api.url,
  token: $('data handler').item.json.api.token,
  connection_key: $('data handler').item.json.api.connection_key
} }}`,
                client: `={{ {
  remote_jid: $('data handler').item.json.client.remote_jid,
  phone: $('data handler').item.json.client.phone || null,
  contact_id: $('data handler').item.json.client.contact_id || null,
  provider_user_id: $('data handler').item.json.client.provider_user_id || null,
  message: $('data handler').item.json.client.message
} }}`,
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
        options: {},
    };

    @node({
        id: '7f059054-5790-48a4-afc4-59eb1099ebbc',
        name: 'pending_state',
        type: 'n8n-nodes-base.switch',
        version: 3.4,
        position: [112, 16],
    })
    PendingState = {
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
                                leftValue: "={{ $('data handler').item.json.state }}",
                                rightValue: 'awaiting_name',
                                operator: {
                                    type: 'string',
                                    operation: 'equals',
                                },
                                id: 'e4dbe532-3cf7-4554-bd0c-b2e1cf1f5b6d',
                            },
                        ],
                        combinator: 'and',
                    },
                    renameOutput: true,
                    outputKey: 'NAME',
                },
            ],
        },
        options: {},
    };

    @node({
        id: 'c4ab7522-4ed8-45fc-8530-a872009fa952',
        name: 'data handler',
        type: 'n8n-nodes-base.set',
        version: 3.4,
        position: [-96, 16],
    })
    DataHandler = {
        assignments: {
            assignments: [
                {
                    id: 'ed1a2d0c-3412-4fd4-8b4b-9b546488efe5',
                    name: 'state',
                    value: '={{ $json.state }}',
                    type: 'string',
                },
                {
                    id: '352b0e72-b1eb-4dc5-83f6-d22192950632',
                    name: 'business',
                    value: '={{ $json.business }}',
                    type: 'object',
                },
                {
                    id: '04c4d6f9-1957-4f77-8943-36d861e4f03a',
                    name: 'client',
                    value: '={{ $json.client }}',
                    type: 'object',
                },
                {
                    id: 'deb23a92-cd9a-48d4-95b2-66dee01296bb',
                    name: 'api',
                    value: '={{ $json.api }}',
                    type: 'object',
                },
            ],
        },
        options: {},
    };

    @node({
        id: '702a60e5-72e4-4e9d-a468-d191d59dc702',
        name: 'outside hours resume schedule',
        type: 'n8n-nodes-base.scheduleTrigger',
        version: 1.3,
        position: [-304, 304],
    })
    OutsideHoursResumeSchedule = {
        rule: {
            interval: [
                {
                    field: 'minutes',
                    minutesInterval: 5,
                },
            ],
        },
    };

    @node({
        id: 'd1779bdf-2456-46d8-9e59-f95dff38fa7c',
        name: 'get outside hours context keys',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [-96, 304],
        credentials: { redis: { id: 'yq1GIl0nbdK5QpYm', name: 'beautyflow test' } },
    })
    GetOutsideHoursContextKeys = {
        operation: 'keys',
        keyPattern: 'beautyflow_bot.*.*.outside_hours_context',
        getValues: false,
    };

    @node({
        id: '148da4af-73ea-4f77-928c-4b506103b093',
        name: 'split outside hours context keys',
        type: 'n8n-nodes-base.splitOut',
        version: 1,
        position: [112, 304],
    })
    SplitOutsideHoursContextKeys = {
        fieldToSplitOut: 'keys',
        options: {},
    };

    @node({
        id: '41b45b49-4e97-4f55-ad7a-5370a306f663',
        name: 'get outside hours context',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [320, 304],
        credentials: { redis: { id: 'yq1GIl0nbdK5QpYm', name: 'beautyflow test' } },
    })
    GetOutsideHoursContext = {
        operation: 'get',
        propertyName: 'outside_hours_context',
        key: '={{ $json.keys }}',
        keyType: 'string',
        options: {},
    };

    @node({
        id: '4e507b3c-abd1-40b0-8cf8-392ce1d0fc52',
        name: 'prepare outside hours resume',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [528, 304],
    })
    PrepareOutsideHoursResume = {
        jsCode: `const raw = $json.outside_hours_context;

let context = raw;

try {
  context = typeof raw === 'string' && raw ? JSON.parse(raw) : raw;
} catch (error) {
  return [];
}

if (!context || context.reason !== 'outside_business_hours') {
  return [];
}

const nextOpenAt = context.next_open_at ? new Date(context.next_open_at) : null;

if (!nextOpenAt || Number.isNaN(nextOpenAt.getTime())) {
  return [];
}

if (nextOpenAt > new Date()) {
  return [];
}

const remoteJid = context.client?.remote_jid;
const connectionKey = context.api?.connection_key;
const hasDeliverableIdentity = Boolean(
  context.client?.phone ||
  context.client?.provider_user_id ||
  String(remoteJid || '').includes('@')
);

if (!remoteJid || !connectionKey || !hasDeliverableIdentity) {
  return [];
}

return [
  {
    json: {
      ...context,
      context_key: context.context_key || $json.keys,
      state_key: context.state_key || 'beautyflow_bot.' + connectionKey + '.' + remoteJid + '.state',
      resume_message:
        context.resume_message ||
        'Olá! O atendimento já está disponível novamente. Podemos continuar por aqui.',
    },
  },
];`,
    };

    @node({
        id: '7fd06126-8ca7-4420-b1dc-ed015a6228a3',
        name: 'get outside hours state',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [736, 304],
        credentials: { redis: { id: 'yq1GIl0nbdK5QpYm', name: 'beautyflow test' } },
    })
    GetOutsideHoursState = {
        operation: 'get',
        propertyName: 'pending_state',
        key: '={{ $json.state_key }}',
        keyType: 'string',
        options: {},
    };

    @node({
        id: 'bf78b9f7-bd68-402c-b312-b742047db4e6',
        name: 'should resume outside hours?',
        type: 'n8n-nodes-base.if',
        version: 2.3,
        position: [944, 304],
    })
    ShouldResumeOutsideHours = {
        conditions: {
            options: {
                caseSensitive: true,
                leftValue: '',
                typeValidation: 'loose',
                version: 3,
            },
            conditions: [
                {
                    id: 'a4054365-b344-466f-903c-c878fc22d12c',
                    leftValue: '={{ $json.pending_state }}',
                    rightValue: '',
                    operator: {
                        type: 'string',
                        operation: 'exists',
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
        id: '42c19846-04be-4647-94fb-2c4694eafab7',
        name: 'send outside hours resume',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.4,
        position: [1152, 224],
    })
    SendOutsideHoursResume = {
        method: 'POST',
        url: '={{ $json.api.url }}/whatsapp/messages',
        sendHeaders: true,
        headerParameters: {
            parameters: [
                {
                    name: 'Authorization',
                    value: '={{ $json.api.token }}',
                },
            ],
        },
        sendBody: true,
        specifyBody: 'json',
        jsonBody: `={{ {
  type: 'text',
  ...($json.client?.phone
    ? { to: $json.client.phone }
    : $json.client?.provider_user_id
      ? { recipient: $json.client.provider_user_id }
      : { to: String($json.client?.remote_jid || '').split('@')[0] }),
  ...($json.client?.contact_id ? { contact_id: $json.client.contact_id } : {}),
  text: $json.resume_message
} }}`,
        options: {},
    };

    @node({
        id: '39f40444-094c-4e9f-8e45-291bb94065a8',
        name: 'delete outside hours context',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [1360, 304],
        credentials: { redis: { id: 'yq1GIl0nbdK5QpYm', name: 'beautyflow test' } },
        retryOnFail: true,
    })
    DeleteOutsideHoursContext = {
        operation: 'delete',
        key: "={{ $('prepare outside hours resume').item.json.context_key }}",
    };

    @node({
        id: '5d7b0188-bb60-4b63-8864-7d869f820973',
        name: 'should delete outside hours state?',
        type: 'n8n-nodes-base.if',
        version: 2.3,
        position: [1568, 304],
    })
    ShouldDeleteOutsideHoursState = {
        conditions: {
            options: {
                caseSensitive: true,
                leftValue: '',
                typeValidation: 'strict',
                version: 3,
            },
            conditions: [
                {
                    id: '1e0c90eb-d6f4-4585-8cfd-4986ff2ed325',
                    leftValue: "={{ $('get outside hours state').item.json.pending_state }}",
                    rightValue: 'outside_business_hours',
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
        id: '20a2b3b7-a09d-42be-b0c9-5d260f2c21d7',
        name: 'delete outside hours state',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [1776, 224],
        credentials: { redis: { id: 'yq1GIl0nbdK5QpYm', name: 'beautyflow test' } },
        retryOnFail: true,
    })
    DeleteOutsideHoursState = {
        operation: 'delete',
        key: "={{ $('prepare outside hours resume').item.json.state_key }}",
    };

    // =====================================================================
    // ROUTAGE ET CONNEXIONS
    // =====================================================================

    @links()
    defineRouting() {
        this.PendingState.out(0).to(this.BackToGetName.in(0));
        this.Webhook.out(0).to(this.DataHandler.in(0));
        this.DataHandler.out(0).to(this.PendingState.in(0));
        this.OutsideHoursResumeSchedule.out(0).to(this.GetOutsideHoursContextKeys.in(0));
        this.GetOutsideHoursContextKeys.out(0).to(this.SplitOutsideHoursContextKeys.in(0));
        this.SplitOutsideHoursContextKeys.out(0).to(this.GetOutsideHoursContext.in(0));
        this.GetOutsideHoursContext.out(0).to(this.PrepareOutsideHoursResume.in(0));
        this.PrepareOutsideHoursResume.out(0).to(this.GetOutsideHoursState.in(0));
        this.GetOutsideHoursState.out(0).to(this.ShouldResumeOutsideHours.in(0));
        this.ShouldResumeOutsideHours.out(0).to(this.SendOutsideHoursResume.in(0));
        this.ShouldResumeOutsideHours.out(1).to(this.DeleteOutsideHoursContext.in(0));
        this.SendOutsideHoursResume.out(0).to(this.DeleteOutsideHoursContext.in(0));
        this.DeleteOutsideHoursContext.out(0).to(this.ShouldDeleteOutsideHoursState.in(0));
        this.ShouldDeleteOutsideHoursState.out(0).to(this.DeleteOutsideHoursState.in(0));
    }
}
