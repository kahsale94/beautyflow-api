import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : test-staging
// Nodes   : 23  |  Connections: 29
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// MenuDeTestesStaging                formTrigger
// PrepareTestCase                    code
// GetIntegrationToken                httpRequest                [onError→regular] [creds] [retry]
// RouteByWorkflow                    switch
// ClearMainStagingChatBuffer         redis                      [onError→regular] [creds]
// ClearMainStagingChatMemory         redis                      [onError→regular] [creds]
// ClearMainStagingState              redis                      [onError→regular] [creds]
// ClearMainStagingOutsideHoursContext redis                      [onError→regular] [creds]
// ClearMainStagingPersonalBlock      redis                      [onError→regular] [creds]
// CallMainStagingWebhook             httpRequest                [onError→regular] [creds]
// ExecuteBusinessesStaging           executeWorkflow            [onError→regular]
// ExecuteClientsStaging              executeWorkflow            [onError→regular]
// ExecuteServicesStaging             executeWorkflow            [onError→regular]
// ExecuteProfessionalsStaging        executeWorkflow            [onError→regular]
// ExecuteAvailabilitiesStaging       executeWorkflow            [onError→regular]
// ExecuteAppointmentsStaging         executeWorkflow            [onError→regular]
// ExecutePendingStateStaging         executeWorkflow            [onError→regular]
// ExecuteErrorStaging                executeWorkflow            [onError→regular]
// CheckBackendStagingHealth          httpRequest                [onError→regular]
// BuildSummaryAndMiniReport          code
// DocsVisaoGeral                     stickyNote
// DocsGruposDeTeste                  stickyNote
// DocsBackendTests                   stickyNote
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// MenuDeTestesStaging
//    → PrepareTestCase
//      → GetIntegrationToken
//        → RouteByWorkflow
//          → ClearMainStagingChatBuffer
//            → ClearMainStagingChatMemory
//              → ClearMainStagingState
//                → ClearMainStagingOutsideHoursContext
//                  → ClearMainStagingPersonalBlock
//                    → CallMainStagingWebhook
//                      → BuildSummaryAndMiniReport
//         .out(1) → ExecuteBusinessesStaging
//            → BuildSummaryAndMiniReport (↩ loop)
//         .out(2) → ExecuteClientsStaging
//            → BuildSummaryAndMiniReport (↩ loop)
//         .out(3) → ExecuteServicesStaging
//            → BuildSummaryAndMiniReport (↩ loop)
//         .out(4) → ExecuteProfessionalsStaging
//            → BuildSummaryAndMiniReport (↩ loop)
//         .out(5) → ExecuteAvailabilitiesStaging
//            → BuildSummaryAndMiniReport (↩ loop)
//         .out(6) → ExecuteAppointmentsStaging
//            → BuildSummaryAndMiniReport (↩ loop)
//         .out(7) → ExecutePendingStateStaging
//            → BuildSummaryAndMiniReport (↩ loop)
//         .out(8) → ExecuteErrorStaging
//            → BuildSummaryAndMiniReport (↩ loop)
//         .out(9) → CheckBackendStagingHealth
//            → BuildSummaryAndMiniReport (↩ loop)
//         .out(10) → BuildSummaryAndMiniReport (↩ loop)
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: 'P8X2SfwMgUmKvh1v',
    name: 'test-staging',
    active: true,
    isArchived: false,
    projectId: 'UVYVLJNFC5m6HlJG',
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
export class TestStagingWorkflow {
    // =====================================================================
    // CONFIGURATION DES NOEUDS
    // =====================================================================

    @node({
        id: '95d03f8d-9fcb-45fd-825a-43d02003aff1',
        webhookId: '106a52b9-31a2-4fc3-aa2e-20b1a76d014d',
        name: 'menu de testes staging',
        type: 'n8n-nodes-base.formTrigger',
        version: 2,
        position: [-1648, 208],
    })
    MenuDeTestesStaging = {
        path: 'test-staging',
        formTitle: 'Central de testes - staging',
        formDescription:
            'Escolha um workflow e um cenario. O cenario selecionado e executado sozinho e o ultimo node retorna summary, mini_report e evidencias redigidas.',
        formFields: {
            values: [
                {
                    fieldType: 'html',
                    html: '<p><b>Como usar:</b> selecione o grupo em Workflow e um cenario com o mesmo prefixo. Se houver divergencia, o cenario vence e o relatorio avisa.</p>',
                },
                {
                    fieldLabel: 'Workflow',
                    fieldType: 'dropdown',
                    fieldOptions: {
                        values: [
                            {
                                option: 'main-staging',
                            },
                            {
                                option: 'appointments-staging',
                            },
                            {
                                option: 'availabilities-staging',
                            },
                            {
                                option: 'businesses-staging',
                            },
                            {
                                option: 'clients-staging',
                            },
                            {
                                option: 'services-staging',
                            },
                            {
                                option: 'professionals-staging',
                            },
                            {
                                option: 'pending state-staging',
                            },
                            {
                                option: 'error-staging',
                            },
                            {
                                option: 'backend-staging',
                            },
                        ],
                    },
                    requiredField: true,
                },
                {
                    fieldLabel: 'Cenario',
                    fieldType: 'dropdown',
                    fieldOptions: {
                        values: [
                            {
                                option: 'main-staging | disponibilidade',
                            },
                            {
                                option: 'main-staging | confirmar agendamento',
                            },
                            {
                                option: 'main-staging | erro video privado',
                            },
                            {
                                option: 'businesses-staging | contexto por telefone',
                            },
                            {
                                option: 'clients-staging | buscar cliente existente',
                            },
                            {
                                option: 'clients-staging | coletar nome pendente',
                            },
                            {
                                option: 'services-staging | listar servicos',
                            },
                            {
                                option: 'services-staging | buscar servico por id',
                            },
                            {
                                option: 'services-staging | buscar servico por nome',
                            },
                            {
                                option: 'professionals-staging | listar profissionais',
                            },
                            {
                                option: 'professionals-staging | buscar profissional por id',
                            },
                            {
                                option: 'professionals-staging | buscar profissional por nome',
                            },
                            {
                                option: 'availabilities-staging | listar slots',
                            },
                            {
                                option: 'availabilities-staging | checar horario solicitado',
                            },
                            {
                                option: 'appointments-staging | agendar',
                            },
                            {
                                option: 'appointments-staging | remarcar por id',
                            },
                            {
                                option: 'appointments-staging | cancelar por id',
                            },
                            {
                                option: 'appointments-staging | buscar por id',
                            },
                            {
                                option: 'appointments-staging | erro servico invalido',
                            },
                            {
                                option: 'pending state-staging | voltar para coleta de nome',
                            },
                            {
                                option: 'error-staging | reportar erro interno',
                            },
                            {
                                option: 'backend-staging | health ready',
                            },
                        ],
                    },
                    requiredField: true,
                },
                {
                    fieldLabel: 'Appointment ID override',
                    placeholder: 'Opcional. Use em remarcar/cancelar/buscar por id.',
                },
                {
                    fieldLabel: 'Data/hora override',
                    placeholder: 'Opcional. Ex: 2026-06-24T10:00:00-03:00',
                },
                {
                    fieldLabel: 'Remote JID override',
                    placeholder: 'Opcional. Ex: 120363410124491446@g.us',
                },
                {
                    fieldLabel: 'Mensagem override',
                    fieldType: 'textarea',
                    placeholder: 'Opcional. Substitui a mensagem do cliente no cenario selecionado.',
                },
                {
                    fieldLabel: 'Notas da execucao',
                    fieldType: 'textarea',
                    placeholder: 'Opcional. Vai para o mini relatorio.',
                },
            ],
        },
        responseMode: 'lastNode',
        options: {},
    };

    @node({
        id: '8e29f24c-e892-4f8a-b98b-cdf2347d12f8',
        name: 'prepare test case',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [-1376, 208],
    })
    PrepareTestCase = {
        jsCode: `const form = $input.first().json || {};

const clean = (value) => {
  if (value === undefined || value === null) return '';
  const text = String(value).trim();
  return ['undefined', 'null', 'nan'].includes(text.toLowerCase()) ? '' : text;
};

const field = (...names) => {
  for (const name of names) {
    const value = clean(form[name]);
    if (value) return value;
  }
  return '';
};

const workflow = field('workflow', 'Workflow');
const scenario = field('scenario', 'Cenario');
const notes = field('notes', 'Notas da execucao');

const pad = (value) => String(value).padStart(2, '0');

function nextBusinessSlot(offsetDays = 2, slotOffset = 0) {
  const date = new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000);
  while ([0, 6].includes(date.getDay())) {
    date.setDate(date.getDate() + 1);
  }
  const hour = 10 + Math.floor(slotOffset / 2);
  const minute = slotOffset % 2 === 0 ? 0 : 30;
  const day = date.toISOString().slice(0, 10);
  return {
    date: day,
    start: day + 'T' + pad(hour) + ':' + pad(minute) + ':00-03:00',
  };
}

const slot = nextBusinessSlot(2, Math.floor(Date.now() / 60000) % 4);
const rescheduleSlot = nextBusinessSlot(3, (Math.floor(Date.now() / 60000) + 1) % 4);

const businessPhone = '5511991549118';
const businessSenderJid = businessPhone + '@s.whatsapp.net';
const defaultGroupJid = '120363410124491446@g.us';
const defaultPrivateJid = businessPhone + '@s.whatsapp.net';
const defaultGroupParticipant = '197289373085900@lid';
const defaultGroupParticipantAlt = '5511974402483@s.whatsapp.net';
const appointmentIdOverride = field('appointment_id_override', 'Appointment ID override');
const startDatetimeOverride = field('start_datetime_override', 'Data/hora override');
const remoteJidOverride = field('remote_jid_override', 'Remote JID override');
const messageTextOverride = field('message_text_override', 'Mensagem override');

const remoteJid = remoteJidOverride || defaultGroupJid;
const appointmentId = appointmentIdOverride || '8';
const startDatetime = startDatetimeOverride || slot.start;
const messageOverride = messageTextOverride;

const baseApi = {
  url: 'http://backend-staging:8000/v1',
  evo_instance: 'sale_instance',
};

const baseBusiness = {
  id: 1,
  name: 'Barbearia Modelo',
  phone: businessPhone,
};

function client(messageText = 'sim') {
  return {
    id: 11,
    name: 'Jaco',
    remote_jid: remoteJid,
    phone: businessPhone,
    message_id: 'TEST-STAGING-' + Date.now(),
    message_text: messageOverride || messageText,
    message: messageOverride || messageText,
  };
}

function evolutionBody(messageText, options = {}) {
  const type = options.messageType || 'conversation';
  const jid = options.remoteJid || remoteJid;
  const key = {
    remoteJid: jid,
    fromMe: options.fromMe ?? false,
    id: 'TEST-STAGING-' + Date.now(),
  };

  if (jid.endsWith('@g.us')) {
    key.participant = options.participant || defaultGroupParticipant;
    key.participantAlt = options.participantAlt || defaultGroupParticipantAlt;
    key.addressingMode = 'lid';
  }

  const body = {
    event: 'messages.upsert',
    instance: 'sale_instance',
    destination: businessSenderJid,
    date_time: new Date().toISOString(),
    sender: businessSenderJid,
    server_url: 'https://evolution.techlegacy.com.br',
    data: {
      key,
      pushName: 'Teste Staging',
      status: 'DELIVERY_ACK',
      messageType: type,
      messageTimestamp: Math.floor(Date.now() / 1000),
      instanceId: 'test-staging',
      source: 'web',
      message: {},
    },
  };

  if (type === 'conversation') {
    body.data.message.conversation = messageOverride || messageText;
  } else if (type === 'audioMessage') {
    body.data.message.audioMessage = {
      mimetype: 'audio/ogg; codecs=opus',
      seconds: 1,
    };
  } else if (type === 'videoMessage') {
    body.data.message.videoMessage = {
      mimetype: 'video/mp4',
      seconds: 1,
    };
  }

  return body;
}

const common = {
  business: baseBusiness,
  client: client(),
  api: baseApi,
};

function baseCase(config) {
  const remoteJidForCleanup = config.mainWebhook?.body?.data?.key?.remoteJid;
  const cleanupKeys = config.cleanupKeys || (remoteJidForCleanup ? [
    'beautyflow_bot.' + remoteJidForCleanup + '.chat_buffer',
    'beautyflow_bot.' + remoteJidForCleanup + '.chat_memory',
    'beautyflow_bot.' + remoteJidForCleanup + '.state',
    'beautyflow_bot.' + remoteJidForCleanup + '.outside_hours_context',
    'beautyflow_bot.' + remoteJidForCleanup + '.personal_block',
  ] : []);

  return {
    selectedWorkflow: workflow,
    scenario,
    scenarioLabel: config.scenarioLabel,
    workflowName: config.workflowName,
    target: config.target,
    routeIndex: config.routeIndex,
    expectedFailure: Boolean(config.expectedFailure),
    expectedResult: config.expectedResult,
    path: config.path,
    dataImpact: config.dataImpact,
    evidenceHint: config.evidenceHint,
    probableCauseHint: config.probableCauseHint || '',
    mitigationHint: config.mitigationHint || '',
    notes,
    formOverrides: {
      appointment_id_override: appointmentIdOverride,
      start_datetime_override: startDatetimeOverride,
      remote_jid_override: remoteJidOverride,
      message_text_override: messageTextOverride,
    },
    workflowInputs: config.workflowInputs || {},
    mainWebhook: config.mainWebhook || null,
    backendHealth: config.backendHealth || null,
    cleanupKeys,
    warnings: [],
  };
}

const cases = {
  'main-staging | disponibilidade': baseCase({
    target: 'main',
    routeIndex: 0,
    workflowName: 'main-staging',
    scenarioLabel: 'Fluxo completo de consulta/confirmacao de disponibilidade',
    path: 'Webhook Evolution -> business/client context -> classifier -> availabilities tool -> resposta',
    expectedResult: 'Retornar mensagem de confirmacao de horario, sem criar agendamento ainda.',
    dataImpact: 'Pode atualizar buffers e memoria Redis do atendimento de staging e enviar mensagem pela Evolution.',
    evidenceHint: 'Resposta final do main-staging e chamada ao workflow availabilities-staging.',
    mainWebhook: {
      body: evolutionBody('quero agendar barba amanha as 10 com Bruno'),
    },
  }),

  'main-staging | confirmar agendamento': baseCase({
    target: 'main',
    routeIndex: 0,
    workflowName: 'main-staging',
    scenarioLabel: 'Fluxo completo de confirmacao de agendamento',
    path: 'Webhook Evolution -> pending/context -> agent -> appointments tool -> resposta',
    expectedResult: 'Criar/confirmar um agendamento em staging e enviar resposta de confirmacao.',
    dataImpact: 'Pode criar appointment, evento de calendario, email de confirmacao, memoria Redis e mensagem Evolution.',
    evidenceHint: 'Resposta final mencionando agendamento confirmado.',
    mainWebhook: {
      body: evolutionBody('sim'),
    },
  }),

  'main-staging | erro video privado': baseCase({
    target: 'main',
    routeIndex: 0,
    workflowName: 'main-staging',
    scenarioLabel: 'Fluxo de erro por video privado sem groupJid',
    path: 'Webhook Evolution -> data handler -> get group participants -> erro esperado',
    expectedFailure: true,
    expectedResult: 'Gerar erro controlado ao tentar buscar participantes com remoteJid privado.',
    dataImpact: 'Nao deve criar dados de negocio; pode acionar error-staging.',
    evidenceHint: 'Erro 400 groupJid does not match pattern.',
    probableCauseHint: 'Payload privado nao tem remoteJid de grupo, mas o fluxo tenta usar endpoint de participantes de grupo.',
    mitigationHint: 'Adicionar guard antes de buscar participantes ou rotear mensagens privadas para um caminho proprio.',
    mainWebhook: {
      body: evolutionBody('', {
        remoteJid: defaultPrivateJid,
        messageType: 'videoMessage',
      }),
    },
  }),

  'businesses-staging | contexto por telefone': baseCase({
    target: 'businesses',
    routeIndex: 1,
    workflowName: 'businesses-staging',
    scenarioLabel: 'Resolver contexto da empresa por telefone',
    path: 'executeWorkflowTrigger -> Redis context -> API fallback -> business context',
    expectedResult: 'Retornar business.id=1 e business.name=Barbearia Modelo.',
    dataImpact: 'Pode ler/gravar cache Redis beautyflow_bot.<phone>.business_context.',
    evidenceHint: 'Saida business context com business preenchido.',
    workflowInputs: {
      business_phone: businessPhone,
      client: client(),
      api: baseApi,
    },
  }),

  'clients-staging | buscar cliente existente': baseCase({
    target: 'clients',
    routeIndex: 2,
    workflowName: 'clients-staging',
    scenarioLabel: 'Buscar cliente existente por remote_jid/contexto',
    path: 'executeWorkflowTrigger -> action=get -> context/client API -> success',
    expectedResult: 'Retornar client.id=11 ou cliente existente equivalente.',
    dataImpact: 'Pode ler/gravar contexto Redis do cliente.',
    evidenceHint: 'Saida client preenchida.',
    workflowInputs: {
      action: 'get',
      business: baseBusiness,
      client: client('sim'),
      api: baseApi,
    },
  }),

  'clients-staging | coletar nome pendente': baseCase({
    target: 'clients',
    routeIndex: 2,
    workflowName: 'clients-staging',
    scenarioLabel: 'Coleta de nome quando cliente ainda precisa informar dados',
    path: 'executeWorkflowTrigger -> action=name -> extractor -> pending state/resposta',
    expectedResult: 'Responder solicitando ou registrando nome, sem quebrar o fluxo.',
    dataImpact: 'Pode atualizar cliente, pending state, memoria Redis e enviar mensagem Evolution.',
    evidenceHint: 'Saida response/success do clients-staging.',
    workflowInputs: {
      action: 'name',
      business: baseBusiness,
      client: client('me chamo Teste Staging'),
      api: baseApi,
    },
  }),

  'services-staging | listar servicos': baseCase({
    target: 'services',
    routeIndex: 3,
    workflowName: 'services-staging',
    scenarioLabel: 'Listar servicos disponiveis',
    path: 'executeWorkflowTrigger -> action=list -> API/cache -> services context',
    expectedResult: 'Retornar lista de servicos com Barba/Corte quando disponiveis.',
    dataImpact: 'Pode ler/gravar cache Redis de servicos.',
    evidenceHint: 'Saida services context com array services.',
    workflowInputs: {
      action: 'list',
      service_id: '',
      service_name: '',
      business: baseBusiness,
      client: client(),
      api: baseApi,
    },
  }),

  'services-staging | buscar servico por id': baseCase({
    target: 'services',
    routeIndex: 3,
    workflowName: 'services-staging',
    scenarioLabel: 'Buscar servico por id',
    path: 'executeWorkflowTrigger -> action=get -> cache/API by id -> services context',
    expectedResult: 'Retornar service id=2, nome Barba, duracao 30.',
    dataImpact: 'Pode ler/gravar cache Redis de servicos.',
    evidenceHint: 'Saida services[0].id=2.',
    workflowInputs: {
      action: 'get',
      service_id: '2',
      service_name: '',
      business: baseBusiness,
      client: client(),
      api: baseApi,
    },
  }),

  'services-staging | buscar servico por nome': baseCase({
    target: 'services',
    routeIndex: 3,
    workflowName: 'services-staging',
    scenarioLabel: 'Buscar servico por nome',
    path: 'executeWorkflowTrigger -> action=get -> cache/API by name -> services context',
    expectedResult: 'Retornar servico Barba.',
    dataImpact: 'Pode ler/gravar cache Redis de servicos.',
    evidenceHint: 'Saida services com nome Barba.',
    workflowInputs: {
      action: 'get',
      service_id: '',
      service_name: 'Barba',
      business: baseBusiness,
      client: client(),
      api: baseApi,
    },
  }),

  'professionals-staging | listar profissionais': baseCase({
    target: 'professionals',
    routeIndex: 4,
    workflowName: 'professionals-staging',
    scenarioLabel: 'Listar profissionais disponiveis',
    path: 'executeWorkflowTrigger -> action=list -> API/cache -> professionals context',
    expectedResult: 'Retornar lista de profissionais.',
    dataImpact: 'Pode ler/gravar cache Redis de profissionais.',
    evidenceHint: 'Saida professionals context com array professionals.',
    workflowInputs: {
      action: 'list',
      professional_id: '',
      professional_name: '',
      business: baseBusiness,
      client: client(),
      api: baseApi,
    },
  }),

  'professionals-staging | buscar profissional por id': baseCase({
    target: 'professionals',
    routeIndex: 4,
    workflowName: 'professionals-staging',
    scenarioLabel: 'Buscar profissional por id',
    path: 'executeWorkflowTrigger -> action=get -> cache/API by id -> professionals context',
    expectedResult: 'Retornar professional id=1, Joao Barbeiro.',
    dataImpact: 'Pode ler/gravar cache Redis de profissionais.',
    evidenceHint: 'Saida professionals[0].id=1.',
    workflowInputs: {
      action: 'get',
      professional_id: '1',
      professional_name: '',
      business: baseBusiness,
      client: client(),
      api: baseApi,
    },
  }),

  'professionals-staging | buscar profissional por nome': baseCase({
    target: 'professionals',
    routeIndex: 4,
    workflowName: 'professionals-staging',
    scenarioLabel: 'Buscar profissional por nome',
    path: 'executeWorkflowTrigger -> action=get -> cache/API by name -> professionals context',
    expectedResult: 'Retornar profissional Joao Barbeiro.',
    dataImpact: 'Pode ler/gravar cache Redis de profissionais.',
    evidenceHint: 'Saida professionals com nome Joao Barbeiro.',
    workflowInputs: {
      action: 'get',
      professional_id: '',
      professional_name: 'Joao Barbeiro',
      business: baseBusiness,
      client: client(),
      api: baseApi,
    },
  }),

  'availabilities-staging | listar slots': baseCase({
    target: 'availabilities',
    routeIndex: 5,
    workflowName: 'availabilities-staging',
    scenarioLabel: 'Listar slots por data',
    path: 'executeWorkflowTrigger -> get slots -> aggregate -> success',
    expectedResult: 'Retornar array slots para service_id=2 e professional_id=1.',
    dataImpact: 'Somente leitura de disponibilidade no backend.',
    evidenceHint: 'Saida slots ou success=true.',
    workflowInputs: {
      service_id: '2',
      professional_id: '1',
      date: slot.date,
      requested_start: '',
      max_suggestions: '3',
      search_days_ahead: '7',
      business: baseBusiness,
      client: client('quais horarios tem?'),
      api: baseApi,
    },
  }),

  'availabilities-staging | checar horario solicitado': baseCase({
    target: 'availabilities',
    routeIndex: 5,
    workflowName: 'availabilities-staging',
    scenarioLabel: 'Checar horario especifico e sugerir alternativas',
    path: 'executeWorkflowTrigger -> check-and-suggest -> check suggest success',
    expectedResult: 'Retornar available=true ou sugestoes proximas.',
    dataImpact: 'Somente leitura de disponibilidade no backend.',
    evidenceHint: 'Saida mode/check-and-suggest, available e suggestions.',
    workflowInputs: {
      service_id: '2',
      professional_id: '1',
      date: slot.date,
      requested_start: startDatetime,
      max_suggestions: '3',
      search_days_ahead: '7',
      business: baseBusiness,
      client: client('pode ser as 10'),
      api: baseApi,
    },
  }),

  'appointments-staging | agendar': baseCase({
    target: 'appointments',
    routeIndex: 6,
    workflowName: 'appointments-staging',
    scenarioLabel: 'Criar agendamento',
    path: 'executeWorkflowTrigger -> action=post -> backend -> calendar -> gmail -> final return',
    expectedResult: 'Criar appointment scheduled para service_id=2/professional_id=1.',
    dataImpact: 'Cria appointment em staging, evento de calendario e email de confirmacao.',
    evidenceHint: 'Saida appointments[0].status=scheduled.',
    workflowInputs: {
      action: 'post',
      appointment_id: '',
      professional_id: '1',
      service_id: '2',
      start_datetime: startDatetime,
      business: baseBusiness,
      client: client('sim'),
      api: baseApi,
    },
  }),

  'appointments-staging | remarcar por id': baseCase({
    target: 'appointments',
    routeIndex: 6,
    workflowName: 'appointments-staging',
    scenarioLabel: 'Remarcar agendamento existente',
    path: 'executeWorkflowTrigger -> action=update -> backend -> update calendar/email -> final return',
    expectedResult: 'Atualizar appointment_id informado para novo horario.',
    dataImpact: 'Altera appointment em staging, evento de calendario e email relacionado.',
    evidenceHint: 'Saida appointments com start_datetime atualizado.',
    workflowInputs: {
      action: 'update',
      appointment_id: appointmentId,
      professional_id: '1',
      service_id: '2',
      start_datetime: startDatetimeOverride || rescheduleSlot.start,
      business: baseBusiness,
      client: client('quero remarcar'),
      api: baseApi,
    },
  }),

  'appointments-staging | cancelar por id': baseCase({
    target: 'appointments',
    routeIndex: 6,
    workflowName: 'appointments-staging',
    scenarioLabel: 'Cancelar agendamento existente',
    path: 'executeWorkflowTrigger -> action=cancel -> backend -> delete calendar/email -> final return',
    expectedResult: 'Cancelar appointment_id informado.',
    dataImpact: 'Cancela appointment em staging e remove/atualiza artefatos externos relacionados.',
    evidenceHint: 'Saida appointments com status canceled ou retorno equivalente.',
    workflowInputs: {
      action: 'cancel',
      appointment_id: appointmentId,
      professional_id: '1',
      service_id: '2',
      start_datetime: '',
      business: baseBusiness,
      client: client('quero cancelar'),
      api: baseApi,
    },
  }),

  'appointments-staging | buscar por id': baseCase({
    target: 'appointments',
    routeIndex: 6,
    workflowName: 'appointments-staging',
    scenarioLabel: 'Buscar agendamento por id',
    path: 'executeWorkflowTrigger -> action=get -> get by id -> context -> final return',
    expectedResult: 'Retornar contexto do appointment_id informado.',
    dataImpact: 'Somente leitura de appointments no backend.',
    evidenceHint: 'Saida appointments com appointment_id solicitado.',
    workflowInputs: {
      action: 'get',
      appointment_id: appointmentId,
      professional_id: '',
      service_id: '',
      start_datetime: '',
      business: baseBusiness,
      client: client('meus horarios'),
      api: baseApi,
    },
  }),

  'appointments-staging | erro servico invalido': baseCase({
    target: 'appointments',
    routeIndex: 6,
    workflowName: 'appointments-staging',
    scenarioLabel: 'Erro esperado por service_id invalido',
    path: 'executeWorkflowTrigger -> action=post -> backend validation -> error path',
    expectedFailure: true,
    expectedResult: 'Falhar com validacao de servico/profissional inexistente.',
    dataImpact: 'Nao deve criar appointment valido.',
    evidenceHint: 'Erro em post/pre-context/service context.',
    probableCauseHint: 'service_id 999999 nao existe ou nao esta vinculado ao professional_id 1.',
    mitigationHint: 'Validar service_id/professional_id antes de chamar appointments-staging.',
    workflowInputs: {
      action: 'post',
      appointment_id: '',
      professional_id: '1',
      service_id: '999999',
      start_datetime: startDatetime,
      business: baseBusiness,
      client: client('sim'),
      api: baseApi,
    },
  }),

  'pending state-staging | voltar para coleta de nome': baseCase({
    target: 'pending_state',
    routeIndex: 7,
    workflowName: 'pending state-staging',
    scenarioLabel: 'Retomar pending state get_name',
    path: 'executeWorkflowTrigger -> state=get_name -> clients-staging action=name',
    expectedResult: 'Chamar clients-staging para tratar coleta de nome.',
    dataImpact: 'Pode atualizar pending state, cliente, memoria Redis e enviar mensagem Evolution.',
    evidenceHint: 'Execucao integrada de clients-staging.',
    workflowInputs: {
      state: 'get_name',
      business: baseBusiness,
      client: {
        remote_jid: remoteJid,
        message: messageOverride || 'me chamo Teste Staging',
      },
      api: baseApi,
    },
  }),

  'error-staging | reportar erro interno': baseCase({
    target: 'error',
    routeIndex: 8,
    workflowName: 'error-staging',
    scenarioLabel: 'Exercitar workflow de erro por chamada direta',
    path: 'executeWorkflowTrigger -> normalize error -> switch notify -> outputs',
    expectedResult: 'Normalizar erro e produzir error context sem quebrar.',
    dataImpact: 'Pode enviar notificacao Evolution/email conforme politica de erro.',
    evidenceHint: 'Saida error context com tipo business.appointment_create.',
    workflowInputs: {
      error: {
        workflow: 'test-staging',
        execution: 'manual',
        type: 'business.appointment_create',
        node: 'test-staging synthetic error',
        code: 'TEST',
        description: 'Erro sintetico para validar error-staging.',
      },
      business: baseBusiness,
      client: client('erro sintetico'),
      api: baseApi,
    },
  }),

  'backend-staging | health ready': baseCase({
    target: 'backend',
    routeIndex: 9,
    workflowName: 'backend-staging',
    scenarioLabel: 'Health check de readiness do backend',
    path: 'HTTP GET /health/ready',
    expectedResult: 'Retornar HTTP 200 com banco, Redis e migracao saudaveis.',
    dataImpact: 'Somente leitura.',
    evidenceHint: 'Status code 200 e corpo health/ready.',
    backendHealth: {
      url: 'http://backend-staging:8000/health/ready',
    },
  }),
};

let testCase = cases[scenario];

if (!testCase) {
  testCase = baseCase({
    target: 'invalid',
    routeIndex: 10,
    workflowName: workflow || 'unknown',
    scenarioLabel: 'Cenario invalido ou nao mapeado',
    expectedFailure: true,
    expectedResult: 'O menu deve selecionar um cenario conhecido.',
    path: 'Form -> validation',
    dataImpact: 'Nenhum dado manipulado.',
    evidenceHint: 'Validacao local do test-staging.',
    workflowInputs: {},
  });
  testCase.validationError = 'Cenario nao mapeado: ' + scenario;
}

if (workflow && testCase.workflowName && workflow !== testCase.workflowName) {
  testCase.warnings.push('Workflow selecionado (' + workflow + ') difere do cenario (' + testCase.workflowName + '). O cenario foi usado como fonte de verdade.');
}

return [{ json: testCase }];`,
    };

    @node({
        id: '032a2ef9-bab9-4b83-9a7d-2f5f1b8a80d6',
        name: 'get integration token',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.4,
        position: [-1104, 208],
        credentials: { httpBearerAuth: { id: 'GOtlhhje8hFoh3UQ', name: 'n8n beautyflow token - test' } },
        onError: 'continueRegularOutput',
        retryOnFail: true,
        waitBetweenTries: 500,
    })
    GetIntegrationToken = {
        method: 'POST',
        url: "={{ $('prepare test case').first().json.workflowInputs?.api?.url || 'http://backend-staging:8000/v1' }}/auth/integration",
        authentication: 'genericCredentialType',
        genericAuthType: 'httpBearerAuth',
        sendHeaders: true,
        headerParameters: {
            parameters: [
                {
                    name: 'X-Evolution-Instance',
                    value: "={{ $('prepare test case').first().json.workflowInputs?.api?.evo_instance || 'sale_instance' }}",
                },
                {
                    name: 'X-Business-Phone',
                    value: "={{ $('prepare test case').first().json.workflowInputs?.business_phone || $('prepare test case').first().json.workflowInputs?.business?.phone || '5511991549118' }}",
                },
            ],
        },
        options: {},
    };

    @node({
        id: '99573ffc-31c0-44bb-b1de-07589c8cc3b0',
        name: 'route by workflow',
        type: 'n8n-nodes-base.switch',
        version: 3.4,
        position: [-848, 64],
    })
    RouteByWorkflow = {
        mode: 'expression',
        numberOutputs: 11,
        output: "={{ $('prepare test case').first().json.routeIndex }}",
        looseTypeValidation: true,
    };

    @node({
        id: 'd86810c2-269b-4215-b475-97f20a5ed1ae',
        name: 'clear main-staging chat buffer',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [-720, -544],
        credentials: { redis: { id: 'yq1GIl0nbdK5QpYm', name: 'beautyflow test' } },
        onError: 'continueRegularOutput',
    })
    ClearMainStagingChatBuffer = {
        operation: 'delete',
        key: "=beautyflow_bot.{{ $('prepare test case').first().json.mainWebhook.body.data.key.remoteJid }}.chat_buffer",
    };

    @node({
        id: '0e62a91c-dd70-4a94-8217-8c2b3e1ad766',
        name: 'clear main-staging chat memory',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [-672, -544],
        credentials: { redis: { id: 'yq1GIl0nbdK5QpYm', name: 'beautyflow test' } },
        onError: 'continueRegularOutput',
    })
    ClearMainStagingChatMemory = {
        operation: 'delete',
        key: "=beautyflow_bot.{{ $('prepare test case').first().json.mainWebhook.body.data.key.remoteJid }}.chat_memory",
    };

    @node({
        id: 'd8f5075f-685e-48c4-a96d-77c720d1f9ce',
        name: 'clear main-staging state',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [-624, -544],
        credentials: { redis: { id: 'yq1GIl0nbdK5QpYm', name: 'beautyflow test' } },
        onError: 'continueRegularOutput',
    })
    ClearMainStagingState = {
        operation: 'delete',
        key: "=beautyflow_bot.{{ $('prepare test case').first().json.mainWebhook.body.data.key.remoteJid }}.state",
    };

    @node({
        id: '8b1a4eca-9b51-4739-9893-7804e45d69bf',
        name: 'clear main-staging outside-hours context',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [-576, -544],
        credentials: { redis: { id: 'yq1GIl0nbdK5QpYm', name: 'beautyflow test' } },
        onError: 'continueRegularOutput',
    })
    ClearMainStagingOutsideHoursContext = {
        operation: 'delete',
        key: "=beautyflow_bot.{{ $('prepare test case').first().json.mainWebhook.body.data.key.remoteJid }}.outside_hours_context",
    };

    @node({
        id: '8ac46c65-2fc0-481b-8f3b-cc3e95dd16ab',
        name: 'clear main-staging personal block',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [-528, -544],
        credentials: { redis: { id: 'yq1GIl0nbdK5QpYm', name: 'beautyflow test' } },
        onError: 'continueRegularOutput',
    })
    ClearMainStagingPersonalBlock = {
        operation: 'delete',
        key: "=beautyflow_bot.{{ $('prepare test case').first().json.mainWebhook.body.data.key.remoteJid }}.personal_block",
    };

    @node({
        id: 'af6ddc5c-951b-4755-b995-00b81ab480f9',
        name: 'call main-staging webhook',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.4,
        position: [-480, -544],
        credentials: { httpHeaderAuth: { id: 'SgMhjuYgwqILwgel', name: 'Beautyflow Evolution Webhook' } },
        onError: 'continueRegularOutput',
    })
    CallMainStagingWebhook = {
        method: 'POST',
        url: 'https://n8n.techlegacy.com.br/webhook/beautyflow-staging',
        authentication: 'genericCredentialType',
        genericAuthType: 'httpHeaderAuth',
        sendBody: true,
        specifyBody: 'json',
        jsonBody: "={{ $('prepare test case').first().json.mainWebhook.body }}",
        options: {
            response: {
                response: {
                    fullResponse: true,
                },
            },
        },
    };

    @node({
        id: '4f9fd4d4-889b-49b1-98bd-7f86ae925a47',
        name: 'execute businesses-staging',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [-512, -416],
        onError: 'continueRegularOutput',
    })
    ExecuteBusinessesStaging = {
        workflowId: {
            __rl: true,
            value: 'dVtm2MJ8gTjXHIuE',
            mode: 'list',
            cachedResultUrl: '/workflow/dVtm2MJ8gTjXHIuE',
            cachedResultName: 'businesses-staging',
        },
        workflowInputs: {
            mappingMode: 'defineBelow',
            value: {
                business_phone: "={{ $('prepare test case').first().json.workflowInputs.business_phone }}",
                client: "={{ $('prepare test case').first().json.workflowInputs.client }}",
                api: "={{ { ...$('prepare test case').first().json.workflowInputs.api, token: 'Bearer ' + ($('get integration token').first().json.access_token || '') } }}",
            },
            matchingColumns: [],
            schema: [
                {
                    id: 'business_phone',
                    displayName: 'business_phone',
                    required: false,
                    defaultMatch: false,
                    display: true,
                    canBeUsedToMatch: true,
                    type: 'string',
                },
                {
                    id: 'client',
                    displayName: 'client',
                    required: false,
                    defaultMatch: false,
                    display: true,
                    canBeUsedToMatch: true,
                    type: 'object',
                },
                {
                    id: 'api',
                    displayName: 'api',
                    required: false,
                    defaultMatch: false,
                    display: true,
                    canBeUsedToMatch: true,
                    type: 'object',
                },
            ],
            attemptToConvertTypes: false,
            convertFieldsToString: true,
        },
        options: {},
    };

    @node({
        id: 'a161e3d4-3b84-49c0-a5d2-59cd5abf1b94',
        name: 'execute clients-staging',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [-512, -288],
        onError: 'continueRegularOutput',
    })
    ExecuteClientsStaging = {
        workflowId: {
            __rl: true,
            value: 'el3GeDHzGRJaidKi',
            mode: 'list',
            cachedResultUrl: '/workflow/el3GeDHzGRJaidKi',
            cachedResultName: 'clients-staging',
        },
        workflowInputs: {
            mappingMode: 'defineBelow',
            value: {
                action: "={{ $('prepare test case').first().json.workflowInputs.action }}",
                business: "={{ $('prepare test case').first().json.workflowInputs.business }}",
                client: "={{ $('prepare test case').first().json.workflowInputs.client }}",
                api: "={{ { ...$('prepare test case').first().json.workflowInputs.api, token: 'Bearer ' + ($('get integration token').first().json.access_token || '') } }}",
            },
        },
        options: {},
    };

    @node({
        id: '5408f136-0853-4f95-bec3-76c22afda116',
        name: 'execute services-staging',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [-512, -160],
        onError: 'continueRegularOutput',
    })
    ExecuteServicesStaging = {
        workflowId: {
            __rl: true,
            value: 'tPtMFcuYvJPyKHQl',
            mode: 'list',
            cachedResultUrl: '/workflow/tPtMFcuYvJPyKHQl',
            cachedResultName: 'services-staging',
        },
        workflowInputs: {
            mappingMode: 'defineBelow',
            value: {
                action: "={{ $('prepare test case').first().json.workflowInputs.action }}",
                service_id: "={{ $('prepare test case').first().json.workflowInputs.service_id }}",
                service_name: "={{ $('prepare test case').first().json.workflowInputs.service_name }}",
                business: "={{ $('prepare test case').first().json.workflowInputs.business }}",
                client: "={{ $('prepare test case').first().json.workflowInputs.client }}",
                api: "={{ { ...$('prepare test case').first().json.workflowInputs.api, token: 'Bearer ' + ($('get integration token').first().json.access_token || '') } }}",
            },
        },
        options: {},
    };

    @node({
        id: 'b2d1c0bb-40cd-47ea-bb21-2fb99d3414f5',
        name: 'execute professionals-staging',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [-512, -32],
        onError: 'continueRegularOutput',
    })
    ExecuteProfessionalsStaging = {
        workflowId: {
            __rl: true,
            value: 'rMEHtjR5lFuN97w0',
            mode: 'list',
            cachedResultUrl: '/workflow/rMEHtjR5lFuN97w0',
            cachedResultName: 'professionals-staging',
        },
        workflowInputs: {
            mappingMode: 'defineBelow',
            value: {
                action: "={{ $('prepare test case').first().json.workflowInputs.action }}",
                professional_id: "={{ $('prepare test case').first().json.workflowInputs.professional_id }}",
                professional_name: "={{ $('prepare test case').first().json.workflowInputs.professional_name }}",
                business: "={{ $('prepare test case').first().json.workflowInputs.business }}",
                client: "={{ $('prepare test case').first().json.workflowInputs.client }}",
                api: "={{ { ...$('prepare test case').first().json.workflowInputs.api, token: 'Bearer ' + ($('get integration token').first().json.access_token || '') } }}",
            },
        },
        options: {},
    };

    @node({
        id: '7faaf50a-f6c1-404d-abd6-d6fd14e6ac93',
        name: 'execute availabilities-staging',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [-512, 96],
        onError: 'continueRegularOutput',
    })
    ExecuteAvailabilitiesStaging = {
        workflowId: {
            __rl: true,
            value: '249kJRLhcloHLPCk',
            mode: 'list',
            cachedResultUrl: '/workflow/249kJRLhcloHLPCk',
            cachedResultName: 'availabilities-staging',
        },
        workflowInputs: {
            mappingMode: 'defineBelow',
            value: {
                service_id: "={{ $('prepare test case').first().json.workflowInputs.service_id }}",
                professional_id: "={{ $('prepare test case').first().json.workflowInputs.professional_id }}",
                date: "={{ $('prepare test case').first().json.workflowInputs.date }}",
                requested_start: "={{ $('prepare test case').first().json.workflowInputs.requested_start }}",
                max_suggestions: "={{ $('prepare test case').first().json.workflowInputs.max_suggestions }}",
                search_days_ahead: "={{ $('prepare test case').first().json.workflowInputs.search_days_ahead }}",
                business: "={{ $('prepare test case').first().json.workflowInputs.business }}",
                client: "={{ $('prepare test case').first().json.workflowInputs.client }}",
                api: "={{ { ...$('prepare test case').first().json.workflowInputs.api, token: 'Bearer ' + ($('get integration token').first().json.access_token || '') } }}",
            },
        },
        options: {},
    };

    @node({
        id: '59a5fe18-92ea-4077-a6f2-702c77a08354',
        name: 'execute appointments-staging',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [-512, 224],
        onError: 'continueRegularOutput',
    })
    ExecuteAppointmentsStaging = {
        workflowId: {
            __rl: true,
            value: '8Zv0enEr5Ktjbay1',
            mode: 'list',
            cachedResultUrl: '/workflow/8Zv0enEr5Ktjbay1',
            cachedResultName: 'appointments-staging',
        },
        workflowInputs: {
            mappingMode: 'defineBelow',
            value: {
                action: "={{ $('prepare test case').first().json.workflowInputs.action }}",
                appointment_id: "={{ $('prepare test case').first().json.workflowInputs.appointment_id }}",
                professional_id: "={{ $('prepare test case').first().json.workflowInputs.professional_id }}",
                service_id: "={{ $('prepare test case').first().json.workflowInputs.service_id }}",
                start_datetime: "={{ $('prepare test case').first().json.workflowInputs.start_datetime }}",
                business: "={{ $('prepare test case').first().json.workflowInputs.business }}",
                client: "={{ $('prepare test case').first().json.workflowInputs.client }}",
                api: "={{ { ...$('prepare test case').first().json.workflowInputs.api, token: 'Bearer ' + ($('get integration token').first().json.access_token || '') } }}",
            },
        },
        options: {},
    };

    @node({
        id: '1d72bc7d-27c5-42ff-a0c6-ed260ba5c40e',
        name: 'execute pending state-staging',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [-512, 352],
        onError: 'continueRegularOutput',
    })
    ExecutePendingStateStaging = {
        workflowId: {
            __rl: true,
            value: 'VJhji9bH9TjYZy06',
            mode: 'list',
            cachedResultUrl: '/workflow/VJhji9bH9TjYZy06',
            cachedResultName: 'pending state-staging',
        },
        workflowInputs: {
            mappingMode: 'defineBelow',
            value: {
                state: "={{ $('prepare test case').first().json.workflowInputs.state }}",
                business: "={{ $('prepare test case').first().json.workflowInputs.business }}",
                client: "={{ $('prepare test case').first().json.workflowInputs.client }}",
                api: "={{ { ...$('prepare test case').first().json.workflowInputs.api, token: 'Bearer ' + ($('get integration token').first().json.access_token || '') } }}",
            },
        },
        options: {},
    };

    @node({
        id: '69787da6-9470-47bc-a84b-f348af78e032',
        name: 'execute error-staging',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [-512, 480],
        onError: 'continueRegularOutput',
    })
    ExecuteErrorStaging = {
        workflowId: {
            __rl: true,
            value: 'BxyJLKjTEcfzV18k',
            mode: 'list',
            cachedResultUrl: '/workflow/BxyJLKjTEcfzV18k',
            cachedResultName: 'error-staging',
        },
        workflowInputs: {
            mappingMode: 'defineBelow',
            value: {
                error: "={{ $('prepare test case').first().json.workflowInputs.error }}",
                business: "={{ $('prepare test case').first().json.workflowInputs.business }}",
                client: "={{ $('prepare test case').first().json.workflowInputs.client }}",
                api: "={{ { ...$('prepare test case').first().json.workflowInputs.api, token: 'Bearer ' + ($('get integration token').first().json.access_token || '') } }}",
            },
        },
        options: {},
    };

    @node({
        id: 'd612490a-02ac-42cb-a8c1-ef90713c9af2',
        name: 'check backend-staging health',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.4,
        position: [-512, 608],
        onError: 'continueRegularOutput',
    })
    CheckBackendStagingHealth = {
        url: "={{ $('prepare test case').first().json.backendHealth.url }}",
        options: {
            response: {
                response: {
                    fullResponse: true,
                },
            },
        },
    };

    @node({
        id: '0af01e2f-ac5f-4a27-b68a-ee9f59a26f53',
        name: 'build summary and mini report',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [-128, 64],
    })
    BuildSummaryAndMiniReport = {
        jsCode: `const inputItems = $input.all();
const result = inputItems[0]?.json || {};
const test = $('prepare test case').first().json || {};

let tokenProbe = {};
try {
  tokenProbe = $('get integration token').first().json || {};
} catch (error) {
  tokenProbe = {};
}

function mask(value) {
  if (value === undefined || value === null) return value;
  const text = String(value);
  if (text.length <= 8) return '***';
  return text.slice(0, 3) + '***' + text.slice(-6);
}

function sanitize(value, key = '') {
  if (Array.isArray(value)) return value.map((item) => sanitize(item, key));
  if (value && typeof value === 'object') {
    const output = {};
    for (const [childKey, childValue] of Object.entries(value)) {
      const lower = childKey.toLowerCase();
      if (['token', 'access_token', 'authorization', 'apikey', 'api_key', 'password', 'secret'].includes(lower)) {
        output[childKey] = '[redacted]';
      } else if (['phone', 'remote_jid', 'remotejid'].includes(lower)) {
        output[childKey] = mask(childValue);
      } else {
        output[childKey] = sanitize(childValue, childKey);
      }
    }
    return output;
  }
  if (['phone', 'remote_jid', 'remotejid'].includes(String(key).toLowerCase())) return mask(value);
  return value;
}

function firstArray(value) {
  return Array.isArray(value) ? value : value ? [value] : [];
}

const error =
  result.error ||
  result.execution?.error ||
  (Number(result.statusCode) >= 400 ? { message: result.body || result.message || 'HTTP error', statusCode: result.statusCode } : null) ||
  (test.validationError ? { message: test.validationError } : null);

const expectedFailure = Boolean(test.expectedFailure);
const matchedExpectedFailure = expectedFailure && Boolean(error);
const unexpectedError = Boolean(error) && !expectedFailure;
const missingExpectedFailure = expectedFailure && !error;
const status = unexpectedError || missingExpectedFailure || test.validationError ? 'failed' : 'success';

const outputKeys = Object.keys(result || {});
const appointments = firstArray(result.appointments);
const services = firstArray(result.services);
const professionals = firstArray(result.professionals);
const slots = firstArray(result.slots);
const suggestions = firstArray(result.suggestions);

const manipulated = {
  declared_impact: test.dataImpact || '',
  redis_keys_cleared: test.cleanupKeys || [],
  appointment_ids: appointments.map((item) => item.id).filter(Boolean),
  appointment_statuses: appointments.map((item) => item.status).filter(Boolean),
  service_ids: services.map((item) => item.id).filter(Boolean),
  professional_ids: professionals.map((item) => item.id).filter(Boolean),
  slots_count: slots.length,
  suggestions_count: suggestions.length,
};

let likelyCause = 'Sem falha observada.';
let suggestion = 'Nenhuma acao imediata necessaria.';

if (matchedExpectedFailure) {
  likelyCause = test.probableCauseHint || 'O cenario foi desenhado para validar um caminho de erro.';
  suggestion = test.mitigationHint || 'Confirmar se a mensagem de erro continua clara e se o error-staging foi acionado quando aplicavel.';
} else if (unexpectedError) {
  likelyCause =
    test.probableCauseHint ||
    error.description ||
    error.message ||
    'Falha inesperada no workflow ou em dependencia de staging.';
  suggestion =
    test.mitigationHint ||
    'Abrir a execucao no n8n, localizar o node indicado e comparar o payload usado com o contrato do workflow.';
} else if (missingExpectedFailure) {
  likelyCause = 'O fluxo de erro esperado nao falhou; a validacao pode ter mudado ou o payload nao exercita mais esse caminho.';
  suggestion = 'Revisar o cenario de erro e atualizar os dados de teste ou a expectativa.';
}

const summary = {
  status,
  expected_failure_observed: matchedExpectedFailure,
  workflow_tested: test.workflowName,
  scenario_tested: test.scenarioLabel,
  selected_menu_workflow: test.selectedWorkflow,
  selected_menu_scenario: test.scenario,
  path_executed: test.path,
  data_manipulated: manipulated,
  important_events: {
    output_keys: outputKeys,
    response: result.response || result.message || result.body || null,
    success_flag: result.sucess ?? result.success ?? null,
    http_status: result.statusCode || null,
    token_obtained: Boolean(tokenProbe.access_token),
    warnings: test.warnings || [],
  },
  error: error
    ? {
        where: error.node?.name || error.node || result.node || test.workflowName,
        message: error.message || error.description || JSON.stringify(error),
        status_code: error.statusCode || error.status || result.statusCode || null,
        data_used: sanitize(test.workflowInputs || test.mainWebhook?.body || {}),
        failed_step: error.node?.name || error.node || 'unknown',
        probable_cause: likelyCause,
        initial_suggestion: suggestion,
      }
    : null,
};

const miniReportJson = {
  scenario: test.scenarioLabel,
  workflow: test.workflowName,
  path: test.path,
  data_used: sanitize(test.workflowInputs || test.mainWebhook?.body || test.backendHealth || {}),
  expected_result: test.expectedResult,
  obtained_result: {
    status,
    output_keys: outputKeys,
    response: summary.important_events.response,
    success_flag: summary.important_events.success_flag,
    http_status: summary.important_events.http_status,
  },
  error: summary.error,
  evidence: {
    hint: test.evidenceHint,
    redacted_output: sanitize(result),
    token_obtained: Boolean(tokenProbe.access_token),
    warnings: test.warnings || [],
    form_overrides: sanitize(test.formOverrides || {}),
    notes: test.notes || '',
  },
  cause_hypothesis: likelyCause,
  next_steps: suggestion,
};

const miniReport = [
  '# Mini report - test-staging',
  '',
  '- Workflow: ' + (test.workflowName || ''),
  '- Cenario: ' + (test.scenarioLabel || ''),
  '- Status: ' + status,
  '- Caminho executado: ' + (test.path || ''),
  '- Resultado esperado: ' + (test.expectedResult || ''),
  '- Resultado obtido: ' + JSON.stringify(miniReportJson.obtained_result),
  '- Erro: ' + (summary.error ? summary.error.message : 'nenhum'),
  '- Evidencias: ' + (test.evidenceHint || ''),
  '- Hipotese de causa: ' + likelyCause,
  '- Proximos passos: ' + suggestion,
  '',
  '## Dados usados',
  '~~~json',
  JSON.stringify(miniReportJson.data_used, null, 2),
  '~~~',
  '',
  '## Saida redigida',
  '~~~json',
  JSON.stringify(miniReportJson.evidence.redacted_output, null, 2),
  '~~~',
].join('\\n');

return [
  {
    json: {
      summary,
      mini_report: miniReport,
      mini_report_json: miniReportJson,
    },
  },
];`,
    };

    @node({
        id: '18e96515-491a-4a2e-96cb-89bb586519fb',
        name: 'docs - visao geral',
        type: 'n8n-nodes-base.stickyNote',
        version: 1,
        position: [-1680, -128],
    })
    DocsVisaoGeral = {
        content: `## Central de testes staging

Use o formulario para selecionar um unico cenario. O workflow prepara dados realistas de staging, aciona apenas o alvo escolhido e gera summary + mini_report para diagnostico.`,
        height: 224,
        width: 416,
        color: 4,
    };

    @node({
        id: 'd12e17ac-3654-4a42-9009-f3a416556625',
        name: 'docs - grupos de teste',
        type: 'n8n-nodes-base.stickyNote',
        version: 1,
        position: [-592, -768],
    })
    DocsGruposDeTeste = {
        content: `## Grupos cobertos

- main-staging: jornadas reais via webhook Evolution.
- Workflows auxiliares: chamadas por Execute Workflow com contratos de entrada reais.
- appointments-staging: agendar, remarcar, cancelar, buscar e erro controlado.
- error-staging: normalizacao e notificacao de erro.`,
        height: 256,
        width: 448,
        color: 5,
    };

    @node({
        id: '2ee93f23-e1e9-4cf0-bbd1-29f6d3632fa5',
        name: 'docs - backend tests',
        type: 'n8n-nodes-base.stickyNote',
        version: 1,
        position: [-592, 768],
    })
    DocsBackendTests = {
        content: `## Integracao backend

Os testes existentes do backend sao pytest/CLI, entao nao foram chamados diretamente para preservar a restricao de operar dentro do n8n. A integracao simples incluida e o health ready do backend staging via HTTP nativo.`,
        height: 224,
        width: 448,
        color: 6,
    };

    // =====================================================================
    // ROUTAGE ET CONNEXIONS
    // =====================================================================

    @links()
    defineRouting() {
        this.MenuDeTestesStaging.out(0).to(this.PrepareTestCase.in(0));
        this.PrepareTestCase.out(0).to(this.GetIntegrationToken.in(0));
        this.GetIntegrationToken.out(0).to(this.RouteByWorkflow.in(0));
        this.RouteByWorkflow.out(0).to(this.ClearMainStagingChatBuffer.in(0));
        this.RouteByWorkflow.out(1).to(this.ExecuteBusinessesStaging.in(0));
        this.RouteByWorkflow.out(2).to(this.ExecuteClientsStaging.in(0));
        this.RouteByWorkflow.out(3).to(this.ExecuteServicesStaging.in(0));
        this.RouteByWorkflow.out(4).to(this.ExecuteProfessionalsStaging.in(0));
        this.RouteByWorkflow.out(5).to(this.ExecuteAvailabilitiesStaging.in(0));
        this.RouteByWorkflow.out(6).to(this.ExecuteAppointmentsStaging.in(0));
        this.RouteByWorkflow.out(7).to(this.ExecutePendingStateStaging.in(0));
        this.RouteByWorkflow.out(8).to(this.ExecuteErrorStaging.in(0));
        this.RouteByWorkflow.out(9).to(this.CheckBackendStagingHealth.in(0));
        this.RouteByWorkflow.out(10).to(this.BuildSummaryAndMiniReport.in(0));
        this.ClearMainStagingChatBuffer.out(0).to(this.ClearMainStagingChatMemory.in(0));
        this.ClearMainStagingChatMemory.out(0).to(this.ClearMainStagingState.in(0));
        this.ClearMainStagingState.out(0).to(this.ClearMainStagingOutsideHoursContext.in(0));
        this.ClearMainStagingOutsideHoursContext.out(0).to(this.ClearMainStagingPersonalBlock.in(0));
        this.ClearMainStagingPersonalBlock.out(0).to(this.CallMainStagingWebhook.in(0));
        this.CallMainStagingWebhook.out(0).to(this.BuildSummaryAndMiniReport.in(0));
        this.ExecuteBusinessesStaging.out(0).to(this.BuildSummaryAndMiniReport.in(0));
        this.ExecuteClientsStaging.out(0).to(this.BuildSummaryAndMiniReport.in(0));
        this.ExecuteServicesStaging.out(0).to(this.BuildSummaryAndMiniReport.in(0));
        this.ExecuteProfessionalsStaging.out(0).to(this.BuildSummaryAndMiniReport.in(0));
        this.ExecuteAvailabilitiesStaging.out(0).to(this.BuildSummaryAndMiniReport.in(0));
        this.ExecuteAppointmentsStaging.out(0).to(this.BuildSummaryAndMiniReport.in(0));
        this.ExecutePendingStateStaging.out(0).to(this.BuildSummaryAndMiniReport.in(0));
        this.ExecuteErrorStaging.out(0).to(this.BuildSummaryAndMiniReport.in(0));
        this.CheckBackendStagingHealth.out(0).to(this.BuildSummaryAndMiniReport.in(0));
    }
}
