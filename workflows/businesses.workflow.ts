import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : businesses
// Nodes   : 15  |  Connections: 18
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// Webhook                            executeWorkflowTrigger
// BusinessContext                    set                        [executeOnce]
// DataHandler                        set
// HasData                            if
// GetContext                         redis                      [onError→out(1)] [creds]
// Convert                            code
// PushContext                        redis                      [onError→out(1)] [creds]
// ErrorReport18                      executeWorkflow
// ErrorReport                        stopAndError
// ErrorReport19                      executeWorkflow
// GetConfig                          httpRequest                [onError→out(1)]
// GetBusiness                        httpRequest                [onError→out(1)]
// BusinessData                       set
// ErrorReport1                       stopAndError
// Wait                               merge
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// Webhook
//    → DataHandler
//      → GetContext
//        → HasData
//          → Convert
//            → BusinessContext
//         .out(1) → GetConfig
//            → GetBusiness
//              → BusinessData
//                → PushContext
//                  → Wait.in(1)
//                    → BusinessContext (↩ loop)
//                 .out(1) → ErrorReport19
//                    → Wait.in(1) (↩ loop)
//                → Wait (↩ loop)
//             .out(1) → ErrorReport1
//           .out(1) → ErrorReport
//       .out(1) → ErrorReport18
//          → HasData (↩ loop)
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: 'fI4FYgDFzKREs8oI',
    name: 'businesses',
    active: true,
    isArchived: false,
    tags: ['Kaiky', 'beautyflow-api'],
    settings: {
        executionOrder: 'v1',
        binaryMode: 'separate',
        timeSavedMode: 'fixed',
        errorWorkflow: 'bWdz3xBVwmycvfwW',
        timezone: 'America/Sao_Paulo',
        callerPolicy: 'workflowsFromSameOwner',
        availableInMCP: false,
    },
})
export class BusinessesWorkflow {
    // =====================================================================
    // CONFIGURATION DES NOEUDS
    // =====================================================================

    @node({
        id: 'ab229015-f3a5-40a8-965e-2bb21c7988b8',
        name: 'webhook',
        type: 'n8n-nodes-base.executeWorkflowTrigger',
        version: 1.1,
        position: [-640, 0],
    })
    Webhook = {
        workflowInputs: {
            values: [
                {
                    name: 'business_phone',
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
        id: '06ef012b-1862-4bb3-b84f-6e82d4865768',
        name: 'business context',
        type: 'n8n-nodes-base.set',
        version: 3.4,
        position: [1824, -32],
        executeOnce: true,
    })
    BusinessContext = {
        assignments: {
            assignments: [
                {
                    id: '368a6057-0bcf-48df-aa14-35c64fcd2a34',
                    name: 'business',
                    value: '={{ $json.business }}',
                    type: 'object',
                },
            ],
        },
        options: {},
    };

    @node({
        id: '1c16b8f5-2447-4092-a225-758bc63d9a1a',
        name: 'data handler',
        type: 'n8n-nodes-base.set',
        version: 3.4,
        position: [-432, 0],
    })
    DataHandler = {
        assignments: {
            assignments: [
                {
                    id: '401916f0-cc5c-483f-9967-cb0c969e7775',
                    name: 'api',
                    value: '={{ $json.api }}',
                    type: 'object',
                },
                {
                    id: '5ec35bf1-e6d9-4621-b9a2-0069105703d9',
                    name: 'business.phone',
                    value: '={{ $json.business_phone }}',
                    type: 'string',
                },
            ],
        },
        options: {},
    };

    @node({
        id: 'bdea41f9-7ff0-43ed-92ed-1e29371421b6',
        name: 'has data?',
        type: 'n8n-nodes-base.if',
        version: 2.3,
        position: [-16, -16],
    })
    HasData = {
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
                    leftValue: "={{ $('get context').item.json.business }}",
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
        looseTypeValidation: true,
        options: {},
    };

    @node({
        id: '6cd8081d-89a7-46c2-b65a-67a2846232e4',
        name: 'get context',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [-224, 0],
        credentials: { redis: { id: 'zMk8tatRFuFo6wmp', name: 'beautyflow' } },
        onError: 'continueErrorOutput',
    })
    GetContext = {
        operation: 'get',
        propertyName: 'business',
        key: "=beautyflow_bot.{{ $('data handler').item.json.business.phone }}.business_context",
        options: {},
    };

    @node({
        id: 'f53a1a98-0b15-4e02-a6c1-a039a9e4b8f2',
        name: 'convert',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [400, -32],
    })
    Convert = {
        jsCode: `const items = $input.all();

function parseIfJson(value) {
  if (typeof value !== 'string') {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    return value;
  }
}

const output = [];

for (const item of items) {
  let business = item.json.business;

  if (!business) {
    continue;
  }

  business = parseIfJson(business);

  if (!business || typeof business !== 'object' || Array.isArray(business)) {
    continue;
  }

  output.push({
    json: {
      business: {
        ...business,
      },
    },
  });
}

return output;`,
    };

    @node({
        id: '8c35ab70-fa9d-4962-a578-2aa733d2a1dd',
        name: 'push context',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [1328, 272],
        credentials: { redis: { id: 'zMk8tatRFuFo6wmp', name: 'beautyflow' } },
        onError: 'continueErrorOutput',
    })
    PushContext = {
        operation: 'set',
        key: "=beautyflow_bot.{{ $('data handler').item.json.business.phone }}.business_context",
        value: "={{ JSON.stringify($('business data').item.json.business) }}",
        keyType: 'string',
    };

    @node({
        id: 'c1a2e23d-6a13-4f1c-8584-5f62902c0186',
        name: 'error report 18',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [-224, 144],
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
  id: $execution.id,
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
    id: $('data handler').item.json.id || '',
    name: $('data handler').item.json.name || '',
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
        id: '1a0f6977-777b-4126-9d4f-86cd77099d82',
        name: 'error report ',
        type: 'n8n-nodes-base.stopAndError',
        version: 1,
        position: [400, 320],
    })
    ErrorReport = {
        errorType: 'errorObject',
        errorObject: `={
  "error": {
    "workflow": "{{ $workflow.id }}",
    "execution": "{{ $execution.id }}",
    "type": "internal.api.get_business",
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
    "id": "{{ $('data handler').item.json.id || '' }}",
    "name": "{{ $('data handler').item.json.name || '' }}",
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
        id: '3f61ce14-6636-4604-8409-f8b2d8618f02',
        name: 'error report 19',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [1328, 416],
    })
    ErrorReport19 = {
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
    id: $('data handler').item.json.id || '',
    name: $('data handler').item.json.name || '',
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
        id: '9429a6df-fbaf-49ab-9eb8-748c69cdf215',
        name: 'get config',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.4,
        position: [400, 176],
        onError: 'continueErrorOutput',
        retryOnFail: false,
    })
    GetConfig = {
        url: "={{ $('data handler').item.json.api.url }}/business-integrations/config",
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
        id: 'bda0c65e-a1cd-4d4f-8182-6394dffe8892',
        name: 'get business',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.4,
        position: [656, 160],
        onError: 'continueErrorOutput',
        retryOnFail: false,
    })
    GetBusiness = {
        url: "={{ $('data handler').item.json.api.url }}/businesses/me",
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
        id: '2c0f12c9-33ec-4bf1-9763-497e9603c925',
        name: 'business data',
        type: 'n8n-nodes-base.set',
        version: 3.4,
        position: [1120, 144],
    })
    BusinessData = {
        assignments: {
            assignments: [
                {
                    id: '92dfe140-495c-43ae-975d-fc23ce323365',
                    name: 'business',
                    value: `={{
  (() => {
    const business = $('get business').first().json;
    const config = $('get config').first().json.config;

    const n8nConfig = config?.n8n ?? {};
    const lateToleranceMinutes = n8nConfig.late_tolerance_minutes ?? 10;

    return {
      id: business.id,
      name: business.name,
      phone: business.phone,
      email: business.email,

      address: [
        business.address,
        business.city,
        business.state
      ].filter(Boolean).join(', '),

      allow_client_cancel: business.allow_client_cancel,
      timezone: business.timezone,

      ...(business.allow_client_cancel
        ? {
            cancellation_policies: \`Cancelamentos são permitidos com no mínimo \${business.cancel_limit_hours} horas de antecedência. Após esse prazo, o cliente deverá entrar em contato diretamente com o estabelecimento.\`
          }
        : {}),

      delay_policies: \`Em caso de atraso, recomendamos que o cliente avise o estabelecimento o quanto antes. A tolerância para atrasos é de até \${lateToleranceMinutes} minutos. Após esse período, o atendimento poderá ser remarcado ou cancelado conforme disponibilidade da agenda.\`,

      ...n8nConfig
    };
  })()
}}`,
                    type: 'object',
                },
            ],
        },
        options: {},
    };

    @node({
        id: '47372db9-8583-4f9a-9d24-941bc8fba129',
        name: 'error report 1',
        type: 'n8n-nodes-base.stopAndError',
        version: 1,
        position: [656, 304],
    })
    ErrorReport1 = {
        errorType: 'errorObject',
        errorObject: `={
  "error": {
    "workflow": "{{ $workflow.id }}",
    "execution": "{{ $execution.id }}",
    "type": "internal.api.get_business",
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
    "id": "{{ $('data handler').item.json.id || '' }}",
    "name": "{{ $('data handler').item.json.name || '' }}",
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
        id: '3869d6ff-6032-4c29-970a-eac2d9ee896c',
        name: 'wait',
        type: 'n8n-nodes-base.merge',
        version: 3.2,
        position: [1584, 160],
    })
    Wait = {
        mode: 'chooseBranch',
    };

    // =====================================================================
    // ROUTAGE ET CONNEXIONS
    // =====================================================================

    @links()
    defineRouting() {
        this.Webhook.out(0).to(this.DataHandler.in(0));
        this.DataHandler.out(0).to(this.GetContext.in(0));
        this.HasData.out(0).to(this.Convert.in(0));
        this.HasData.out(1).to(this.GetConfig.in(0));
        this.GetContext.out(0).to(this.HasData.in(0));
        this.GetContext.out(1).to(this.ErrorReport18.in(0));
        this.Convert.out(0).to(this.BusinessContext.in(0));
        this.PushContext.out(0).to(this.Wait.in(1));
        this.PushContext.out(1).to(this.ErrorReport19.in(0));
        this.ErrorReport18.out(0).to(this.HasData.in(0));
        this.ErrorReport19.out(0).to(this.Wait.in(1));
        this.GetConfig.out(0).to(this.GetBusiness.in(0));
        this.GetConfig.out(1).to(this.ErrorReport.in(0));
        this.GetBusiness.out(0).to(this.BusinessData.in(0));
        this.GetBusiness.out(1).to(this.ErrorReport1.in(0));
        this.BusinessData.out(0).to(this.PushContext.in(0));
        this.BusinessData.out(0).to(this.Wait.in(0));
        this.Wait.out(0).to(this.BusinessContext.in(0));
    }
}
