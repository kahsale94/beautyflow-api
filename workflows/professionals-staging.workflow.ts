import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : professionals-staging
// Nodes   : 39  |  Connections: 55
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
// ErrorReport23                      executeWorkflow            [onError→regular]
// ErrorReport                        stopAndError
// ErrorReport24                      executeWorkflow
// ErrorReport25                      executeWorkflow            [onError→regular]
// ErrorReport1                       stopAndError
// ErrorReport2                       stopAndError
// ErrorReport18                      executeWorkflow
// ErrorReport26                      executeWorkflow
// ErrorReport27                      executeWorkflow
// ProfessionalsContext               set
// ProfessionalsData                  set
// Get1                               if
// FreshId                            if
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
//          → FreshId
//            → GetById
//              → PushContext1
//                → Wait1.in(1)
//                  → ProfessionalsContext (↩ loop)
//               .out(1) → ErrorReport26
//                  → Wait1.in(1) (↩ loop)
//              → Aggregate1
//                → Wait1 (↩ loop)
//             .out(1) → ErrorReport1
//           .out(1) → GetContext1
//              → HasData1
//                → Convert1
//                  → Aggregate1 (↩ loop)
//                → Wait1.in(1) (↩ loop)
//               .out(1) → GetById (↩ loop)
//             .out(1) → ErrorReport25
//                → GetById (↩ loop)
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
//              → GetByName (↩ loop)
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: 'rMEHtjR5lFuN97w0',
    name: 'professionals-staging',
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
export class ProfessionalsStagingWorkflow {
    // =====================================================================
    // CONFIGURATION DES NOEUDS
    // =====================================================================

    @node({
        id: '1290e4de-6e4e-4789-b726-c267a026258d',
        name: 'webhook',
        type: 'n8n-nodes-base.executeWorkflowTrigger',
        version: 1.1,
        position: [-1584, 4288],
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
                    name: 'fresh',
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
        id: 'bce882ef-b679-48b7-9701-52a06f49e645',
        name: 'data handler',
        type: 'n8n-nodes-base.set',
        version: 3.4,
        position: [-1376, 4288],
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
                    id: 'c59e17dc-93aa-4833-872c-30df8822834f',
                    name: 'fresh',
                    value: "={{ $json.fresh === true || String($json.fresh ?? '').trim().toLowerCase() === 'true' }}",
                    type: 'boolean',
                },
                {
                    id: '65974a96-6dcd-4cdd-84ac-716742c1bb07',
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
        id: '307ad16e-4faa-480e-bf3b-ad66eefe4d8c',
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
        id: 'f5c095c4-2e43-477f-8fa1-98aa42b3b7fb',
        name: 'action',
        type: 'n8n-nodes-base.switch',
        version: 3.4,
        position: [-1168, 4288],
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
        id: '2a6876ee-8ef3-43ce-9aa1-01ff6911d5ea',
        name: 'get by name',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.3,
        position: [-256, 4464],
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
        options: {
            response: {
                response: {
                    fullResponse: true,
                },
            },
        },
    };

    @node({
        id: 'd82e831d-1907-47b8-b6cb-d124aee81f98',
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
        id: 'accdc7d5-b99f-48d9-b75d-320d43fff4c1',
        name: 'get context',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [-448, 3456],
        credentials: { redis: { id: 'yq1GIl0nbdK5QpYm', name: 'beautyflow test' } },
        onError: 'continueErrorOutput',
    })
    GetContext = {
        operation: 'keys',
        keyPattern:
            "=beautyflow_bot.{{ $('data handler').first().json.api.connection_key || 'default' }}.*.*.professional_context",
    };

    @node({
        id: '8f6a56ef-fd53-4d6f-be06-aaf4f367912f',
        name: 'get context 1',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [-656, 3824],
        credentials: { redis: { id: 'yq1GIl0nbdK5QpYm', name: 'beautyflow test' } },
        onError: 'continueErrorOutput',
    })
    GetContext1 = {
        operation: 'keys',
        keyPattern:
            "=beautyflow_bot.{{ $('data handler').first().json.api.connection_key || 'default' }}.{{ $('data handler').item.json.professional.id }}.*.professional_context",
    };

    @node({
        id: '2cb081a8-370a-43fc-b685-3d8dfaaa1c2c',
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
        id: '1952e918-3f1f-485f-beda-48dc161652cc',
        name: 'has data? 2',
        type: 'n8n-nodes-base.if',
        version: 2.3,
        position: [-464, 4304],
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
        id: '0b3f175c-679b-40d9-8fd2-35e937991616',
        name: 'aggregate 1',
        type: 'n8n-nodes-base.aggregate',
        version: 1,
        position: [368, 3792],
    })
    Aggregate1 = {
        aggregate: 'aggregateAllItemData',
        destinationFieldName: 'professionals',
        include: 'specifiedFields',
        fieldsToInclude: 'id, name, email, phone, simultaneous_capacity',
        options: {},
    };

    @node({
        id: '2bbd12f8-48c2-4f23-b20f-c7f0cbeeb055',
        name: 'aggregate 2',
        type: 'n8n-nodes-base.aggregate',
        version: 1,
        position: [400, 4240],
    })
    Aggregate2 = {
        aggregate: 'aggregateAllItemData',
        destinationFieldName: 'professionals',
        options: {},
    };

    @node({
        id: '6a3aa942-c6e1-488c-9a85-09f7c59e6c27',
        name: 'push context',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [384, 3472],
        credentials: { redis: { id: 'yq1GIl0nbdK5QpYm', name: 'beautyflow test' } },
        onError: 'continueErrorOutput',
    })
    PushContext = {
        operation: 'set',
        key: "=beautyflow_bot.{{ $('data handler').first().json.api.connection_key || 'default' }}.{{ $('loop').item.json.id }}.{{ String($('loop').item.json.name || '').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').trim().toLowerCase() }}.professional_context",
        value: `={{ JSON.stringify({
  id: $('loop').item.json.id,
  name: $('loop').item.json.name,
  email: $('loop').item.json.email,
  phone: $('loop').item.json.phone,
}) }}`,
        keyType: 'string',
        expire: true,
        ttl: 86400,
    };

    @node({
        id: '64912286-c3cb-422c-8239-5e779052fc48',
        name: 'push context 1',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [192, 3936],
        credentials: { redis: { id: 'yq1GIl0nbdK5QpYm', name: 'beautyflow test' } },
        onError: 'continueErrorOutput',
    })
    PushContext1 = {
        operation: 'set',
        key: "=beautyflow_bot.{{ $('data handler').first().json.api.connection_key || 'default' }}.{{ $('get by id').item.json.id }}.{{ String($('get by id').item.json.name || '').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').trim().toLowerCase() }}.professional_context",
        value: `={{ JSON.stringify({
  id: $('get by id').item.json.id,
  name: $('get by id').item.json.name,
  email: $('get by id').item.json.email,
  phone: $('get by id').item.json.phone
}) }}`,
        keyType: 'string',
        expire: true,
        ttl: 86400,
    };

    @node({
        id: '5277e2d4-faa0-4a40-b127-534f1d4b52b8',
        name: 'push context 2',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [-16, 4512],
        credentials: { redis: { id: 'yq1GIl0nbdK5QpYm', name: 'beautyflow test' } },
        onError: 'continueErrorOutput',
    })
    PushContext2 = {
        operation: 'set',
        key: "=beautyflow_bot.{{ $('data handler').first().json.api.connection_key || 'default' }}.{{ $('get by name').item.json.body[0].id }}.{{ String($('get by name').item.json.body[0].name || '').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').trim().toLowerCase() }}.professional_context",
        value: `={{ JSON.stringify({
  id: $('get by name').item.json.body[0].id,
  name: $('get by name').item.json.body[0].name,
  email: $('get by name').item.json.body[0].email,
  phone: $('get by name').item.json.body[0].phone
}) }}`,
        keyType: 'string',
        expire: true,
        ttl: 86400,
    };

    @node({
        id: '12cff860-cde9-45a3-9aa6-76cf1cc34e0a',
        name: 'loop',
        type: 'n8n-nodes-base.splitInBatches',
        version: 3,
        position: [176, 3456],
    })
    Loop = {
        options: {},
    };

    @node({
        id: '8fcbea2b-bbee-41cc-bf7a-13abc37319b5',
        name: 'convert 1',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [-240, 3792],
    })
    Convert1 = {
        jsCode: `const items = $input.all();
const output = [];
const seenIds = new Set();

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

    const id = String(professional.id);
    if (seenIds.has(id)) continue;
    seenIds.add(id);

    output.push({
      json: {
        id: professional.id,
        name: professional.name,
        email: professional.email,
        phone: professional.phone,
        simultaneous_capacity: professional.simultaneous_capacity ?? 1
      },
    });
  }
}

return output;`,
    };

    @node({
        id: 'ab46d7cd-838b-47f4-bcd8-2b6ce9e95cb3',
        name: 'convert 2',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [-256, 4288],
    })
    Convert2 = {
        jsCode: `const items = $input.all();
const output = [];
const seenIds = new Set();

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

    const id = String(professional.id);
    if (seenIds.has(id)) continue;
    seenIds.add(id);

    output.push({
      json: {
        id: professional.id,
        name: professional.name,
        email: professional.email,
        phone: professional.phone,
        simultaneous_capacity: professional.simultaneous_capacity ?? 1
      },
    });
  }
}

return output;`,
    };

    @node({
        id: '8255249a-da9d-4352-8041-ba288dae53a7',
        name: 'get context 2',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [-672, 4320],
        credentials: { redis: { id: 'yq1GIl0nbdK5QpYm', name: 'beautyflow test' } },
        onError: 'continueErrorOutput',
    })
    GetContext2 = {
        operation: 'keys',
        keyPattern:
            "=beautyflow_bot.{{ $('data handler').first().json.api.connection_key || 'default' }}.*.{{ String($('data handler').item.json.professional.name || '').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').trim().toLowerCase() }}.professional_context",
    };

    @node({
        id: 'f747ff6b-ade6-4eeb-9bfb-f8f5a739450e',
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
      simultaneous_capacity: professional.simultaneous_capacity ?? 1,
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
        id: '93a5d700-4014-4946-9afa-65ac7202b62b',
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
        id: 'f79e55a9-df38-4b68-83df-8866c7fa486d',
        name: 'wait',
        type: 'n8n-nodes-base.merge',
        version: 3.2,
        position: [384, 3296],
    })
    Wait = {
        mode: 'chooseBranch',
    };

    @node({
        id: '7fe70375-356b-4741-909b-ef26f5295af0',
        name: 'error report 23',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [-672, 4464],
        onError: 'continueRegularOutput',
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
        id: 'c51a6e99-037c-4505-8de5-aa06c9e821bd',
        name: 'error report ',
        type: 'n8n-nodes-base.stopAndError',
        version: 1,
        position: [-256, 4608],
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
    "token": "",
    "connection_key": "{{ $('data handler').first().json.api?.connection_key || '' }}"
  }
}`,
    };

    @node({
        id: '8e605e42-93d6-44fd-adf9-43570964eda0',
        name: 'error report 24',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [-16, 4656],
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
        id: 'bb816d8e-ea32-425c-93a5-c0b0d1d7ec7a',
        name: 'error report 25',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [-656, 3968],
        onError: 'continueRegularOutput',
    })
    ErrorReport25 = {
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
        id: '189d51c2-c149-4a62-b135-09fd92e18ac8',
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
        id: '33e0c14e-84b8-4ff1-8f09-b941a0f4bfe3',
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
        id: '5ab2ea3e-0de8-4c06-9e63-36af5a60a7b0',
        name: 'error report 18',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [-448, 3600],
    })
    ErrorReport18 = {
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
        options: {},
    };

    @node({
        id: 'f4670a9a-357b-4561-aa8a-0f1f856b332c',
        name: 'error report 26',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [192, 4080],
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
        id: '0ad3b791-8750-4132-ae4e-3afc2023340c',
        name: 'error report 27',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [384, 3616],
    })
    ErrorReport27 = {
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
        id: 'e0574fdc-20aa-464d-976c-454b12d09871',
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
                    value: `={{
  Array.isArray($json.professionals) &&
  $json.professionals.some(p =>
    p &&
    Object.values(p).some(v => v !== null && v !== undefined && v !== '')
  )
}}`,
                    type: 'boolean',
                },
                {
                    id: '7748568d-748f-4ac6-ab88-fb32197f0806',
                    name: 'professionals',
                    value: `={{
  Array.isArray($json.professionals) &&
  $json.professionals.some(p =>
    p &&
    Object.values(p).some(v => v !== null && v !== undefined && v !== '')
  )
    ? $json.professionals
    : []
}}`,
                    type: 'array',
                },
                {
                    id: 'f0e8b30c-d46a-46d4-a7ae-2b1c2e354c79',
                    name: 'message',
                    value: `={{
  Array.isArray($json.professionals) &&
  $json.professionals.some(p =>
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
        id: 'a50e3515-3d66-4025-b7b1-3bb1ab7bd2df',
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
    simultaneous_capacity: professional.simultaneous_capacity ?? 1,
  }))
}}`,
                    type: 'array',
                },
            ],
        },
        options: {},
    };

    @node({
        id: '15a5c011-01b0-472d-87fe-d17504abed75',
        name: 'get1',
        type: 'n8n-nodes-base.if',
        version: 2.3,
        position: [-912, 4304],
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
        id: 'eab9ea45-671a-450c-ab29-32c0db0e262f',
        name: 'fresh id?',
        type: 'n8n-nodes-base.if',
        version: 2.3,
        position: [-688, 4192],
    })
    FreshId = {
        conditions: {
            options: {
                caseSensitive: true,
                leftValue: '',
                typeValidation: 'strict',
                version: 3,
            },
            conditions: [
                {
                    id: '8eeadcd4-75fb-4acc-a2c0-2ffef99f28b5',
                    leftValue: "={{ $('data handler').first().json.fresh }}",
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
        id: 'd034fd05-a927-40eb-8d7d-ca9962e1b92c',
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
        id: '60e75356-170b-462e-a1f1-b16f347c8b0d',
        name: 'context',
        type: 'n8n-nodes-base.set',
        version: 3.4,
        position: [176, 4384],
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
                {
                    id: '56982af3-13e3-4679-98d9-bfb316437ef5',
                    name: 'simultaneous_capacity',
                    value: '={{ $json.body[0].simultaneous_capacity ?? 1 }}',
                    type: 'number',
                },
            ],
        },
        options: {},
    };

    @node({
        id: 'd260c735-694d-4e75-a9b7-8c49e35bedb2',
        name: 'wait 1',
        type: 'n8n-nodes-base.merge',
        version: 3.2,
        position: [656, 3808],
    })
    Wait1 = {
        mode: 'chooseBranch',
    };

    @node({
        id: '25e047ce-3daa-4513-a029-a4d726559a3e',
        name: 'wait 2',
        type: 'n8n-nodes-base.merge',
        version: 3.2,
        position: [832, 4304],
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
        this.ErrorReport23.out(0).to(this.GetByName.in(0));
        this.ErrorReport24.out(0).to(this.Wait2.in(1));
        this.ErrorReport25.out(0).to(this.GetById.in(0));
        this.ErrorReport26.out(0).to(this.Wait1.in(1));
        this.ProfessionalsData.out(0).to(this.Wait.in(0));
        this.Get1.out(0).to(this.FreshId.in(0));
        this.Get1.out(1).to(this.GetContext2.in(0));
        this.FreshId.out(0).to(this.GetById.in(0));
        this.FreshId.out(1).to(this.GetContext1.in(0));
        this.If1.out(0).to(this.Wait.in(0));
        this.If1.out(1).to(this.GetContext.in(0));
        this.If1.out(1).to(this.ProfessionalsData.in(0));
        this.Context.out(0).to(this.Aggregate2.in(0));
        this.Wait1.out(0).to(this.ProfessionalsContext.in(0));
        this.Wait2.out(0).to(this.ProfessionalsContext.in(0));
    }
}
