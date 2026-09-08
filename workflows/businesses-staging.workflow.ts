import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : businesses-staging
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
    id: 'dVtm2MJ8gTjXHIuE',
    name: 'businesses-staging',
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
export class BusinessesStagingWorkflow {
    // =====================================================================
    // CONFIGURATION DES NOEUDS
    // =====================================================================

    @node({
        id: '30092a60-280c-40b3-a011-930f3c9354c6',
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
        id: 'ab18a6f6-02b9-4482-b1ba-c9005d9d59fc',
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
        id: '49126f07-f191-4eab-902f-f212e89f7ba1',
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
        id: '4c5de3f7-d320-4024-a1d7-d0cefaa96200',
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
                    leftValue: `={{
(() => {
  const raw = $('get context').item.json.business;
  if (!raw) return '';

  try {
    const business = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return business?.cache_version === 4 ? 'valid' : '';
  } catch (error) {
    return '';
  }
})()
}}`,
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
        id: '36bf1ce8-ef97-483e-9fd1-5d17e3e96540',
        name: 'get context',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [-224, 0],
        credentials: { redis: { id: 'yq1GIl0nbdK5QpYm', name: 'beautyflow test' } },
        onError: 'continueErrorOutput',
    })
    GetContext = {
        operation: 'get',
        propertyName: 'business',
        key: "=beautyflow_bot.{{ $('data handler').item.json.api.connection_key || 'default' }}.{{ $('data handler').item.json.business.phone }}.business_context",
        options: {},
    };

    @node({
        id: 'a66c3c19-5be6-4137-addf-98e5b999a803',
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
        id: 'b0a12635-bef1-43e3-aa0e-41b1d3755dea',
        name: 'push context',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [1328, 272],
        credentials: { redis: { id: 'yq1GIl0nbdK5QpYm', name: 'beautyflow test' } },
        onError: 'continueErrorOutput',
    })
    PushContext = {
        operation: 'set',
        key: "=beautyflow_bot.{{ $('data handler').item.json.api.connection_key || 'default' }}.{{ $('data handler').item.json.business.phone }}.business_context",
        value: "={{ JSON.stringify($('business data').item.json.business) }}",
        keyType: 'string',
        expire: true,
        ttl: 86400,
    };

    @node({
        id: '06a59bcb-26a4-48f4-bb34-656407c0bb20',
        name: 'error report 18',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [-224, 144],
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
        id: '193e3ffe-0a25-41a5-ab0b-d84a11f3fbea',
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
        id: '596a8060-6b02-49d4-aa25-369fa514b03c',
        name: 'error report 19',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [1328, 416],
    })
    ErrorReport19 = {
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
        id: '8ca1c556-2f4a-46fb-9007-0c62789b936c',
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
        id: '2d299de7-1c5e-41de-936d-8c448aa17141',
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
        id: '87ca298e-9a68-4d6c-8a66-8ffe07de36a5',
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
    const paymentMethodLabelsByValue = {
      money: 'Dinheiro',
      pix: 'Pix',
      credit_card: 'Cartão de crédito',
      debit_card: 'Cartão de débito',
    };
    const normalizePaymentMethods = (value) => {
      const raw = Array.isArray(value) ? value : [];
      const allowed = new Set(Object.keys(paymentMethodLabelsByValue));
      const seen = new Set();

      return raw
        .map((method) => String(method || '').trim())
        .filter((method) => {
          if (!allowed.has(method) || seen.has(method)) return false;
          seen.add(method);
          return true;
        });
    };
    const paymentMethods = normalizePaymentMethods(
      business.payment_methods ?? n8nConfig.payment_methods
    );
    const configuredLabels = Array.isArray(business.payment_method_labels)
      ? business.payment_method_labels
      : n8nConfig.payment_method_labels;
    const paymentMethodLabels = Array.isArray(configuredLabels) && configuredLabels.length === paymentMethods.length
      ? configuredLabels.map((label) => String(label || '').trim()).filter(Boolean)
      : paymentMethods.map((method) => paymentMethodLabelsByValue[method]).filter(Boolean);
    const featureDefaults = {
      capacity_based_booking: false,
      recurring_schedules: false,
      replacement_classes: false,
      trial_appointments: false,
      professional_schedule_notifications: false,
    };
    const features = { ...featureDefaults };
    const featureConfigs = {
      capacity_based_booking: { professional_assignment: 'automatic' },
      recurring_schedules: {},
      replacement_classes: { expiration_days: 30 },
      trial_appointments: {},
      professional_schedule_notifications: {},
      reminder_policy: { mode: 'all' },
    };
    for (const feature of Array.isArray(business.features) ? business.features : []) {
      const key = String(feature?.feature_key || '');
      if (Object.prototype.hasOwnProperty.call(features, key)) {
        features[key] = Boolean(feature.enabled);
      }
      if (Object.prototype.hasOwnProperty.call(featureConfigs, key)) {
        featureConfigs[key] = feature.config && typeof feature.config === 'object'
          ? feature.config
          : featureConfigs[key];
      }
    }

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

      ...n8nConfig,
      payment_methods: paymentMethods,
      payment_method_labels: paymentMethodLabels,
      features,
      feature_configs: featureConfigs,
      reminder_policy: featureConfigs.reminder_policy?.mode || 'all',
      cache_version: 4,
      attendance_plan: business.attendance_plan || n8nConfig.attendance_plan || 'business_hours',
      business_is_open: Boolean(business.business_is_open),
      attendance_allowed: Boolean(business.attendance_allowed),
      attendance_block_reason: business.attendance_block_reason || null,
      attendance_status: business.attendance_status || {
        plan: business.attendance_plan || n8nConfig.attendance_plan || 'business_hours',
        business_is_open: Boolean(business.business_is_open),
        allowed: Boolean(business.attendance_allowed),
        block_reason: business.attendance_block_reason || null
      },
      opening_hours: business.opening_hours || n8nConfig.opening_hours || ''
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
        id: '4b944ac2-285b-43c1-9b35-11ec794c3b49',
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
        id: 'de4d3e2e-ebbe-4dbd-b17d-29ac2b205e6d',
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
