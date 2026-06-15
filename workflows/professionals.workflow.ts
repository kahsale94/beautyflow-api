import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : professionals
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
// If_                                if
// Wait                               merge
// ErrorReport23                      executeWorkflow
// ErrorReport                        stopAndError
// NoOperationDoNothing               noOp
// ErrorReport24                      executeWorkflow
// ErrorReport25                      executeWorkflow
// NoOperationDoNothing1              noOp
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
//                  → ProfessionalsContext (↩ loop)
//             .out(1) → GetById
//                → PushContext1
//                  → NoOperationDoNothing1
//                 .out(1) → ErrorReport26
//                    → NoOperationDoNothing1 (↩ loop)
//                → Aggregate1 (↩ loop)
//               .out(1) → ErrorReport1
//           .out(1) → ErrorReport25
//              → HasData1 (↩ loop)
//         .out(1) → GetContext2
//            → HasData2
//              → Convert2
//                → Aggregate2
//                  → ProfessionalsContext (↩ loop)
//             .out(1) → GetByName
//                → PushContext2
//                  → NoOperationDoNothing
//                 .out(1) → ErrorReport24
//                    → NoOperationDoNothing (↩ loop)
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
    name: 'professionals',
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
export class ProfessionalsWorkflow {
    // =====================================================================
    // CONFIGURATION DES NOEUDS
    // =====================================================================

    @node({
        id: 'e6890190-0cec-4e2a-ba23-53ed6239062f',
        name: 'webhook',
        type: 'n8n-nodes-base.executeWorkflowTrigger',
        version: 1.1,
        position: [-1568, 4176],
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
        id: '8201f8d7-c758-4ad5-8b7a-707e46ec3bec',
        name: 'data handler',
        type: 'n8n-nodes-base.set',
        version: 3.4,
        position: [-1360, 4176],
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
        id: '2e7011ad-9fb9-4b43-965a-aa1941b0599f',
        name: 'get all',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.3,
        position: [-912, 3216],
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
        id: '456a56c7-dbcf-441e-8f0b-9c98db0a3ecb',
        name: 'action',
        type: 'n8n-nodes-base.switch',
        version: 3.4,
        position: [-1152, 4176],
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
        id: 'f4e4828a-0e36-4eb3-bc06-a111958f51c1',
        name: 'get by name',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.3,
        position: [-240, 4352],
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
        id: '014640e7-995b-4ed3-9633-f628c6dfc964',
        name: 'get by id',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.3,
        position: [-240, 3952],
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
        id: 'd945cc75-b1a7-4f98-b4d2-1ef95a56f58a',
        name: 'get context',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [-448, 3456],
        credentials: { redis: { id: 'zMk8tatRFuFo6wmp', name: 'beautyflow' } },
        onError: 'continueErrorOutput',
    })
    GetContext = {
        operation: 'keys',
        keyPattern: 'beautyflow_bot.*.*.professional_context',
    };

    @node({
        id: '51b1bdd2-1c9c-4d91-9f18-5e2dbf8faae2',
        name: 'get context 1',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [-656, 3808],
        credentials: { redis: { id: 'zMk8tatRFuFo6wmp', name: 'beautyflow' } },
        onError: 'continueErrorOutput',
    })
    GetContext1 = {
        operation: 'keys',
        keyPattern: "=beautyflow_bot.{{ $('data handler').item.json.professional.id }}.*.professional_context",
    };

    @node({
        id: '207e2ed4-dc33-46d8-b8e7-90ab1042f52b',
        name: 'has data? 1',
        type: 'n8n-nodes-base.if',
        version: 2.3,
        position: [-448, 3808],
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
        id: '6adf0616-672e-4a68-859a-085bb0600292',
        name: 'has data? 2',
        type: 'n8n-nodes-base.if',
        version: 2.3,
        position: [-448, 4192],
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
        id: 'e01a8a99-2bac-45e8-8787-5ecb59290cb8',
        name: 'aggregate 1',
        type: 'n8n-nodes-base.aggregate',
        version: 1,
        position: [512, 3792],
    })
    Aggregate1 = {
        aggregate: 'aggregateAllItemData',
        destinationFieldName: 'professionals',
        include: 'specifiedFields',
        fieldsToInclude: 'id, name, email, phone',
        options: {},
    };

    @node({
        id: 'fa6cc8df-323d-4608-82ea-e20a4a42b8ae',
        name: 'aggregate 2',
        type: 'n8n-nodes-base.aggregate',
        version: 1,
        position: [608, 4176],
    })
    Aggregate2 = {
        aggregate: 'aggregateAllItemData',
        destinationFieldName: 'professionals',
        options: {},
    };

    @node({
        id: '154da4c1-1723-4748-95bf-c7293d425116',
        name: 'push context',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [384, 3472],
        credentials: { redis: { id: 'zMk8tatRFuFo6wmp', name: 'beautyflow' } },
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
        id: 'c01329b5-c4d3-4f33-9291-7f65daff3314',
        name: 'push context 1',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [192, 3936],
        credentials: { redis: { id: 'zMk8tatRFuFo6wmp', name: 'beautyflow' } },
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
        id: 'fbb69190-efc2-4e4b-b38b-d453be715e31',
        name: 'push context 2',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [0, 4400],
        credentials: { redis: { id: 'zMk8tatRFuFo6wmp', name: 'beautyflow' } },
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
        id: '347f972e-8dda-4463-8a23-19c02214cfdb',
        name: 'loop',
        type: 'n8n-nodes-base.splitInBatches',
        version: 3,
        position: [176, 3456],
    })
    Loop = {
        options: {},
    };

    @node({
        id: 'a9e404d8-8764-4e41-a008-8214c6cf1795',
        name: 'convert 1',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [-240, 3792],
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
        id: '715c5f69-3280-48ed-9ea3-db304ab6779d',
        name: 'convert 2',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [-240, 4176],
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
        id: '003285be-bec6-4daf-9f53-5e7cceb4428a',
        name: 'get context 2',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [-656, 4208],
        credentials: { redis: { id: 'zMk8tatRFuFo6wmp', name: 'beautyflow' } },
        onError: 'continueErrorOutput',
    })
    GetContext2 = {
        operation: 'keys',
        keyPattern: "=beautyflow_bot.*.{{ $('data handler').item.json.professional.name }}.professional_context",
    };

    @node({
        id: '38468ea6-9325-45b3-bc64-d606fa66058b',
        name: 'compare',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [-240, 3440],
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
        id: '23790a7d-305f-489b-8d94-87559ea82394',
        name: 'if',
        type: 'n8n-nodes-base.if',
        version: 2.3,
        position: [-32, 3440],
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
        id: '5d0db5d9-2d87-452a-9a3f-09956d58649a',
        name: 'wait',
        type: 'n8n-nodes-base.merge',
        version: 3.2,
        position: [384, 3296],
    })
    Wait = {
        mode: 'chooseBranch',
    };

    @node({
        id: 'e3dd9f43-aad7-4dc1-9b0f-95568d17aa1b',
        name: 'error report 23',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [-656, 4352],
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
        id: '73f63b91-6570-4de9-821f-9bf0b37c653d',
        name: 'error report ',
        type: 'n8n-nodes-base.stopAndError',
        version: 1,
        position: [-240, 4496],
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
        id: 'd2609806-2978-4368-8310-c58f8fa4e2ea',
        name: 'No Operation, do nothing',
        type: 'n8n-nodes-base.noOp',
        version: 1,
        position: [352, 4400],
    })
    NoOperationDoNothing = {};

    @node({
        id: '5c287a3a-9eca-4cb8-b439-fede839d0e50',
        name: 'error report 24',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [0, 4544],
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
        id: '7c2e04a4-e6a4-4584-a791-12e73085b3e0',
        name: 'error report 25',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [-656, 3952],
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
        id: '4029fdf2-64d4-4e61-81a9-4da2fd37726e',
        name: 'No Operation, do nothing1',
        type: 'n8n-nodes-base.noOp',
        version: 1,
        position: [512, 3952],
    })
    NoOperationDoNothing1 = {};

    @node({
        id: 'affcfd96-ebe2-46da-b745-da2d5f8f78a9',
        name: 'error report 1',
        type: 'n8n-nodes-base.stopAndError',
        version: 1,
        position: [-48, 4048],
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
        id: 'b054e2d7-d240-48c1-8c53-1e17c071653c',
        name: 'error report 2',
        type: 'n8n-nodes-base.stopAndError',
        version: 1,
        position: [-912, 3360],
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
        id: '75e98a96-8591-4622-b7a5-ce5c798f657a',
        name: 'error report 18',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [-448, 3600],
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
  id: $('data handler').item.json.business.id || '',
  name: $('data handler').item.json.business.name || '',
  phone: $('data handler').item.json.business.phone || ''
} }}`,
                client: `={{ {
  remote_jid: $('data handler').item.json.client.remote_jid || '',
  message_id: $('data handler').item.json.client.message_id || '',
  message_text: $('data handler').item.json.client.message_text || ''
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
        options: {},
    };

    @node({
        id: '0b515e99-68cc-49d3-a637-9c58669f75e4',
        name: 'error report 26',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [352, 4048],
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
        id: '31e7e708-ff73-4703-98d1-c3548a351bd5',
        name: 'error report 27',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [384, 3616],
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
        id: '0f452b3e-01a6-407a-99ea-29b76bdcde62',
        name: 'professionals context',
        type: 'n8n-nodes-base.set',
        version: 3.4,
        position: [1088, 3296],
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
        id: '4d1c3cac-737f-480d-ba6f-e43406a91e2b',
        name: 'professionals data',
        type: 'n8n-nodes-base.set',
        version: 3.4,
        position: [-448, 3280],
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
        id: '5303ac49-7b32-44b2-9d59-9fc9a17fd2ce',
        name: 'get1',
        type: 'n8n-nodes-base.if',
        version: 2.3,
        position: [-896, 4192],
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
        id: '665e21e0-6caf-4067-984b-59af38262796',
        name: 'if 1',
        type: 'n8n-nodes-base.if',
        version: 2.3,
        position: [-688, 3200],
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
        id: '4441b22e-a00c-4966-a453-b526f78a21ec',
        name: 'context',
        type: 'n8n-nodes-base.set',
        version: 3.4,
        position: [192, 4272],
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
        this.HasData1.out(1).to(this.GetById.in(0));
        this.HasData2.out(0).to(this.Convert2.in(0));
        this.HasData2.out(1).to(this.GetByName.in(0));
        this.Aggregate1.out(0).to(this.ProfessionalsContext.in(0));
        this.Aggregate2.out(0).to(this.ProfessionalsContext.in(0));
        this.PushContext.out(0).to(this.Loop.in(0));
        this.PushContext.out(1).to(this.ErrorReport27.in(0));
        this.PushContext1.out(0).to(this.NoOperationDoNothing1.in(0));
        this.PushContext1.out(1).to(this.ErrorReport26.in(0));
        this.PushContext2.out(0).to(this.NoOperationDoNothing.in(0));
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
        this.ErrorReport24.out(0).to(this.NoOperationDoNothing.in(0));
        this.ErrorReport25.out(0).to(this.HasData1.in(0));
        this.ErrorReport26.out(0).to(this.NoOperationDoNothing1.in(0));
        this.ProfessionalsData.out(0).to(this.Wait.in(0));
        this.Get1.out(0).to(this.GetContext1.in(0));
        this.Get1.out(1).to(this.GetContext2.in(0));
        this.If1.out(0).to(this.Wait.in(0));
        this.If1.out(1).to(this.GetContext.in(0));
        this.If1.out(1).to(this.ProfessionalsData.in(0));
        this.Context.out(0).to(this.Aggregate2.in(0));
    }
}
