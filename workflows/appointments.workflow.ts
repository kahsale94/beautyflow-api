import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : appointments
// Nodes   : 42  |  Connections: 58
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// Webhook                            executeWorkflowTrigger
// DataHandler                        set
// Action                             switch
// Cancel                             httpRequest                [onError→out(1)]
// AddToCalendar                      googleCalendar             [onError→out(1)] [creds]
// ConfirmationEmail                  gmail                      [onError→out(1)] [creds]
// Post                               httpRequest                [onError→out(1)]
// Patch                              httpRequest                [onError→out(1)]
// GetEvent                           googleCalendar             [onError→out(1)] [creds]
// UpdateEvent                        googleCalendar             [onError→out(1)] [creds]
// GetEmail                           gmail                      [onError→out(1)] [creds]
// UpdateEmail                        gmail                      [onError→out(1)] [creds]
// DeleteEvent                        googleCalendar             [onError→out(1)] [creds]
// GetEvent1                          googleCalendar             [onError→out(1)] [creds]
// DeleteEmail                        gmail                      [onError→out(1)] [creds]
// GetEmail1                          gmail                      [onError→out(1)] [creds]
// Action1                            switch
// FinalReturn                        set
// Aggregate                          aggregate
// GetByClient                        httpRequest                [onError→out(1)]
// GetById                            httpRequest                [onError→out(1)]
// Id                                 if
// PreContext                         set
// AppointmentContext                 code
// ReturnContext                      code
// GetAll                             httpRequest                [onError→out(1)]
// Filter                             filter
// Complete                           httpRequest                [onError→out(1)]
// ErrorReport15                      stopAndError
// ErrorReport16                      stopAndError
// ErrorReport18                      stopAndError
// ErrorReport19                      stopAndError
// ErrorReport20                      stopAndError
// ErrorReport23                      executeWorkflow
// ErrorReport24                      executeWorkflow
// ErrorReport25                      executeWorkflow
// ErrorReport26                      executeWorkflow
// ErrorReport27                      executeWorkflow
// ErrorReport                        executeWorkflow
// ErrorReport21                      stopAndError
// ServiceContext                     executeWorkflow
// ProfessionalContext                executeWorkflow
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// Webhook
//    → DataHandler
//      → Action
//        → Post
//          → PreContext
//            → ProfessionalContext
//              → ServiceContext
//                → AppointmentContext
//                  → Action1
//                    → AddToCalendar
//                      → ConfirmationEmail
//                        → ReturnContext
//                          → Aggregate
//                            → FinalReturn
//                       .out(1) → ErrorReport24
//                          → ReturnContext (↩ loop)
//                     .out(1) → ErrorReport23
//                        → ConfirmationEmail (↩ loop)
//                   .out(1) → ReturnContext (↩ loop)
//                   .out(2) → GetEvent
//                      → UpdateEvent
//                        → GetEmail
//                          → UpdateEmail
//                            → ReturnContext (↩ loop)
//                           .out(1) → ErrorReport26
//                              → ReturnContext (↩ loop)
//                         .out(1) → ErrorReport26 (↩ loop)
//                       .out(1) → ErrorReport25
//                          → GetEmail (↩ loop)
//                     .out(1) → ErrorReport25 (↩ loop)
//                   .out(3) → Cancel
//                      → GetEvent1
//                        → DeleteEvent
//                          → GetEmail1
//                            → DeleteEmail
//                              → ReturnContext (↩ loop)
//                             .out(1) → ErrorReport
//                                → ReturnContext (↩ loop)
//                           .out(1) → ErrorReport (↩ loop)
//                         .out(1) → ErrorReport27
//                            → GetEmail1 (↩ loop)
//                       .out(1) → ErrorReport27 (↩ loop)
//                     .out(1) → ErrorReport21
//         .out(1) → ErrorReport20
//       .out(1) → Patch
//          → PreContext (↩ loop)
//         .out(1) → ErrorReport19
//       .out(2) → GetById
//          → PreContext (↩ loop)
//         .out(1) → ErrorReport18
//       .out(3) → Id
//          → GetById (↩ loop)
//         .out(1) → GetByClient
//            → PreContext (↩ loop)
//           .out(1) → ErrorReport16
// GetAll
//    → Filter
//      → Complete
//       .out(1) → ErrorReport15
//   .out(1) → ErrorReport15 (↩ loop)
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: 'j71qqEVnWkAMmhB3',
    name: 'appointments',
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
export class AppointmentsWorkflow {
    // =====================================================================
    // CONFIGURATION DES NOEUDS
    // =====================================================================

    @node({
        id: '3d49ec35-c336-4d5a-aad8-5bda26340e89',
        name: 'webhook',
        type: 'n8n-nodes-base.executeWorkflowTrigger',
        version: 1.1,
        position: [1248, 6896],
    })
    Webhook = {
        workflowInputs: {
            values: [
                {
                    name: 'action',
                },
                {
                    name: 'appointment_id',
                },
                {
                    name: 'professional_id',
                },
                {
                    name: 'service_id',
                },
                {
                    name: 'start_datetime',
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
        id: 'd9393947-1c79-447e-9b62-44226a908602',
        name: 'data handler',
        type: 'n8n-nodes-base.set',
        version: 3.4,
        position: [1456, 6896],
    })
    DataHandler = {
        assignments: {
            assignments: [
                {
                    id: '4142f544-89a2-44a1-b42f-4ffe05f8eda0',
                    name: 'data',
                    value: `={{ (() => {
  return {
    action: $json.action || 'get',
    appointment: {
      id: $json.appointment_id || '',
      start_datetime: $json.start_datetime || ''
    },
    professional: {
      id: $json.professional_id || ''
    },
    service: {
      id: $json.service_id || ''
    }
  };
})() }}`,
                    type: 'object',
                },
                {
                    id: '7e567273-0a6d-4dcc-a373-db6d1faaa838',
                    name: 'client',
                    value: '={{ $json.client }}',
                    type: 'object',
                },
                {
                    id: '4d9cd564-171f-4763-99aa-ed4e9119060d',
                    name: 'business',
                    value: '={{ $json.business }}',
                    type: 'object',
                },
                {
                    id: '064cb0fd-8607-4646-8fc3-91f1ad6e8aac',
                    name: 'api',
                    value: '={{ $json.api }}',
                    type: 'object',
                },
            ],
        },
        options: {},
    };

    @node({
        id: 'fb650163-3d00-49dc-81f5-c562f521b17d',
        name: 'action',
        type: 'n8n-nodes-base.switch',
        version: 3.4,
        position: [1664, 6864],
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
                                id: 'edb3e1d9-c030-457e-8736-852be0e6c9e3',
                                leftValue: "={{ $('data handler').item.json.data.action }}",
                                rightValue: 'post',
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
                    outputKey: 'POST',
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
                                leftValue: "={{ $('data handler').item.json.data.action }}",
                                rightValue: 'update',
                                operator: {
                                    type: 'string',
                                    operation: 'equals',
                                },
                                id: 'd5c0a724-d78c-4ebf-b61d-8a647698c685',
                            },
                        ],
                        combinator: 'and',
                    },
                    renameOutput: true,
                    outputKey: 'PATCH',
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
                                id: 'afc83179-c5f5-4b32-8b2b-ac4541eaf40c',
                                leftValue: "={{ $('data handler').item.json.data.action }}",
                                rightValue: 'cancel',
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
                    outputKey: 'CANCEL',
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
                                leftValue: "={{ $('data handler').item.json.data.action }}",
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
        options: {},
    };

    @node({
        id: 'f4b3dd1f-3f82-472e-bd13-9f4138816a04',
        name: 'cancel',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.3,
        position: [3936, 7424],
        onError: 'continueErrorOutput',
    })
    Cancel = {
        method: 'PATCH',
        url: "={{ $('data handler').item.json.api.url }}/appointments/{{ $('data handler').item.json.data.appointment.id }}/cancel",
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
                    responseFormat: 'file',
                },
            },
        },
    };

    @node({
        id: 'b4b1978e-ce42-47cd-9a4a-b36d9f113409',
        name: 'add to calendar',
        type: 'n8n-nodes-base.googleCalendar',
        version: 1.3,
        position: [4160, 6528],
        credentials: { googleCalendarOAuth2Api: { id: 'il5QImXhsEG3w3pY', name: 'calendar beautyflow' } },
        onError: 'continueErrorOutput',
    })
    AddToCalendar = {
        calendar: {
            __rl: true,
            value: 'beautyflow.api@gmail.com',
            mode: 'list',
            cachedResultName: 'beautyflow.api@gmail.com',
        },
        start: "={{ $('post').item.json.start_datetime }}",
        end: "={{ $('post').item.json.end_datetime }}",
        additionalFields: {
            attendees: ["={{ $('appointment context').item.json.professional.email }}"],
            description: `=Detalhes do Agendamento:

ID: {{ $('appointment context').item.json.id }}
Cliente: {{ $('appointment context').item.json.client.name }}
Serviço: {{ $('appointment context').item.json.service.name }}
Profissional: {{ $('appointment context').item.json.professional.name }}
Dia: {{ $('appointment context').item.json.date }} ({{ $('appointment context').item.json.weekday }})`,
            summary:
                "={{ $('appointment context').item.json.service.name }} - {{ $('appointment context').item.json.client.name }} (#{{ $('appointment context').item.json.id }})",
        },
    };

    @node({
        id: '4c563dc8-4f03-45b3-be2e-ea6f4b2e382e',
        webhookId: '7b0df6e3-ebf1-4bd3-97e4-80827c3e8791',
        name: 'confirmation email',
        type: 'n8n-nodes-base.gmail',
        version: 2.2,
        position: [4432, 6512],
        credentials: { gmailOAuth2: { id: 'KD9KohSq7p0CzQL0', name: 'gmail beautyflow' } },
        onError: 'continueErrorOutput',
    })
    ConfirmationEmail = {
        sendTo: "={{ $('appointment context').item.json.professional.email }}",
        subject:
            "=Novo Agendamento Confirmado - {{ $('appointment context').item.json.client.name }} - (#{{ $('appointment context').item.json.id }})",
        message: `=<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Novo agendamento confirmado</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f6f8; font-family:Arial, Helvetica, sans-serif; color:#1f2937;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f6f8; margin:0; padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:600px; max-width:600px; background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.08);">
          
          <tr>
            <td style="background-color:#111827; padding:24px 32px; text-align:center;">
              <h1 style="margin:0; font-size:22px; line-height:30px; color:#ffffff; font-weight:700;">
                Novo agendamento confirmado
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px 0; font-size:16px; line-height:24px;">
                Olá, <strong>{{ $('appointment context').item.json.professional.name }}</strong>.
              </p>

              <p style="margin:0 0 24px 0; font-size:16px; line-height:24px;">
                Informamos que um novo agendamento foi confirmado em sua agenda. Abaixo estão os detalhes:
              </p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse; margin-bottom:24px;">
                <tr>
                  <td style="padding:12px 0; border-bottom:1px solid #e5e7eb; font-size:15px; width:180px; color:#6b7280;">
                    Cliente
                  </td>
                  <td style="padding:12px 0; border-bottom:1px solid #e5e7eb; font-size:15px; font-weight:600;">
                    {{ $('appointment context').item.json.client.name }}
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0; border-bottom:1px solid #e5e7eb; font-size:15px; color:#6b7280;">
                    Serviço
                  </td>
                  <td style="padding:12px 0; border-bottom:1px solid #e5e7eb; font-size:15px; font-weight:600;">
                    {{ $('appointment context').item.json.service.name }}
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0; border-bottom:1px solid #e5e7eb; font-size:15px; color:#6b7280;">
                    Data
                  </td>
                  <td style="padding:12px 0; border-bottom:1px solid #e5e7eb; font-size:15px; font-weight:600;">
                    {{ $('appointment context').item.json.date }}
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0; border-bottom:1px solid #e5e7eb; font-size:15px; color:#6b7280;">
                    Horário
                  </td>
                  <td style="padding:12px 0; border-bottom:1px solid #e5e7eb; font-size:15px; font-weight:600;">
                    {{ $('appointment context').item.json.start_time }}
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0; border-bottom:1px solid #e5e7eb; font-size:15px; color:#6b7280;">
                    Duração
                  </td>
                  <td style="padding:12px 0; border-bottom:1px solid #e5e7eb; font-size:15px; font-weight:600;">
                    {{ $('appointment context').item.json.service.duration_minutes }} min
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0; font-size:15px; color:#6b7280;">
                    Unidade / Local
                  </td>
                  <td style="padding:12px 0; font-size:15px; font-weight:600;">
                    {{ $('appointment context').item.json.business.address }}
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 24px 0; font-size:15px; line-height:24px; color:#374151;">
                Caso necessário, revise sua agenda para se organizar com antecedência.
              </p>

              <p style="margin:0; font-size:15px; line-height:24px;">
                Atenciosamente,<br />
                <strong>{{ $('appointment context').item.json.business.bot_name }}</strong>, seu(sua) assistente de agendamento 😊!
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 32px; background-color:#f9fafb; border-top:1px solid #e5e7eb; text-align:center;">
              <p style="margin:0; font-size:12px; line-height:18px; color:#6b7280;">
                Este é um e-mail automático de confirmação de agendamento.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
        options: {
            appendAttribution: true,
            bccList: 'ultimateclash22@gmail.com',
        },
    };

    @node({
        id: 'ab656d6a-8dad-42e8-b6bc-53c9d431c5d8',
        name: 'post',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.3,
        position: [2272, 6288],
        onError: 'continueErrorOutput',
        retryOnFail: false,
    })
    Post = {
        method: 'POST',
        url: "={{ $('data handler').item.json.api.url }}/appointments/",
        sendHeaders: true,
        headerParameters: {
            parameters: [
                {
                    name: 'Authorization',
                    value: "={{ $('data handler').item.json.api.token }}",
                },
            ],
        },
        sendBody: true,
        bodyParameters: {
            parameters: [
                {
                    name: 'client_id',
                    value: "={{ $('data handler').item.json.client.id }}",
                },
                {
                    name: 'professional_id',
                    value: "={{ $('data handler').item.json.data.professional.id }}",
                },
                {
                    name: 'service_id',
                    value: "={{ $('data handler').item.json.data.service.id }}",
                },
                {
                    name: 'start_datetime',
                    value: "={{ $('data handler').item.json.data.appointment.start_datetime }}",
                },
            ],
        },
        options: {},
    };

    @node({
        id: '95865ddd-3846-4fbb-a969-5dc5a99003d8',
        name: 'patch',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.3,
        position: [2272, 6608],
        onError: 'continueErrorOutput',
        retryOnFail: false,
    })
    Patch = {
        method: 'PUT',
        url: "={{ $('data handler').first().json.api.url }}/appointments/{{ $('data handler').first().json.data.appointment.id }}",
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
        jsonBody: `={{ (() => {
  const data = $('data handler').first().json.data;
  const appointment = $('data handler').first().json.data.appointment;

  return Object.fromEntries(
    Object.entries({
      professional_id: data.professional_id,
      service_id: data.service_id,
      start_datetime: appointment.start_datetime,
    }).filter(([_, value]) => value !== undefined && value !== null)
  );
})() }}`,
        options: {},
    };

    @node({
        id: '6fd8d63b-750b-40dd-b8be-f6ab4ae47c7b',
        name: 'get event',
        type: 'n8n-nodes-base.googleCalendar',
        version: 1.3,
        position: [3952, 7008],
        credentials: { googleCalendarOAuth2Api: { id: 'il5QImXhsEG3w3pY', name: 'calendar beautyflow' } },
        onError: 'continueErrorOutput',
    })
    GetEvent = {
        operation: 'getAll',
        calendar: {
            __rl: true,
            value: 'beautyflow.api@gmail.com',
            mode: 'list',
            cachedResultName: 'beautyflow.api@gmail.com',
        },
        limit: 1,
        timeMin: '=',
        timeMax: '=',
        options: {
            query: "=Agendamento {{ $('appointment context').item.json.client.name }} {{ $('appointment context').item.json.id }} {{ $('appointment context').item.json.professional.name }}",
        },
    };

    @node({
        id: '75dfb011-5379-415a-8468-b95d0ceeeef6',
        name: 'update event',
        type: 'n8n-nodes-base.googleCalendar',
        version: 1.3,
        position: [4160, 6992],
        credentials: { googleCalendarOAuth2Api: { id: 'il5QImXhsEG3w3pY', name: 'calendar beautyflow' } },
        onError: 'continueErrorOutput',
    })
    UpdateEvent = {
        operation: 'update',
        calendar: {
            __rl: true,
            value: 'beautyflow.api@gmail.com',
            mode: 'list',
            cachedResultName: 'beautyflow.api@gmail.com',
        },
        eventId: "={{ $('get event').item.json.id }}",
        updateFields: {
            description: `=Detalhes do Agendamento:

ID: {{ $('appointment context').item.json.id }}
Cliente: {{ $('appointment context').item.json.client.name }}
Serviço: {{ $('appointment context').item.json.service.name }}
Profissional: {{ $('appointment context').item.json.professional.name }}
Dia: {{ $('appointment context').item.json.date }} ({{ $('appointment context').item.json.weekday }})`,
            end: "={{ $('appointment context').item.json.end_datetime }}",
            start: "={{ $('appointment context').item.json.start_datetime }}",
        },
    };

    @node({
        id: '7edbc6b1-828c-4969-b3fc-51c00aef1675',
        webhookId: '7b0df6e3-ebf1-4bd3-97e4-80827c3e8791',
        name: 'get email',
        type: 'n8n-nodes-base.gmail',
        version: 2.2,
        position: [4384, 6976],
        credentials: { gmailOAuth2: { id: 'KD9KohSq7p0CzQL0', name: 'gmail beautyflow' } },
        onError: 'continueErrorOutput',
    })
    GetEmail = {
        operation: 'getAll',
        limit: 1,
        filters: {
            q: "=Agendamento {{ $('appointment context').item.json.client.name }} {{ $('appointment context').item.json.id }} {{ $('appointment context').item.json.professional.name }}",
        },
    };

    @node({
        id: '426c5f0e-a728-4516-a39c-27af9cb76cc3',
        webhookId: '7b0df6e3-ebf1-4bd3-97e4-80827c3e8791',
        name: 'update email',
        type: 'n8n-nodes-base.gmail',
        version: 2.2,
        position: [4592, 6960],
        credentials: { gmailOAuth2: { id: 'KD9KohSq7p0CzQL0', name: 'gmail beautyflow' } },
        onError: 'continueErrorOutput',
    })
    UpdateEmail = {
        operation: 'reply',
        messageId: "={{ $('get email').item.json.id }}",
        message: `=<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Novo agendamento confirmado</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f6f8; font-family:Arial, Helvetica, sans-serif; color:#1f2937;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f6f8; margin:0; padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:600px; max-width:600px; background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.08);">
          
          <tr>
            <td style="background-color:#111827; padding:24px 32px; text-align:center;">
              <h1 style="margin:0; font-size:22px; line-height:30px; color:#ffffff; font-weight:700;">
                Agendamento atualizado
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px 0; font-size:16px; line-height:24px;">
                Olá, <strong>{{ $('appointment context').item.json.professional.name }}</strong>.
              </p>

              <p style="margin:0 0 24px 0; font-size:16px; line-height:24px;">
                Informamos que o agendamento abaixo foi atualizado em sua agenda. Abaixo estão os detalhes atualizados:
              </p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse; margin-bottom:24px;">
                <tr>
                  <td style="padding:12px 0; border-bottom:1px solid #e5e7eb; font-size:15px; width:180px; color:#6b7280;">
                    Cliente
                  </td>
                  <td style="padding:12px 0; border-bottom:1px solid #e5e7eb; font-size:15px; font-weight:600;">
                    {{ $('appointment context').item.json.client.name }}
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0; border-bottom:1px solid #e5e7eb; font-size:15px; color:#6b7280;">
                    Serviço
                  </td>
                  <td style="padding:12px 0; border-bottom:1px solid #e5e7eb; font-size:15px; font-weight:600;">
                    {{ $('appointment context').item.json.service.name }}
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0; border-bottom:1px solid #e5e7eb; font-size:15px; color:#6b7280;">
                    Data
                  </td>
                  <td style="padding:12px 0; border-bottom:1px solid #e5e7eb; font-size:15px; font-weight:600;">
                    {{ $('appointment context').item.json.date }}
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0; border-bottom:1px solid #e5e7eb; font-size:15px; color:#6b7280;">
                    Horário
                  </td>
                  <td style="padding:12px 0; border-bottom:1px solid #e5e7eb; font-size:15px; font-weight:600;">
                    {{ $('appointment context').item.json.start_time }}
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0; border-bottom:1px solid #e5e7eb; font-size:15px; color:#6b7280;">
                    Duração
                  </td>
                  <td style="padding:12px 0; border-bottom:1px solid #e5e7eb; font-size:15px; font-weight:600;">
                    {{ $('appointment context').item.json.service.duration_minutes }} min
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0; font-size:15px; color:#6b7280;">
                    Unidade / Local
                  </td>
                  <td style="padding:12px 0; font-size:15px; font-weight:600;">
                    {{ $('appointment context').item.json.business.address }}
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 24px 0; font-size:15px; line-height:24px; color:#374151;">
                Caso necessário, revise sua agenda para se organizar com antecedência.
              </p>

              <p style="margin:0; font-size:15px; line-height:24px;">
                Atenciosamente,<br />
                <strong>{{ $('appointment context').item.json.business.bot_name }}</strong>, seu(sua) assistente de agendamento 😊!
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 32px; background-color:#f9fafb; border-top:1px solid #e5e7eb; text-align:center;">
              <p style="margin:0; font-size:12px; line-height:18px; color:#6b7280;">
                Este é um e-mail automático de confirmação de agendamento.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
        options: {
            appendAttribution: true,
        },
    };

    @node({
        id: '3cd74882-bf37-49f0-81a9-632ce92453f7',
        name: 'delete event',
        type: 'n8n-nodes-base.googleCalendar',
        version: 1.3,
        position: [4368, 7392],
        credentials: { googleCalendarOAuth2Api: { id: 'il5QImXhsEG3w3pY', name: 'calendar beautyflow' } },
        onError: 'continueErrorOutput',
    })
    DeleteEvent = {
        operation: 'delete',
        calendar: {
            __rl: true,
            value: 'beautyflow.api@gmail.com',
            mode: 'list',
            cachedResultName: 'beautyflow.api@gmail.com',
        },
        eventId: "={{ $('get event 1').item.json.id }}",
        options: {},
    };

    @node({
        id: 'b8d4fb05-3f75-4221-bd54-95c1bad3b7b0',
        name: 'get event 1',
        type: 'n8n-nodes-base.googleCalendar',
        version: 1.3,
        position: [4160, 7408],
        credentials: { googleCalendarOAuth2Api: { id: 'il5QImXhsEG3w3pY', name: 'calendar beautyflow' } },
        onError: 'continueErrorOutput',
    })
    GetEvent1 = {
        operation: 'getAll',
        calendar: {
            __rl: true,
            value: 'beautyflow.api@gmail.com',
            mode: 'list',
            cachedResultName: 'beautyflow.api@gmail.com',
        },
        limit: 1,
        timeMin: '=',
        timeMax: '=',
        options: {
            query: "=Agendamento {{ $('appointment context').item.json.client.name }} {{ $('appointment context').item.json.id }} {{ $('appointment context').item.json.professional.name }}",
        },
    };

    @node({
        id: '1a36c0d4-7538-4aa0-b80f-e30f5a289f6f',
        webhookId: '7b0df6e3-ebf1-4bd3-97e4-80827c3e8791',
        name: 'delete email',
        type: 'n8n-nodes-base.gmail',
        version: 2.2,
        position: [4784, 7360],
        credentials: { gmailOAuth2: { id: 'KD9KohSq7p0CzQL0', name: 'gmail beautyflow' } },
        onError: 'continueErrorOutput',
    })
    DeleteEmail = {
        operation: 'reply',
        messageId: "={{ $('get email 1').item.json.id }}",
        message: `=<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Novo agendamento confirmado</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f6f8; font-family:Arial, Helvetica, sans-serif; color:#1f2937;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f6f8; margin:0; padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:600px; max-width:600px; background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.08);">
          
          <tr>
            <td style="background-color:#111827; padding:24px 32px; text-align:center;">
              <h1 style="margin:0; font-size:22px; line-height:30px; color:#ffffff; font-weight:700;">
                Agendamento atualizado
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px 0; font-size:16px; line-height:24px;">
                Olá, <strong>{{ $('appointment context').item.json.professional.name }}</strong>.
              </p>

              <p style="margin:0 0 24px 0; font-size:16px; line-height:24px;">
                Informamos que o agendamento abaixo foi atualizado em sua agenda. Abaixo estão os detalhes atualizados:
              </p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse; margin-bottom:24px;">
                <tr>
                  <td style="padding:12px 0; border-bottom:1px solid #e5e7eb; font-size:15px; width:180px; color:#6b7280;">
                    Cliente
                  </td>
                  <td style="padding:12px 0; border-bottom:1px solid #e5e7eb; font-size:15px; font-weight:600;">
                    {{ $('appointment context').item.json.client.name }}
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0; border-bottom:1px solid #e5e7eb; font-size:15px; color:#6b7280;">
                    Serviço
                  </td>
                  <td style="padding:12px 0; border-bottom:1px solid #e5e7eb; font-size:15px; font-weight:600;">
                    {{ $('appointment context').item.json.service.name }}
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0; border-bottom:1px solid #e5e7eb; font-size:15px; color:#6b7280;">
                    Data
                  </td>
                  <td style="padding:12px 0; border-bottom:1px solid #e5e7eb; font-size:15px; font-weight:600;">
                    {{ $('appointment context').item.json.date }}
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0; border-bottom:1px solid #e5e7eb; font-size:15px; color:#6b7280;">
                    Horário
                  </td>
                  <td style="padding:12px 0; border-bottom:1px solid #e5e7eb; font-size:15px; font-weight:600;">
                    {{ $('appointment context').item.json.start_time }}
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0; border-bottom:1px solid #e5e7eb; font-size:15px; color:#6b7280;">
                    Duração
                  </td>
                  <td style="padding:12px 0; border-bottom:1px solid #e5e7eb; font-size:15px; font-weight:600;">
                    {{ $('appointment context').item.json.service.duration_minutes }} min
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0; font-size:15px; color:#6b7280;">
                    Unidade / Local
                  </td>
                  <td style="padding:12px 0; font-size:15px; font-weight:600;">
                    {{ $('appointment context').item.json.business.address }}
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 24px 0; font-size:15px; line-height:24px; color:#374151;">
                Caso necessário, revise sua agenda para se organizar com antecedência.
              </p>

              <p style="margin:0; font-size:15px; line-height:24px;">
                Atenciosamente,<br />
                <strong>{{ $('appointment context').item.json.business.bot_name }}</strong>, seu(sua) assistente de agendamento 😊!
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 32px; background-color:#f9fafb; border-top:1px solid #e5e7eb; text-align:center;">
              <p style="margin:0; font-size:12px; line-height:18px; color:#6b7280;">
                Este é um e-mail automático de confirmação de agendamento.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
        options: {
            appendAttribution: true,
        },
    };

    @node({
        id: '2465dce8-3037-485c-ae5e-0522ae62f73f',
        webhookId: '7b0df6e3-ebf1-4bd3-97e4-80827c3e8791',
        name: 'get email 1',
        type: 'n8n-nodes-base.gmail',
        version: 2.2,
        position: [4576, 7376],
        credentials: { gmailOAuth2: { id: 'KD9KohSq7p0CzQL0', name: 'gmail beautyflow' } },
        onError: 'continueErrorOutput',
    })
    GetEmail1 = {
        operation: 'getAll',
        limit: 1,
        filters: {
            q: "=Agendamento {{ $('appointment context').item.json.client.name }} {{ $('appointment context').item.json.id }} {{ $('appointment context').item.json.professional.name }}",
        },
    };

    @node({
        id: '0e07e16a-be86-4073-901e-e5a51aed68fe',
        name: 'action 1',
        type: 'n8n-nodes-base.switch',
        version: 3.4,
        position: [3584, 6864],
    })
    Action1 = {
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
                                id: 'edb3e1d9-c030-457e-8736-852be0e6c9e3',
                                leftValue: "={{ $('data handler').first().json.data.action }}",
                                rightValue: 'post',
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
                    outputKey: 'POST',
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
                                id: '34d3012c-febb-49f1-afad-08861bdcbb7d',
                                leftValue: "={{ $('data handler').first().json.data.action }}",
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
                                leftValue: "={{ $('data handler').first().json.data.action }}",
                                rightValue: 'update',
                                operator: {
                                    type: 'string',
                                    operation: 'equals',
                                },
                                id: 'd5c0a724-d78c-4ebf-b61d-8a647698c685',
                            },
                        ],
                        combinator: 'and',
                    },
                    renameOutput: true,
                    outputKey: 'PATCH',
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
                                id: 'afc83179-c5f5-4b32-8b2b-ac4541eaf40c',
                                leftValue: "={{ $('data handler').first().json.data.action }}",
                                rightValue: 'cancel',
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
                    outputKey: 'CANCEL',
                },
            ],
        },
        looseTypeValidation: true,
        options: {
            allMatchingOutputs: false,
        },
    };

    @node({
        id: '03f8d730-8851-46b7-8ded-607600066810',
        name: 'final return',
        type: 'n8n-nodes-base.set',
        version: 3.4,
        position: [5552, 6880],
    })
    FinalReturn = {
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
                    name: 'appointments',
                    value: '={{ $json.appointments }}',
                    type: 'array',
                },
            ],
        },
        options: {},
    };

    @node({
        id: '8b029c61-154d-4ef7-a608-daf6b0f5d864',
        name: 'aggregate',
        type: 'n8n-nodes-base.aggregate',
        version: 1,
        position: [5344, 6880],
    })
    Aggregate = {
        aggregate: 'aggregateAllItemData',
        destinationFieldName: 'appointments',
        options: {},
    };

    @node({
        id: 'fb07b3e1-cb64-4665-850a-1438d4dac072',
        name: 'get by client',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.3,
        position: [2272, 7248],
        onError: 'continueErrorOutput',
    })
    GetByClient = {
        url: "={{ $('data handler').first().json.api.url }}/appointments/",
        sendQuery: true,
        queryParameters: {
            parameters: [
                {
                    name: 'client_id',
                    value: "={{ $('data handler').first().json.client.id }}",
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
        id: 'fc56f51e-2173-463f-9156-f11668b18933',
        name: 'get by id',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.3,
        position: [2272, 6912],
        onError: 'continueErrorOutput',
    })
    GetById = {
        url: "={{ $('data handler').first().json.api.url }}/appointments/{{ $('data handler').first().json.data.appointment.id }}",
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
        id: 'ceafee95-b30f-40e0-891d-985a84ebded5',
        name: 'id?',
        type: 'n8n-nodes-base.if',
        version: 2.3,
        position: [1872, 7088],
    })
    Id = {
        conditions: {
            options: {
                caseSensitive: true,
                leftValue: '',
                typeValidation: 'loose',
                version: 3,
            },
            conditions: [
                {
                    id: 'a7b05632-1078-42fa-ae6f-de3be1db8cde',
                    leftValue: "={{ $('data handler').item.json.data.appointment.id }}",
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
        id: '539cc1b3-f533-4e04-8a56-288be7831966',
        name: 'pre-context',
        type: 'n8n-nodes-base.set',
        version: 3.4,
        position: [2688, 6896],
    })
    PreContext = {
        assignments: {
            assignments: [
                {
                    id: '79b424a3-a6ce-45db-88aa-b5968a02e34a',
                    name: 'appointment',
                    value: '={{ $json }}',
                    type: 'object',
                },
            ],
        },
        options: {},
    };

    @node({
        id: '957f3db0-9084-42c4-bf2b-b94df4536d8c',
        name: 'appointment context',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [3376, 6896],
    })
    AppointmentContext = {
        mode: 'runOnceForEachItem',
        jsCode: `// 🔹 Fonte principal
const source = $('pre-context').item.json.appointment;

// 🔹 Flatten do campo ""
const base = source[""] ? source[""] : {};
const result = { ...base };

for (const key in source) {
  if (key !== "") {
    result[key] = source[key];
  }
}

// 🔹 Buscar dados externos (com fallback)
let professional = {};
let service = {};
let client = {};
let business = {};

try {
  const raw = $('professional context').item.json.professionals[0];
  professional = { ...raw };
  delete professional.business_id;
  delete professional.is_active;
} catch (e) {}

try {
  const raw = $('service context').item.json.services[0];
  service = { ...raw };
  delete service.business_id;
  delete service.is_active;
} catch (e) {}

try {
  const raw = $('data handler').item.json.client;
  client = { ...raw };
  delete client.business_id;
} catch (e) {}

try {
  business = $('data handler').item.json.business;
} catch (e) {}

const timezone = business?.timezone || 'America/Sao_Paulo';

// 🔹 Remove campos do appointment
delete result.business_id;
delete result.client_id;
delete result.professional_id;
delete result.service_id;
delete result.created_at;

// 🔹 Helpers seguros (anti erro de data)
const safeDate = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d) ? null : d;
};

const formatDate = (date) =>
  date
    ? new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: timezone,
      }).format(date)
    : null;

const formatTime = (date) =>
  date
    ? new Intl.DateTimeFormat('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: timezone,
      }).format(date)
    : null;

const formatWeekday = (date) => {
  if (!date) return null;

  const weekday = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    timeZone: timezone,
  }).format(date);

  return weekday.charAt(0).toUpperCase() + weekday.slice(1);
};

// 🔹 Datas seguras
const startDate = safeDate(result.start_datetime);
const endDate = safeDate(result.end_datetime);

// 🔹 RETORNO (⚠️ objeto, não array)
return {
  json: {
    ...result,

    date: formatDate(startDate),
    weekday: formatWeekday(startDate),
    start_time: formatTime(startDate),
    end_time: formatTime(endDate),

    professional,
    service,
    client,
    business,
  }
};`,
    };

    @node({
        id: 'c86e12e7-6238-4319-84dd-06bc1eb5e6c6',
        name: 'return context',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [5136, 6880],
    })
    ReturnContext = {
        mode: 'runOnceForEachItem',
        jsCode: `const source = $('appointment context').item.json;

const result = source[""] ? source[""] : source;

const action = $('data handler').item.json.data?.action;

if (action === 'cancel') {
  result.status = 'canceled';
}

return {
  json: result
};`,
    };

    @node({
        id: '6324968b-1694-4be2-a839-7ee4bba46a42',
        name: 'get all',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.3,
        position: [1232, 6384],
        onError: 'continueErrorOutput',
    })
    GetAll = {
        url: "={{ $('data handler').first().json.api.url }}/appointments/",
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
        id: '9cbc7da1-f701-4067-b31d-ddb570984714',
        name: 'filter',
        type: 'n8n-nodes-base.filter',
        version: 2.3,
        position: [1440, 6256],
    })
    Filter = {
        conditions: {
            options: {
                caseSensitive: true,
                leftValue: '',
                typeValidation: 'loose',
                version: 3,
            },
            conditions: [
                {
                    id: '46690414-6418-49e2-9886-6de3231be1cb',
                    leftValue: '={{ $json.status }}',
                    rightValue: 'scheduled',
                    operator: {
                        type: 'string',
                        operation: 'equals',
                    },
                },
                {
                    id: 'e2a24989-8752-4da7-b2cd-e59921eaf555',
                    leftValue: '={{ $json.start_datetime }}',
                    rightValue: '={{ $now }}',
                    operator: {
                        type: 'dateTime',
                        operation: 'before',
                    },
                },
            ],
            combinator: 'and',
        },
        looseTypeValidation: true,
        options: {},
    };

    @node({
        id: '5b60f9d6-53d6-458e-a3d5-f91d087e9a63',
        name: 'complete',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.3,
        position: [1648, 6384],
        onError: 'continueErrorOutput',
        retryOnFail: false,
    })
    Complete = {
        method: 'PATCH',
        url: "={{ $('data handler').first().json.api.url }}/appointments/{{ $json.id }}/complete",
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
                    name: 'client_id',
                    value: "={{ $('data handler').first().json.client.id }}",
                },
                {
                    name: 'professional_id',
                    value: "={{ $('data handler').item.json.data.professional.id }}",
                },
                {
                    name: 'service_id',
                    value: "={{ $('data handler').first().json.data.service.id }}",
                },
                {
                    name: 'start_datetime',
                    value: "={{ $('data handler').first().json.data.appointment.start_datetime }}",
                },
            ],
        },
        options: {
            response: {
                response: {
                    fullResponse: true,
                    responseFormat: 'text',
                },
            },
        },
    };

    @node({
        id: 'aeb4fe61-b2ee-4a8a-acbc-296e52b56865',
        name: 'error report 15',
        type: 'n8n-nodes-base.stopAndError',
        version: 1,
        position: [1648, 6528],
    })
    ErrorReport15 = {
        errorType: 'errorObject',
        errorObject: `={
  "error": {
    "id": "{{ $execution.id }}",
    "type": "internal.api.complete_appointments",
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
        id: '12a24dcb-e17d-4aeb-a4bc-bab5f2acd18f',
        name: 'error report 16',
        type: 'n8n-nodes-base.stopAndError',
        version: 1,
        position: [2272, 7392],
    })
    ErrorReport16 = {
        errorType: 'errorObject',
        errorObject: `={
  "error": {
    "id": "{{ $execution.id }}",
    "type": "internal.api.get_appointment",
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
        id: '74a58b20-b4fd-4b8b-9754-11a663f3cf30',
        name: 'error report 18',
        type: 'n8n-nodes-base.stopAndError',
        version: 1,
        position: [2272, 7056],
    })
    ErrorReport18 = {
        errorType: 'errorObject',
        errorObject: `={
  "error": {
    "id": "{{ $execution.id }}",
    "type": "business.appointment_cancel",
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
        id: '8429f8c7-88dd-4143-93a3-fd91310138dc',
        name: 'error report 19',
        type: 'n8n-nodes-base.stopAndError',
        version: 1,
        position: [2272, 6752],
    })
    ErrorReport19 = {
        errorType: 'errorObject',
        errorObject: `={
  "error": {
    "id": "{{ $execution.id }}",
    "type": "business.appointment_update",
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
        id: '01715f04-199b-4dff-b57c-6b8aaaa8c39a',
        name: 'error report 20',
        type: 'n8n-nodes-base.stopAndError',
        version: 1,
        position: [2272, 6432],
    })
    ErrorReport20 = {
        errorType: 'errorObject',
        errorObject: `={
  "error": {
    "id": "{{ $execution.id }}",
    "type": "business.appointment_create",
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
        id: '51d14e68-13c5-4cfb-969d-dca4952a0988',
        name: 'error report 23',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [4160, 6672],
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
  type: "external.calendar",
  node: appointment_context,
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
        id: '0bdcfaa7-28a1-4667-ae28-6400eaec7f3a',
        name: 'error report 24',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [4432, 6656],
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
  type: "external.gmail",
  node: appointment_context,
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
        id: 'e39925a0-5f17-4e48-80f3-60789afb5a88',
        name: 'error report 25',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [4160, 7136],
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
  type: "external.calendar",
  node: appointment_context,
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
        id: '85011672-cd04-4a0e-bd14-7801132dd637',
        name: 'error report 26',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [4592, 7104],
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
  type: "external.gmail",
  node: appointment_context,
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
        id: 'f6d08acd-2143-4fcd-ba80-79334d691761',
        name: 'error report 27',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [4368, 7536],
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
  type: "external.calendar",
  node: appointment_context,
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
        id: '6f8ea78e-7832-404e-b644-9824d36c7393',
        name: 'error report ',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [4784, 7504],
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
  type: "external.gmail",
  node: appointment_context,
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
        id: 'd2b531b6-e369-4637-ba80-2e0676027628',
        name: 'error report 21',
        type: 'n8n-nodes-base.stopAndError',
        version: 1,
        position: [3936, 7568],
    })
    ErrorReport21 = {
        errorType: 'errorObject',
        errorObject: `={
  "error": {
    "id": "{{ $execution.id }}",
    "type": "business.appointment_cancel",
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
        id: '4c684518-36f7-4c5e-9186-4c528353d1f1',
        name: 'service context',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [3152, 6896],
    })
    ServiceContext = {
        workflowId: {
            __rl: true,
            value: 'JUmgL8OgChZeJAWe',
            mode: 'list',
            cachedResultUrl: '/workflow/JUmgL8OgChZeJAWe',
            cachedResultName: 'services',
        },
        workflowInputs: {
            mappingMode: 'defineBelow',
            value: {
                action: 'get',
                service_id: "={{ $('pre-context').first().json.appointment.service_id }}",
                client: "={{ $('data handler').first().json.client }}",
                business: "={{ $('data handler').first().json.business }}",
                api: "={{ $('data handler').first().json.api }}",
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
                    id: 'service_id',
                    displayName: 'service_id',
                    required: false,
                    defaultMatch: false,
                    display: true,
                    canBeUsedToMatch: true,
                    type: 'string',
                    removed: false,
                },
                {
                    id: 'service_name',
                    displayName: 'service_name',
                    required: false,
                    defaultMatch: false,
                    display: true,
                    canBeUsedToMatch: true,
                    type: 'string',
                    removed: true,
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
        id: '5bebdcd1-8fc7-4c9a-8aa5-85fff1d077b7',
        name: 'professional context',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [2928, 6896],
    })
    ProfessionalContext = {
        workflowId: {
            __rl: true,
            value: 'bFSJIIiJrsHfBGcU',
            mode: 'list',
            cachedResultUrl: '/workflow/bFSJIIiJrsHfBGcU',
            cachedResultName: 'professionals',
        },
        workflowInputs: {
            mappingMode: 'defineBelow',
            value: {
                action: 'get',
                professional_id: "={{ $('pre-context').first().json.appointment.professional_id }}",
                client: "={{ $('data handler').first().json.client }}",
                business: "={{ $('data handler').first().json.business }}",
                api: "={{ $('data handler').first().json.api }}",
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
                    id: 'professional_id',
                    displayName: 'professional_id',
                    required: false,
                    defaultMatch: false,
                    display: true,
                    canBeUsedToMatch: true,
                    type: 'string',
                    removed: false,
                },
                {
                    id: 'professional_name',
                    displayName: 'professional_name',
                    required: false,
                    defaultMatch: false,
                    display: true,
                    canBeUsedToMatch: true,
                    type: 'string',
                    removed: true,
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

    // =====================================================================
    // ROUTAGE ET CONNEXIONS
    // =====================================================================

    @links()
    defineRouting() {
        this.Webhook.out(0).to(this.DataHandler.in(0));
        this.DataHandler.out(0).to(this.Action.in(0));
        this.Action.out(0).to(this.Post.in(0));
        this.Action.out(1).to(this.Patch.in(0));
        this.Action.out(2).to(this.GetById.in(0));
        this.Action.out(3).to(this.Id.in(0));
        this.AddToCalendar.out(0).to(this.ConfirmationEmail.in(0));
        this.AddToCalendar.out(1).to(this.ErrorReport23.in(0));
        this.Post.out(0).to(this.PreContext.in(0));
        this.Post.out(1).to(this.ErrorReport20.in(0));
        this.Patch.out(0).to(this.PreContext.in(0));
        this.Patch.out(1).to(this.ErrorReport19.in(0));
        this.GetEvent.out(0).to(this.UpdateEvent.in(0));
        this.GetEvent.out(1).to(this.ErrorReport25.in(0));
        this.UpdateEvent.out(0).to(this.GetEmail.in(0));
        this.UpdateEvent.out(1).to(this.ErrorReport25.in(0));
        this.GetEmail.out(0).to(this.UpdateEmail.in(0));
        this.GetEmail.out(1).to(this.ErrorReport26.in(0));
        this.Cancel.out(0).to(this.GetEvent1.in(0));
        this.Cancel.out(1).to(this.ErrorReport21.in(0));
        this.DeleteEvent.out(0).to(this.GetEmail1.in(0));
        this.DeleteEvent.out(1).to(this.ErrorReport27.in(0));
        this.GetEvent1.out(0).to(this.DeleteEvent.in(0));
        this.GetEvent1.out(1).to(this.ErrorReport27.in(0));
        this.GetEmail1.out(0).to(this.DeleteEmail.in(0));
        this.GetEmail1.out(1).to(this.ErrorReport.in(0));
        this.Action1.out(0).to(this.AddToCalendar.in(0));
        this.Action1.out(1).to(this.ReturnContext.in(0));
        this.Action1.out(2).to(this.GetEvent.in(0));
        this.Action1.out(3).to(this.Cancel.in(0));
        this.DeleteEmail.out(0).to(this.ReturnContext.in(0));
        this.DeleteEmail.out(1).to(this.ErrorReport.in(0));
        this.ConfirmationEmail.out(0).to(this.ReturnContext.in(0));
        this.ConfirmationEmail.out(1).to(this.ErrorReport24.in(0));
        this.UpdateEmail.out(0).to(this.ReturnContext.in(0));
        this.UpdateEmail.out(1).to(this.ErrorReport26.in(0));
        this.Aggregate.out(0).to(this.FinalReturn.in(0));
        this.GetByClient.out(0).to(this.PreContext.in(0));
        this.GetByClient.out(1).to(this.ErrorReport16.in(0));
        this.GetById.out(0).to(this.PreContext.in(0));
        this.GetById.out(1).to(this.ErrorReport18.in(0));
        this.Id.out(0).to(this.GetById.in(0));
        this.Id.out(1).to(this.GetByClient.in(0));
        this.PreContext.out(0).to(this.ProfessionalContext.in(0));
        this.AppointmentContext.out(0).to(this.Action1.in(0));
        this.ReturnContext.out(0).to(this.Aggregate.in(0));
        this.GetAll.out(0).to(this.Filter.in(0));
        this.GetAll.out(1).to(this.ErrorReport15.in(0));
        this.Filter.out(0).to(this.Complete.in(0));
        this.Complete.out(1).to(this.ErrorReport15.in(0));
        this.ErrorReport23.out(0).to(this.ConfirmationEmail.in(0));
        this.ErrorReport24.out(0).to(this.ReturnContext.in(0));
        this.ErrorReport25.out(0).to(this.GetEmail.in(0));
        this.ErrorReport26.out(0).to(this.ReturnContext.in(0));
        this.ErrorReport27.out(0).to(this.GetEmail1.in(0));
        this.ErrorReport.out(0).to(this.ReturnContext.in(0));
        this.ServiceContext.out(0).to(this.AppointmentContext.in(0));
        this.ProfessionalContext.out(0).to(this.ServiceContext.in(0));
    }
}
