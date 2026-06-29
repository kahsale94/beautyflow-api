import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : pending state-prod
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
// SendOutsideHoursResume             evolutionApi               [creds] [retry]
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
    id: '2BBY2GXe0CWMszlt',
    name: 'pending state-prod',
    active: true,
    isArchived: false,
    projectId: 'UVYVLJNFC5m6HlJG',
    tags: ['Kaiky', 'beautyflow-api'],
    settings: {
        executionOrder: 'v1',
        binaryMode: 'separate',
        timeSavedMode: 'fixed',
        errorWorkflow: 'bWdz3xBVwmycvfwW',
        timezone: 'America/Sao_Paulo',
        callerPolicy: 'workflowsFromSameOwner',
        availableInMCP: true,
    },
})
export class PendingStateProdWorkflow {
    // =====================================================================
    // CONFIGURATION DES NOEUDS
    // =====================================================================

    @node({
        id: '1dd215f4-2e3e-420d-9450-4404b242714a',
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
        id: '147961cd-ed00-4084-8598-36f8ad07cc4a',
        name: 'back to get name',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [320, 16],
    })
    BackToGetName = {
        workflowId: {
            __rl: true,
            value: 'p2z28Yex6r93HRT0',
            mode: 'list',
            cachedResultUrl: '/workflow/p2z28Yex6r93HRT0',
            cachedResultName: 'clients',
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
  evo_instance: $('data handler').item.json.api.evo_instance
} }}`,
                client: `={{ {
  remote_jid: $('data handler').item.json.client.remote_jid,
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
        id: '08f656ad-308b-46c3-9fea-c96b1ec78d61',
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
        id: '4433ef88-5350-4100-aa2a-c9f84b59c455',
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
        id: '4f53c48d-0ba1-4cdb-80a2-b620339c3b6d',
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
        id: 'a13e8d58-0b62-4e3c-9ed7-269a1ca7417a',
        name: 'get outside hours context keys',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [-96, 304],
        credentials: { redis: { id: 'zMk8tatRFuFo6wmp', name: 'beautyflow prod' } },
    })
    GetOutsideHoursContextKeys = {
        operation: 'keys',
        keyPattern: 'beautyflow_bot.*.outside_hours_context',
        getValues: false,
    };

    @node({
        id: 'e24347c4-f2a7-422c-8c1f-0910def60865',
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
        id: 'a523f992-7acc-4a0b-bfb4-1793a61c91b9',
        name: 'get outside hours context',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [320, 304],
        credentials: { redis: { id: 'zMk8tatRFuFo6wmp', name: 'beautyflow prod' } },
    })
    GetOutsideHoursContext = {
        operation: 'get',
        propertyName: 'outside_hours_context',
        key: '={{ $json.keys }}',
        keyType: 'string',
        options: {},
    };

    @node({
        id: '35f2a41a-a7bf-4968-acb8-c742dc7dc6ec',
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
const evoInstance = context.api?.evo_instance;

if (!remoteJid || !evoInstance) {
  return [];
}

return [
  {
    json: {
      ...context,
      context_key: context.context_key || $json.keys,
      state_key: context.state_key || 'beautyflow_bot.' + remoteJid + '.state',
      resume_message:
        context.resume_message ||
        'Olá! O atendimento já está disponível novamente. Podemos continuar por aqui.',
    },
  },
];`,
    };

    @node({
        id: 'a63c5e8f-44b6-4b76-bd8c-32ca43f6db12',
        name: 'get outside hours state',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [736, 304],
        credentials: { redis: { id: 'zMk8tatRFuFo6wmp', name: 'beautyflow prod' } },
    })
    GetOutsideHoursState = {
        operation: 'get',
        propertyName: 'pending_state',
        key: '={{ $json.state_key }}',
        keyType: 'string',
        options: {},
    };

    @node({
        id: '35f0640e-c65e-4d8a-b52a-9e9cd59e5b40',
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
        id: '9811f2c0-b171-4d87-b5fe-a23772d1ee3f',
        name: 'send outside hours resume',
        type: 'n8n-nodes-evolution-api.evolutionApi',
        version: 1,
        position: [1152, 224],
        credentials: { evolutionApi: { id: 'vlj9dRMZQEffBnHW', name: 'Evolution Credential - Kaiky' } },
        retryOnFail: true,
        waitBetweenTries: 500,
    })
    SendOutsideHoursResume = {
        resource: 'messages-api',
        instanceName: '={{ $json.api.evo_instance }}',
        remoteJid: '={{ $json.client.remote_jid }}',
        messageText: '={{ $json.resume_message }}',
        options_message: {
            delay: 1200,
        },
    };

    @node({
        id: '26b8e362-d2f8-45a9-b4f7-6f7691df4966',
        name: 'delete outside hours context',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [1360, 304],
        credentials: { redis: { id: 'zMk8tatRFuFo6wmp', name: 'beautyflow prod' } },
        retryOnFail: true,
    })
    DeleteOutsideHoursContext = {
        operation: 'delete',
        key: "={{ $('prepare outside hours resume').item.json.context_key }}",
    };

    @node({
        id: 'ce5f7f22-0385-46a7-893a-7807f88276d2',
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
        id: '1c7e6853-19fd-4507-9b42-50aa63d87ea8',
        name: 'delete outside hours state',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [1776, 224],
        credentials: { redis: { id: 'zMk8tatRFuFo6wmp', name: 'beautyflow prod' } },
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
