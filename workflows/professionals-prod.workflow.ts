import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : professionals-prod
// Nodes   : 38  |  Connections: 53
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// Webhook                            executeWorkflowTrigger
// DataHandler                        set
// GetAll                             httpRequest                [onError→out(1)] [alwaysOutput]
// Action                             switch
// GetByName                          httpRequest                [onError→out(1)]
// GetById                            httpRequest                [onError→out(1)]
// GetContext                         redis                      [onError→out(1)] [creds]
// GetContext1                        redis                      [onError→out(1)] [creds]
// HasData1                           if
// HasData2                           if
// Aggregate1                         aggregate
// Aggregate2                         aggregate
// PushContext                        redis                      [onError→out(1)] [creds]
// PushContext1                       redis                      [onError→out(1)] [creds]
// PushContext2                       redis                      [onError→out(1)] [creds]
// Loop                               splitInBatches
// Convert1                           code
// Convert2                           code
// GetContext2                        redis                      [onError→out(1)] [creds]
// Compare                            code
// If_                                if
// Wait                               merge
// ErrorReport23                      executeWorkflow
// ErrorReport                        stopAndError
// ErrorReport24                      executeWorkflow
// ErrorReport25                      executeWorkflow
// ErrorReport1                       stopAndError
// ErrorReport2                       stopAndError
// ErrorReport18                      executeWorkflow
// ErrorReport26                      executeWorkflow
// ErrorReport27                      executeWorkflow
// ProfessionalsContext               set
// ProfessionalsData                  set
// Get1                               if
// If1                                if
// Context                            set
// Wait1                              merge
// Wait2                              merge
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// Webhook
//    → DataHandler
//      → Action
//        → GetAll
//          → If1
//            → Wait
//              → ProfessionalsContext
//           .out(1) → GetContext
//              → Compare
//                → If_
//                  → Wait.in(1) (↩ loop)
//                 .out(1) → Loop
//                    → Wait.in(1) (↩ loop)
//                   .out(1) → PushContext
//                      → Loop (↩ loop)
//                     .out(1) → ErrorReport27
//             .out(1) → ErrorReport18
//           .out(1) → ProfessionalsData
//              → Wait (↩ loop)
//         .out(1) → ErrorReport2
//       .out(1) → Get1
//          → GetContext1
//            → HasData1
//              → Convert1
//                → Aggregate1
//                  → Wait1
//                    → ProfessionalsContext (↩ loop)
//              → Wait1.in(1) (↩ loop)
//             .out(1) → GetById
//                → PushContext1
//                  → Wait1.in(1) (↩ loop)
//                 .out(1) → ErrorReport26
//                    → Wait1.in(1) (↩ loop)
//                → Aggregate1 (↩ loop)
//               .out(1) → ErrorReport1
//           .out(1) → ErrorReport25
//              → HasData1 (↩ loop)
//         .out(1) → GetContext2
//            → HasData2
//              → Convert2
//                → Aggregate2
//                  → Wait2
//                    → ProfessionalsContext (↩ loop)
//              → Wait2.in(1) (↩ loop)
//             .out(1) → GetByName
//                → PushContext2
//                  → Wait2.in(1) (↩ loop)
//                 .out(1) → ErrorReport24
//                    → Wait2.in(1) (↩ loop)
//                → Context
//                  → Aggregate2 (↩ loop)
//               .out(1) → ErrorReport
//           .out(1) → ErrorReport23
//              → HasData2 (↩ loop)
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: 'bFSJIIiJrsHfBGcU',
    name: 'professionals-prod',
    active: true,
    isArchived: false,
    projectId: 'UVYVLJNFC5m6HlJG',
    tags: ['Kaiky', 'beautyflow-api'],
    settings: {
        executionOrder: 'v1',
        availableInMCP: true,
        binaryMode: 'separate',
        timeSavedMode: 'fixed',
        errorWorkflow: 'bWdz3xBVwmycvfwW',
        timezone: 'America/Sao_Paulo',
        callerPolicy: 'workflowsFromSameOwner',
    },
})
export class ProfessionalsProdWorkflow {
    // =====================================================================
    // CONFIGURATION DES NOEUDS
    // =====================================================================

    @node({
        id: '5ba3da3f-7372-413d-9972-87a66dd91f21',
        name: 'webhook',
        type: 'n8n-nodes-base.executeWorkflowTrigger',
        version: 1.1,
        position: [-896, 4176],
    })
    Webhook = {
        workflowInputs: {
            values: [
                {
                    name: 'action',
                },
                {
                    name: 'professional_id',
                },
                {
                    name: 'professional_name',
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
        id: '762557a6-a6d6-4be3-aaa7-26b4baa6ec48',
        name: 'data handler',
        type: 'n8n-nodes-base.set',
        version: 3.4,
        position: [-688, 4176],
    })
    DataHandler = {
        assignments: {
            assignments: [
                {
                    id: 'bccd3750-dfb9-40e6-a88d-1c5d12d857b4',
                    name: 'action',
                    value: '={{ $json.action }}',
                    type: 'string',
                },
                {
                    id: '1ad73721-9117-496f-911d-85833c00b386',
                    name: 'business',
                    value: '={{ $json.business }}',
                    type: 'object',
                },
                {
                    id: 'afcf3dc6-ac01-49f1-8423-32e554ff77c7',
                    name: 'professional',
                    value: `={{
  (() => {
    const input = $input.first().json;

    const isValidText = (value) => {
      if (value === undefined || value === null) return false;

      const text = String(value).trim().toLowerCase();

      return (
        text !== '' &&
        text !== 'null' &&
        text !== 'undefined' &&
        text !== 'nan'
      );
    };

    const result = {
      id: null,
      name: null
    };

    if (input.professional && typeof input.professional === 'object' && !Array.isArray(input.professional)) {
      const professionalId = Number(input.professional.id);

      if (Number.isInteger(professionalId) && professionalId > 0) {
        result.id = professionalId;
      }

      if (isValidText(input.professional.name)) {
        result.name = String(input.professional.name).trim();
      }

      return result;
    }

    if (isValidText(input.professional_name)) {
      result.name = String(input.professional_name).trim();
    }

    if (typeof input.professional === 'string' && isValidText(input.professional)) {
      result.name = input.professional.trim();
    }

    if (isValidText(input.professional_id)) {
      const professionalId = Number(input.professional_id);

      if (Number.isInteger(professionalId) && professionalId > 0) {
        result.id = professionalId;
      }
    }

    return result;
  })()
}}`,
                    type: 'object',
                },
                {
                    id: '686b06f0-02a5-4161-8e45-feaa667bdc2a',
                    name: 'client',
                    value: '={{ $json.client }}',
                    type: 'object',
                },
                {
                    id: '1cb79adc-6592-4d1f-93c1-fe8d78d54465',
                    name: 'api',
                    value: `={{ {
  ...$json.api,
  url: $json.api.url + '/professionals'
} }}`,
                    type: 'object',
                },
            ],
        },
        options: {},
    };

    @node({
        id: '7ffdca29-7b81-496a-a2ee-953408aaeeef',
        name: 'get all',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.3,
        position: [-224, 3104],
        onError: 'continueErrorOutput',
        alwaysOutputData: true,
    })
    GetAll = {
        url: "={{ $('data handler').item.json.api.url }}/",
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
                },
            },
        },
    };

    @node({
        id: '04affcea-a4ec-46b8-b2f2-2de38cb59240',
        name: 'action',
        type: 'n8n-nodes-base.switch',
        version: 3.4,
        position: [-480, 4176],
    })
    Action = {
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
                                id: 'd1d07cfb-5acf-4eb2-acf3-9772a1c028d7',
                                leftValue: "={{ $('data handler').item.json.action }}",
                                rightValue: 'list',
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
                    outputKey: 'LIST',
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
                                id: '515c42e0-1cc3-474f-b8bd-94312e698da1',
                                leftValue: "={{ $('data handler').item.json.action }}",
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
        options: {
            allMatchingOutputs: false,
        },
    };

    @node({
        id: '7c855208-2497-4dbd-a339-40e1cdd90454',
        name: 'get by name',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.3,
        position: [432, 4352],
        onError: 'continueErrorOutput',
    })
    GetByName = {
        url: "={{ $('data handler').item.json.api.url }}/",
        sendQuery: true,
        queryParameters: {
            parameters: [
                {
                    name: 'professional_name',
                    value: "={{ $('data handler').item.json.professional.name }}",
                },
            ],
        },
        sendHeaders: true,
        headerParameters: {
            parameters: [
                {
                    name: 'Authorization',
                    value: "={{ $('data handler').item.json.api.token }}",
                },
            ],
        },
        options: {},
    };

    @node({
        id: '483abce6-8132-4373-81d7-167d8ec5658b',
        name: 'get by id',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.3,
        position: [448, 3840],
        onError: 'continueErrorOutput',
    })
    GetById = {
        url: "={{ $('data handler').item.json.api.url }}/{{ $('data handler').item.json.professional.id }}",
        sendHeaders: true,
        headerParameters: {
            parameters: [
                {
                    name: 'Authorization',
                    value: "={{ $('data handler').item.json.api.token }}",
                },
            ],
        },
        options: {},
    };

    @node({
        id: '8372236c-d5d0-425d-8eb5-4ea366e531fc',
        name: 'get context',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [240, 3344],
        credentials: { redis: { id: 'zMk8tatRFuFo6wmp', name: 'beautyflow prod' } },
        onError: 'continueErrorOutput',
    })
    GetContext = {
        operation: 'keys',
        keyPattern: 'beautyflow_bot.*.*.professional_context',
    };

    @node({
        id: '4f0eab88-62c0-43ab-abf3-2d5c18d2abb7',
        name: 'get context 1',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [32, 3712],
        credentials: { redis: { id: 'zMk8tatRFuFo6wmp', name: 'beautyflow prod' } },
        onError: 'continueErrorOutput',
    })
    GetContext1 = {
        operation: 'keys',
        keyPattern: "=beautyflow_bot.{{ $('data handler').item.json.professional.id }}.*.professional_context",
    };

    @node({
        id: 'e1fb9424-bf58-418a-8157-f3cc69b13a35',
        name: 'has data? 1',
        type: 'n8n-nodes-base.if',
        version: 2.3,
        position: [240, 3696],
    })
    HasData1 = {
        conditions: {
            options: {
                caseSensitive: true,
                leftValue: '',
                typeValidation: 'loose',
                version: 3,
            },
            conditions: [
                {
                    id: 'c4e5d140-889f-451a-ada6-7fc14c1a90e7',
                    leftValue: "={{ $('get context 1').item.json }}",
                    rightValue: '',
                    operator: {
                        type: 'object',
                        operation: 'notEmpty',
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
        id: 'cacc19a8-82ea-4c2f-8657-cbe2336d87cf',
        name: 'has data? 2',
        type: 'n8n-nodes-base.if',
        version: 2.3,
        position: [224, 4192],
    })
    HasData2 = {
        conditions: {
            options: {
                caseSensitive: true,
                leftValue: '',
                typeValidation: 'loose',
                version: 3,
            },
            conditions: [
                {
                    id: 'c4e5d140-889f-451a-ada6-7fc14c1a90e7',
                    leftValue: "={{ $('get context 2').item.json }}",
                    rightValue: '',
                    operator: {
                        type: 'object',
                        operation: 'notEmpty',
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
        id: '7183b941-abd8-4f01-bd65-9f18698233b6',
        name: 'aggregate 1',
        type: 'n8n-nodes-base.aggregate',
        version: 1,
        position: [1056, 3680],
    })
    Aggregate1 = {
        aggregate: 'aggregateAllItemData',
        destinationFieldName: 'professionals',
        include: 'specifiedFields',
        fieldsToInclude: 'id, name, email, phone',
        options: {},
    };

    @node({
        id: '9a22d7be-3156-4755-8fad-4bd95371ba68',
        name: 'aggregate 2',
        type: 'n8n-nodes-base.aggregate',
        version: 1,
        position: [1088, 4128],
    })
    Aggregate2 = {
        aggregate: 'aggregateAllItemData',
        destinationFieldName: 'professionals',
        options: {},
    };

    @node({
        id: '04809d94-8e7a-4585-8b5f-97d7996ecdb4',
        name: 'push context',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [1072, 3360],
        credentials: { redis: { id: 'zMk8tatRFuFo6wmp', name: 'beautyflow prod' } },
        onError: 'continueErrorOutput',
    })
    PushContext = {
        operation: 'set',
        key: "=beautyflow_bot.{{ $('loop').item.json.id }}.{{ $('loop').item.json.name }}.professional_context",
        value: `={{ JSON.stringify({
  id: $('loop').item.json.id,
  name: $('loop').item.json.name,
  email: $('loop').item.json.email,
  phone: $('loop').item.json.phone,
}) }}`,
        keyType: 'string',
    };

    @node({
        id: 'c22312d8-e9ae-4bc8-98d4-8d089228f055',
        name: 'push context 1',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [880, 3824],
        credentials: { redis: { id: 'zMk8tatRFuFo6wmp', name: 'beautyflow prod' } },
        onError: 'continueErrorOutput',
    })
    PushContext1 = {
        operation: 'set',
        key: "=beautyflow_bot.{{ $('get by id').item.json.id }}.{{ $('get by id').item.json.name }}.professional_context",
        value: `={{ JSON.stringify({
  id: $('get by id').item.json.id,
  name: $('get by id').item.json.name,
  email: $('get by id').item.json.email,
  phone: $('get by id').item.json.phone
}) }}`,
        keyType: 'string',
    };

    @node({
        id: '65e1692e-d59e-4d59-9cf2-30b2b3cc7a36',
        name: 'push context 2',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [672, 4400],
        credentials: { redis: { id: 'zMk8tatRFuFo6wmp', name: 'beautyflow prod' } },
        onError: 'continueErrorOutput',
    })
    PushContext2 = {
        operation: 'set',
        key: "=beautyflow_bot.{{ $('get by name').item.json.id }}.{{ $('get by name').item.json.name }}.professional_context",
        value: `={{ JSON.stringify({
  id: $('get by name').item.json.id,
  name: $('get by name').item.json.name,
  email: $('get by name').item.json.email,
  phone: $('get by name').item.json.phone
}) }}`,
        keyType: 'string',
    };

    @node({
        id: '4005c96f-2e89-4357-85a9-e0046bb5d98a',
        name: 'loop',
        type: 'n8n-nodes-base.splitInBatches',
        version: 3,
        position: [864, 3344],
    })
    Loop = {
        options: {},
    };

    @node({
        id: '4d429add-09e4-4553-ab31-789746f77af0',
        name: 'convert 1',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [448, 3680],
    })
    Convert1 = {
        jsCode: `const items = $input.all();
const output = [];

for (const item of items) {
  for (const value of Object.values(item.json || {})) {
    if (!value) continue;

    let professional;

    try {
      professional = typeof value === 'string' ? JSON.parse(value) : value;
    } catch (error) {
      continue;
    }

    if (!professional || typeof professional !== 'object' || professional.id == null) {
      continue;
    }

    output.push({
      json: {
        id: professional.id,
        name: professional.name,
        email: professional.email,
        phone: professional.phone
      },
    });
  }
}

return output;`,
    };

    @node({
        id: 'c02863ac-a85c-465e-842e-0df65453b031',
        name: 'convert 2',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [432, 4176],
    })
    Convert2 = {
        jsCode: `const items = $input.all();
const output = [];

for (const item of items) {
  for (const value of Object.values(item.json || {})) {
    if (!value) continue;

    let professional;

    try {
      professional = typeof value === 'string' ? JSON.parse(value) : value;
    } catch (error) {
      continue;
    }

    if (!professional || typeof professional !== 'object' || professional.id == null) {
      continue;
    }

    output.push({
      json: {
        id: professional.id,
        name: professional.name,
        email: professional.email,
        phone: professional.phone
      },
    });
  }
}

return output;`,
    };

    @node({
        id: '095781c5-632b-4714-8aec-bde9eab18a09',
        name: 'get context 2',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [16, 4208],
        credentials: { redis: { id: 'zMk8tatRFuFo6wmp', name: 'beautyflow prod' } },
        onError: 'continueErrorOutput',
    })
    GetContext2 = {
        operation: 'keys',
        keyPattern: "=beautyflow_bot.*.{{ $('data handler').item.json.professional.name }}.professional_context",
    };

    @node({
        id: 'a9ff4862-6b18-472a-9a0f-46b1431c98b1',
        name: 'compare',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [448, 3328],
    })
    Compare = {
        jsCode: `const httpItems = $('get all').first().json.body || [];
const redisItems = $('get context').all();

const redisIds = new Set();

for (const item of redisItems) {
  for (const value of Object.values(item.json || {})) {
    if (!value) continue;

    let professional;

    try {
      professional = typeof value === 'string' ? JSON.parse(value) : value;
    } catch (error) {
      continue;
    }

    if (professional?.id !== undefined && professional?.id !== null) {
      redisIds.add(String(professional.id));
    }
  }
}

const output = httpItems
  .filter(professional => !redisIds.has(String(professional.id)))
  .map(professional => ({
    json: {
      id: professional.id,
      name: professional.name,
      email: professional.email,
      phone: professional.phone,
    },
  }));

if (output.length === 0) {
  return [
    {
      json: {
        equal: true,
      },
    },
  ];
}

return output;`,
    };

    @node({
        id: '4bdfdd93-5756-4eef-8a7b-3def49e01ac0',
        name: 'if',
        type: 'n8n-nodes-base.if',
        version: 2.3,
        position: [656, 3328],
    })
    If_ = {
        conditions: {
            options: {
                caseSensitive: true,
                leftValue: '',
                typeValidation: 'strict',
                version: 3,
            },
            conditions: [
                {
                    id: '4607fa57-8654-4b4b-aa93-3036290745b9',
                    leftValue: "={{ $('compare').item.json.equal }}",
                    rightValue: false,
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
        id: '79ad45d8-46f0-43d5-a641-28ffaa41a316',
        name: 'wait',
        type: 'n8n-nodes-base.merge',
        version: 3.2,
        position: [1072, 3184],
    })
    Wait = {
        mode: 'chooseBranch',
    };

    @node({
        id: 'a548033d-c6a6-45e0-ac9b-6db8815c06f0',
        name: 'error report 23',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [16, 4352],
    })
    ErrorReport23 = {
        workflowId: {
            __rl: true,
            value: 'bWdz3xBVwmycvfwW',
            mode: 'list',
            cachedResultUrl: '/workflow/bWdz3xBVwmycvfwW',
            cachedResultName: 'error',
        },
        workflowInputs: {
            mappingMode: 'defineBelow',
            value: {
                error: `={{ {
  workflow: $workflow.id,
  execution: $execution.id,
  type: "internal.redis.context",
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
                api: "={{ $('data handler').first().json.api || {} }}",
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
        id: 'f852c211-4127-43bb-9075-90402dcbb40b',
        name: 'error report ',
        type: 'n8n-nodes-base.stopAndError',
        version: 1,
        position: [432, 4496],
    })
    ErrorReport = {
        errorType: 'errorObject',
        errorObject: `={
  "error": {
    "workflow": "{{ $workflow.id }}",
    "execution": "{{ $execution.id }}",
    "type": "internal.api.get_professional",
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
    "token": "{{ $('data handler').first().json.api?.token || '' }}",
    "evo_instance": "{{ $('data handler').first().json.api?.evo_instance || '' }}"
  }
}`,
    };

    @node({
        id: '525a8d22-20a7-4782-b26d-527ae6e9c63f',
        name: 'error report 24',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [672, 4544],
    })
    ErrorReport24 = {
        workflowId: {
            __rl: true,
            value: 'bWdz3xBVwmycvfwW',
            mode: 'list',
            cachedResultUrl: '/workflow/bWdz3xBVwmycvfwW',
            cachedResultName: 'error',
        },
        workflowInputs: {
            mappingMode: 'defineBelow',
            value: {
                error: `={{ {
  workflow: $workflow.id,
  execution: $execution.id,
  type: "internal.redis.context",
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
                api: "={{ $('data handler').first().json.api || {} }}",
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
        id: '26b192e6-9e60-4450-a1dd-6eff30fec025',
        name: 'error report 25',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [32, 3856],
    })
    ErrorReport25 = {
        workflowId: {
            __rl: true,
            value: 'bWdz3xBVwmycvfwW',
            mode: 'list',
            cachedResultUrl: '/workflow/bWdz3xBVwmycvfwW',
            cachedResultName: 'error',
        },
        workflowInputs: {
            mappingMode: 'defineBelow',
            value: {
                error: `={{ {
  workflow: $workflow.id,
  execution: $execution.id,
  type: "internal.redis.context",
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
                api: "={{ $('data handler').first().json.api || {} }}",
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
        id: '30346b2b-a4bd-4178-95d2-a11d3ecd949e',
        name: 'error report 1',
        type: 'n8n-nodes-base.stopAndError',
        version: 1,
        position: [640, 3936],
    })
    ErrorReport1 = {
        errorType: 'errorObject',
        errorObject: `={
  "error": {
    "workflow": "{{ $workflow.id }}",
    "execution": "{{ $execution.id }}",
    "type": "internal.api.get_professional",
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
    "token": "{{ $('data handler').first().json.api?.token || '' }}",
    "evo_instance": "{{ $('data handler').first().json.api?.evo_instance || '' }}"
  }
}`,
    };

    @node({
        id: '8b5c51e6-b7c2-4c14-8632-75426c85daee',
        name: 'error report 2',
        type: 'n8n-nodes-base.stopAndError',
        version: 1,
        position: [-224, 3248],
    })
    ErrorReport2 = {
        errorType: 'errorObject',
        errorObject: `={
  "error": {
    "workflow": "{{ $workflow.id }}",
    "execution": "{{ $execution.id }}",
    "type": "internal.api.get_professional",
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
    "token": "{{ $('data handler').first().json.api?.token || '' }}",
    "evo_instance": "{{ $('data handler').first().json.api?.evo_instance || '' }}"
  }
}`,
    };

    @node({
        id: '5e406002-00cf-4e1a-8164-e40bae189edf',
        name: 'error report 18',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [240, 3488],
    })
    ErrorReport18 = {
        workflowId: {
            __rl: true,
            value: 'bWdz3xBVwmycvfwW',
            mode: 'list',
            cachedResultUrl: '/workflow/bWdz3xBVwmycvfwW',
            cachedResultName: 'error',
        },
        workflowInputs: {
            mappingMode: 'defineBelow',
            value: {
                error: `={{ {
  workflow: $workflow.id,
  execution: $execution.id,
  type: "internal.redis.context",
  node: $prevNode.name,
  code: $json.error?.status || $json.error?.code || '',
  description: (() => {
    try {
      const part = $json.error.message.split(' - ')[1];
      return JSON.parse(JSON.parse(part)).detail;
    } catch (e) {
      return $json.error?.message || 'Erro ao consultar o contexto no Redis';
    }
  })()
} }}`,
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
                api: "={{ $('data handler').first().json.api || {} }}",
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
        options: {},
    };

    @node({
        id: '4c8006f4-5107-4d55-8963-c862abf88463',
        name: 'error report 26',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [880, 3968],
    })
    ErrorReport26 = {
        workflowId: {
            __rl: true,
            value: 'bWdz3xBVwmycvfwW',
            mode: 'list',
            cachedResultUrl: '/workflow/bWdz3xBVwmycvfwW',
            cachedResultName: 'error',
        },
        workflowInputs: {
            mappingMode: 'defineBelow',
            value: {
                error: `={{ {
  workflow: $workflow.id,
  execution: $execution.id,
  type: "internal.redis.context",
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
                api: "={{ $('data handler').first().json.api || {} }}",
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
        id: 'b837eabf-6cd4-4883-866b-59403480e1d1',
        name: 'error report 27',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [1072, 3504],
    })
    ErrorReport27 = {
        workflowId: {
            __rl: true,
            value: 'bWdz3xBVwmycvfwW',
            mode: 'list',
            cachedResultUrl: '/workflow/bWdz3xBVwmycvfwW',
            cachedResultName: 'error',
        },
        workflowInputs: {
            mappingMode: 'defineBelow',
            value: {
                error: `={{ {
  workflow: $workflow.id,
  execution: $execution.id,
  type: "internal.redis.context",
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
                api: "={{ $('data handler').first().json.api || {} }}",
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
        id: 'bbed00bd-6c80-4f3f-be52-b6c85cda9023',
        name: 'professionals context',
        type: 'n8n-nodes-base.set',
        version: 3.4,
        position: [1776, 3184],
    })
    ProfessionalsContext = {
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
                    name: 'professionals',
                    value: '={{ $json.professionals }}',
                    type: 'array',
                },
            ],
        },
        options: {},
    };

    @node({
        id: '9e4cd2c9-f0f6-4e85-8e45-7dcc31e39a3f',
        name: 'professionals data',
        type: 'n8n-nodes-base.set',
        version: 3.4,
        position: [240, 3168],
    })
    ProfessionalsData = {
        assignments: {
            assignments: [
                {
                    id: 'a3c32698-39a6-45e4-853f-1477b5893695',
                    name: 'professionals',
                    value: `={{
  $('get all').item.json.body.map(professional => ({
    id: professional.id,
    name: professional.name,
    email: professional.email,
    phone: professional.phone,
  }))
}}`,
                    type: 'array',
                },
            ],
        },
        options: {},
    };

    @node({
        id: '1c42bf90-460b-4cc6-aca9-3122cde0571e',
        name: 'get1',
        type: 'n8n-nodes-base.if',
        version: 2.3,
        position: [-224, 4192],
    })
    Get1 = {
        conditions: {
            options: {
                caseSensitive: true,
                leftValue: '',
                typeValidation: 'loose',
                version: 3,
            },
            conditions: [
                {
                    id: '82b157be-d436-4386-bfe3-49b1ecb98f81',
                    leftValue: "={{ $('data handler').first().json.professional.id }}",
                    rightValue: '',
                    operator: {
                        type: 'number',
                        operation: 'notEmpty',
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
        id: '0070678b-5064-4c1c-a825-99313398b8f6',
        name: 'if 1',
        type: 'n8n-nodes-base.if',
        version: 2.3,
        position: [0, 3088],
    })
    If1 = {
        conditions: {
            options: {
                caseSensitive: true,
                leftValue: '',
                typeValidation: 'loose',
                version: 3,
            },
            conditions: [
                {
                    id: '0ada80b5-b275-4c60-9a45-c21b7e66f3c4',
                    leftValue: "={{ $('get all').item.json.body }}",
                    rightValue: '',
                    operator: {
                        type: 'array',
                        operation: 'empty',
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
        id: '2fe3d881-c5ef-421e-936b-c53f4cfe2662',
        name: 'context',
        type: 'n8n-nodes-base.set',
        version: 3.4,
        position: [864, 4272],
    })
    Context = {
        assignments: {
            assignments: [
                {
                    id: '25c699a4-d39a-4ed8-bd2e-30cf4df1a496',
                    name: 'id',
                    value: '={{ $json.body[0].id }}',
                    type: 'number',
                },
                {
                    id: 'de9b4b49-21ea-48f9-b3b3-e11eb9aea38c',
                    name: 'name',
                    value: '={{ $json.body[0].name }}',
                    type: 'string',
                },
                {
                    id: 'd5a64daa-cddf-44d6-8300-e1dc32257937',
                    name: 'email',
                    value: '={{ $json.body[0].email }}',
                    type: 'string',
                },
                {
                    id: 'c8b02f75-b5b3-4e80-8444-3500aaa11833',
                    name: 'phone',
                    value: '={{ $json.body[0].phone }}',
                    type: 'string',
                },
            ],
        },
        options: {},
    };

    @node({
        id: 'b36e3a94-b495-4def-8b0e-1e57cff9366c',
        name: 'wait 1',
        type: 'n8n-nodes-base.merge',
        version: 3.2,
        position: [1344, 3696],
    })
    Wait1 = {
        mode: 'chooseBranch',
    };

    @node({
        id: '3834a797-533e-438d-83f8-5b6ab1760c61',
        name: 'wait 2',
        type: 'n8n-nodes-base.merge',
        version: 3.2,
        position: [1520, 4192],
    })
    Wait2 = {
        mode: 'chooseBranch',
    };

    // =====================================================================
    // ROUTAGE ET CONNEXIONS
    // =====================================================================

    @links()
    defineRouting() {
        this.Webhook.out(0).to(this.DataHandler.in(0));
        this.DataHandler.out(0).to(this.Action.in(0));
        this.GetAll.out(0).to(this.If1.in(0));
        this.GetAll.out(1).to(this.ErrorReport2.in(0));
        this.Action.out(0).to(this.GetAll.in(0));
        this.Action.out(1).to(this.Get1.in(0));
        this.GetByName.out(0).to(this.PushContext2.in(0));
        this.GetByName.out(0).to(this.Context.in(0));
        this.GetByName.out(1).to(this.ErrorReport.in(0));
        this.GetById.out(0).to(this.PushContext1.in(0));
        this.GetById.out(0).to(this.Aggregate1.in(0));
        this.GetById.out(1).to(this.ErrorReport1.in(0));
        this.GetContext.out(0).to(this.Compare.in(0));
        this.GetContext.out(1).to(this.ErrorReport18.in(0));
        this.GetContext1.out(0).to(this.HasData1.in(0));
        this.GetContext1.out(1).to(this.ErrorReport25.in(0));
        this.HasData1.out(0).to(this.Convert1.in(0));
        this.HasData1.out(0).to(this.Wait1.in(1));
        this.HasData1.out(1).to(this.GetById.in(0));
        this.HasData2.out(0).to(this.Convert2.in(0));
        this.HasData2.out(0).to(this.Wait2.in(1));
        this.HasData2.out(1).to(this.GetByName.in(0));
        this.Aggregate1.out(0).to(this.Wait1.in(0));
        this.Aggregate2.out(0).to(this.Wait2.in(0));
        this.PushContext.out(0).to(this.Loop.in(0));
        this.PushContext.out(1).to(this.ErrorReport27.in(0));
        this.PushContext1.out(0).to(this.Wait1.in(1));
        this.PushContext1.out(1).to(this.ErrorReport26.in(0));
        this.PushContext2.out(0).to(this.Wait2.in(1));
        this.PushContext2.out(1).to(this.ErrorReport24.in(0));
        this.Loop.out(0).to(this.Wait.in(1));
        this.Loop.out(1).to(this.PushContext.in(0));
        this.Convert1.out(0).to(this.Aggregate1.in(0));
        this.Convert2.out(0).to(this.Aggregate2.in(0));
        this.GetContext2.out(0).to(this.HasData2.in(0));
        this.GetContext2.out(1).to(this.ErrorReport23.in(0));
        this.Compare.out(0).to(this.If_.in(0));
        this.If_.out(0).to(this.Wait.in(1));
        this.If_.out(1).to(this.Loop.in(0));
        this.Wait.out(0).to(this.ProfessionalsContext.in(0));
        this.ErrorReport23.out(0).to(this.HasData2.in(0));
        this.ErrorReport24.out(0).to(this.Wait2.in(1));
        this.ErrorReport25.out(0).to(this.HasData1.in(0));
        this.ErrorReport26.out(0).to(this.Wait1.in(1));
        this.ProfessionalsData.out(0).to(this.Wait.in(0));
        this.Get1.out(0).to(this.GetContext1.in(0));
        this.Get1.out(1).to(this.GetContext2.in(0));
        this.If1.out(0).to(this.Wait.in(0));
        this.If1.out(1).to(this.GetContext.in(0));
        this.If1.out(1).to(this.ProfessionalsData.in(0));
        this.Context.out(0).to(this.Aggregate2.in(0));
        this.Wait1.out(0).to(this.ProfessionalsContext.in(0));
        this.Wait2.out(0).to(this.ProfessionalsContext.in(0));
    }
}
