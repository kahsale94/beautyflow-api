import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : services-prod
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
// Wait                               merge
// If_                                if
// ErrorReport21                      executeWorkflow
// ErrorReport11                      stopAndError
// ErrorReport2                       stopAndError
// ErrorReport22                      executeWorkflow
// ErrorReport23                      executeWorkflow
// ErrorReport24                      executeWorkflow
// ErrorReport12                      stopAndError
// ErrorReport                        executeWorkflow
// ErrorReport1                       executeWorkflow
// ServicesContext                    set
// If_1                               if
// ServicesData                       set
// Get                                if
// Context                            set
// Wait2                              merge
// Wait1                              merge
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// Webhook
//    → DataHandler
//      → Action
//        → GetAll
//          → If_1
//            → Wait
//              → ServicesContext
//           .out(1) → GetContext
//              → Compare
//                → If_
//                  → Wait.in(1) (↩ loop)
//                 .out(1) → Loop
//                    → Wait.in(1) (↩ loop)
//                   .out(1) → PushContext
//                      → Loop (↩ loop)
//                     .out(1) → ErrorReport1
//             .out(1) → ErrorReport
//           .out(1) → ServicesData
//              → Wait (↩ loop)
//         .out(1) → ErrorReport2
//       .out(1) → Get
//          → GetContext1
//            → HasData1
//              → Convert1
//                → Aggregate1
//                  → Wait2
//                    → ServicesContext (↩ loop)
//              → Wait2.in(1) (↩ loop)
//             .out(1) → GetById
//                → Aggregate1 (↩ loop)
//                → PushContext1
//                  → Wait2.in(1) (↩ loop)
//                 .out(1) → ErrorReport24
//                    → Wait2.in(1) (↩ loop)
//               .out(1) → ErrorReport12
//           .out(1) → ErrorReport23
//              → HasData1 (↩ loop)
//         .out(1) → GetContext2
//            → HasData2
//              → Convert2
//                → Aggregate2
//                  → Wait1
//                    → ServicesContext (↩ loop)
//              → Wait1.in(1) (↩ loop)
//             .out(1) → GetByName
//                → PushContext2
//                  → Wait1.in(1) (↩ loop)
//                 .out(1) → ErrorReport22
//                    → Wait1.in(1) (↩ loop)
//                → Context
//                  → Aggregate2 (↩ loop)
//               .out(1) → ErrorReport11
//           .out(1) → ErrorReport21
//              → HasData2 (↩ loop)
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: 'JUmgL8OgChZeJAWe',
    name: 'services-prod',
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
export class ServicesProdWorkflow {
    // =====================================================================
    // CONFIGURATION DES NOEUDS
    // =====================================================================

    @node({
        id: 'b42f9ff2-1c18-4888-a371-61cc595b26bf',
        name: 'webhook',
        type: 'n8n-nodes-base.executeWorkflowTrigger',
        version: 1.1,
        position: [0, 6624],
    })
    Webhook = {
        workflowInputs: {
            values: [
                {
                    name: 'action',
                },
                {
                    name: 'service_id',
                },
                {
                    name: 'service_name',
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
        id: '320b2bc0-4316-4a2d-b263-fd3f45834d63',
        name: 'data handler',
        type: 'n8n-nodes-base.set',
        version: 3.4,
        position: [192, 6624],
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
                    name: 'service',
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

    if (input.service && typeof input.service === 'object' && !Array.isArray(input.service)) {
      const serviceId = Number(input.service.id);

      if (Number.isInteger(serviceId) && serviceId > 0) {
        result.id = serviceId;
      }

      if (isValidText(input.service.name)) {
        result.name = String(input.service.name).trim();
      }

      return result;
    }

    if (isValidText(input.service_name)) {
      result.name = String(input.service_name).trim();
    }

    if (typeof input.service === 'string' && isValidText(input.service)) {
      result.name = input.service.trim();
    }

    if (isValidText(input.service_id)) {
      const serviceId = Number(input.service_id);

      if (Number.isInteger(serviceId) && serviceId > 0) {
        result.id = serviceId;
      }
    }

    return result;
  })()
}}`,
                    type: 'object',
                },
                {
                    id: '994090e2-5b08-4fac-bb5f-5ba48acbc67c',
                    name: 'client',
                    value: '={{ $json.client }}',
                    type: 'object',
                },
                {
                    id: '1cb79adc-6592-4d1f-93c1-fe8d78d54465',
                    name: 'api',
                    value: `={{ {
  ...$json.api,
  url: $json.api.url + '/services'
} }}`,
                    type: 'object',
                },
            ],
        },
        options: {},
    };

    @node({
        id: '9229df91-597e-412e-8bec-e892e02ac9c4',
        name: 'get all',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.3,
        position: [752, 5552],
        onError: 'continueErrorOutput',
        alwaysOutputData: true,
    })
    GetAll = {
        url: "={{ $('data handler').first().json.api.url }}/",
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
                },
            },
        },
    };

    @node({
        id: '09919685-1fc3-4bb8-8588-88f6134be9d3',
        name: 'action',
        type: 'n8n-nodes-base.switch',
        version: 3.4,
        position: [400, 6624],
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
                                id: 'd1d07cfb-5acf-4eb2-acf3-9772a1c028d7',
                                leftValue: "={{ $('data handler').first().json.action }}",
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
                            typeValidation: 'loose',
                            version: 3,
                        },
                        conditions: [
                            {
                                id: '515c42e0-1cc3-474f-b8bd-94312e698da1',
                                leftValue: "={{ $('data handler').first().json.action }}",
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
        options: {
            allMatchingOutputs: false,
        },
    };

    @node({
        id: '5ec9d316-8ab1-447b-a934-a1cdbbffc95b',
        name: 'get by name',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.3,
        position: [1440, 6800],
        onError: 'continueErrorOutput',
    })
    GetByName = {
        url: "={{ $('data handler').item.json.api.url }}/",
        sendQuery: true,
        queryParameters: {
            parameters: [
                {
                    name: 'service_name',
                    value: "={{ $('data handler').item.json.service.name }}",
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
        options: {
            response: {
                response: {
                    fullResponse: true,
                },
            },
        },
    };

    @node({
        id: '14b48b83-be03-45c5-b395-fda376661274',
        name: 'get by id',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.3,
        position: [1440, 6352],
        onError: 'continueErrorOutput',
    })
    GetById = {
        url: "={{ $('data handler').item.json.api.url }}/{{ $('data handler').item.json.service.id }}",
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
        id: 'c4a6ea2b-0f02-46f2-8341-956b7cb110b9',
        name: 'get context',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [1232, 5840],
        credentials: { redis: { id: 'zMk8tatRFuFo6wmp', name: 'beautyflow prod' } },
        onError: 'continueErrorOutput',
    })
    GetContext = {
        operation: 'keys',
        keyPattern: 'beautyflow_bot.*.*.service_context',
    };

    @node({
        id: '6a5f8208-7ac3-4c95-9269-d18acc0e3ad8',
        name: 'get context 1',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [816, 6224],
        credentials: { redis: { id: 'zMk8tatRFuFo6wmp', name: 'beautyflow prod' } },
        onError: 'continueErrorOutput',
    })
    GetContext1 = {
        operation: 'keys',
        keyPattern: "=beautyflow_bot.{{ $('data handler').first().json.service.id }}.*.service_context",
    };

    @node({
        id: 'c8f2559a-c196-438d-a7cc-b1dd6abed1a7',
        name: 'has data? 1',
        type: 'n8n-nodes-base.if',
        version: 2.3,
        position: [1232, 6208],
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
        id: '70acca7f-df84-4f5f-bf39-d882a16c52bd',
        name: 'has data? 2',
        type: 'n8n-nodes-base.if',
        version: 2.3,
        position: [1232, 6656],
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
        id: '62b3eee9-068a-4277-b619-bfcb7e74be9a',
        name: 'aggregate 1',
        type: 'n8n-nodes-base.aggregate',
        version: 1,
        position: [1920, 6192],
    })
    Aggregate1 = {
        aggregate: 'aggregateAllItemData',
        destinationFieldName: 'services',
        include: 'specifiedFields',
        fieldsToInclude: 'id, name, price, duration_minutes',
        options: {},
    };

    @node({
        id: '331dd4e3-1df1-4c03-9659-6b86d08ee986',
        name: 'aggregate 2',
        type: 'n8n-nodes-base.aggregate',
        version: 1,
        position: [2048, 6640],
    })
    Aggregate2 = {
        aggregate: 'aggregateAllItemData',
        destinationFieldName: 'services',
        options: {},
    };

    @node({
        id: '25d85559-3cb4-47e3-872f-e1203155b6e3',
        name: 'push context',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [2064, 5856],
        credentials: { redis: { id: 'zMk8tatRFuFo6wmp', name: 'beautyflow prod' } },
        onError: 'continueErrorOutput',
    })
    PushContext = {
        operation: 'set',
        key: "=beautyflow_bot.{{ $('loop').item.json.id }}.{{ $('loop').item.json.name }}.service_context",
        value: `={{ JSON.stringify({
  id: $('loop').item.json.id,
  name: $('loop').item.json.name,
  price: $('loop').item.json.price,
  duration_minutes: $('loop').item.json.duration_minutes
}) }}`,
        keyType: 'string',
    };

    @node({
        id: '64d6434d-6828-4961-914f-b814b22a0a84',
        name: 'push context 1',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [1664, 6384],
        credentials: { redis: { id: 'zMk8tatRFuFo6wmp', name: 'beautyflow prod' } },
        onError: 'continueErrorOutput',
    })
    PushContext1 = {
        operation: 'set',
        key: "=beautyflow_bot.{{ $('get by id').item.json.id }}.{{ $('get by id').item.json.name }}.service_context",
        value: `={{ JSON.stringify({
  id: $('get by id').item.json.id,
  name: $('get by id').item.json.name,
  price: $('get by id').item.json.price,
  duration_minutes: $('get by id').item.json.duration_minutes
}) }}`,
        keyType: 'string',
    };

    @node({
        id: 'b3fa875b-bd1b-48ac-8ca9-107ffc46225c',
        name: 'push context 2',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [2048, 6864],
        credentials: { redis: { id: 'zMk8tatRFuFo6wmp', name: 'beautyflow prod' } },
        onError: 'continueErrorOutput',
        alwaysOutputData: false,
    })
    PushContext2 = {
        operation: 'set',
        key: "=beautyflow_bot.{{ $('get by name').item.json.body[0].id }}.{{ $('get by name').item.json.body[0].name }}.service_context",
        value: `={{ JSON.stringify({
  id: $('get by name').item.json.body[0].id,
  name: $('get by name').item.json.body[0].name,
  price: $('get by name').item.json.body[0].price,
  duration_minutes: $('get by name').item.json.body[0].duration_minutes
}) }}`,
        keyType: 'string',
    };

    @node({
        id: 'f20574b5-57af-4d0f-b653-5a87ed069084',
        name: 'loop',
        type: 'n8n-nodes-base.splitInBatches',
        version: 3,
        position: [1856, 5840],
    })
    Loop = {
        options: {},
    };

    @node({
        id: '55810a6e-d86d-460f-8f2c-6223ed5321e0',
        name: 'convert 1',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [1440, 6192],
    })
    Convert1 = {
        jsCode: `const items = $input.all();
const output = [];

for (const item of items) {
  for (const value of Object.values(item.json || {})) {
    if (!value) continue;

    let service;

    try {
      service = typeof value === 'string' ? JSON.parse(value) : value;
    } catch (error) {
      continue;
    }

    if (!service || typeof service !== 'object' || service.id == null) {
      continue;
    }

    output.push({
      json: {
        id: service.id,
        name: service.name,
        price: service.price,
        duration_minutes: service.duration_minutes,
      },
    });
  }
}

return output;`,
    };

    @node({
        id: '5e6c1ac1-b0aa-4a3f-8626-27774cc5592c',
        name: 'convert 2',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [1440, 6640],
    })
    Convert2 = {
        jsCode: `const items = $input.all();
const output = [];

for (const item of items) {
  for (const value of Object.values(item.json || {})) {
    if (!value) continue;

    let service;

    try {
      service = typeof value === 'string' ? JSON.parse(value) : value;
    } catch (error) {
      continue;
    }

    if (!service || typeof service !== 'object' || service.id == null) {
      continue;
    }

    output.push({
      json: {
        id: service.id,
        name: service.name,
        price: service.price,
        duration_minutes: service.duration_minutes,
      },
    });
  }
}

return output;`,
    };

    @node({
        id: '877d4c42-a08c-40ef-8ead-39582b733cab',
        name: 'get context 2',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [816, 6656],
        credentials: { redis: { id: 'zMk8tatRFuFo6wmp', name: 'beautyflow prod' } },
        onError: 'continueErrorOutput',
    })
    GetContext2 = {
        operation: 'keys',
        keyPattern: "=beautyflow_bot.*.{{ $('data handler').first().json.service.name }}.service_context",
    };

    @node({
        id: '8df45670-aee2-4e32-90ec-dd1c9da1d87e',
        name: 'compare',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [1440, 5824],
        alwaysOutputData: false,
    })
    Compare = {
        jsCode: `const httpItems = $('get all').first().json.body || [];
const redisItems = $('get context').all();

const redisIds = new Set();

for (const item of redisItems) {
  for (const value of Object.values(item.json || {})) {
    if (!value) continue;

    let service;

    try {
      service = typeof value === 'string' ? JSON.parse(value) : value;
    } catch (error) {
      continue;
    }

    if (service?.id !== undefined && service?.id !== null) {
      redisIds.add(String(service.id));
    }
  }
}

const output = httpItems
  .filter(service => !redisIds.has(String(service.id)))
  .map(service => ({
    json: {
      id: service.id,
      name: service.name,
      price: service.price,
      duration_minutes: service.duration_minutes,
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
        id: 'ac1c6f69-1565-46a1-9bcb-285bdfb97b8b',
        name: 'wait',
        type: 'n8n-nodes-base.merge',
        version: 3.2,
        position: [2080, 5680],
    })
    Wait = {
        mode: 'chooseBranch',
    };

    @node({
        id: '6aabd321-05b3-44e3-b1b2-622aabcc993d',
        name: 'if',
        type: 'n8n-nodes-base.if',
        version: 2.3,
        position: [1648, 5824],
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
        id: '9377767a-b4bf-4e2a-ad2d-bd7e57764da4',
        name: 'error report 21',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [816, 6800],
    })
    ErrorReport21 = {
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
        id: 'f73295b3-7c54-4b03-9852-00fc85e97b9a',
        name: 'error report 11',
        type: 'n8n-nodes-base.stopAndError',
        version: 1,
        position: [1440, 6944],
    })
    ErrorReport11 = {
        errorType: 'errorObject',
        errorObject: `={
  "error": {
    "workflow": "{{ $workflow.id }}",
    "execution": "{{ $execution.id }}",
    "type": "internal.api.get_service",
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
        id: '57cb90a5-eb67-4f27-bb87-d9221cbe9e01',
        name: 'error report 2',
        type: 'n8n-nodes-base.stopAndError',
        version: 1,
        position: [752, 5696],
    })
    ErrorReport2 = {
        errorType: 'errorObject',
        errorObject: `={
  "error": {
    "workflow": "{{ $workflow.id }}",
    "execution": "{{ $execution.id }}",
    "type": "internal.api.get_service",
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
        id: '5fb762c2-4aa7-4ce8-86d2-5c42f8ceabbb',
        name: 'error report 22',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [2048, 7008],
    })
    ErrorReport22 = {
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
        id: '06a19c5c-d1dc-46e4-8290-64017e1a0d3a',
        name: 'error report 23',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [816, 6368],
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
        id: 'e4fd6b10-4400-4910-b83b-a083be164253',
        name: 'error report 24',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [1664, 6528],
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
        id: 'e46bd7f6-95b2-489f-a5d7-10d2ee7e0b47',
        name: 'error report 12',
        type: 'n8n-nodes-base.stopAndError',
        version: 1,
        position: [1440, 6496],
    })
    ErrorReport12 = {
        errorType: 'errorObject',
        errorObject: `={
  "error": {
    "workflow": "{{ $workflow.id }}",
    "execution": "{{ $execution.id }}",
    "type": "internal.api.get_service",
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
        id: 'c043e2a2-7440-45a8-b3ec-a6379d226938',
        name: 'error report ',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [1232, 5984],
    })
    ErrorReport = {
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
        id: 'adf9afa9-b517-4174-b6e1-fe3bd489cb1a',
        name: 'error report 1',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [2064, 6000],
    })
    ErrorReport1 = {
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
        id: 'bceb888c-0457-4cd2-b615-af925bcc55e8',
        name: 'services context',
        type: 'n8n-nodes-base.set',
        version: 3.4,
        position: [2864, 5680],
    })
    ServicesContext = {
        assignments: {
            assignments: [
                {
                    id: '804a7f04-c007-4045-a9f5-34b606a6eea1',
                    name: 'sucess',
                    value: '={{ Array.isArray($json.services) && $json.services.length > 0 }}',
                    type: 'boolean',
                },
                {
                    id: '7748568d-748f-4ac6-ab88-fb32197f0806',
                    name: 'services',
                    value: '={{ $json.services }}',
                    type: 'array',
                },
                {
                    id: 'bfcaa4ca-6f14-47d4-bda3-c0408809e423',
                    name: 'message',
                    value: "={{ Array.isArray($json.services) && $json.services.length > 0 ? undefined : 'Nenhum serviço encontrado para essa busca.' }}",
                    type: 'string',
                },
            ],
        },
        options: {},
    };

    @node({
        id: 'b97db868-d3e2-4c56-8269-044ff98c245a',
        name: 'If',
        type: 'n8n-nodes-base.if',
        version: 2.3,
        position: [960, 5536],
    })
    If_1 = {
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
        id: 'cf227390-01e6-4676-a2f0-1b0b82f44c50',
        name: 'services data',
        type: 'n8n-nodes-base.set',
        version: 3.4,
        position: [1232, 5664],
    })
    ServicesData = {
        assignments: {
            assignments: [
                {
                    id: 'a3c32698-39a6-45e4-853f-1477b5893695',
                    name: 'services',
                    value: `={{
  $('get all').item.json.body.map(service => ({
    id: service.id,
    name: service.name,
    duration_minutes: service.duration_minutes,
    price: service.price,
  }))
}}`,
                    type: 'array',
                },
            ],
        },
        options: {},
    };

    @node({
        id: 'aaf3cb1e-a07a-457a-bac1-65abcdbabc24',
        name: 'get',
        type: 'n8n-nodes-base.if',
        version: 2.3,
        position: [608, 6640],
    })
    Get = {
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
                    leftValue: "={{ $('data handler').first().json.service.id }}",
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
        id: '9d87b01a-9b72-4019-b687-400ea50ea7ed',
        name: 'context',
        type: 'n8n-nodes-base.set',
        version: 3.4,
        position: [1744, 6704],
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
                    name: 'duration_minutes',
                    value: '={{ $json.body[0].duration_minutes }}',
                    type: 'string',
                },
                {
                    id: 'c8b02f75-b5b3-4e80-8444-3500aaa11833',
                    name: 'price',
                    value: '={{ $json.body[0].price }}',
                    type: 'string',
                },
            ],
        },
        options: {},
    };

    @node({
        id: '49e2480a-aac1-4f32-8fd7-09ddfd18feb8',
        name: 'wait 2',
        type: 'n8n-nodes-base.merge',
        version: 3.2,
        position: [2176, 6208],
    })
    Wait2 = {
        mode: 'chooseBranch',
    };

    @node({
        id: '11a91e3e-8f17-4a64-b63d-1979a032065e',
        name: 'wait 1',
        type: 'n8n-nodes-base.merge',
        version: 3.2,
        position: [2352, 6656],
    })
    Wait1 = {
        mode: 'chooseBranch',
    };

    // =====================================================================
    // ROUTAGE ET CONNEXIONS
    // =====================================================================

    @links()
    defineRouting() {
        this.Webhook.out(0).to(this.DataHandler.in(0));
        this.DataHandler.out(0).to(this.Action.in(0));
        this.GetAll.out(0).to(this.If_1.in(0));
        this.GetAll.out(1).to(this.ErrorReport2.in(0));
        this.Action.out(0).to(this.GetAll.in(0));
        this.Action.out(1).to(this.Get.in(0));
        this.GetByName.out(0).to(this.PushContext2.in(0));
        this.GetByName.out(0).to(this.Context.in(0));
        this.GetByName.out(1).to(this.ErrorReport11.in(0));
        this.GetById.out(0).to(this.Aggregate1.in(0));
        this.GetById.out(0).to(this.PushContext1.in(0));
        this.GetById.out(1).to(this.ErrorReport12.in(0));
        this.GetContext.out(0).to(this.Compare.in(0));
        this.GetContext.out(1).to(this.ErrorReport.in(0));
        this.GetContext1.out(0).to(this.HasData1.in(0));
        this.GetContext1.out(1).to(this.ErrorReport23.in(0));
        this.HasData1.out(0).to(this.Convert1.in(0));
        this.HasData1.out(0).to(this.Wait2.in(1));
        this.HasData1.out(1).to(this.GetById.in(0));
        this.HasData2.out(0).to(this.Convert2.in(0));
        this.HasData2.out(0).to(this.Wait1.in(1));
        this.HasData2.out(1).to(this.GetByName.in(0));
        this.Aggregate1.out(0).to(this.Wait2.in(0));
        this.Aggregate2.out(0).to(this.Wait1.in(0));
        this.PushContext.out(0).to(this.Loop.in(0));
        this.PushContext.out(1).to(this.ErrorReport1.in(0));
        this.PushContext1.out(0).to(this.Wait2.in(1));
        this.PushContext1.out(1).to(this.ErrorReport24.in(0));
        this.PushContext2.out(0).to(this.Wait1.in(1));
        this.PushContext2.out(1).to(this.ErrorReport22.in(0));
        this.Loop.out(0).to(this.Wait.in(1));
        this.Loop.out(1).to(this.PushContext.in(0));
        this.Convert1.out(0).to(this.Aggregate1.in(0));
        this.Convert2.out(0).to(this.Aggregate2.in(0));
        this.GetContext2.out(0).to(this.HasData2.in(0));
        this.GetContext2.out(1).to(this.ErrorReport21.in(0));
        this.Compare.out(0).to(this.If_.in(0));
        this.Wait.out(0).to(this.ServicesContext.in(0));
        this.If_.out(0).to(this.Wait.in(1));
        this.If_.out(1).to(this.Loop.in(0));
        this.ErrorReport21.out(0).to(this.HasData2.in(0));
        this.ErrorReport22.out(0).to(this.Wait1.in(1));
        this.ErrorReport23.out(0).to(this.HasData1.in(0));
        this.ErrorReport24.out(0).to(this.Wait2.in(1));
        this.If_1.out(0).to(this.Wait.in(0));
        this.If_1.out(1).to(this.GetContext.in(0));
        this.If_1.out(1).to(this.ServicesData.in(0));
        this.ServicesData.out(0).to(this.Wait.in(0));
        this.Get.out(0).to(this.GetContext1.in(0));
        this.Get.out(1).to(this.GetContext2.in(0));
        this.Context.out(0).to(this.Aggregate2.in(0));
        this.Wait2.out(0).to(this.ServicesContext.in(0));
        this.Wait1.out(0).to(this.ServicesContext.in(0));
    }
}
