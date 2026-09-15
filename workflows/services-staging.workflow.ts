import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : services-staging
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
    id: 'tPtMFcuYvJPyKHQl',
    name: 'services-staging',
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
export class ServicesStagingWorkflow {
    // =====================================================================
    // CONFIGURATION DES NOEUDS
    // =====================================================================

    @node({
        id: 'cf8decf7-99e1-4fa7-ae7f-009c5dd7a896',
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
        id: '52b27bb3-387b-4a28-9a92-c0338e5e7f63',
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
                    id: '66823484-a40f-4a5d-a24b-294ea856ce1b',
                    name: 'client',
                    value: '={{ $json.business }}',
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
        id: '586a2102-1373-4d11-b618-9a2caaebf4b5',
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
        id: '8810a99f-b989-45b2-875e-fd26ae211513',
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
        id: '4a63c902-094d-46b7-94d2-d13de802b344',
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
        id: '947a7349-8a34-4f37-9006-cb57970a7ef4',
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
        id: '7a8dddf4-700e-45d0-b2d2-9e76d33e4e55',
        name: 'get context',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [1328, 4672],
        credentials: { redis: { id: 'yq1GIl0nbdK5QpYm', name: 'beautyflow test' } },
        onError: 'continueErrorOutput',
    })
    GetContext = {
        operation: 'keys',
        keyPattern:
            "=beautyflow_bot.{{ $('data handler').first().json.api.connection_key || 'default' }}.*.*.service_context",
    };

    @node({
        id: '0aa54837-c39c-40de-bbc6-0d651af5a42f',
        name: 'get context 1',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [912, 5056],
        credentials: { redis: { id: 'yq1GIl0nbdK5QpYm', name: 'beautyflow test' } },
        onError: 'continueErrorOutput',
    })
    GetContext1 = {
        operation: 'keys',
        keyPattern:
            "=beautyflow_bot.{{ $('data handler').first().json.api.connection_key || 'default' }}.{{ $('data handler').first().json.service.id }}.*.service_context",
    };

    @node({
        id: '85a450bc-9078-47d5-9258-4d6182c75004',
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
        id: 'cc3270c6-88d3-4729-a524-9ddd16ea25ad',
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
        id: 'a44f3cc6-2a51-4e33-a3a8-2a4c319eabd6',
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
        id: '6aa2db63-d34c-4cc8-b3b4-3d724fa5af82',
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
        id: '7423889f-b461-4862-81e1-cb15b98e975f',
        name: 'push context',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [2160, 4688],
        credentials: { redis: { id: 'yq1GIl0nbdK5QpYm', name: 'beautyflow test' } },
        onError: 'continueErrorOutput',
    })
    PushContext = {
        operation: 'set',
        key: "=beautyflow_bot.{{ $('data handler').first().json.api.connection_key || 'default' }}.{{ $('loop').item.json.id }}.{{ String($('loop').item.json.name || '').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').trim().toLowerCase() }}.service_context",
        value: `={{ JSON.stringify({
  id: $('loop').item.json.id,
  name: $('loop').item.json.name,
  price: $('loop').item.json.price,
  duration_minutes: $('loop').item.json.duration_minutes
}) }}`,
        keyType: 'string',
        expire: true,
        ttl: 86400,
    };

    @node({
        id: 'eeaf0da1-80ac-4d0f-84c0-13df74ae1512',
        name: 'push context 1',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [1760, 5216],
        credentials: { redis: { id: 'yq1GIl0nbdK5QpYm', name: 'beautyflow test' } },
        onError: 'continueErrorOutput',
    })
    PushContext1 = {
        operation: 'set',
        key: "=beautyflow_bot.{{ $('data handler').first().json.api.connection_key || 'default' }}.{{ $('get by id').item.json.id }}.{{ String($('get by id').item.json.name || '').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').trim().toLowerCase() }}.service_context",
        value: `={{ JSON.stringify({
  id: $('get by id').item.json.id,
  name: $('get by id').item.json.name,
  price: $('get by id').item.json.price,
  duration_minutes: $('get by id').item.json.duration_minutes
}) }}`,
        keyType: 'string',
        expire: true,
        ttl: 86400,
    };

    @node({
        id: 'ee3771b1-7169-4942-92d5-4f3bedc26de8',
        name: 'push context 2',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [2144, 5696],
        credentials: { redis: { id: 'yq1GIl0nbdK5QpYm', name: 'beautyflow test' } },
        onError: 'continueErrorOutput',
        alwaysOutputData: false,
    })
    PushContext2 = {
        operation: 'set',
        key: "=beautyflow_bot.{{ $('data handler').first().json.api.connection_key || 'default' }}.{{ $('get by name').item.json.body[0].id }}.{{ String($('get by name').item.json.body[0].name || '').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').trim().toLowerCase() }}.service_context",
        value: `={{ JSON.stringify({
  id: $('get by name').item.json.body[0].id,
  name: $('get by name').item.json.body[0].name,
  price: $('get by name').item.json.body[0].price,
  duration_minutes: $('get by name').item.json.body[0].duration_minutes
}) }}`,
        keyType: 'string',
        expire: true,
        ttl: 86400,
    };

    @node({
        id: '2799675d-5c32-4058-8c5a-46c5e209a6b5',
        name: 'loop',
        type: 'n8n-nodes-base.splitInBatches',
        version: 3,
        position: [1952, 4672],
    })
    Loop = {
        options: {},
    };

    @node({
        id: '6507e84b-0bbb-45d4-a33e-f8d83992ddbc',
        name: 'convert 1',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [1536, 5024],
    })
    Convert1 = {
        jsCode: `const items = $input.all();
const output = [];
const seenIds = new Set();

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

    const id = String(service.id);
    if (seenIds.has(id)) continue;
    seenIds.add(id);

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
        id: '2d7e005b-96f8-4053-a82a-cdb4c8e5aaf9',
        name: 'convert 2',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [1536, 5472],
    })
    Convert2 = {
        jsCode: `const items = $input.all();
const output = [];
const seenIds = new Set();

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

    const id = String(service.id);
    if (seenIds.has(id)) continue;
    seenIds.add(id);

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
        id: '24c2c74c-d3b6-4fff-80f7-86fc7753fb58',
        name: 'get context 2',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [912, 5488],
        credentials: { redis: { id: 'yq1GIl0nbdK5QpYm', name: 'beautyflow test' } },
        onError: 'continueErrorOutput',
    })
    GetContext2 = {
        operation: 'keys',
        keyPattern:
            "=beautyflow_bot.{{ $('data handler').first().json.api.connection_key || 'default' }}.*.{{ String($('data handler').first().json.service.name || '').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').trim().toLowerCase() }}.service_context",
    };

    @node({
        id: 'bdb55432-c404-4917-b0c4-31b056d845c2',
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
        id: '25288194-7713-420c-9410-8b45d8f1e127',
        name: 'wait',
        type: 'n8n-nodes-base.merge',
        version: 3.2,
        position: [2176, 4512],
    })
    Wait = {
        mode: 'chooseBranch',
    };

    @node({
        id: '561d5772-f67d-4d4c-917e-bf55879e54e6',
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
        id: '064eb7d1-377b-4243-ae36-1b55cb58c432',
        name: 'error report 21',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [912, 5632],
    })
    ErrorReport21 = {
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
        id: 'daf1331f-6feb-45a7-b98c-a263f5a97c95',
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
        id: 'a380c930-575e-4990-882e-64d4616a7163',
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
        id: '478e3d38-3fe2-4118-81ee-448ac06b6ff5',
        name: 'error report 22',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [2144, 5840],
    })
    ErrorReport22 = {
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
        id: '9b7103f6-b01e-4883-a452-04e4859d5191',
        name: 'error report 23',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [912, 5200],
    })
    ErrorReport23 = {
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
        id: '9712c279-e2ca-4087-a5a0-d44938044af8',
        name: 'error report 24',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [1760, 5360],
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
        id: '81ff1b96-a382-405a-a1b7-d7a63007b2ff',
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
        id: 'f03feab0-9cce-4180-90fe-29ae43f168c1',
        name: 'error report ',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [1328, 4816],
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
        id: 'd13fd628-9bb9-41b3-b86f-7d658b13d9ba',
        name: 'error report 1',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [2160, 4832],
    })
    ErrorReport1 = {
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
        id: '2904b2d9-34fe-4c54-b9a0-b671e026244f',
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
                    value: `={{
  Array.isArray($json.services) &&
  $json.services.some(p =>
    p &&
    Object.values(p).some(v => v !== null && v !== undefined && v !== '')
  )
}}`,
                    type: 'boolean',
                },
                {
                    id: '7748568d-748f-4ac6-ab88-fb32197f0806',
                    name: 'services',
                    value: `={{
  Array.isArray($json.services) &&
  $json.services.some(p =>
    p &&
    Object.values(p).some(v => v !== null && v !== undefined && v !== '')
  )
    ? $json.services
    : []
}}`,
                    type: 'array',
                },
                {
                    id: 'bfcaa4ca-6f14-47d4-bda3-c0408809e423',
                    name: 'message',
                    value: `={{
  Array.isArray($json.services) &&
  $json.services.some(p =>
    p &&
    Object.values(p).some(v => v !== null && v !== undefined && v !== '')
  )
    ? undefined
    : 'Nenhum profissional encontrado para essa busca.'
}}`,
                    type: 'string',
                },
            ],
        },
        options: {},
    };

    @node({
        id: 'e5fc05c6-31f4-4129-be65-f439d3efaab5',
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
        id: '0db91f33-f756-4ec1-aee7-1e830edf87e8',
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
        id: '897398d9-dff1-4207-91d8-9bb22482e06d',
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
        id: 'd78c76e8-829b-4c95-8205-33bca3e47536',
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

    @node({
        id: '1a241c2e-6b6e-4e50-abc1-15fe7a46a598',
        name: 'wait 2',
        type: 'n8n-nodes-base.merge',
        version: 3.2,
        position: [2272, 5040],
    })
    Wait2 = {
        mode: 'chooseBranch',
    };

    @node({
        id: '3535304f-742f-4d1c-9ec5-e690b6fb71be',
        name: 'wait 1',
        type: 'n8n-nodes-base.merge',
        version: 3.2,
        position: [2448, 5488],
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
