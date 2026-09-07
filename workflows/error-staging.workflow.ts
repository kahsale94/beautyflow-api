import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : error-staging
// Nodes   : 17  |  Connections: 23
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// DataHandler                        set
// ErrorTrigger                       errorTrigger
// BackendErrorWebhook                webhook                    [creds]
// CallTrigger                        executeWorkflowTrigger
// Switch_                            switch
// NormalizeError                     code
// SplitOut                           splitOut
// LoopResponse                       splitInBatches
// SendResponse                       httpRequest                [onError→out(1)]
// SendResponse1                      httpRequest                [onError→out(1)]
// ClientReponse                      set
// BusinessReponse                    set
// DevReponse                         set
// SplitOut1                          splitOut
// LoopResponse1                      splitInBatches
// SendResponse2                      httpRequest                [onError→out(1)]
// ErrorContext                       set
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// ErrorTrigger
//    → DataHandler
//      → NormalizeError
//        → Switch_
//          → ClientReponse
//            → SplitOut
//              → LoopResponse
//                → ErrorContext
//               .out(1) → SendResponse
//                  → LoopResponse (↩ loop)
//                 .out(1) → ErrorContext (↩ loop)
//         .out(1) → BusinessReponse
//            → SplitOut1
//              → LoopResponse1
//                → ErrorContext (↩ loop)
//               .out(1) → SendResponse1
//                  → LoopResponse1 (↩ loop)
//                 .out(1) → ErrorContext (↩ loop)
//         .out(2) → DevReponse
//            → SendResponse2
//              → ErrorContext (↩ loop)
//             .out(1) → ErrorContext (↩ loop)
// BackendErrorWebhook
//    → DataHandler (↩ loop)
// CallTrigger
//    → DataHandler (↩ loop)
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: 'BxyJLKjTEcfzV18k',
    name: 'error-staging',
    active: true,
    isArchived: false,
    tags: ['Kaiky', 'beautyflow-api'],
    settings: {
        executionOrder: 'v1',
        availableInMCP: true,
        binaryMode: 'separate',
        callerPolicy: 'workflowsFromSameOwner',
    },
})
export class ErrorStagingWorkflow {
    // =====================================================================
    // CONFIGURATION DES NOEUDS
    // =====================================================================

    @node({
        id: '10ec7547-5310-4545-8e93-2fed74a030ab',
        name: 'data handler',
        type: 'n8n-nodes-base.set',
        version: 3.4,
        position: [496, 256],
    })
    DataHandler = {
        assignments: {
            assignments: [
                {
                    id: 'acb5487b-2d8a-431b-922d-da00f923b8fe',
                    name: 'error',
                    value: '={{ $json.error || $json.body?.error || $json.execution?.error?.context?.metadata?.error || {} }}',
                    type: 'object',
                },
                {
                    id: 'b2341770-24f7-4cc7-b68d-95d0a76615e4',
                    name: 'client',
                    value: '={{ $json.client || $json.body?.client || $json.execution?.error?.context?.metadata?.client || {} }}',
                    type: 'object',
                },
                {
                    id: '9aa47863-b845-4851-ac21-8f41b73466af',
                    name: 'business',
                    value: '={{ $json.business || $json.body?.business || $json.execution?.error?.context?.metadata?.business || {} }}',
                    type: 'object',
                },
                {
                    id: 'fbc577f0-e39a-4e8d-bb14-89e526927a96',
                    name: 'api',
                    value: '={{ $json.api || $json.body?.api || $json.execution?.error?.context?.metadata?.api || {} }}',
                    type: 'object',
                },
            ],
        },
        options: {},
    };

    @node({
        id: '88f04a56-9e26-4ef7-9e95-e72b61428dfe',
        name: 'error trigger',
        type: 'n8n-nodes-base.errorTrigger',
        version: 1,
        position: [272, 80],
    })
    ErrorTrigger = {};

    @node({
        id: 'fe9522b6-f52f-4cca-aa02-7d7790d066a0',
        webhookId: '87a7ae3e-f5b9-40c1-b5df-ccb502c68ca0',
        name: 'backend error webhook',
        type: 'n8n-nodes-base.webhook',
        version: 2,
        position: [272, 432],
        credentials: { httpHeaderAuth: { id: 'OIiqJRZKmTNQF6WE', name: 'Beautyflow Evolution Webhook - STAG' } },
    })
    BackendErrorWebhook = {
        httpMethod: 'POST',
        path: '87a7ae3e-f5b9-40c1-b5df-ccb502c68ca0',
        authentication: 'headerAuth',
        options: {},
    };

    @node({
        id: 'bf9e177d-c231-4cbf-8ba1-23cd0e71926a',
        name: 'call trigger',
        type: 'n8n-nodes-base.executeWorkflowTrigger',
        version: 1.1,
        position: [272, 256],
    })
    CallTrigger = {
        workflowInputs: {
            values: [
                {
                    name: 'error',
                    type: 'object',
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
        id: '7ae0f830-48fb-4a15-b4d5-f74836b56061',
        name: 'Switch',
        type: 'n8n-nodes-base.switch',
        version: 3.4,
        position: [944, 240],
    })
    Switch_ = {
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
                                leftValue: "={{ $('normalize error').item.json.normalized.notifyCustomer }}",
                                rightValue: true,
                                operator: {
                                    type: 'boolean',
                                    operation: 'true',
                                    singleValue: true,
                                },
                                id: '7fc06c7c-e361-4d75-a9eb-0935326e89b2',
                            },
                            {
                                leftValue:
                                    "={{ Boolean($('data handler').first().json.api.connection_key && $('data handler').first().json.api.token && ($('data handler').first().json.client.phone || $('data handler').first().json.client.provider_user_id || String($('data handler').first().json.client.remote_jid || '').includes('@')) && $('normalize error').item.json.normalized.customerMessage) }}",
                                rightValue: true,
                                operator: {
                                    type: 'boolean',
                                    operation: 'true',
                                    singleValue: true,
                                },
                                id: '0d530c89-580d-46c2-b39d-8d305a1db20f',
                            },
                        ],
                        combinator: 'and',
                    },
                    renameOutput: true,
                    outputKey: 'CLIENT',
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
                                id: 'ee786165-0cb2-468b-a7c4-06b3ffbdbd89',
                                leftValue: "={{ $('normalize error').item.json.normalized.notifyOwner }}",
                                rightValue: '',
                                operator: {
                                    type: 'boolean',
                                    operation: 'true',
                                    singleValue: true,
                                },
                            },
                            {
                                id: '0ffce208-8b92-4604-89a0-061165fc02e9',
                                leftValue:
                                    "={{ Boolean($('data handler').first().json.api.connection_key && $('data handler').first().json.api.token && $('data handler').first().json.business.phone && $('normalize error').item.json.normalized.ownerMessage) }}",
                                rightValue: true,
                                operator: {
                                    type: 'boolean',
                                    operation: 'true',
                                    singleValue: true,
                                },
                            },
                        ],
                        combinator: 'and',
                    },
                    renameOutput: true,
                    outputKey: 'BUSINESS',
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
                                id: '40ce48eb-f273-4454-a8d5-c61bd4f8eb74',
                                leftValue: "={{ $('normalize error').item.json.normalized.notifyDev }}",
                                rightValue: '',
                                operator: {
                                    type: 'boolean',
                                    operation: 'true',
                                    singleValue: true,
                                },
                            },
                            {
                                id: '9a64c39a-a546-4036-bfd2-d0b4df7aa700',
                                leftValue:
                                    "={{ Boolean($('data handler').first().json.api.connection_key && $('data handler').first().json.api.token) }}",
                                rightValue: true,
                                operator: {
                                    type: 'boolean',
                                    operation: 'true',
                                    singleValue: true,
                                },
                            },
                        ],
                        combinator: 'and',
                    },
                    renameOutput: true,
                    outputKey: 'DEV',
                },
            ],
        },
        looseTypeValidation: true,
        options: {
            allMatchingOutputs: true,
        },
    };

    @node({
        id: '037b643f-244b-4123-9d2b-5fd9c486b912',
        name: 'normalize error',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [720, 256],
    })
    NormalizeError = {
        jsCode: `const input = $input.first().json;

const error = input.error || {};
const business = input.business || {};
const client = input.client || {};

const type = String(error.type || 'unknown').trim();

const policies = {
  'backend.unhandled': {
    severity: 'critical',
    notifyCustomer: false,
    notifyOwner: false,
    notifyDev: true
  },

  'internal.api.auth': {
    severity: 'critical',
    notifyCustomer: true,
    notifyOwner: true,
    notifyDev: true,
    customerMessage: 'Tive uma instabilidade no sistema agora e não consegui continuar o atendimento. A equipe já vai verificar.'
  },
  
  'internal.api.reminders': {
    severity: 'high',
    notifyCustomer: false,
    notifyOwner: false,
    notifyDev: true,
  },

  'internal.api.get_business': {
    severity: 'critical',
    notifyCustomer: true,
    notifyOwner: true,
    notifyDev: true,
    customerMessage: 'Não consegui acessar os dados da empresa agora. A equipe já vai verificar.'
  },
  
  'internal.api.get_service': {
    severity: 'critical',
    notifyCustomer: false,
    notifyOwner: true,
    notifyDev: true
  },
  
  'internal.api.post_client': {
    severity: 'critical',
    notifyCustomer: false,
    notifyOwner: true,
    notifyDev: true
  },
  
  'internal.api.client_name': {
    severity: 'high',
    notifyCustomer: false,
    notifyOwner: true,
    notifyDev: true
  },
  
  'internal.api.get_client': {
    severity: 'critical',
    notifyCustomer: false,
    notifyOwner: true,
    notifyDev: true
  },
  
  'internal.api.get_professional': {
    severity: 'critical',
    notifyCustomer: false,
    notifyOwner: true,
    notifyDev: true
  },
  
  'internal.api.get_context': {
    severity: 'critical',
    notifyCustomer: false,
    notifyOwner: true,
    notifyDev: true
  },
  
  'internal.api.get_appointment': {
    severity: 'critical',
    notifyCustomer: false,
    notifyOwner: true,
    notifyDev: true,
    customerMessage: 'Não consegui verificar seus agendamentos. Vou pedir para a equipe verificar e te retornar. Gostaria de mais alguma coisa?'
  },
  
  'internal.api.complete_appointments': {
    severity: 'low',
    notifyCustomer: false,
    notifyOwner: true,
    notifyDev: true
  },

  'internal.redis.keys': {
    severity: 'medium',
    notifyCustomer: false,
    notifyOwner: false,
    notifyDev: true
  },
  
  'internal.redis.buffer': {
    severity: 'high',
    notifyCustomer: true,
    notifyOwner: false,
    notifyDev: true,
    customerMessage: 'Tive uma instabilidade para recuperar a etapa anterior. Poderia me confirmar novamente o que deseja fazer?'
  },
  
  'internal.redis.context': {
    severity: 'medium',
    notifyCustomer: false,
    notifyOwner: false,
    notifyDev: true
  },
  
  'internal.redis.set_pending': {
    severity: 'high',
    notifyCustomer: true,
    notifyOwner: false,
    notifyDev: true,
    customerMessage: 'Tive uma instabilidade para recuperar a etapa anterior. Poderia me confirmar novamente o que deseja fazer?'
  },
  
  'internal.redis.get_pending': {
    severity: 'high',
    notifyCustomer: true,
    notifyOwner: false,
    notifyDev: true,
    customerMessage: 'Tive uma instabilidade para recuperar a etapa anterior. Poderia me confirmar novamente o que deseja fazer?'
  },
  
  'internal.redis.get_timeout': {
    severity: 'high',
    notifyCustomer: true,
    notifyOwner: false,
    notifyDev: true,
    customerMessage: 'Tive uma instabilidade para recuperar a etapa anterior. Poderia me confirmar novamente o que deseja fazer?'
  },
  
  'internal.redis.set_timeout': {
    severity: 'high',
    notifyCustomer: false,
    notifyOwner: true,
    notifyDev: true
  },

  'internal.redis.delete_pending': {
    severity: 'high',
    notifyCustomer: false,
    notifyOwner: false,
    notifyDev: true
  },

  'internal.redis.get_memory': {
    severity: 'high',
    notifyCustomer: false,
    notifyOwner: false,
    notifyDev: true
  },

  'internal.redis.push_memory': {
    severity: 'high',
    notifyCustomer: false,
    notifyOwner: false,
    notifyDev: true
  },

  'internal.api.contact_ownership': {
    severity: 'high',
    notifyCustomer: true,
    notifyOwner: false,
    notifyDev: true,
    customerMessage: 'Tive uma instabilidade para continuar o atendimento. Poderia tentar novamente em instantes?'
  },

  'internal.api.human_takeover': {
    severity: 'high',
    notifyCustomer: true,
    notifyOwner: false,
    notifyDev: true,
    customerMessage: 'Tive uma instabilidade para continuar o atendimento. Poderia tentar novamente em instantes?'
  },

  'external.whatsapp.download_media': {
    severity: 'low',
    notifyCustomer: true,
    notifyOwner: false,
    notifyDev: true,
    customerMessage: 'Não consegui processar esse áudio agora. Poderia me mandar em texto?'
  },

  'external.whatsapp.send_message': {
    severity: 'critical',
    notifyCustomer: false,
    notifyOwner: true,
    notifyDev: true
  },

  'external.ai.transcription': {
    severity: 'low',
    notifyCustomer: true,
    notifyOwner: false,
    notifyDev: true,
    customerMessage: 'Não consegui entender o áudio agora. Poderia me mandar em texto?'
  },
  
  'external.ai.text_classifier': {
    severity: 'high',
    notifyCustomer: false,
    notifyOwner: false,
    notifyDev: true
  },
  
  'external.ai.name_extractor': {
    severity: 'high',
    notifyCustomer: false,
    notifyOwner: false,
    notifyDev: true
  },

  'business.human_handoff': {
    severity: 'medium',
    notifyCustomer: false,
    notifyOwner: true,
    notifyDev: false
  },

  'internal.ai.agent': {
    severity: 'critical',
    notifyCustomer: true,
    notifyOwner: false,
    notifyDev: true,
    customerMessage: 'Desculpa, tive uma instabilidade aqui. Poderia me mandar novamente?'
  },

  'business.availability_get_slots': {
    severity: 'critical',
    notifyCustomer: true,
    notifyOwner: false,
    notifyDev: true,
    customerMessage: 'Não consegui consultar os horários disponíveis agora. Poderia tentar novamente em instantes?'
  },

  'business.availability_check_and_suggest': {
    severity: 'critical',
    notifyCustomer: true,
    notifyOwner: false,
    notifyDev: true,
    customerMessage: 'Não consegui confirmar esse horário nem buscar alternativas agora. Poderia tentar novamente em instantes?'
  },

  'business.appointment_create': {
    severity: 'critical',
    notifyCustomer: true,
    notifyOwner: true,
    notifyDev: true,
    customerMessage: 'Não consegui confirmar o agendamento com segurança agora. Vou pedir para a equipe verificar e te retornar.'
  },

  'business.appointment_update': {
    severity: 'critical',
    notifyCustomer: true,
    notifyOwner: true,
    notifyDev: true,
    customerMessage: 'Não consegui confirmar a remarcação com segurança agora. Vou pedir para a equipe verificar e te retornar.'
  },

  'business.appointment_cancel': {
    severity: 'critical',
    notifyCustomer: true,
    notifyOwner: true,
    notifyDev: true,
    customerMessage: 'Não consegui confirmar o cancelamento com segurança agora. Vou pedir para a equipe verificar e te retornar.'
  },

  'external.calendar': {
    severity: 'high',
    notifyCustomer: false,
    notifyOwner: false,
    notifyDev: true
  },

  'external.gmail': {
    severity: 'medium',
    notifyCustomer: false,
    notifyOwner: false,
    notifyDev: true
  }
};

const fallbackPolicy = {
  severity: 'medium',
  notifyCustomer: true,
  notifyOwner: false,
  notifyDev: true,
  customerMessage: 'Tive uma instabilidade aqui. Pode tentar novamente em instantes?'
};

const policy = policies[type] || fallbackPolicy;

function valueOrFallback(value, fallback = 'não informado') {
  return value === undefined || value === null || value === ''
    ? fallback
    : String(value);
}

function isMessagingError(type, error) {
  const normalizedType = String(type || '').toLowerCase();
  const node = String(error.node || '').toLowerCase();

  return (
    normalizedType.includes('whatsapp') ||
    normalizedType.includes('covercut') ||
    normalizedType.includes('evolution') ||
    node.includes('whatsapp') ||
    node.includes('covercut') ||
    node.includes('evolution') ||
    node.includes('send response') ||
    node.includes('get base64')
  );
}

function buildOwnerMessage({ type, error, business, client, policy }) {
  if (!policy.notifyOwner) return '';

  if (isMessagingError(type, error)) return '';

  const businessName = valueOrFallback(business.name || business.business_name, '');
  const clientPhone = valueOrFallback(
    client.phone ||
    client.remote_jid ||
    client.client_remote_jid ||
    business.client_remote_jid,
    'cliente não identificado'
  );

  const errorNode = valueOrFallback(error.node);
  const errorCode = valueOrFallback(error.code);
  const executionId = valueOrFallback(error.id || error.execution);
  const description = valueOrFallback(error.description || error.message);

  const baseFooter =
    \`\\n\\nDetalhes para suporte:\` +
    \`\\n- Tipo: \${type}\` +
    \`\\n- Node: \${errorNode}\` +
    \`\\n- Código: \${errorCode}\` +
    \`\\n- Execução: \${executionId}\` +
    \`\\n- Cliente: \${clientPhone}\` +
    \`\\n- Erro: \${description}\`;

  const messages = {
    'internal.api.auth':
      \`⚠️ Atenção, \${businessName}.\\n\\nO assistente teve uma falha de autenticação e pode não conseguir atender os clientes neste momento. Nossa equipe técnica precisa verificar o acesso ao sistema.\`,
    
    'internal.redis.set_timeout':
      \`⚠️ Atenção, \${businessName}.\\n\\nO assistente teve uma falha ao tranferir a conversa para o atendimento humano. Nossa equipe técnica já foi avisada e irá verificar o sistema.\`,

    'internal.api.get_business':
      \`⚠️ Atenção, \${businessName}.\\n\\nO assistente não conseguiu carregar os dados da empresa. Alguns atendimentos podem ficar indisponíveis até a equipe técnica verificar.\`,

    'internal.api.post_client':
      \`⚠️ Atenção, \${businessName}.\\n\\nUm cliente tentou iniciar atendimento ou agendamento, mas o assistente não conseguiu criar o cadastro com segurança. Pode ser necessário verificar manualmente e responder o cliente.\`,

    'business.appointment_create':
      \`⚠️ Atenção, \${businessName}.\\n\\nUm cliente tentou fazer um agendamento, mas o assistente não conseguiu confirmar a criação com segurança.\\n\\nAntes de responder o cliente, verifique manualmente se o agendamento foi criado para evitar duplicidade.\`,

    'business.appointment_update':
      \`⚠️ Atenção, \${businessName}.\\n\\nUm cliente tentou remarcar um agendamento, mas o assistente não conseguiu confirmar a alteração com segurança.\\n\\nAntes de responder o cliente, verifique manualmente a agenda para confirmar se a remarcação aconteceu.\`,

    'business.appointment_cancel':
      \`⚠️ Atenção, \${businessName}.\\n\\nUm cliente tentou cancelar um agendamento, mas o assistente não conseguiu confirmar o cancelamento com segurança.\\n\\nAntes de responder o cliente, verifique manualmente se o agendamento foi cancelado.\`,

    'business.human_handoff':
      \`Atenção, \${businessName}.\\n\\nUm cliente pediu explicitamente atendimento humano. O assistente pausou temporariamente a conversa para evitar respostas automáticas durante o atendimento.\\n\\nÚltima mensagem: \${valueOrFallback(client.message_text || client.message || error.description)}\`,

    'external.calendar':
      \`⚠️ Atenção, \${businessName}.\\n\\nUm agendamento pode ter sido salvo no sistema, mas houve falha ao sincronizar com o calendário. Verifique se a agenda externa precisa ser atualizada manualmente.\`
  };

  const message =
    messages[type] ||
    \`⚠️ Atenção, \${businessName}.\\n\\nO assistente encontrou uma falha que pode exigir verificação manual.\`;

  return message + baseFooter;
}

const ownerMessage = buildOwnerMessage({
  type,
  error,
  business,
  client,
  policy
});

return [
  {
    json: {
      error,
      business,
      client,
      policy: {
        ...policy,
        ownerMessage
      },
      normalized: {
        type,
        severity: policy.severity,
        notifyCustomer: policy.notifyCustomer,
        notifyOwner: policy.notifyOwner,
        notifyDev: policy.notifyDev,
        customerMessage: policy.customerMessage || '',
        ownerMessage
      }
    }
  }
];`,
    };

    @node({
        id: '43f1c82f-c3f9-44d4-9b0f-3bee2026ba53',
        name: 'split out',
        type: 'n8n-nodes-base.splitOut',
        version: 1,
        position: [1408, -48],
    })
    SplitOut = {
        fieldToSplitOut: 'response',
        options: {},
    };

    @node({
        id: 'ee443402-f5b7-47b6-a6ad-ff3b29ca43bc',
        name: 'loop response',
        type: 'n8n-nodes-base.splitInBatches',
        version: 3,
        position: [1616, -48],
    })
    LoopResponse = {
        options: {},
    };

    @node({
        id: '88b2fe05-8033-456b-ad2d-9c6684ea45d6',
        name: 'send response',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.4,
        position: [1856, 0],
        onError: 'continueErrorOutput',
    })
    SendResponse = {
        method: 'POST',
        url: "={{ $('data handler').first().json.api.url }}/whatsapp/messages",
        sendHeaders: true,
        headerParameters: {
            parameters: [
                {
                    name: 'Authorization',
                    value: "={{ $('data handler').first().json.api.token }}",
                },
            ],
        },
        sendBody: true,
        specifyBody: 'json',
        jsonBody: `={{ {
  type: 'text',
  ...($('data handler').first().json.client.phone
    ? { to: $('data handler').first().json.client.phone }
    : $('data handler').first().json.client.provider_user_id
      ? { recipient: $('data handler').first().json.client.provider_user_id }
      : { to: String($('data handler').first().json.client.remote_jid || '').split('@')[0] }),
  ...($('data handler').first().json.client.contact_id
    ? { contact_id: $('data handler').first().json.client.contact_id }
    : {}),
  text: $('client reponse').first().json.response
} }}`,
        options: {},
    };

    @node({
        id: 'ae070d0c-e14d-4d23-90a0-dc3565263e19',
        name: 'send response1',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.4,
        position: [1840, 304],
        onError: 'continueErrorOutput',
    })
    SendResponse1 = {
        method: 'POST',
        url: "={{ $('data handler').first().json.api.url }}/whatsapp/messages",
        sendHeaders: true,
        headerParameters: {
            parameters: [
                {
                    name: 'Authorization',
                    value: "={{ $('data handler').first().json.api.token }}",
                },
            ],
        },
        sendBody: true,
        specifyBody: 'json',
        jsonBody: `={{ {
  type: 'text',
  to: $('data handler').first().json.business.phone,
  text: $('business reponse').item.json.response
} }}`,
        options: {},
    };

    @node({
        id: '05cf5e26-5425-4d72-92c2-7d26719ff92f',
        name: 'client reponse',
        type: 'n8n-nodes-base.set',
        version: 3.4,
        position: [1200, -48],
    })
    ClientReponse = {
        assignments: {
            assignments: [
                {
                    id: '43099950-bb55-4647-830f-b0aa10e7d3c3',
                    name: 'response',
                    value: "={{ $('normalize error').item.json.normalized.customerMessage.split(/\\n\\n+/).filter(Boolean) }}",
                    type: 'array',
                },
            ],
        },
        options: {},
    };

    @node({
        id: '5e9ac72b-9337-4283-b9f5-15c62e7dc0d2',
        name: 'business reponse',
        type: 'n8n-nodes-base.set',
        version: 3.4,
        position: [1200, 256],
    })
    BusinessReponse = {
        assignments: {
            assignments: [
                {
                    id: '43099950-bb55-4647-830f-b0aa10e7d3c3',
                    name: 'response',
                    value: "={{ $('normalize error').item.json.normalized.ownerMessage.split(/\\n\\n+/).filter(Boolean) }}",
                    type: 'array',
                },
            ],
        },
        options: {},
    };

    @node({
        id: '179ae844-4128-421c-8406-78e1274f084b',
        name: 'dev reponse',
        type: 'n8n-nodes-base.set',
        version: 3.4,
        position: [1216, 528],
    })
    DevReponse = {
        assignments: {
            assignments: [
                {
                    id: '43099950-bb55-4647-830f-b0aa10e7d3c3',
                    name: 'response',
                    value: `={{
[
  '🚨 ERRO DETECTADO',
  '',
  '📈 Workflow',
  \`ID: \${$json.error?.workflow || 'não informado'}\`,
  \`Execução: \${$json.error?.execution || 'não informado'}\`,
  '',
  '📌 Dados do erro',
  \`Tipo: \${$json.error?.type || 'não informado'}\`,
  \`Node: \${$json.error?.node || 'não informado'}\`,
  \`Código: \${$json.error?.code || 'não informado'}\`,
  \`Descrição: \${$json.error?.description || 'não informado'}\`,
  '',
  '🏢 Negócio',
  \`Nome: \${$json.business?.name || 'não informado'}\`,
  \`Telefone: \${$json.business?.phone || 'não informado'}\`,
  '',
  '👤 Cliente',
  \`Telefone: \${$json.client.remote_jid || 'não informado'}\`,
  \`ID da Mensagem: \${$json.client.message_id || 'não informado'}\`,
  \`Mensagem: \${$json.client.message_text || 'não informado'}\`,
  '',
  '⚙️ Política',
  \`Severidade: \${$json.policy?.severity || 'não informado'}\`,
  \`Notificar cliente: \${$json.policy?.notifyCustomer ? 'sim' : 'não'}\`,
  \`Notificar dono: \${$json.policy?.notifyOwner ? 'sim' : 'não'}\`,
  \`Notificar dev: \${$json.policy?.notifyDev ? 'sim' : 'não'}\`,
  '',
  '💬 Mensagem para o cliente',
  $json.policy?.customerMessage || 'não informado',
  '',
  '👑 Mensagem para o dono',
  $json.policy?.ownerMessage || 'não informado'
].join('\\n')
}}`,
                    type: 'string',
                },
            ],
        },
        options: {},
    };

    @node({
        id: 'b43c4f9f-d626-48e1-a150-0bfa597a780a',
        name: 'split out 1',
        type: 'n8n-nodes-base.splitOut',
        version: 1,
        position: [1408, 256],
    })
    SplitOut1 = {
        fieldToSplitOut: 'response',
        options: {},
    };

    @node({
        id: '7e198873-df7b-43dd-8a9f-b459c03c4eac',
        name: 'loop response 1',
        type: 'n8n-nodes-base.splitInBatches',
        version: 3,
        position: [1616, 256],
    })
    LoopResponse1 = {
        options: {},
    };

    @node({
        id: '99362849-7960-4672-add1-6a7bce98c933',
        name: 'send response 2',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.4,
        position: [1840, 528],
        onError: 'continueErrorOutput',
    })
    SendResponse2 = {
        method: 'POST',
        url: "={{ $('data handler').first().json.api.url }}/whatsapp/messages",
        sendHeaders: true,
        headerParameters: {
            parameters: [
                {
                    name: 'Authorization',
                    value: "={{ $('data handler').first().json.api.token }}",
                },
            ],
        },
        sendBody: true,
        specifyBody: 'json',
        jsonBody: `={{ {
  type: 'text',
  to: '5511991549118',
  text: $('dev reponse').first().json.response
} }}`,
        options: {},
    };

    @node({
        id: 'c96257e3-4a17-4b0a-bd63-0c9106f336cb',
        name: 'error context',
        type: 'n8n-nodes-base.set',
        version: 3.4,
        position: [2496, -64],
    })
    ErrorContext = {
        options: {},
    };

    // =====================================================================
    // ROUTAGE ET CONNEXIONS
    // =====================================================================

    @links()
    defineRouting() {
        this.ErrorTrigger.out(0).to(this.DataHandler.in(0));
        this.BackendErrorWebhook.out(0).to(this.DataHandler.in(0));
        this.CallTrigger.out(0).to(this.DataHandler.in(0));
        this.DataHandler.out(0).to(this.NormalizeError.in(0));
        this.NormalizeError.out(0).to(this.Switch_.in(0));
        this.SplitOut.out(0).to(this.LoopResponse.in(0));
        this.LoopResponse.out(0).to(this.ErrorContext.in(0));
        this.LoopResponse.out(1).to(this.SendResponse.in(0));
        this.SendResponse.out(0).to(this.LoopResponse.in(0));
        this.SendResponse.out(1).to(this.ErrorContext.in(0));
        this.Switch_.out(0).to(this.ClientReponse.in(0));
        this.Switch_.out(1).to(this.BusinessReponse.in(0));
        this.Switch_.out(2).to(this.DevReponse.in(0));
        this.SendResponse1.out(0).to(this.LoopResponse1.in(0));
        this.SendResponse1.out(1).to(this.ErrorContext.in(0));
        this.ClientReponse.out(0).to(this.SplitOut.in(0));
        this.BusinessReponse.out(0).to(this.SplitOut1.in(0));
        this.DevReponse.out(0).to(this.SendResponse2.in(0));
        this.SplitOut1.out(0).to(this.LoopResponse1.in(0));
        this.LoopResponse1.out(0).to(this.ErrorContext.in(0));
        this.LoopResponse1.out(1).to(this.SendResponse1.in(0));
        this.SendResponse2.out(0).to(this.ErrorContext.in(0));
        this.SendResponse2.out(1).to(this.ErrorContext.in(0));
    }
}
