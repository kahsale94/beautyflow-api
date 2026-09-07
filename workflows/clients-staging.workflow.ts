import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : clients-staging
// Nodes   : 61  |  Connections: 72
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// DataHandler                        set
// HasClientPhone                     if
// RequestContactInfo                 httpRequest                [onError→out(1)]
// ContactInfoRequestedEnd            code
// PostClient                         httpRequest                [onError→out(1)]
// SendConfirmation                   gmail                      [onError→out(1)] [creds]
// ClientData                         set
// Webhook                            executeWorkflowTrigger
// NameExtractor                      informationExtractor       [AI] [onError→out(1)] [executeOnce]
// Switch_                            switch
// NameInMessage                      if
// SplitOut                           splitOut
// LoopResponse                       splitInBatches
// SendResponse                       httpRequest                [onError→out(1)]
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
// BypassCacheForExistingOnly         if
// ReturnExistingClientDirectly       if
// ExistingClientSuccess              code
// Convert                            code
// AddName                            httpRequest                [onError→out(1)]
// SplitOut1                          splitOut
// DeletePending                      redis                      [onError→out(1)] [creds] [executeOnce] [retry]
// LoopResponse1                      splitInBatches
// TypingDelay1                       code
// SendResponse1                      httpRequest                [onError→out(1)]
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
// ExistingOnly                       if
// ExistingClientNotFound             set
// OpenrouterChatModel                lmChatOpenRouter           [creds] [ai_languageModel]
// DeleteBuffer                       redis                      [onError→out(1)] [creds] [retry]
// ErrorReport24                      executeWorkflow
// Response2                          set
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// Webhook
//    → DataHandler
//      → HasClientPhone
//        → Switch_
//          → GetClient1
//            → NameExtractor
//              → NameInMessage
//                → AddName
//                  → Response1
//                    → SplitOut1
//                      → LoopResponse1
//                        → DeletePending
//                          → PushHumanMemory
//                            → PushAiMemory
//                              → DeleteBuffer
//                               .out(1) → ErrorReport24
//                             .out(1) → ErrorReport26
//                                → DeleteBuffer (↩ loop)
//                           .out(1) → ErrorReport26 (↩ loop)
//                         .out(1) → ErrorReport17
//                       .out(1) → TypingDelay1
//                          → SendResponse1
//                            → LoopResponse1 (↩ loop)
//                           .out(1) → ErrorReport18
//                 .out(1) → ErrorReport14
//               .out(1) → Response2
//                  → SplitOut
//                    → LoopResponse
//                      → SetPendingState
//                        → PushHumanMemory1
//                          → PushAiMemory1
//                            → DeleteBuffer (↩ loop)
//                           .out(1) → ErrorReport25
//                              → DeleteBuffer (↩ loop)
//                         .out(1) → ErrorReport25 (↩ loop)
//                       .out(1) → ErrorReport16
//                     .out(1) → TypingDelay
//                        → SendResponse
//                          → LoopResponse (↩ loop)
//                         .out(1) → ErrorReport15
//             .out(1) → ErrorReport23
//                → NameInMessage (↩ loop)
//           .out(1) → ErrorReport1
//         .out(1) → PostClient
//            → ClientData
//              → Response
//                → SplitOut (↩ loop)
//           .out(1) → ErrorReport
//         .out(2) → BypassCacheForExistingOnly
//            → GetClient2
//              → HasClient
//                → ReturnExistingClientDirectly
//                  → ExistingClientSuccess
//                 .out(1) → PushContext2
//                    → Name
//                      → Sucess
//                     .out(1) → Response (↩ loop)
//                   .out(1) → ErrorReport21
//                      → Name (↩ loop)
//               .out(1) → ExistingOnly
//                  → ExistingClientNotFound
//                 .out(1) → PostClient1
//             .out(1) → ErrorReport13
//           .out(1) → GetContext
//              → HasData
//                → Convert
//                  → Name (↩ loop)
//               .out(1) → GetClient2 (↩ loop)
//             .out(1) → ErrorReport12
//       .out(1) → RequestContactInfo
//          → ContactInfoRequestedEnd
//         .out(1) → ErrorReport15 (↩ loop)
// ErrorReport22
//    → ClientData (↩ loop)
//
// AI CONNECTIONS
// NameExtractor.uses({ ai_languageModel: OpenrouterChatModel })
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: 'el3GeDHzGRJaidKi',
    name: 'clients-staging',
    active: true,
    isArchived: false,
    tags: ['Kaiky', 'beautyflow-api'],
    settings: {
        executionOrder: 'v1',
        availableInMCP: true,
        binaryMode: 'separate',
        timeSavedMode: 'fixed',
        errorWorkflow: 'BxyJLKjTEcfzV18k',
        callerPolicy: 'workflowsFromSameOwner',
        timezone: 'America/Sao_Paulo',
    },
})
export class ClientsStagingWorkflow {
    // =====================================================================
    // CONFIGURATION DES NOEUDS
    // =====================================================================

    @node({
        id: '702c1180-a014-4f6e-9660-e6da777db863',
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
                    id: '987a70e5-d23f-4a91-93f9-721b8ee27492',
                    name: 'existing_only',
                    value: '={{ $json.existing_only === true || String($json.existing_only).toLowerCase() === "true" }}',
                    type: 'boolean',
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
                    value: `={{ (() => {
  const client = $json.client || {};
  const explicitPhone = String(client.phone || '').trim();
  const remoteJid = String(client.remote_jid || '');
  const derivedPhone = remoteJid.includes('@') && !remoteJid.includes('@g.us')
    ? remoteJid.split('@')[0]
    : '';

  return {
    ...client,
    phone: explicitPhone || derivedPhone
  };
})() }}`,
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
        id: 'contact-phone-required-guard',
        name: 'has client phone?',
        type: 'n8n-nodes-base.if',
        version: 2.3,
        position: [-608, 4432],
    })
    HasClientPhone = {
        conditions: {
            options: {
                caseSensitive: true,
                leftValue: '',
                typeValidation: 'loose',
                version: 3,
            },
            conditions: [
                {
                    id: 'client-phone-not-empty',
                    leftValue: "={{ $('data handler').first().json.client.phone }}",
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
        id: 'request-covercut-contact-info',
        name: 'request contact info',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.4,
        position: [-384, 4688],
        onError: 'continueErrorOutput',
    })
    RequestContactInfo = {
        method: 'POST',
        url: "={{ $('data handler').first().json.api.url.replace(/\\/clients\\/?$/, '') }}/whatsapp/messages",
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
  type: 'request_contact_info',
  recipient: $('data handler').first().json.client.provider_user_id,
  contact_id: $('data handler').first().json.client.contact_id,
  text: 'Para continuar com seu cadastro e agendamento, compartilhe seu número de telefone pelo botão abaixo.'
} }}`,
        options: {},
    };

    @node({
        id: 'contact-info-requested-end',
        name: 'contact info requested end',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [-144, 4688],
    })
    ContactInfoRequestedEnd = {
        jsCode: 'return [];',
    };

    @node({
        id: '28909ff0-3864-440a-b785-db6832e146da',
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
        id: '22333f2d-c8b9-4126-9bd7-605707c9f49c',
        webhookId: 'd5ee7932-ebae-4846-b7fa-c605bfc992cb',
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
        id: '1b8e46c2-bab1-44b4-a1e1-86bd47979f95',
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
        id: '100c9aac-88f1-40b8-8a4c-8de16d5c9c82',
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
                    name: 'existing_only',
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
        id: '259130c6-3f14-48d0-8894-c99613305abf',
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
        id: '031e08a4-53e9-4a11-8702-7dc32c4c0da1',
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
        id: 'b5b3bd64-8f15-4a3a-8798-e5a42c682bc9',
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
        id: 'ac0dcf5e-360e-4ad7-a8be-3090ac711eb6',
        name: 'split out',
        type: 'n8n-nodes-base.splitOut',
        version: 1,
        position: [1344, 4400],
    })
    SplitOut = {
        fieldToSplitOut: 'response',
        options: {},
    };

    @node({
        id: 'ca905608-9731-45f7-9aa5-ea0e6b9939e7',
        name: 'loop response',
        type: 'n8n-nodes-base.splitInBatches',
        version: 3,
        position: [1552, 4400],
    })
    LoopResponse = {
        options: {},
    };

    @node({
        id: '68f6b4b0-1a8c-4bb9-977e-5cea41e9c020',
        name: 'send response',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.4,
        position: [1968, 4464],
        onError: 'continueErrorOutput',
    })
    SendResponse = {
        method: 'POST',
        url: "={{ $('data handler').first().json.api.url.replace(/\\/clients\\/?$/, '') }}/whatsapp/messages",
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
  to: $('data handler').first().json.client.phone,
  contact_id: $('data handler').first().json.client.contact_id || null,
  text: $('typing delay').item.json.response
} }}`,
        options: {},
    };

    @node({
        id: '732e3b33-4357-4cf4-a762-ca19723c20ac',
        name: 'typing delay',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [1760, 4464],
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
        id: '81dbd10c-0c7c-4375-956f-79fbbec1e8ab',
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
        id: 'aa6aa50e-f6ef-41fc-b94b-2870f6b1a527',
        name: 'set pending state',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [2208, 4384],
        credentials: { redis: { id: 'yq1GIl0nbdK5QpYm', name: 'beautyflow test' } },
        onError: 'continueErrorOutput',
        executeOnce: true,
        retryOnFail: true,
    })
    SetPendingState = {
        operation: 'set',
        key: "=beautyflow_bot.{{ $('data handler').item.json.api.connection_key || 'default' }}.{{ $('data handler').item.json.client.remote_jid }}.state",
        value: 'awaiting_name',
        expire: true,
        ttl: 86400,
    };

    @node({
        id: '324e2b5b-aea6-4705-a79f-ec72dd413f16',
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
        id: 'c488b7c2-ea93-4016-9e24-b578c7209e95',
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
        id: '25af8a70-132b-4626-b37d-7d322152daba',
        name: 'post client 1',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [400, 5152],
    })
    PostClient1 = {
        workflowId: {
            __rl: true,
            value: 'el3GeDHzGRJaidKi',
            mode: 'list',
            cachedResultUrl: '/workflow/el3GeDHzGRJaidKi',
            cachedResultName: 'clients test',
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
  connection_key: $('data handler').first().json.api.connection_key
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
        id: 'ea78d7a0-785f-4d83-ab05-798ad48070db',
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
        id: '504b9a49-ec7d-4ceb-b8b6-f59183b1b20e',
        name: 'push context 2',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [624, 4992],
        credentials: { redis: { id: 'yq1GIl0nbdK5QpYm', name: 'beautyflow test' } },
        onError: 'continueErrorOutput',
        retryOnFail: true,
    })
    PushContext2 = {
        operation: 'set',
        key: "=beautyflow_bot.{{ $('data handler').item.json.api.connection_key || 'default' }}.{{ $('data handler').item.json.client.phone }}.client_context",
        value: `={{ JSON.stringify({
  id: $('get client 2').item.json.body[0].id,
  name: $('get client 2').item.json.body[0].name,
  phone: $('get client 2').item.json.body[0].phone
}) }}`,
        keyType: 'string',
        expire: true,
        ttl: 86400,
    };

    @node({
        id: '1ee44385-4762-495c-8a1e-583446b3ca5f',
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
        id: '1e87bdb3-be96-4d8a-9540-14174092ef9f',
        name: 'get context',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [-288, 4784],
        credentials: { redis: { id: 'yq1GIl0nbdK5QpYm', name: 'beautyflow test' } },
        onError: 'continueErrorOutput',
    })
    GetContext = {
        operation: 'keys',
        keyPattern:
            "=beautyflow_bot.{{ $('data handler').item.json.api.connection_key || 'default' }}.{{ $('data handler').item.json.client.phone }}.client_context",
    };

    @node({
        id: '91713aba-a903-4a68-b12d-73b47b30583c',
        name: 'bypass cache for existing only?',
        type: 'n8n-nodes-base.if',
        version: 2.3,
        position: [-496, 4896],
    })
    BypassCacheForExistingOnly = {
        conditions: {
            options: {
                caseSensitive: true,
                leftValue: '',
                typeValidation: 'strict',
                version: 3,
            },
            conditions: [
                {
                    id: 'c79448ac-6a24-434c-843a-938cb4df25bd',
                    leftValue: "={{ $('data handler').first().json.existing_only }}",
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
        looseTypeValidation: false,
        options: {},
    };

    @node({
        id: 'ff4cd627-957e-40e5-9659-fe22ad03cd6b',
        name: 'return existing client directly?',
        type: 'n8n-nodes-base.if',
        version: 2.3,
        position: [608, 4880],
    })
    ReturnExistingClientDirectly = {
        conditions: {
            options: {
                caseSensitive: true,
                leftValue: '',
                typeValidation: 'strict',
                version: 3,
            },
            conditions: [
                {
                    id: 'b9925bcd-1474-45b7-b998-55ee41310379',
                    leftValue: "={{ $('data handler').first().json.existing_only }}",
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
        looseTypeValidation: false,
        options: {},
    };

    @node({
        id: '9a24c00f-b15b-4d23-b08e-e31297741ecf',
        name: 'existing client success',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [832, 4816],
    })
    ExistingClientSuccess = {
        mode: 'runOnceForAllItems',
        jsCode: `const response = $('get client 2').first().json || {};
const rows = Array.isArray(response.body) ? response.body : (Array.isArray(response) ? response : []);
const client = rows[0] || null;

if (!client?.id) {
  return [{ json: { client_found: false, reason: 'existing_client_not_found', client: {} } }];
}

return [{ json: {
  client_found: true,
  client: {
    id: client.id,
    name: client.name || null,
    phone: client.phone || null,
    business_id: client.business_id || $('data handler').first().json.business?.id || null,
  },
} }];`,
    };

    @node({
        id: '8547fc9b-c5e5-4331-9777-3658fee9a9e6',
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
        id: '238e3f16-5943-410b-b1cc-f61b968f32b0',
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
        id: '24d60fc5-9b28-4bc5-a2b0-57deac270049',
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
        id: 'c958ddec-b911-4e5a-a5e4-c864c6c13bdd',
        name: 'delete pending',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [2176, 3648],
        credentials: { redis: { id: 'yq1GIl0nbdK5QpYm', name: 'beautyflow test' } },
        onError: 'continueErrorOutput',
        executeOnce: true,
        retryOnFail: true,
    })
    DeletePending = {
        operation: 'delete',
        key: "=beautyflow_bot.{{ $('data handler').item.json.api.connection_key || 'default' }}.{{ $('data handler').item.json.client.remote_jid }}.state",
    };

    @node({
        id: '5bf3f49e-3ab7-4285-a4ec-0cc7d9bbb53b',
        name: 'loop response 1',
        type: 'n8n-nodes-base.splitInBatches',
        version: 3,
        position: [1536, 3664],
    })
    LoopResponse1 = {
        options: {},
    };

    @node({
        id: 'd81ae2e8-e64e-4210-ae05-65fc20ac90ee',
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
        id: 'dea6cca5-b304-48f3-bca5-1546666760e2',
        name: 'send response 1',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.4,
        position: [1952, 3728],
        onError: 'continueErrorOutput',
    })
    SendResponse1 = {
        method: 'POST',
        url: "={{ $('data handler').first().json.api.url.replace(/\\/clients\\/?$/, '') }}/whatsapp/messages",
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
  to: $('data handler').first().json.client.phone,
  contact_id: $('data handler').first().json.client.contact_id || null,
  text: $('typing delay 1').item.json.response
} }}`,
        options: {},
    };

    @node({
        id: 'ba963c29-e9bc-4591-a85f-986253940d07',
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
        id: '68692006-c433-4597-ad1e-a95540691bdb',
        name: 'response',
        type: 'n8n-nodes-base.set',
        version: 3.4,
        position: [672, 4400],
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
        id: '4cc84d23-775d-4da6-b22e-73c6946c3700',
        name: 'push human memory',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [2384, 3632],
        credentials: { redis: { id: 'yq1GIl0nbdK5QpYm', name: 'beautyflow test' } },
        onError: 'continueErrorOutput',
        executeOnce: false,
        retryOnFail: true,
    })
    PushHumanMemory = {
        operation: 'push',
        list: "=beautyflow_bot.{{ $('data handler').item.json.api.connection_key || 'default' }}.{{ $('data handler').item.json.client.remote_jid }}.chat_memory",
        messageData: `={{ JSON.stringify({
  type: "human",
  data: {
    content: $('data handler').item.json.client.message,
    additional_kwargs: {},
    response_metadata: {}
  }
}) }}`,
        expire: true,
        ttl: 86400,
    };

    @node({
        id: '1e62a9eb-1007-4989-99a1-267c167a12dc',
        name: 'push human memory 1',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [2432, 4368],
        credentials: { redis: { id: 'yq1GIl0nbdK5QpYm', name: 'beautyflow test' } },
        onError: 'continueErrorOutput',
        executeOnce: false,
        retryOnFail: true,
    })
    PushHumanMemory1 = {
        operation: 'push',
        list: "=beautyflow_bot.{{ $('data handler').item.json.api.connection_key || 'default' }}.{{ $('data handler').item.json.client.remote_jid }}.chat_memory",
        messageData: `={{ JSON.stringify({
  type: "human",
  data: {
    content: $('data handler').item.json.client.message,
    additional_kwargs: {},
    response_metadata: {}
  }
}) }}`,
        expire: true,
        ttl: 86400,
    };

    @node({
        id: '0fbeda6c-2646-4b17-857d-50e02ebbb1e2',
        name: 'push ai memory',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [2592, 3616],
        credentials: { redis: { id: 'yq1GIl0nbdK5QpYm', name: 'beautyflow test' } },
        onError: 'continueErrorOutput',
    })
    PushAiMemory = {
        operation: 'push',
        list: "=beautyflow_bot.{{ $('data handler').item.json.api.connection_key || 'default' }}.{{ $('data handler').item.json.client.remote_jid }}.chat_memory",
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
        expire: true,
        ttl: 86400,
    };

    @node({
        id: '119f65f6-76f3-49f0-84b4-b0f8c6f160a5',
        name: 'push ai memory 1',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [2672, 4352],
        credentials: { redis: { id: 'yq1GIl0nbdK5QpYm', name: 'beautyflow test' } },
        onError: 'continueErrorOutput',
    })
    PushAiMemory1 = {
        operation: 'push',
        list: "=beautyflow_bot.{{ $('data handler').item.json.api.connection_key || 'default' }}.{{ $('data handler').item.json.client.remote_jid }}.chat_memory",
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
        expire: true,
        ttl: 86400,
    };

    @node({
        id: '818260dd-1d75-4788-aff3-57f53f8f102e',
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
        id: 'dab53521-6b0d-4862-bcc6-68c1a9b46c99',
        name: 'error report 21',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [624, 5136],
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
        id: '72fdd823-17aa-4d73-91b0-56361d8eb3aa',
        name: 'error report 13',
        type: 'n8n-nodes-base.stopAndError',
        version: 1,
        position: [176, 5168],
    })
    ErrorReport13 = {
        errorType: 'errorObject',
        errorObject: `={{ JSON.stringify((() => {
  const data = $('data handler').first().json || {};
  let webhook = {};
  try {
    webhook = $('webhook').first().json || {};
  } catch (e) {}

  const sourceError = $json.error || {};
  const rawMessage = String(sourceError.message || sourceError.description || '');
  const description = (() => {
    try {
      const part = rawMessage.split(' - ')[1];
      return JSON.parse(JSON.parse(part)).detail || rawMessage;
    } catch (e) {
      return rawMessage;
    }
  })();

  return {
    error: {
      workflow: $workflow.id,
      execution: $execution.id,
      type: 'internal.api.get_client',
      node: $prevNode.name,
      code: sourceError.status || sourceError.code || '',
      description,
    },
    business: {
      id: data.business?.id || '',
      name: data.business?.name || '',
      phone: data.business?.phone || '',
    },
    client: {
      remote_jid: data.client?.remote_jid || webhook.client?.remote_jid || '',
      message_id: data.client?.message_id || webhook.client?.message_id || '',
      message_text: data.client?.message_text || webhook.client?.message_text || '',
    },
    api: {
      url: data.api?.url || '',
      connection_key: data.api?.connection_key || '',
    },
  };
})()) }}`,
    };

    @node({
        id: 'e9210e25-3183-4106-9932-acfab032d1dd',
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
        id: 'd50d460d-d883-474e-b250-d4ea84989ad3',
        name: 'error report 22',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [-80, 4560],
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
        id: '5caefcda-2b13-4e8d-9c6d-37d47f2ebc32',
        name: 'error report 1',
        type: 'n8n-nodes-base.stopAndError',
        version: 1,
        position: [-288, 4224],
    })
    ErrorReport1 = {
        errorType: 'errorObject',
        errorObject: `={{ JSON.stringify((() => {
  const data = $('data handler').first().json || {};
  let webhook = {};
  try {
    webhook = $('webhook').first().json || {};
  } catch (e) {}

  const sourceError = $json.error || {};
  const rawMessage = String(sourceError.message || sourceError.description || '');
  const description = (() => {
    try {
      const part = rawMessage.split(' - ')[1];
      return JSON.parse(JSON.parse(part)).detail || rawMessage;
    } catch (e) {
      return rawMessage;
    }
  })();

  return {
    error: {
      workflow: $workflow.id,
      execution: $execution.id,
      type: 'internal.api.get_client',
      node: $prevNode.name,
      code: sourceError.status || sourceError.code || '',
      description,
    },
    business: {
      id: data.business?.id || '',
      name: data.business?.name || '',
      phone: data.business?.phone || '',
    },
    client: {
      remote_jid: data.client?.remote_jid || webhook.client?.remote_jid || '',
      message_id: data.client?.message_id || webhook.client?.message_id || '',
      message_text: data.client?.message_text || webhook.client?.message_text || '',
    },
    api: {
      url: data.api?.url || '',
      connection_key: data.api?.connection_key || '',
    },
  };
})()) }}`,
    };

    @node({
        id: 'e36bed3f-4d61-4467-a6a9-d968524fceed',
        name: 'error report 23',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [176, 4208],
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
        id: '0594370b-f20f-4868-be85-2b91868137ba',
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
        id: '06e33d49-35fa-49cf-bb72-9371386f2b42',
        name: 'error report 15',
        type: 'n8n-nodes-base.stopAndError',
        version: 1,
        position: [1968, 4608],
    })
    ErrorReport15 = {
        errorType: 'errorObject',
        errorObject: `={
  "error": {
    "workflow": "{{ $workflow.id }}",
    "execution": "{{ $execution.id }}",
    "type": "external.whatsapp.send_message",
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
        id: 'b4e65ec0-077f-4fdf-9c1f-6591d1ade46b',
        name: 'error report 16',
        type: 'n8n-nodes-base.stopAndError',
        version: 1,
        position: [2208, 4528],
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
        id: '5789d550-69e1-4f3f-9a85-c92fe74b9176',
        name: 'error report 25',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [2672, 4496],
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
        id: 'f42b9939-92e8-46aa-b7ad-fca720e244b0',
        name: 'error report 26',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [2592, 3760],
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
        id: 'c011f9fb-081f-47f4-87d1-fcaec971a256',
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
        id: '350731b3-256e-4936-9073-da8bca1d9f8a',
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
    "type": "external.whatsapp.send_message",
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
        id: 'b78e53b6-3e87-4a98-9fde-a567d8aefed2',
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
        id: '54a8633a-204d-44d2-a88f-c1c3c178a70e',
        name: 'existing only?',
        type: 'n8n-nodes-base.if',
        version: 2.3,
        position: [624, 5168],
    })
    ExistingOnly = {
        conditions: {
            options: {
                caseSensitive: true,
                leftValue: '',
                typeValidation: 'strict',
                version: 3,
            },
            conditions: [
                {
                    id: '343fbdae-a0fb-4b7c-b95e-8f2d91df6981',
                    leftValue: "={{ $('data handler').first().json.existing_only }}",
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
        looseTypeValidation: false,
        options: {},
    };

    @node({
        id: '5cfc8455-bcf7-4649-8c76-96edc62a7115',
        name: 'existing client not found',
        type: 'n8n-nodes-base.set',
        version: 3.4,
        position: [848, 5152],
    })
    ExistingClientNotFound = {
        assignments: {
            assignments: [
                {
                    id: '3f48e106-c5d0-4722-93dd-68feef652cca',
                    name: 'client_found',
                    value: false,
                    type: 'boolean',
                },
                {
                    id: '9bb42ed4-3010-49c5-9ba9-e2841443ca2a',
                    name: 'reason',
                    value: 'existing_client_not_found',
                    type: 'string',
                },
                {
                    id: '6ca91f6d-c812-429e-9933-fde096beff74',
                    name: 'client',
                    value: '={{ {} }}',
                    type: 'object',
                },
            ],
        },
        options: {},
    };

    @node({
        id: 'b6f150b7-cbd1-4124-8d89-d162ae729916',
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
        id: '301e5024-9b3a-4ba9-804c-0af1777438f9',
        name: 'delete buffer',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [2992, 3952],
        credentials: { redis: { id: 'yq1GIl0nbdK5QpYm', name: 'beautyflow test' } },
        onError: 'continueErrorOutput',
        retryOnFail: true,
    })
    DeleteBuffer = {
        operation: 'delete',
        key: "=beautyflow_bot.{{ $('data handler').item.json.api.connection_key || 'default' }}.{{ $('data handler').item.json.client.remote_jid }}.chat_buffer",
    };

    @node({
        id: '5a0650ee-7a3f-4fc8-9253-a8ab86a300db',
        name: 'error report 24',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [3168, 4112],
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
        id: '136cc786-74a0-49fe-bf89-273a77dab374',
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
        this.DataHandler.out(0).to(this.HasClientPhone.in(0));
        this.HasClientPhone.out(0).to(this.Switch_.in(0));
        this.HasClientPhone.out(1).to(this.RequestContactInfo.in(0));
        this.RequestContactInfo.out(0).to(this.ContactInfoRequestedEnd.in(0));
        this.RequestContactInfo.out(1).to(this.ErrorReport15.in(0));
        this.PostClient.out(0).to(this.ClientData.in(0));
        this.PostClient.out(1).to(this.ErrorReport.in(0));
        this.Webhook.out(0).to(this.DataHandler.in(0));
        this.NameExtractor.out(0).to(this.NameInMessage.in(0));
        this.NameExtractor.out(1).to(this.ErrorReport23.in(0));
        this.Switch_.out(0).to(this.GetClient1.in(0));
        this.Switch_.out(1).to(this.PostClient.in(0));
        this.Switch_.out(2).to(this.BypassCacheForExistingOnly.in(0));
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
        this.Name.out(1).to(this.Response.in(0));
        this.GetClient2.out(0).to(this.HasClient.in(0));
        this.GetClient2.out(1).to(this.ErrorReport13.in(0));
        this.PushContext2.out(0).to(this.Name.in(0));
        this.PushContext2.out(1).to(this.ErrorReport21.in(0));
        this.HasData.out(0).to(this.Convert.in(0));
        this.HasData.out(1).to(this.GetClient2.in(0));
        this.GetContext.out(0).to(this.HasData.in(0));
        this.GetContext.out(1).to(this.ErrorReport12.in(0));
        this.BypassCacheForExistingOnly.out(0).to(this.GetClient2.in(0));
        this.BypassCacheForExistingOnly.out(1).to(this.GetContext.in(0));
        this.Convert.out(0).to(this.Name.in(0));
        this.ClientData.out(0).to(this.Response.in(0));
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
        this.HasClient.out(0).to(this.ReturnExistingClientDirectly.in(0));
        this.HasClient.out(1).to(this.ExistingOnly.in(0));
        this.ReturnExistingClientDirectly.out(0).to(this.ExistingClientSuccess.in(0));
        this.ReturnExistingClientDirectly.out(1).to(this.PushContext2.in(0));
        this.ExistingOnly.out(0).to(this.ExistingClientNotFound.in(0));
        this.ExistingOnly.out(1).to(this.PostClient1.in(0));
        this.DeleteBuffer.out(1).to(this.ErrorReport24.in(0));
        this.Response2.out(0).to(this.SplitOut.in(0));

        this.NameExtractor.uses({
            ai_languageModel: this.OpenrouterChatModel.output,
        });
    }
}
