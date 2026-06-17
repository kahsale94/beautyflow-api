import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : error
// Nodes   : 23  |  Connections: 26
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
// SendResponse                       evolutionApi               [onError→out(1)] [creds] [retry]
// TypingDelay                        code
// SendResponse1                      evolutionApi               [onError→out(1)] [creds] [retry]
// ClientReponse                      set
// BusinessReponse                    set
// DevReponse                         set
// SplitOut1                          splitOut
// LoopResponse1                      splitInBatches
// SendResponse2                      evolutionApi               [onError→out(1)] [creds] [retry]
// SendEmail                          gmail                      [onError→out(1)] [creds] [retry]
// ErrorContext                       set
// ErrorReport8                       stopAndError
// ErrorReport9                       stopAndError
// ErrorReport10                      stopAndError
// ErrorReport                        stopAndError
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
//               .out(1) → TypingDelay
//                  → SendResponse
//                    → LoopResponse (↩ loop)
//                   .out(1) → ErrorContext (↩ loop)
//         .out(1) → BusinessReponse
//            → SplitOut1
//              → LoopResponse1
//                → ErrorContext (↩ loop)
//               .out(1) → SendResponse1
//                  → LoopResponse1 (↩ loop)
//                 .out(1) → ErrorContext (↩ loop)
//         .out(2) → DevReponse
//            → SendEmail
//              → SendResponse2
//                → ErrorContext (↩ loop)
//               .out(1) → ErrorContext (↩ loop)
//             .out(1) → SendResponse2 (↩ loop)
// BackendErrorWebhook
//    → DataHandler (↩ loop)
// CallTrigger
//    → DataHandler (↩ loop)
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: 'bWdz3xBVwmycvfwW',
    name: 'error',
    active: true,
    isArchived: false,
    tags: ['Kaiky', 'beautyflow-api'],
    settings: {
        executionOrder: 'v1',
        availableInMCP: false,
        binaryMode: 'separate',
        callerPolicy: 'workflowsFromSameOwner',
    },
})
export class ErrorWorkflow {
    // =====================================================================
    // CONFIGURATION DES NOEUDS
    // =====================================================================

    @node({
        id: 'f97310f9-778b-4052-a10c-0ce185f73730',
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
        id: 'cb4ac57c-adc2-431d-9c29-e22248dab236',
        name: 'error trigger',
        type: 'n8n-nodes-base.errorTrigger',
        version: 1,
        position: [272, 160],
    })
    ErrorTrigger = {};

    @node({
        id: '70483f62-3e2c-4e18-b2ca-dcebd30967c5',
        webhookId: 'b68e512f-996a-42a2-a83b-008183310e62',
        name: 'backend error webhook',
        type: 'n8n-nodes-base.webhook',
        version: 2,
        position: [272, 512],
        credentials: { httpHeaderAuth: { id: 'SgMhjuYgwqILwgel', name: 'Beautyflow Evolution Webhook' } },
    })
    BackendErrorWebhook = {
        httpMethod: 'POST',
        path: 'beautyflow-error',
        authentication: 'headerAuth',
        responseMode: 'onReceived',
        responseCode: 202,
        options: {},
    };

    @node({
        id: 'c055762a-8fe7-4141-a639-df2372f30060',
        name: 'call trigger',
        type: 'n8n-nodes-base.executeWorkflowTrigger',
        version: 1.1,
        position: [288, 352],
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
        id: 'b2d7f1cd-d205-4da4-a30b-3895740592d3',
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
                                    "={{ Boolean($('data handler').first().json.api.evo_instance && $('data handler').first().json.client.remote_jid && $('normalize error').item.json.normalized.customerMessage) }}",
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
                                    "={{ Boolean($('data handler').first().json.api.evo_instance && $('data handler').first().json.business.phone && $('normalize error').item.json.normalized.ownerMessage) }}",
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
        id: '2b6ff9a7-aa6d-4f6d-a198-9f70eea5a69d',
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

  'internal.redis.personal_block': {
    severity: 'high',
    notifyCustomer: true,
    notifyOwner: false,
    notifyDev: true,
    customerMessage: 'Tive uma instabilidade para continuar o atendimento. Poderia tentar novamente em instantes?'
  },

  'external.evo.get_base64': {
    severity: 'low',
    notifyCustomer: true,
    notifyOwner: false,
    notifyDev: true,
    customerMessage: 'Não consegui processar esse áudio agora. Poderia me mandar em texto?'
  },

  'external.evo.send_message': {
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

function isEvolutionError(type, error) {
  const normalizedType = String(type || '').toLowerCase();
  const node = String(error.node || '').toLowerCase();

  return (
    normalizedType.includes('evo') ||
    normalizedType.includes('evolution') ||
    node.includes('evo') ||
    node.includes('evolution') ||
    node.includes('send response') ||
    node.includes('get base64')
  );
}

function buildOwnerMessage({ type, error, business, client, policy }) {
  if (!policy.notifyOwner) return '';

  if (isEvolutionError(type, error)) return '';

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
      \`Atenção, \${businessName}.\\n\\nUm cliente pediu atendimento humano ou enviou um assunto pessoal. O assistente pausou a conversa por 24h para evitar respostas automáticas nesse assunto.\\n\\nÚltima mensagem: \${valueOrFallback(client.message_text || client.message || error.description)}\`,

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
        id: '7ac7002e-2277-4ef6-ad23-9144b8f88e7a',
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
        id: '9e613170-b75f-4f96-ae22-7e90e5d4869c',
        name: 'loop response',
        type: 'n8n-nodes-base.splitInBatches',
        version: 3,
        position: [1616, -48],
    })
    LoopResponse = {
        options: {},
    };

    @node({
        id: '2ffc3e86-0cc1-4acc-a3e0-419953f9f29d',
        name: 'send response',
        type: 'n8n-nodes-evolution-api.evolutionApi',
        version: 1,
        position: [2032, 0],
        credentials: { evolutionApi: { id: 'vlj9dRMZQEffBnHW', name: 'Evolution Credential - Kaiky' } },
        onError: 'continueErrorOutput',
        retryOnFail: true,
        waitBetweenTries: 500,
    })
    SendResponse = {
        resource: 'messages-api',
        instanceName: "={{ $('data handler').first().json.api.evo_instance }}",
        remoteJid: "={{ $('data handler').first().json.client.remote_jid }}",
        messageText: "={{ $('typing delay').item.json.response }}",
        options_message: {
            delay: "={{ $('typing delay').item.json.delay }}",
        },
    };

    @node({
        id: 'fd073df6-af5a-4f80-badf-e5ee8ac5d7b4',
        name: 'typing delay',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [1824, 0],
    })
    TypingDelay = {
        jsCode: `const data = $input.first();

let text = data.json.response;

if (Array.isArray(text)) {
  text = text.join(' ');
}

text = String(text || '');

const charCount = text.length;

const milliseconds = Math.max(
  400,
  Math.min(3000, Math.round((charCount / 40) * 1000))
);

return [
  {
    json: {
      ...data.json,
      delay: milliseconds,
    }
  }
];`,
    };

    @node({
        id: '9ff39b25-dcce-42b8-9a17-9803b7cc6cad',
        name: 'send response1',
        type: 'n8n-nodes-evolution-api.evolutionApi',
        version: 1,
        position: [1840, 304],
        credentials: { evolutionApi: { id: 'vlj9dRMZQEffBnHW', name: 'Evolution Credential - Kaiky' } },
        onError: 'continueErrorOutput',
        retryOnFail: true,
        waitBetweenTries: 500,
    })
    SendResponse1 = {
        resource: 'messages-api',
        instanceName: "={{ $('data handler').first().json.api.evo_instance }}",
        remoteJid: "={{ $('data handler').first().json.business.phone }}@s.whatsapp.net",
        messageText: "={{ $('business reponse').item.json.response }}",
        options_message: {},
    };

    @node({
        id: '88c2e705-3278-4cc5-b5ba-c5e811dfaad9',
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
        id: '68edb71b-6ac9-4a0d-bc4d-32fe2c5e6a28',
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
        id: 'aed2c453-4165-45d7-bd35-4fba01904578',
        name: 'dev reponse',
        type: 'n8n-nodes-base.set',
        version: 3.4,
        position: [1216, 544],
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
        id: '2767c803-8435-4b4c-9f78-28fb3400ef53',
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
        id: '378e1c61-1dc1-41fe-8556-bbf2972cc84e',
        name: 'loop response 1',
        type: 'n8n-nodes-base.splitInBatches',
        version: 3,
        position: [1616, 256],
    })
    LoopResponse1 = {
        options: {},
    };

    @node({
        id: '1a1fa6d4-e17e-44cd-8485-42463803acf3',
        name: 'send response 2',
        type: 'n8n-nodes-evolution-api.evolutionApi',
        version: 1,
        position: [1424, 640],
        credentials: { evolutionApi: { id: 'vlj9dRMZQEffBnHW', name: 'Evolution Credential - Kaiky' } },
        onError: 'continueErrorOutput',
        retryOnFail: true,
        waitBetweenTries: 500,
    })
    SendResponse2 = {
        resource: 'messages-api',
        instanceName: "={{ $('data handler').first().json.api.evo_instance }}",
        remoteJid: '5511991549118@s.whatsapp.net',
        messageText: "={{ $('dev reponse').item.json.response }}",
        options_message: {},
    };

    @node({
        id: 'dc7ee0fe-bbb1-4047-87e9-f47d2aa9bc69',
        webhookId: 'c1eda0d1-8bba-4495-9c6d-ac33fdfef9e2',
        name: 'send email',
        type: 'n8n-nodes-base.gmail',
        version: 2.2,
        position: [1664, 544],
        credentials: { gmailOAuth2: { id: 'KD9KohSq7p0CzQL0', name: 'gmail beautyflow' } },
        onError: 'continueErrorOutput',
        retryOnFail: true,
    })
    SendEmail = {
        sendTo: 'ultimateclash22@gmail.com',
        subject: 'ERRO NO FLUXO ',
        message: `={{
\`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Erro Detectado</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f4f5; font-family:Arial, Helvetica, sans-serif; color:#18181b;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5; padding:24px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:12px; overflow:hidden; border:1px solid #e4e4e7;">
          
          <tr>
            <td style="background-color:#dc2626; padding:20px 24px; color:#ffffff;">
              <h1 style="margin:0; font-size:22px; font-weight:bold;">
                🚨 Erro Detectado
              </h1>
              <p style="margin:8px 0 0; font-size:14px;">
                Uma falha crítica foi identificada no atendimento automatizado.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:24px;">

              <h2 style="font-size:18px; margin:0 0 12px; color:#18181b;">
                📌 Dados do erro
              </h2>

              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; margin-bottom:24px;">
                <tr>
                  <td style="padding:10px; background-color:#f9fafb; border:1px solid #e5e7eb; font-weight:bold;">ID</td>
                  <td style="padding:10px; border:1px solid #e5e7eb;">\${$json.error?.id || 'não informado'}</td>
                </tr>
                <tr>
                  <td style="padding:10px; background-color:#f9fafb; border:1px solid #e5e7eb; font-weight:bold;">Tipo</td>
                  <td style="padding:10px; border:1px solid #e5e7eb;">\${$json.error?.type || 'não informado'}</td>
                </tr>
                <tr>
                  <td style="padding:10px; background-color:#f9fafb; border:1px solid #e5e7eb; font-weight:bold;">Node</td>
                  <td style="padding:10px; border:1px solid #e5e7eb;">\${$json.error?.node || 'não informado'}</td>
                </tr>
                <tr>
                  <td style="padding:10px; background-color:#f9fafb; border:1px solid #e5e7eb; font-weight:bold;">Código</td>
                  <td style="padding:10px; border:1px solid #e5e7eb;">\${$json.error?.code || 'não informado'}</td>
                </tr>
                <tr>
                  <td style="padding:10px; background-color:#f9fafb; border:1px solid #e5e7eb; font-weight:bold;">Descrição</td>
                  <td style="padding:10px; border:1px solid #e5e7eb;">\${$json.error?.description || 'não informado'}</td>
                </tr>
              </table>

              <h2 style="font-size:18px; margin:0 0 12px; color:#18181b;">
                🏢 Negócio
              </h2>

              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; margin-bottom:24px;">
                <tr>
                  <td style="padding:10px; background-color:#f9fafb; border:1px solid #e5e7eb; font-weight:bold;">Nome</td>
                  <td style="padding:10px; border:1px solid #e5e7eb;">\${$json.business?.name || 'não informado'}</td>
                </tr>
                <tr>
                  <td style="padding:10px; background-color:#f9fafb; border:1px solid #e5e7eb; font-weight:bold;">Telefone</td>
                  <td style="padding:10px; border:1px solid #e5e7eb;">\${$json.business?.phone || 'não informado'}</td>
                </tr>
              </table>

              <h2 style="font-size:18px; margin:0 0 12px; color:#18181b;">
                👤 Cliente
              </h2>

              <div style="padding:14px; background-color:#f9fafb; border:1px solid #e5e7eb; border-radius:8px; margin-bottom:24px;">
                \${Object.keys($json.client || {}).length ? JSON.stringify($json.client) : 'cliente não identificado'}
              </div>

              <h2 style="font-size:18px; margin:0 0 12px; color:#18181b;">
                ⚙️ Política
              </h2>

              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; margin-bottom:24px;">
                <tr>
                  <td style="padding:10px; background-color:#f9fafb; border:1px solid #e5e7eb; font-weight:bold;">Severidade</td>
                  <td style="padding:10px; border:1px solid #e5e7eb;">\${$json.policy?.severity || 'não informado'}</td>
                </tr>
                <tr>
                  <td style="padding:10px; background-color:#f9fafb; border:1px solid #e5e7eb; font-weight:bold;">Notificar cliente</td>
                  <td style="padding:10px; border:1px solid #e5e7eb;">\${$json.policy?.notifyCustomer ? 'Sim' : 'Não'}</td>
                </tr>
                <tr>
                  <td style="padding:10px; background-color:#f9fafb; border:1px solid #e5e7eb; font-weight:bold;">Notificar dono</td>
                  <td style="padding:10px; border:1px solid #e5e7eb;">\${$json.policy?.notifyOwner ? 'Sim' : 'Não'}</td>
                </tr>
                <tr>
                  <td style="padding:10px; background-color:#f9fafb; border:1px solid #e5e7eb; font-weight:bold;">Notificar dev</td>
                  <td style="padding:10px; border:1px solid #e5e7eb;">\${$json.policy?.notifyDev ? 'Sim' : 'Não'}</td>
                </tr>
              </table>

              <h2 style="font-size:18px; margin:0 0 12px; color:#18181b;">
                💬 Mensagem para o cliente
              </h2>

              <div style="padding:16px; background-color:#eff6ff; border-left:4px solid #2563eb; border-radius:8px; margin-bottom:24px; line-height:1.5;">
                \${$json.policy?.customerMessage || 'não informado'}
              </div>

              <h2 style="font-size:18px; margin:0 0 12px; color:#18181b;">
                👑 Mensagem para o dono
              </h2>

              <div style="padding:16px; background-color:#fff7ed; border-left:4px solid #f97316; border-radius:8px; line-height:1.5; white-space:pre-line;">
                \${$json.policy?.ownerMessage || 'não informado'}
              </div>

            </td>
          </tr>

          <tr>
            <td style="background-color:#f9fafb; padding:16px 24px; text-align:center; font-size:12px; color:#71717a;">
              E-mail automático de monitoramento do sistema.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
\`
}}`,
        options: {
            appendAttribution: true,
        },
    };

    @node({
        id: 'aaf654f2-d161-4f92-af30-ecb8502eda23',
        name: 'error context',
        type: 'n8n-nodes-base.set',
        version: 3.4,
        position: [3120, -64],
    })
    ErrorContext = {
        options: {},
    };

    @node({
        id: '94f8aa60-bdf5-44ca-a1df-660fdf77a022',
        name: 'error report 8',
        type: 'n8n-nodes-base.stopAndError',
        version: 1,
        position: [1664, 688],
    })
    ErrorReport8 = {
        errorType: 'errorObject',
        errorObject: `={
  "error": {
    "workflow": "{{ $workflow.id }}",
    "execution": "{{ $execution.id }}",
    "type": "external.gmail",
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
    "message_id": "{{ $('data handler').item.json.client.message_id || '' }}",
    "message_text": "{{ $('data handler').item.json.client.message_text || '' }}"
  }
}`,
    };

    @node({
        id: '203b618a-10b2-4102-91f8-385d8bf7b575',
        name: 'error report 9',
        type: 'n8n-nodes-base.stopAndError',
        version: 1,
        position: [1424, 784],
    })
    ErrorReport9 = {
        errorType: 'errorObject',
        errorObject: `={
  "error": {
    "workflow": "{{ $workflow.id }}",
    "execution": "{{ $execution.id }}",
    "type": "external.evo.send_message",
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
    "message_id": "{{ $('data handler').item.json.client.message_id || '' }}",
    "message_text": "{{ $('data handler').item.json.client.message_text || '' }}"
  }
}`,
    };

    @node({
        id: '75d16694-d222-4271-93f6-7b980edc4e61',
        name: 'error report 10',
        type: 'n8n-nodes-base.stopAndError',
        version: 1,
        position: [1840, 448],
    })
    ErrorReport10 = {
        errorType: 'errorObject',
        errorObject: `={
  "error": {
    "workflow": "{{ $workflow.id }}",
    "execution": "{{ $execution.id }}",
    "type": "external.evo.send_message",
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
    "message_id": "{{ $('data handler').item.json.client.message_id || '' }}",
    "message_text": "{{ $('data handler').item.json.client.message_text || '' }}"
  }
}`,
    };

    @node({
        id: '79a9ba94-3dbc-42b6-83cc-2b13031f1104',
        name: 'error report ',
        type: 'n8n-nodes-base.stopAndError',
        version: 1,
        position: [2032, 144],
    })
    ErrorReport = {
        errorType: 'errorObject',
        errorObject: `={
  "error": {
    "workflow": "{{ $workflow.id }}",
    "execution": "{{ $execution.id }}",
    "type": "external.evo.send_message",
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
    "message_id": "{{ $('data handler').item.json.client.message_id || '' }}",
    "message_text": "{{ $('data handler').item.json.client.message_text || '' }}"
  }
}`,
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
        this.LoopResponse.out(1).to(this.TypingDelay.in(0));
        this.SendResponse.out(0).to(this.LoopResponse.in(0));
        this.SendResponse.out(1).to(this.ErrorContext.in(0));
        this.TypingDelay.out(0).to(this.SendResponse.in(0));
        this.Switch_.out(0).to(this.ClientReponse.in(0));
        this.Switch_.out(1).to(this.BusinessReponse.in(0));
        this.Switch_.out(2).to(this.DevReponse.in(0));
        this.SendResponse1.out(0).to(this.LoopResponse1.in(0));
        this.SendResponse1.out(1).to(this.ErrorContext.in(0));
        this.ClientReponse.out(0).to(this.SplitOut.in(0));
        this.BusinessReponse.out(0).to(this.SplitOut1.in(0));
        this.DevReponse.out(0).to(this.SendEmail.in(0));
        this.SplitOut1.out(0).to(this.LoopResponse1.in(0));
        this.LoopResponse1.out(0).to(this.ErrorContext.in(0));
        this.LoopResponse1.out(1).to(this.SendResponse1.in(0));
        this.SendResponse2.out(0).to(this.ErrorContext.in(0));
        this.SendResponse2.out(1).to(this.ErrorContext.in(0));
        this.SendEmail.out(0).to(this.SendResponse2.in(0));
        this.SendEmail.out(1).to(this.SendResponse2.in(0));
    }
}
