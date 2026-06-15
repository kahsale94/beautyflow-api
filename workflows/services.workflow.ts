import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : services
// Nodes   : 38  |  Connections: 49
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
// NoOperationDoNothing               noOp
// ErrorReport22                      executeWorkflow
// ErrorReport23                      executeWorkflow
// ErrorReport24                      executeWorkflow
// NoOperationDoNothing1              noOp
// ErrorReport12                      stopAndError
// ErrorReport                        executeWorkflow
// ErrorReport1                       executeWorkflow
// ServicesContext                    set
// If_1                               if
// ServicesData                       set
// Get                                if
// Context                            set
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
//                  → ServicesContext (↩ loop)
//             .out(1) → GetById
//                → Aggregate1 (↩ loop)
//                → PushContext1
//                  → NoOperationDoNothing1
//                 .out(1) → ErrorReport24
//                    → NoOperationDoNothing1 (↩ loop)
//               .out(1) → ErrorReport12
//           .out(1) → ErrorReport23
//              → HasData1 (↩ loop)
//         .out(1) → GetContext2
//            → HasData2
//              → Convert2
//                → Aggregate2
//                  → ServicesContext (↩ loop)
//             .out(1) → GetByName
//                → PushContext2
//                  → NoOperationDoNothing
//                 .out(1) → ErrorReport22
//                    → NoOperationDoNothing (↩ loop)
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
    name: 'services',
    active: true,
    isArchived: false,
    tags: ['Kaiky', 'beautyflow-api'],
    settings: {
        executionOrder: 'v1',
        availableInMCP: false,
        binaryMode: 'separate',
        timeSavedMode: 'fixed',
        errorWorkflow: 'bWdz3xBVwmycvfwW',
        timezone: 'America/Sao_Paulo',
        callerPolicy: 'workflowsFromSameOwner',
    },
})
export class ServicesWorkflow {
    // =====================================================================
    // CONFIGURATION DES NOEUDS
    // =====================================================================

    @node({
        id: '46f855f5-d422-43de-a65c-35d3c272c0f9',
        name: 'webhook',
        type: 'n8n-nodes-base.executeWorkflowTrigger',
        version: 1.1,
        position: [96, 5456],
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
        id: '19539fb4-66f8-4efe-ad6e-fe33dd6b158e',
        name: 'data handler',
        type: 'n8n-nodes-base.set',
        version: 3.4,
        position: [288, 5456],
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
        id: '77b7f8ea-444b-4f56-a2f0-77d6ff41c6a8',
        name: 'get all',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.3,
        position: [848, 4384],
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
        id: '10c0c6c1-bfc5-4e8b-ac0f-c311f94efe7c',
        name: 'action',
        type: 'n8n-nodes-base.switch',
        version: 3.4,
        position: [496, 5456],
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
        id: '3f228433-850b-4278-860a-63f3f30f66cf',
        name: 'get by name',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.3,
        position: [1536, 5632],
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
        id: '25920458-99e2-4098-99c4-02a775873e7d',
        name: 'get by id',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.3,
        position: [1536, 5184],
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
        id: '29bf52af-80f3-485f-88d0-71805fae121b',
        name: 'get context',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [1328, 4672],
        credentials: { redis: { id: 'zMk8tatRFuFo6wmp', name: 'beautyflow' } },
        onError: 'continueErrorOutput',
    })
    GetContext = {
        operation: 'keys',
        keyPattern: 'beautyflow_bot.*.*.service_context',
    };

    @node({
        id: 'a1d9d829-c1ad-4985-81d2-f8f9ed21902f',
        name: 'get context 1',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [912, 5056],
        credentials: { redis: { id: 'zMk8tatRFuFo6wmp', name: 'beautyflow' } },
        onError: 'continueErrorOutput',
    })
    GetContext1 = {
        operation: 'keys',
        keyPattern: "=beautyflow_bot.{{ $('data handler').first().json.service.id }}.*.service_context",
    };

    @node({
        id: 'b9eec892-b70d-4025-816a-2cd15262acd4',
        name: 'has data? 1',
        type: 'n8n-nodes-base.if',
        version: 2.3,
        position: [1328, 5040],
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
        id: 'd267e270-8498-4af9-a2ef-cb670512dba2',
        name: 'has data? 2',
        type: 'n8n-nodes-base.if',
        version: 2.3,
        position: [1328, 5488],
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
        id: 'da5e94b0-d371-452b-8203-2b43d000f38e',
        name: 'aggregate 1',
        type: 'n8n-nodes-base.aggregate',
        version: 1,
        position: [2016, 5024],
    })
    Aggregate1 = {
        aggregate: 'aggregateAllItemData',
        destinationFieldName: 'services',
        include: 'specifiedFields',
        fieldsToInclude: 'id, name, price, duration_minutes',
        options: {},
    };

    @node({
        id: '8bb5eab8-c7a4-4384-8d3d-c200921110ff',
        name: 'aggregate 2',
        type: 'n8n-nodes-base.aggregate',
        version: 1,
        position: [2144, 5472],
    })
    Aggregate2 = {
        aggregate: 'aggregateAllItemData',
        destinationFieldName: 'services',
        options: {},
    };

    @node({
        id: '0aee0b6c-b9ea-47e3-b8aa-a447e659fb98',
        name: 'push context',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [2160, 4688],
        credentials: { redis: { id: 'zMk8tatRFuFo6wmp', name: 'beautyflow' } },
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
        id: '9a359978-3774-4d84-810f-d0d28f4fc916',
        name: 'push context 1',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [1760, 5216],
        credentials: { redis: { id: 'zMk8tatRFuFo6wmp', name: 'beautyflow' } },
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
        id: '1cadf296-4261-4adb-b05f-1ba50c193e93',
        name: 'push context 2',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [2144, 5696],
        credentials: { redis: { id: 'zMk8tatRFuFo6wmp', name: 'beautyflow' } },
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
        id: 'a8423948-0be0-465f-a69b-0a4146bae59c',
        name: 'loop',
        type: 'n8n-nodes-base.splitInBatches',
        version: 3,
        position: [1952, 4672],
    })
    Loop = {
        options: {},
    };

    @node({
        id: 'c22423a6-d8da-4cf9-a5e6-5e50834a2325',
        name: 'convert 1',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [1536, 5024],
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
        id: 'bc9841dd-5ebf-4d59-a4ec-9da1ea60358a',
        name: 'convert 2',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [1536, 5472],
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
        id: '15f5c1d7-3729-4968-b5ca-3830465810c9',
        name: 'get context 2',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [912, 5488],
        credentials: { redis: { id: 'zMk8tatRFuFo6wmp', name: 'beautyflow' } },
        onError: 'continueErrorOutput',
    })
    GetContext2 = {
        operation: 'keys',
        keyPattern: "=beautyflow_bot.*.{{ $('data handler').first().json.service.name }}.service_context",
    };

    @node({
        id: 'e0f9c52f-751b-4870-aec7-466f831f1338',
        name: 'compare',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [1536, 4656],
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
        id: '0823fd23-463e-4146-b867-90a7235d5432',
        name: 'wait',
        type: 'n8n-nodes-base.merge',
        version: 3.2,
        position: [2176, 4512],
    })
    Wait = {
        mode: 'chooseBranch',
    };

    @node({
        id: '93a495b3-b902-40fa-886f-f84f128ec9e3',
        name: 'if',
        type: 'n8n-nodes-base.if',
        version: 2.3,
        position: [1744, 4656],
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
        id: '30a0a03b-c320-4b85-90d3-38d075d26cb7',
        name: 'error report 21',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [912, 5632],
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
    id: $('data handler').item.json.business.id || '',
    name: $('data handler').item.json.business.name || '',
    phone: $('data handler').item.json.business.phone || ''
} }}`,
                client: `={{ {
  remote_jid: $('data handler').item.json.client.remote_jid || '',
  message_id: $('data handler').item.json.message.id || '',
  message_text: $('data handler').item.json.message.text || ''
} }}`,
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
            ],
            attemptToConvertTypes: true,
            convertFieldsToString: true,
        },
        options: {
            waitForSubWorkflow: false,
        },
    };

    @node({
        id: '3c1d9fc5-c06d-49de-87bd-d3d7d63a804a',
        name: 'error report 11',
        type: 'n8n-nodes-base.stopAndError',
        version: 1,
        position: [1536, 5776],
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
    "id": "{{ $('data handler').item.json.business.id || '' }}",
    "name": "{{ $('data handler').item.json.business.name || '' }}",
    "phone": "{{ $('data handler').item.json.business.phone || '' }}"
  },
  "client": {
    "remote_jid": "{{ $('data handler').item.json.client.remote_jid || '' }}",
    "message_id": "{{ $('data handler').item.json.message.id || '' }}",
    "message_text": "{{ $('data handler').item.json.message.text || '' }}"
  }
}`,
    };

    @node({
        id: 'b93cdf94-6c2a-4fba-ab2d-bde4017a2518',
        name: 'error report 2',
        type: 'n8n-nodes-base.stopAndError',
        version: 1,
        position: [848, 4528],
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
    "id": "{{ $('data handler').item.json.business.id || '' }}",
    "name": "{{ $('data handler').item.json.business.name || '' }}",
    "phone": "{{ $('data handler').item.json.business.phone || '' }}"
  },
  "client": {
    "remote_jid": "{{ $('data handler').item.json.client.remote_jid || '' }}",
    "message_id": "{{ $('data handler').item.json.message.id || '' }}",
    "message_text": "{{ $('data handler').item.json.message.text || '' }}"
  }
}`,
    };

    @node({
        id: '45831291-1d31-4283-8430-01d139ab4442',
        name: 'No Operation, do nothing',
        type: 'n8n-nodes-base.noOp',
        version: 1,
        position: [2416, 5680],
    })
    NoOperationDoNothing = {};

    @node({
        id: '92fd3c68-5583-4607-aacf-77fbd3b3ebf8',
        name: 'error report 22',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [2144, 5840],
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
    id: $('data handler').item.json.business.id || '',
    name: $('data handler').item.json.business.name || '',
    phone: $('data handler').item.json.business.phone || ''
} }}`,
                client: `={{ {
  remote_jid: $('data handler').item.json.client.remote_jid || '',
  message_id: $('data handler').item.json.message.id || '',
  message_text: $('data handler').item.json.message.text || ''
} }}`,
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
            ],
            attemptToConvertTypes: true,
            convertFieldsToString: true,
        },
        options: {
            waitForSubWorkflow: false,
        },
    };

    @node({
        id: 'c5b84cf1-404c-4bcb-8be7-e93442a6d337',
        name: 'error report 23',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [912, 5200],
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
    id: $('data handler').item.json.business.id || '',
    name: $('data handler').item.json.business.name || '',
    phone: $('data handler').item.json.business.phone || ''
} }}`,
                client: `={{ {
  remote_jid: $('data handler').item.json.client.remote_jid || '',
  message_id: $('data handler').item.json.message.id || '',
  message_text: $('data handler').item.json.message.text || ''
} }}`,
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
            ],
            attemptToConvertTypes: true,
            convertFieldsToString: true,
        },
        options: {
            waitForSubWorkflow: false,
        },
    };

    @node({
        id: '5dcebb5c-f4ee-433c-97e4-453df157ff96',
        name: 'error report 24',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [1760, 5360],
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
    id: $('data handler').item.json.business.id || '',
    name: $('data handler').item.json.business.name || '',
    phone: $('data handler').item.json.business.phone || ''
} }}`,
                client: `={{ {
  remote_jid: $('data handler').item.json.client.remote_jid || '',
  message_id: $('data handler').item.json.message.id || '',
  message_text: $('data handler').item.json.message.text || ''
} }}`,
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
            ],
            attemptToConvertTypes: true,
            convertFieldsToString: true,
        },
        options: {
            waitForSubWorkflow: false,
        },
    };

    @node({
        id: 'd8f2bc72-32b0-44f3-b6c5-f8814eb3f3fb',
        name: 'No Operation, do nothing1',
        type: 'n8n-nodes-base.noOp',
        version: 1,
        position: [2016, 5200],
    })
    NoOperationDoNothing1 = {};

    @node({
        id: '9a846958-0450-4703-a0c1-3d00b5b2babc',
        name: 'error report 12',
        type: 'n8n-nodes-base.stopAndError',
        version: 1,
        position: [1536, 5328],
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
    "id": "{{ $('data handler').item.json.business.id || '' }}",
    "name": "{{ $('data handler').item.json.business.name || '' }}",
    "phone": "{{ $('data handler').item.json.business.phone || '' }}"
  },
  "client": {
    "remote_jid": "{{ $('data handler').item.json.client.remote_jid || '' }}",
    "message_id": "{{ $('data handler').item.json.message.id || '' }}",
    "message_text": "{{ $('data handler').item.json.message.text || '' }}"
  }
}`,
    };

    @node({
        id: '3de081a9-f581-4e54-8b77-139231fb5fcf',
        name: 'error report ',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [1328, 4816],
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
    id: $('data handler').item.json.business.id || '',
    name: $('data handler').item.json.business.name || '',
    phone: $('data handler').item.json.business.phone || ''
} }}`,
                client: `={{ {
  remote_jid: $('data handler').item.json.client.remote_jid || '',
  message_id: $('data handler').item.json.message.id || '',
  message_text: $('data handler').item.json.message.text || ''
} }}`,
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
            ],
            attemptToConvertTypes: true,
            convertFieldsToString: true,
        },
        options: {
            waitForSubWorkflow: false,
        },
    };

    @node({
        id: 'a80fa36e-4d4e-4bb1-8f53-8c0b4fac5b78',
        name: 'error report 1',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [2160, 4832],
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
    id: $('data handler').item.json.business.id || '',
    name: $('data handler').item.json.business.name || '',
    phone: $('data handler').item.json.business.phone || ''
} }}`,
                client: `={{ {
  remote_jid: $('data handler').item.json.client.remote_jid || '',
  message_id: $('data handler').item.json.message.id || '',
  message_text: $('data handler').item.json.message.text || ''
} }}`,
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
            ],
            attemptToConvertTypes: true,
            convertFieldsToString: true,
        },
        options: {
            waitForSubWorkflow: false,
        },
    };

    @node({
        id: 'c47b9b35-8a22-42ad-bb5a-659ecb83ad5f',
        name: 'services context',
        type: 'n8n-nodes-base.set',
        version: 3.4,
        position: [2960, 4512],
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
        id: 'b0894cee-f177-4e75-a2d8-3f86521cb8dc',
        name: 'If',
        type: 'n8n-nodes-base.if',
        version: 2.3,
        position: [1056, 4368],
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
        id: 'c488547f-a1a8-48f2-9b98-fab6cac5731e',
        name: 'services data',
        type: 'n8n-nodes-base.set',
        version: 3.4,
        position: [1328, 4496],
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
        id: '13ce7f5d-9aa6-4b1c-bdde-48466de030a0',
        name: 'get',
        type: 'n8n-nodes-base.if',
        version: 2.3,
        position: [704, 5472],
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
        id: 'f6f061ff-8412-4825-b372-cbe99b9dee1e',
        name: 'context',
        type: 'n8n-nodes-base.set',
        version: 3.4,
        position: [1840, 5536],
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
        this.HasData1.out(1).to(this.GetById.in(0));
        this.HasData2.out(0).to(this.Convert2.in(0));
        this.HasData2.out(1).to(this.GetByName.in(0));
        this.Aggregate1.out(0).to(this.ServicesContext.in(0));
        this.Aggregate2.out(0).to(this.ServicesContext.in(0));
        this.PushContext.out(0).to(this.Loop.in(0));
        this.PushContext.out(1).to(this.ErrorReport1.in(0));
        this.PushContext1.out(0).to(this.NoOperationDoNothing1.in(0));
        this.PushContext1.out(1).to(this.ErrorReport24.in(0));
        this.PushContext2.out(0).to(this.NoOperationDoNothing.in(0));
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
        this.ErrorReport22.out(0).to(this.NoOperationDoNothing.in(0));
        this.ErrorReport23.out(0).to(this.HasData1.in(0));
        this.ErrorReport24.out(0).to(this.NoOperationDoNothing1.in(0));
        this.If_1.out(0).to(this.Wait.in(0));
        this.If_1.out(1).to(this.GetContext.in(0));
        this.If_1.out(1).to(this.ServicesData.in(0));
        this.ServicesData.out(0).to(this.Wait.in(0));
        this.Get.out(0).to(this.GetContext1.in(0));
        this.Get.out(1).to(this.GetContext2.in(0));
        this.Context.out(0).to(this.Aggregate2.in(0));
    }
}
