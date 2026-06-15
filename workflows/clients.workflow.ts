import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : clients
// Nodes   : 55  |  Connections: 66
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// DataHandler                        set
// PostClient                         httpRequest                [onError→out(1)]
// SendConfirmation                   gmail                      [onError→out(1)] [creds]
// ClientData                         set
// Webhook                            executeWorkflowTrigger
// NameExtractor                      informationExtractor       [AI] [onError→out(1)] [executeOnce]
// Switch_                            switch
// NameInMessage                      if
// SplitOut                           splitOut
// LoopResponse                       splitInBatches
// SendResponse                       evolutionApi               [onError→out(1)] [creds] [retry]
// TypingDelay                        code
// GetClient1                         httpRequest                [onError→out(1)] [retry]
// SetPendingState                    redis                      [onError→out(1)] [creds] [executeOnce] [retry]
// Name                               if
// GetClient2                         httpRequest                [onError→out(1)] [retry]
// PostClient1                        executeWorkflow
// Sucess                             set
// PushContext2                       redis                      [onError→out(1)] [creds] [retry]
// HasData                            if
// GetContext                         redis                      [onError→out(1)] [creds]
// Convert                            code
// AddName                            httpRequest                [onError→out(1)]
// SplitOut1                          splitOut
// DeletePending                      redis                      [onError→out(1)] [creds] [executeOnce] [retry]
// LoopResponse1                      splitInBatches
// TypingDelay1                       code
// SendResponse1                      evolutionApi               [onError→out(1)] [creds] [retry]
// Response1                          set
// Response                           set
// PushHumanMemory                    redis                      [onError→out(1)] [creds] [retry]
// PushHumanMemory1                   redis                      [onError→out(1)] [creds] [retry]
// PushAiMemory                       redis                      [onError→out(1)] [creds]
// PushAiMemory1                      redis                      [onError→out(1)] [creds]
// ErrorReport12                      stopAndError
// ErrorReport21                      executeWorkflow
// ErrorReport13                      stopAndError
// ErrorReport                        stopAndError
// ErrorReport22                      executeWorkflow
// ErrorReport1                       stopAndError
// ErrorReport23                      executeWorkflow
// ErrorReport14                      stopAndError
// ErrorReport15                      stopAndError
// ErrorReport16                      stopAndError
// ErrorReport25                      executeWorkflow
// ErrorReport26                      executeWorkflow
// ErrorReport17                      stopAndError
// ErrorReport18                      stopAndError
// HasClient                          if
// OpenrouterChatModel                lmChatOpenRouter           [creds] [ai_languageModel]
// ErrorReport19                      stopAndError
// SetPendingState1                   redis                      [onError→out(1)] [creds] [executeOnce] [retry]
// DeleteBuffer                       redis                      [onError→out(1)] [creds] [retry]
// ErrorReport24                      executeWorkflow
// Response2                          set
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// Webhook
//    → DataHandler
//      → Switch_
//        → GetClient1
//          → NameExtractor
//            → NameInMessage
//              → AddName
//                → Response1
//                  → SplitOut1
//                    → LoopResponse1
//                      → DeletePending
//                        → PushHumanMemory
//                          → PushAiMemory
//                            → DeleteBuffer
//                             .out(1) → ErrorReport24
//                           .out(1) → ErrorReport26
//                              → DeleteBuffer (↩ loop)
//                         .out(1) → ErrorReport26 (↩ loop)
//                       .out(1) → ErrorReport17
//                     .out(1) → TypingDelay1
//                        → SendResponse1
//                          → LoopResponse1 (↩ loop)
//                         .out(1) → ErrorReport18
//               .out(1) → ErrorReport14
//             .out(1) → Response2
//                → SplitOut
//                  → LoopResponse
//                    → SetPendingState
//                      → PushHumanMemory1
//                        → PushAiMemory1
//                          → DeleteBuffer (↩ loop)
//                         .out(1) → ErrorReport25
//                            → DeleteBuffer (↩ loop)
//                       .out(1) → ErrorReport25 (↩ loop)
//                     .out(1) → ErrorReport16
//                   .out(1) → TypingDelay
//                      → SendResponse
//                        → LoopResponse (↩ loop)
//                       .out(1) → ErrorReport15
//           .out(1) → ErrorReport23
//              → NameInMessage (↩ loop)
//         .out(1) → ErrorReport1
//       .out(1) → PostClient
//          → SendConfirmation
//            → ClientData
//              → SetPendingState1
//                → Response
//                  → SplitOut (↩ loop)
//               .out(1) → ErrorReport19
//           .out(1) → ErrorReport22
//              → ClientData (↩ loop)
//         .out(1) → ErrorReport
//       .out(2) → GetContext
//          → HasData
//            → Convert
//              → Name
//                → Sucess
//               .out(1) → SetPendingState1 (↩ loop)
//           .out(1) → GetClient2
//              → HasClient
//                → PushContext2
//                  → Name (↩ loop)
//                 .out(1) → ErrorReport21
//                    → Name (↩ loop)
//               .out(1) → PostClient1
//             .out(1) → ErrorReport13
//         .out(1) → ErrorReport12
//
// AI CONNECTIONS
// NameExtractor.uses({ ai_languageModel: OpenrouterChatModel })
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: 'p2z28Yex6r93HRT0',
    name: 'clients',
    active: true,
    isArchived: false,
    tags: ['Kaiky', 'beautyflow-api'],
    settings: {
        executionOrder: 'v1',
        availableInMCP: false,
        binaryMode: 'separate',
        timeSavedMode: 'fixed',
        errorWorkflow: 'bWdz3xBVwmycvfwW',
        callerPolicy: 'workflowsFromSameOwner',
        timezone: 'America/Sao_Paulo',
    },
})
export class ClientsWorkflow {
    // =====================================================================
    // CONFIGURATION DES NOEUDS
    // =====================================================================

    @node({
        id: '727c5e5d-cd66-466d-bf07-63716312481d',
        name: 'data handler',
        type: 'n8n-nodes-base.set',
        version: 3.4,
        position: [-800, 4432],
    })
    DataHandler = {
        assignments: {
            assignments: [
                {
                    id: 'af50a371-7f3b-4553-bd81-ab0f8d95ac27',
                    name: 'action',
                    value: '={{ $json.action }}',
                    type: 'string',
                },
                {
                    id: 'dea249c2-d33e-4d8d-8de6-6ec86bfac133',
                    name: 'business',
                    value: '={{ $json.business }}',
                    type: 'object',
                },
                {
                    id: 'fb5e9190-2904-431d-bee5-ad2bfe2d2bbb',
                    name: 'client',
                    value: `={{ { 
  ...$json.client,
  "phone": String($json.client?.remote_jid || '').split('@')[0]
} }}`,
                    type: 'object',
                },
                {
                    id: '1cb79adc-6592-4d1f-93c1-fe8d78d54465',
                    name: 'api',
                    value: `={{ {
  ...$json.api,
  url: $json.api.url + '/clients'
} }}`,
                    type: 'object',
                },
            ],
        },
        options: {},
    };

    @node({
        id: '6be20eaf-a5dc-484f-ad08-710e438b6da1',
        name: 'post client',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.3,
        position: [-288, 4432],
        onError: 'continueErrorOutput',
        retryOnFail: false,
    })
    PostClient = {
        method: 'POST',
        url: "={{ $('data handler').item.json.api.url }}/",
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
        bodyParameters: {
            parameters: [
                {
                    name: 'phone',
                    value: "={{ $('data handler').item.json.client.phone }}",
                },
            ],
        },
        options: {},
    };

    @node({
        id: 'db4d5689-8fca-4559-9b70-3c03bda6f892',
        webhookId: 'e8ec7ce4-9236-49af-8044-dadc77fe087a',
        name: 'send confirmation',
        type: 'n8n-nodes-base.gmail',
        version: 2.2,
        position: [-80, 4416],
        credentials: { gmailOAuth2: { id: 'KD9KohSq7p0CzQL0', name: 'gmail beautyflow' } },
        onError: 'continueErrorOutput',
    })
    SendConfirmation = {
        sendTo: 'ultimateclash22@gmail.com',
        subject: "=NOVO CLIENTE CADASTRADO ({{ $('data handler').item.json.business.name }})",
        message: `=<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Cliente Cadastrado</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f6f8; font-family:Arial, Helvetica, sans-serif;">
  
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8; padding:20px 0;">
    <tr>
      <td align="center">
        
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(90deg, #4CAF50, #2E7D32); padding:20px; color:#ffffff;">
              <h2 style="margin:0; font-size:22px;">Novo Cliente Cadastrado</h2>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:24px;">
              <p style="margin:0 0 16px 0; font-size:16px; color:#333;">
                Bom dia,
              </p>

              <p style="margin:0 0 20px 0; font-size:15px; color:#555;">
                Um novo cliente foi cadastrado com sucesso. Confira os detalhes abaixo:
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <tr>
                  <td style="padding:10px; background:#f9fafb; border-radius:6px;">
                    <strong>ID:</strong><br>
                    <span style="color:#333;">{{ $('post client').item.json.id }}</span>
                  </td>
                </tr>

                <tr><td style="height:10px;"></td></tr>

                <tr>
                  <td style="padding:10px; background:#f9fafb; border-radius:6px;">
                    <strong>Nome do WhatsApp:</strong><br>
                    <span style="color:#333;">{{ $('post client').item.json.name_wpp }}</span>
                  </td>
                </tr>

                <tr><td style="height:10px;"></td></tr>

                <tr>
                  <td style="padding:10px; background:#f9fafb; border-radius:6px;">
                    <strong>Telefone:</strong><br>
                    <span style="color:#333;">{{ '+' + $('post client').item.json.phone.slice(0,2) + ' (' + $('post client').item.json.phone.slice(2,4) + ') ' + $('post client').item.json.phone.slice(4,9) + '-' + $('post client').item.json.phone.slice(9) }}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px; text-align:center; font-size:12px; color:#888;">
              Este é um email automático. Não responda.
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`,
        options: {
            ccList: 'ultimateclash22@gmail.com',
        },
    };

    @node({
        id: 'c03d80bd-2b6a-4a2a-a872-f41da0aadd7b',
        name: 'client data',
        type: 'n8n-nodes-base.set',
        version: 3.4,
        position: [128, 4400],
    })
    ClientData = {
        assignments: {
            assignments: [
                {
                    id: '843f299b-1f64-4ed7-8ba5-385c36bb9ad9',
                    name: 'client.id',
                    value: "={{ $('post client').item.json.id }}",
                    type: 'string',
                },
                {
                    id: 'f2a3bf0d-532a-4e19-a199-df449fcd2e4e',
                    name: 'client.name',
                    value: "={{ $('post client').item.json.name }}",
                    type: 'string',
                },
                {
                    id: 'f0e17e45-87fb-4f45-9c60-69b65f2eadca',
                    name: 'client.phone',
                    value: "={{ $('post client').item.json.phone }}",
                    type: 'string',
                },
            ],
        },
        options: {},
    };

    @node({
        id: '7ce5c540-e40c-4d9b-af8b-253c7b2f0958',
        name: 'webhook',
        type: 'n8n-nodes-base.executeWorkflowTrigger',
        version: 1.1,
        position: [-1008, 4432],
    })
    Webhook = {
        workflowInputs: {
            values: [
                {
                    name: 'action',
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
        id: 'e204cb95-fd3e-462c-81da-6aa3144cb41d',
        name: 'name extractor',
        type: '@n8n/n8n-nodes-langchain.informationExtractor',
        version: 1.2,
        position: [48, 4064],
        onError: 'continueErrorOutput',
        executeOnce: true,
    })
    NameExtractor = {
        text: "={{ $('data handler').first().json.client.message }}",
        schemaType: 'manual',
        inputSchema: `{
  "type": "object",
  "properties": {
    "client_name": {
      "type": ["string", "null"],
      "description": "Nome do próprio cliente. Retorne somente se a mensagem declarar explicitamente o nome do cliente, como 'meu nome é João', 'me chamo Maria', 'sou Pedro' ou 'pode me chamar de Lucas'. Se a mensagem for confirmação, saudação ou resposta curta como 'sim', 'ok', 'oi', 'quero', retorne null. Nunca invente."
    }
  },
  "required": ["client_name"],
  "additionalProperties": false
}`,
        options: {},
    };

    @node({
        id: '28cfd567-d60b-48e1-a94b-801f5b8f7055',
        name: 'switch',
        type: 'n8n-nodes-base.switch',
        version: 3.4,
        position: [-592, 4416],
    })
    Switch_ = {
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
                                id: 'c270718b-55cf-49c9-a9da-cb4c513954d9',
                                leftValue: "={{ $('data handler').item.json.action }}",
                                rightValue: 'name',
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
                    outputKey: 'NAME',
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
                                leftValue: "={{ $('data handler').item.json.action }}",
                                rightValue: 'post',
                                operator: {
                                    type: 'string',
                                    operation: 'equals',
                                },
                                id: 'f36d2e87-9752-4114-860a-661f811b059e',
                            },
                        ],
                        combinator: 'and',
                    },
                    renameOutput: true,
                    outputKey: 'POST',
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
                                id: '8bd0c802-4fd6-48de-9f76-2d70d132f3f9',
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
        options: {},
    };

    @node({
        id: 'de5a1a89-3702-4dc4-a576-24d29b7747a4',
        name: 'name in message?',
        type: 'n8n-nodes-base.if',
        version: 2.3,
        position: [464, 4048],
    })
    NameInMessage = {
        conditions: {
            options: {
                caseSensitive: true,
                leftValue: '',
                typeValidation: 'loose',
                version: 3,
            },
            conditions: [
                {
                    id: '594491a3-525c-4e77-9fa0-394be8efbd60',
                    leftValue: "={{ $('name extractor').first().json.output.client_name }}",
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
        id: '9a7b0aa7-b981-4d81-8153-338f05e8ff96',
        name: 'split out',
        type: 'n8n-nodes-base.splitOut',
        version: 1,
        position: [1344, 4384],
    })
    SplitOut = {
        fieldToSplitOut: 'response',
        options: {},
    };

    @node({
        id: 'c2def58b-87d0-4949-82a3-8a45a49657c6',
        name: 'loop response',
        type: 'n8n-nodes-base.splitInBatches',
        version: 3,
        position: [1552, 4384],
    })
    LoopResponse = {
        options: {},
    };

    @node({
        id: '6e6235da-593a-4237-b52e-79fb3c98910a',
        name: 'send response',
        type: 'n8n-nodes-evolution-api.evolutionApi',
        version: 1,
        position: [1968, 4448],
        credentials: { evolutionApi: { id: 'vlj9dRMZQEffBnHW', name: 'Evolution Credential - Kaiky' } },
        onError: 'continueErrorOutput',
        retryOnFail: true,
        waitBetweenTries: 500,
    })
    SendResponse = {
        resource: 'messages-api',
        instanceName: "={{ $('data handler').item.json.api.evo_instance }}",
        remoteJid: "={{ $('data handler').item.json.client.remote_jid }}",
        messageText: "={{ $('typing delay').item.json.response }}",
        options_message: {
            delay: "={{ $('typing delay').item.json.delay }}",
        },
    };

    @node({
        id: 'd25c993c-7fea-4d48-a713-ebb82a55f721',
        name: 'typing delay',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [1760, 4448],
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
        id: 'd9a1dae6-e451-46b5-bd65-adea186c0a8e',
        name: 'get client 1',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.3,
        position: [-288, 4080],
        onError: 'continueErrorOutput',
        retryOnFail: true,
        maxTries: 2,
    })
    GetClient1 = {
        url: "={{ $('data handler').item.json.api.url }}/",
        sendQuery: true,
        queryParameters: {
            parameters: [
                {
                    name: 'client_phone',
                    value: "={{ $('data handler').item.json.client.phone }}",
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
        id: '591b0328-7f5a-471f-bab8-2568a4c1e635',
        name: 'set pending state',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [2208, 4368],
        credentials: { redis: { id: 'zMk8tatRFuFo6wmp', name: 'beautyflow' } },
        onError: 'continueErrorOutput',
        executeOnce: true,
        retryOnFail: true,
    })
    SetPendingState = {
        operation: 'set',
        key: "=beautyflow_bot.{{ $('data handler').item.json.client.remote_jid }}.state",
        value: 'awaiting_name',
    };

    @node({
        id: '255c5de2-3ad9-49a3-9f08-417fc061c259',
        name: 'name?',
        type: 'n8n-nodes-base.if',
        version: 2.3,
        position: [896, 4752],
    })
    Name = {
        conditions: {
            options: {
                caseSensitive: true,
                leftValue: '',
                typeValidation: 'loose',
                version: 3,
            },
            conditions: [
                {
                    id: '4e5d34e1-6d10-49b7-990f-6aa1750cd4f0',
                    leftValue: `={{ $('convert').isExecuted 
  ? $('convert').item.json.name 
  : $json.body[0].name
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
        id: '6231be21-4d8b-4683-9590-7a3a487ab39d',
        name: 'get client 2',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.4,
        position: [176, 5024],
        onError: 'continueErrorOutput',
        alwaysOutputData: false,
        executeOnce: false,
        retryOnFail: true,
    })
    GetClient2 = {
        url: "={{ $('data handler').item.json.api.url }}/",
        sendQuery: true,
        queryParameters: {
            parameters: [
                {
                    name: 'client_phone',
                    value: "={{ $('data handler').item.json.client.phone }}",
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
                    responseFormat: 'json',
                },
            },
        },
    };

    @node({
        id: 'de231101-071d-458b-925f-1f3d0898955b',
        name: 'post client 1',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [400, 5152],
    })
    PostClient1 = {
        workflowId: {
            __rl: true,
            value: 'p2z28Yex6r93HRT0',
            mode: 'list',
            cachedResultUrl: '/workflow/p2z28Yex6r93HRT0',
            cachedResultName: 'clients',
        },
        workflowInputs: {
            mappingMode: 'defineBelow',
            value: {
                action: 'post',
                business: `={{ {
  id: $('data handler').first().json.business.id,
  name: $('data handler').first().json.business.name,
  phone: $('data handler').first().json.business.phone,
} }}`,
                client: `={{ {
  remote_jid: $('data handler').first().json.client.remote_jid,
  message: $('data handler').first().json.client.message
} }}`,
                api: `={{ {
  url: $('data handler').first().json.api.url.replace(/\\/clients\\/?$/, ''),
  token: $('data handler').first().json.api.token,
  evo_instance: $('data handler').first().json.api.evo_instance
} }}`,
            },
            matchingColumns: [],
            schema: [
                {
                    id: 'action',
                    displayName: 'action',
                    required: false,
                    defaultMatch: false,
                    display: true,
                    canBeUsedToMatch: true,
                    type: 'string',
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
            waitForSubWorkflow: true,
        },
    };

    @node({
        id: '3b5735af-d72f-452c-ac63-758e4e79d3e3',
        name: 'sucess',
        type: 'n8n-nodes-base.set',
        version: 3.4,
        position: [1248, 4736],
    })
    Sucess = {
        assignments: {
            assignments: [
                {
                    id: 'fe295157-ce2f-4823-8294-6217aa7be342',
                    name: 'client',
                    value: "={{ $json.removeField('business_id') }}",
                    type: 'object',
                },
            ],
        },
        options: {},
    };

    @node({
        id: '786ec55e-0743-48f0-aab8-303eac6bfd48',
        name: 'push context 2',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [624, 4992],
        credentials: { redis: { id: 'zMk8tatRFuFo6wmp', name: 'beautyflow' } },
        onError: 'continueErrorOutput',
        retryOnFail: true,
    })
    PushContext2 = {
        operation: 'set',
        key: "=beautyflow_bot.{{ $('data handler').item.json.client.phone }}.client_context",
        value: `={{ JSON.stringify({
  id: $('get client 2').item.json.body[0].id,
  name: $('get client 2').item.json.body[0].name,
  phone: $('get client 2').item.json.body[0].phone
}) }}`,
        keyType: 'string',
    };

    @node({
        id: '1697e559-d3a1-4cba-8a5d-321184f82536',
        name: 'has data?',
        type: 'n8n-nodes-base.if',
        version: 2.3,
        position: [-80, 4768],
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
                    leftValue: "={{ $('get context').item.json }}",
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
        id: '1a3f403e-ac85-4819-9c6f-b27c84190f33',
        name: 'get context',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [-288, 4784],
        credentials: { redis: { id: 'zMk8tatRFuFo6wmp', name: 'beautyflow' } },
        onError: 'continueErrorOutput',
    })
    GetContext = {
        operation: 'keys',
        keyPattern: "=beautyflow_bot.{{ $('data handler').item.json.client.phone }}.client_context",
    };

    @node({
        id: '0a0dee1e-47ce-4f4b-99f4-40148a032ba1',
        name: 'convert',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [176, 4752],
    })
    Convert = {
        jsCode: `const items = $input.all();
const output = [];

for (const item of items) {
  for (const value of Object.values(item.json || {})) {
    if (!value) continue;

    let client;

    try {
      client = typeof value === 'string' ? JSON.parse(value) : value;
    } catch (error) {
      continue;
    }

    if (!client || typeof client !== 'object' || client.id == null) {
      continue;
    }

    output.push({
      json: {
        id: client.id,
        name: client.name,
        phone: client.phone,
      },
    });
  }
}

return output;`,
    };

    @node({
        id: '4530b592-a299-4a83-8e81-e6a8c53417d8',
        name: 'add name',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.4,
        position: [672, 3952],
        onError: 'continueErrorOutput',
    })
    AddName = {
        method: 'PATCH',
        url: "={{ $('data handler').first().json.api.url }}/{{ $('get client 1').first().json.body[0].id }}",
        sendQuery: true,
        queryParameters: {
            parameters: [
                {
                    name: 'name',
                    value: '={{ $json.output.client_name }}',
                },
            ],
        },
        sendHeaders: true,
        headerParameters: {
            parameters: [
                {
                    name: 'Authorization',
                    value: "={{ $('data handler').first().json.api.token }}",
                },
            ],
        },
        options: {},
    };

    @node({
        id: '7c62ea12-7c04-41db-bf69-d98203fc6a6c',
        name: 'split out1',
        type: 'n8n-nodes-base.splitOut',
        version: 1,
        position: [1312, 3664],
    })
    SplitOut1 = {
        fieldToSplitOut: 'response',
        options: {},
    };

    @node({
        id: '5ac134ec-1ddd-4de1-8346-5f2637875ae1',
        name: 'delete pending',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [2176, 3648],
        credentials: { redis: { id: 'zMk8tatRFuFo6wmp', name: 'beautyflow' } },
        onError: 'continueErrorOutput',
        executeOnce: true,
        retryOnFail: true,
    })
    DeletePending = {
        operation: 'delete',
        key: "=beautyflow_bot.{{ $('data handler').item.json.client.remote_jid }}.state",
    };

    @node({
        id: '07d63279-54af-4600-b8c1-d49e49f14935',
        name: 'loop response 1',
        type: 'n8n-nodes-base.splitInBatches',
        version: 3,
        position: [1536, 3664],
    })
    LoopResponse1 = {
        options: {},
    };

    @node({
        id: 'f96e3488-e6c8-4af0-b833-e79f908c3573',
        name: 'typing delay 1',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [1744, 3728],
    })
    TypingDelay1 = {
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
        id: '5b43e661-4aaf-4791-b727-caf753611511',
        name: 'send response 1',
        type: 'n8n-nodes-evolution-api.evolutionApi',
        version: 1,
        position: [1952, 3728],
        credentials: { evolutionApi: { id: 'vlj9dRMZQEffBnHW', name: 'Evolution Credential - Kaiky' } },
        onError: 'continueErrorOutput',
        retryOnFail: true,
        waitBetweenTries: 500,
    })
    SendResponse1 = {
        resource: 'messages-api',
        instanceName: "={{ $('data handler').item.json.api.evo_instance }}",
        remoteJid: "={{ $('data handler').item.json.client.remote_jid }}",
        messageText: "={{ $('typing delay 1').item.json.response }}",
        options_message: {
            delay: "={{ $('typing delay 1').item.json.delay }}",
        },
    };

    @node({
        id: 'b88c8ff1-b779-4319-a6d1-9fee1c88b67e',
        name: 'response 1',
        type: 'n8n-nodes-base.set',
        version: 3.4,
        position: [896, 3936],
    })
    Response1 = {
        assignments: {
            assignments: [
                {
                    id: '43099950-bb55-4647-830f-b0aa10e7d3c3',
                    name: 'response',
                    value: `={{
\`Perfeito!
Anotei aqui \${$('add name').item.json.name}
Agora para continuarmos, poderia me confirmar qual serviço você deseja mesmo?\`
.split(/\\n+/)
.filter(Boolean)
}}`,
                    type: 'array',
                },
            ],
        },
        options: {},
    };

    @node({
        id: 'ffb7d142-d081-4e12-a1a6-c7ca9acb39e8',
        name: 'response',
        type: 'n8n-nodes-base.set',
        version: 3.4,
        position: [672, 4384],
    })
    Response = {
        assignments: {
            assignments: [
                {
                    id: '43099950-bb55-4647-830f-b0aa10e7d3c3',
                    name: 'response',
                    value: '={{ "Claro!\\nPoderia me confirmar seu nome?\\nAssim podemos continuar certinho! 😊".split(/\\n+/).filter(Boolean) }}',
                    type: 'array',
                },
            ],
        },
        options: {},
    };

    @node({
        id: 'fc368cd6-3cb7-48fd-a0fd-964d7ca2c9ce',
        name: 'push human memory',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [2384, 3632],
        credentials: { redis: { id: 'zMk8tatRFuFo6wmp', name: 'beautyflow' } },
        onError: 'continueErrorOutput',
        executeOnce: false,
        retryOnFail: true,
    })
    PushHumanMemory = {
        operation: 'push',
        list: "=beautyflow_bot.{{ $('data handler').item.json.client.remote_jid }}.chat_memory",
        messageData: `={{ JSON.stringify({
  type: "human",
  data: {
    content: $('data handler').item.json.client.message,
    additional_kwargs: {},
    response_metadata: {}
  }
}) }}`,
    };

    @node({
        id: 'dd90f1ca-48ae-4c1d-8fba-f4e34f13f7ee',
        name: 'push human memory 1',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [2432, 4352],
        credentials: { redis: { id: 'zMk8tatRFuFo6wmp', name: 'beautyflow' } },
        onError: 'continueErrorOutput',
        executeOnce: false,
        retryOnFail: true,
    })
    PushHumanMemory1 = {
        operation: 'push',
        list: "=beautyflow_bot.{{ $('data handler').item.json.client.remote_jid }}.chat_memory",
        messageData: `={{ JSON.stringify({
  type: "human",
  data: {
    content: $('data handler').item.json.client.message,
    additional_kwargs: {},
    response_metadata: {}
  }
}) }}`,
    };

    @node({
        id: '022e166d-936a-4f7f-8587-65ea90211e3d',
        name: 'push ai memory',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [2592, 3616],
        credentials: { redis: { id: 'zMk8tatRFuFo6wmp', name: 'beautyflow' } },
        onError: 'continueErrorOutput',
    })
    PushAiMemory = {
        operation: 'push',
        list: "=beautyflow_bot.{{ $('data handler').item.json.client.remote_jid }}.chat_memory",
        messageData: `={{ (() => { 
  const raw = $('response 1').first().json.response

  const content = Array.isArray(raw)
    ? raw.join('\\n')
    : raw?.output || raw?.content || raw || '';

  return JSON.stringify({
    type: "ai",
    data: {
      content,
      tool_calls: [],
      invalid_tool_calls: [],
      additional_kwargs: {},
      response_metadata: {}
    }
  });
})() }}`,
    };

    @node({
        id: '68f2a511-c2dc-42c5-8766-ce6fdf899d18',
        name: 'push ai memory 1',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [2672, 4336],
        credentials: { redis: { id: 'zMk8tatRFuFo6wmp', name: 'beautyflow' } },
        onError: 'continueErrorOutput',
    })
    PushAiMemory1 = {
        operation: 'push',
        list: "=beautyflow_bot.{{ $('data handler').item.json.client.remote_jid }}.chat_memory",
        messageData: `={{ (() => { 
  const raw = $('response 2').isExecuted
    ? $('response 2').first().json.response
    : $('response').first().json.response;

  const content = Array.isArray(raw)
    ? raw.join('\\n')
    : raw?.output || raw?.content || raw || '';

  return JSON.stringify({
    type: "ai",
    data: {
      content,
      tool_calls: [],
      invalid_tool_calls: [],
      additional_kwargs: {},
      response_metadata: {}
    }
  });
})() }}`,
    };

    @node({
        id: 'c868019f-6724-4437-8a70-5860d02cba53',
        name: 'error report 12',
        type: 'n8n-nodes-base.stopAndError',
        version: 1,
        position: [-288, 4928],
    })
    ErrorReport12 = {
        errorType: 'errorObject',
        errorObject: `={
  "error": {
    "workflow": "{{ $workflow.id }}",
    "execution": "{{ $execution.id }}",
    "type": "internal.redis.context",
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
        id: '766f23a4-91ab-47bc-89a3-9bf732ac9ea1',
        name: 'error report 21',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [624, 5136],
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
        id: 'cb53483b-7bf9-472e-8ed7-f0f1e1c46a77',
        name: 'error report 13',
        type: 'n8n-nodes-base.stopAndError',
        version: 1,
        position: [176, 5168],
    })
    ErrorReport13 = {
        errorType: 'errorObject',
        errorObject: `={
  "error": {
    "workflow": "{{ $workflow.id }}",
    "execution": "{{ $execution.id }}",
    "type": "internal.api.get_client",
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
        id: '91c3a79c-a77b-4873-b430-c0f823af8c51',
        name: 'error report ',
        type: 'n8n-nodes-base.stopAndError',
        version: 1,
        position: [-288, 4576],
    })
    ErrorReport = {
        errorType: 'errorObject',
        errorObject: `={
  "error": {
    "workflow": "{{ $workflow.id }}",
    "execution": "{{ $execution.id }}",
    "type": "internal.api.post_client",
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
        id: '2485132c-549f-411b-b3ff-e533f8cd0724',
        name: 'error report 22',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [-80, 4560],
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
  type: "external.gmail",
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
        id: '6385bd0b-1e6e-4d11-b0a2-0f6356c43452',
        name: 'error report 1',
        type: 'n8n-nodes-base.stopAndError',
        version: 1,
        position: [-288, 4224],
    })
    ErrorReport1 = {
        errorType: 'errorObject',
        errorObject: `={
  "error": {
    "workflow": "{{ $workflow.id }}",
    "execution": "{{ $execution.id }}",
    "type": "internal.api.get_client",
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
        id: 'd5cf1bca-17ee-4184-89ce-addbbcdbc1fb',
        name: 'error report 23',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [176, 4208],
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
  type: "external.ai.name_extractor",
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
        id: '4d0f51ba-8f74-452c-98d2-99aba46f957a',
        name: 'error report 14',
        type: 'n8n-nodes-base.stopAndError',
        version: 1,
        position: [672, 4096],
    })
    ErrorReport14 = {
        errorType: 'errorObject',
        errorObject: `={
  "error": {
    "workflow": "{{ $workflow.id }}",
    "execution": "{{ $execution.id }}",
    "type": "internal.api.client_name",
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
        id: '0ef5cfaa-2dda-46c0-9851-5322593ea399',
        name: 'error report 15',
        type: 'n8n-nodes-base.stopAndError',
        version: 1,
        position: [1968, 4592],
    })
    ErrorReport15 = {
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
    "message_id": "{{ $('data handler').item.json.message.id || '' }}",
    "message_text": "{{ $('data handler').item.json.message.text || '' }}"
  }
}`,
    };

    @node({
        id: '205fd180-7a63-41a1-87dc-96128d5f1fd6',
        name: 'error report 16',
        type: 'n8n-nodes-base.stopAndError',
        version: 1,
        position: [2208, 4512],
    })
    ErrorReport16 = {
        errorType: 'errorObject',
        errorObject: `={
  "error": {
    "workflow": "{{ $workflow.id }}",
    "execution": "{{ $execution.id }}",
    "type": "internal.redis.set_pending",
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
        id: '12e9611d-9348-4e62-aeea-8ff350636473',
        name: 'error report 25',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [2672, 4480],
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
  type: "internal.redis.push_memory",
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
        id: 'b9392d81-62f3-47f5-970c-21cce2f8d5d8',
        name: 'error report 26',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [2592, 3760],
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
  type: "internal.redis.push_memory",
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
        id: '87a83466-ddd0-4bb2-88bf-ccb201e5abf1',
        name: 'error report 17',
        type: 'n8n-nodes-base.stopAndError',
        version: 1,
        position: [2176, 3792],
    })
    ErrorReport17 = {
        errorType: 'errorObject',
        errorObject: `={
  "error": {
    "workflow": "{{ $workflow.id }}",
    "execution": "{{ $execution.id }}",
    "type": "internal.redis.delete_pending",
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
        id: '7a48420f-783a-4ef5-a7d3-c5a0a5dd1342',
        name: 'error report 18',
        type: 'n8n-nodes-base.stopAndError',
        version: 1,
        position: [1952, 3872],
    })
    ErrorReport18 = {
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
    "message_id": "{{ $('data handler').item.json.message.id || '' }}",
    "message_text": "{{ $('data handler').item.json.message.text || '' }}"
  }
}`,
    };

    @node({
        id: 'd38899d6-7051-432f-9ed8-909322e107d6',
        name: 'has client?',
        type: 'n8n-nodes-base.if',
        version: 2.3,
        position: [400, 5008],
    })
    HasClient = {
        conditions: {
            options: {
                caseSensitive: true,
                leftValue: '',
                typeValidation: 'strict',
                version: 3,
            },
            conditions: [
                {
                    id: '056c5af3-e506-40e7-92f0-28cb8097e3c5',
                    leftValue: "={{ $('get client 2').item.json.body }}",
                    rightValue: '',
                    operator: {
                        type: 'array',
                        operation: 'notEmpty',
                        singleValue: true,
                    },
                },
            ],
            combinator: 'and',
        },
        options: {},
    };

    @node({
        id: 'dfaac41b-e6d1-483e-b55f-58fbfb5c58fe',
        name: 'OpenRouter Chat Model',
        type: '@n8n/n8n-nodes-langchain.lmChatOpenRouter',
        version: 1,
        position: [48, 4160],
        credentials: { openRouterApi: { id: 'Op5dKapW14nLrY9q', name: 'beautyflow key' } },
    })
    OpenrouterChatModel = {
        model: 'google/gemini-2.5-flash-lite',
        options: {},
    };

    @node({
        id: '31f1c841-4a9d-4833-b933-3bab9005b489',
        name: 'error report 19',
        type: 'n8n-nodes-base.stopAndError',
        version: 1,
        position: [432, 4544],
    })
    ErrorReport19 = {
        errorType: 'errorObject',
        errorObject: `={
  "error": {
    "workflow": "{{ $workflow.id }}",
    "execution": "{{ $execution.id }}",
    "type": "internal.redis.set_pending",
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
        id: '1e7bd6c8-edf4-40ae-8475-01b4877a9ccb',
        name: 'set pending state 1',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [432, 4400],
        credentials: { redis: { id: 'zMk8tatRFuFo6wmp', name: 'beautyflow' } },
        onError: 'continueErrorOutput',
        executeOnce: true,
        retryOnFail: true,
    })
    SetPendingState1 = {
        operation: 'set',
        key: "=beautyflow_bot.{{ $('data handler').item.json.client.remote_jid }}.state",
        value: 'awaiting_name',
    };

    @node({
        id: '82c949e7-a72e-4cfa-b561-cb945c719de9',
        name: 'delete buffer',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [2992, 3952],
        credentials: { redis: { id: 'zMk8tatRFuFo6wmp', name: 'beautyflow' } },
        onError: 'continueErrorOutput',
        retryOnFail: true,
    })
    DeleteBuffer = {
        operation: 'delete',
        key: "=beautyflow_bot.{{ $('data handler').item.json.client.remote_jid }}.chat_buffer",
    };

    @node({
        id: '68ca995c-1bb3-439e-98e8-190be8b79493',
        name: 'error report 24',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [3264, 3968],
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
  type: "internal.redis.buffer",
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
        id: '988eb06d-7552-4355-a907-3731f67ccb8f',
        name: 'response 2',
        type: 'n8n-nodes-base.set',
        version: 3.4,
        position: [672, 4240],
    })
    Response2 = {
        assignments: {
            assignments: [
                {
                    id: '43099950-bb55-4647-830f-b0aa10e7d3c3',
                    name: 'response',
                    value: '={{ "Desculpa, não entendi!\\nPoderia repetir?".split(/\\n+/).filter(Boolean) }}',
                    type: 'array',
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
        this.DataHandler.out(0).to(this.Switch_.in(0));
        this.PostClient.out(0).to(this.SendConfirmation.in(0));
        this.PostClient.out(1).to(this.ErrorReport.in(0));
        this.SendConfirmation.out(0).to(this.ClientData.in(0));
        this.SendConfirmation.out(1).to(this.ErrorReport22.in(0));
        this.Webhook.out(0).to(this.DataHandler.in(0));
        this.NameExtractor.out(0).to(this.NameInMessage.in(0));
        this.NameExtractor.out(1).to(this.ErrorReport23.in(0));
        this.Switch_.out(0).to(this.GetClient1.in(0));
        this.Switch_.out(1).to(this.PostClient.in(0));
        this.Switch_.out(2).to(this.GetContext.in(0));
        this.NameInMessage.out(0).to(this.AddName.in(0));
        this.NameInMessage.out(1).to(this.Response2.in(0));
        this.SplitOut.out(0).to(this.LoopResponse.in(0));
        this.LoopResponse.out(0).to(this.SetPendingState.in(0));
        this.LoopResponse.out(1).to(this.TypingDelay.in(0));
        this.SendResponse.out(0).to(this.LoopResponse.in(0));
        this.SendResponse.out(1).to(this.ErrorReport15.in(0));
        this.TypingDelay.out(0).to(this.SendResponse.in(0));
        this.GetClient1.out(0).to(this.NameExtractor.in(0));
        this.GetClient1.out(1).to(this.ErrorReport1.in(0));
        this.SetPendingState.out(0).to(this.PushHumanMemory1.in(0));
        this.SetPendingState.out(1).to(this.ErrorReport16.in(0));
        this.Name.out(0).to(this.Sucess.in(0));
        this.Name.out(1).to(this.SetPendingState1.in(0));
        this.GetClient2.out(0).to(this.HasClient.in(0));
        this.GetClient2.out(1).to(this.ErrorReport13.in(0));
        this.PushContext2.out(0).to(this.Name.in(0));
        this.PushContext2.out(1).to(this.ErrorReport21.in(0));
        this.HasData.out(0).to(this.Convert.in(0));
        this.HasData.out(1).to(this.GetClient2.in(0));
        this.GetContext.out(0).to(this.HasData.in(0));
        this.GetContext.out(1).to(this.ErrorReport12.in(0));
        this.Convert.out(0).to(this.Name.in(0));
        this.ClientData.out(0).to(this.SetPendingState1.in(0));
        this.AddName.out(0).to(this.Response1.in(0));
        this.AddName.out(1).to(this.ErrorReport14.in(0));
        this.SplitOut1.out(0).to(this.LoopResponse1.in(0));
        this.DeletePending.out(0).to(this.PushHumanMemory.in(0));
        this.DeletePending.out(1).to(this.ErrorReport17.in(0));
        this.LoopResponse1.out(0).to(this.DeletePending.in(0));
        this.LoopResponse1.out(1).to(this.TypingDelay1.in(0));
        this.TypingDelay1.out(0).to(this.SendResponse1.in(0));
        this.SendResponse1.out(0).to(this.LoopResponse1.in(0));
        this.SendResponse1.out(1).to(this.ErrorReport18.in(0));
        this.Response1.out(0).to(this.SplitOut1.in(0));
        this.Response.out(0).to(this.SplitOut.in(0));
        this.PushHumanMemory.out(0).to(this.PushAiMemory.in(0));
        this.PushHumanMemory.out(1).to(this.ErrorReport26.in(0));
        this.PushHumanMemory1.out(0).to(this.PushAiMemory1.in(0));
        this.PushHumanMemory1.out(1).to(this.ErrorReport25.in(0));
        this.PushAiMemory.out(0).to(this.DeleteBuffer.in(0));
        this.PushAiMemory.out(1).to(this.ErrorReport26.in(0));
        this.PushAiMemory1.out(0).to(this.DeleteBuffer.in(0));
        this.PushAiMemory1.out(1).to(this.ErrorReport25.in(0));
        this.ErrorReport21.out(0).to(this.Name.in(0));
        this.ErrorReport22.out(0).to(this.ClientData.in(0));
        this.ErrorReport23.out(0).to(this.NameInMessage.in(0));
        this.ErrorReport25.out(0).to(this.DeleteBuffer.in(0));
        this.ErrorReport26.out(0).to(this.DeleteBuffer.in(0));
        this.HasClient.out(0).to(this.PushContext2.in(0));
        this.HasClient.out(1).to(this.PostClient1.in(0));
        this.SetPendingState1.out(0).to(this.Response.in(0));
        this.SetPendingState1.out(1).to(this.ErrorReport19.in(0));
        this.DeleteBuffer.out(1).to(this.ErrorReport24.in(0));
        this.Response2.out(0).to(this.SplitOut.in(0));

        this.NameExtractor.uses({
            ai_languageModel: this.OpenrouterChatModel.output,
        });
    }
}
