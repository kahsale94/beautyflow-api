import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : recurring-schedules-staging
// Nodes   : 10  |  Connections: 9
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// Webhook                            executeWorkflowTrigger
// DataHandler                        set
// Action                             switch
// List                               httpRequest
// Get                                httpRequest
// Create                             httpRequest
// Update                             httpRequest
// Pause                              httpRequest
// Resume                             httpRequest
// Cancel                             httpRequest
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// Webhook
//    → DataHandler
//      → Action
//        → List
//       .out(1) → Get
//       .out(2) → Create
//       .out(3) → Update
//       .out(4) → Pause
//       .out(5) → Resume
//       .out(6) → Cancel
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: 'RsEC18urVBX7Kf6N',
    name: 'recurring-schedules-staging',
    active: true,
    isArchived: false,
    projectId: 'UVYVLJNFC5m6HlJG',
    settings: {
        errorWorkflow: 'BxyJLKjTEcfzV18k',
        timezone: 'America/Sao_Paulo',
        executionOrder: 'v1',
        availableInMCP: true,
        callerPolicy: 'workflowsFromSameOwner',
    },
})
export class RecurringSchedulesStagingWorkflow {
    // =====================================================================
    // CONFIGURATION DES NOEUDS
    // =====================================================================

    @node({
        id: '7940a674-fd89-43c3-9293-d9be9c59aec2',
        name: 'webhook',
        type: 'n8n-nodes-base.executeWorkflowTrigger',
        version: 1.1,
        position: [0, 0],
    })
    Webhook = {
        workflowInputs: {
            values: [
                {
                    name: 'action',
                },
                {
                    name: 'series_id',
                },
                {
                    name: 'service_id',
                },
                {
                    name: 'weekday',
                },
                {
                    name: 'start_time',
                },
                {
                    name: 'effective_from',
                },
                {
                    name: 'effective_until',
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
        id: '7940a674-fd89-43c3-9293-d9be9c59aec3',
        name: 'data handler',
        type: 'n8n-nodes-base.set',
        version: 3.4,
        position: [240, 0],
    })
    DataHandler = {
        assignments: {
            assignments: [
                {
                    id: '7940a674-fd89-43c3-9293-d9be9c59aec4',
                    name: 'data',
                    value: `={{ (() => {
  const clean = (value) => {
    const text = String(value ?? '').trim();
    return !text || ['null', 'undefined'].includes(text.toLowerCase()) ? '' : text;
  };
  return {
    action: (clean($json.action) || 'list').toLowerCase(),
    series_id: clean($json.series_id),
    service_id: clean($json.service_id),
    weekday: clean($json.weekday),
    start_time: clean($json.start_time),
    effective_from: clean($json.effective_from),
    effective_until: clean($json.effective_until),
  };
})() }}`,
                    type: 'object',
                },
                {
                    id: '7940a674-fd89-43c3-9293-d9be9c59aec5',
                    name: 'client',
                    value: '={{ $json.client }}',
                    type: 'object',
                },
                {
                    id: '7940a674-fd89-43c3-9293-d9be9c59aec6',
                    name: 'business',
                    value: '={{ $json.business }}',
                    type: 'object',
                },
                {
                    id: '7940a674-fd89-43c3-9293-d9be9c59aec7',
                    name: 'api',
                    value: '={{ $json.api }}',
                    type: 'object',
                },
            ],
        },
        options: {},
    };

    @node({
        id: '7940a674-fd89-43c3-9293-d9be9c59aec8',
        name: 'action',
        type: 'n8n-nodes-base.switch',
        version: 3.4,
        position: [480, 0],
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
                                id: '7940a674-fd89-43c3-9293-d9be9c59ae01',
                                leftValue: "={{ $('data handler').item.json.data.action }}",
                                rightValue: 'list',
                                operator: {
                                    type: 'string',
                                    operation: 'equals',
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
                            typeValidation: 'loose',
                            version: 3,
                        },
                        conditions: [
                            {
                                id: '7940a674-fd89-43c3-9293-d9be9c59ae02',
                                leftValue: "={{ $('data handler').item.json.data.action }}",
                                rightValue: 'get',
                                operator: {
                                    type: 'string',
                                    operation: 'equals',
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
                                id: '7940a674-fd89-43c3-9293-d9be9c59ae03',
                                leftValue: "={{ $('data handler').item.json.data.action }}",
                                rightValue: 'create',
                                operator: {
                                    type: 'string',
                                    operation: 'equals',
                                },
                            },
                        ],
                        combinator: 'and',
                    },
                    renameOutput: true,
                    outputKey: 'CREATE',
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
                                id: '7940a674-fd89-43c3-9293-d9be9c59ae04',
                                leftValue: "={{ $('data handler').item.json.data.action }}",
                                rightValue: 'update',
                                operator: {
                                    type: 'string',
                                    operation: 'equals',
                                },
                            },
                        ],
                        combinator: 'and',
                    },
                    renameOutput: true,
                    outputKey: 'UPDATE',
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
                                id: '7940a674-fd89-43c3-9293-d9be9c59ae05',
                                leftValue: "={{ $('data handler').item.json.data.action }}",
                                rightValue: 'pause',
                                operator: {
                                    type: 'string',
                                    operation: 'equals',
                                },
                            },
                        ],
                        combinator: 'and',
                    },
                    renameOutput: true,
                    outputKey: 'PAUSE',
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
                                id: '7940a674-fd89-43c3-9293-d9be9c59ae06',
                                leftValue: "={{ $('data handler').item.json.data.action }}",
                                rightValue: 'resume',
                                operator: {
                                    type: 'string',
                                    operation: 'equals',
                                },
                            },
                        ],
                        combinator: 'and',
                    },
                    renameOutput: true,
                    outputKey: 'RESUME',
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
                                id: '7940a674-fd89-43c3-9293-d9be9c59ae07',
                                leftValue: "={{ $('data handler').item.json.data.action }}",
                                rightValue: 'cancel',
                                operator: {
                                    type: 'string',
                                    operation: 'equals',
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
        options: {},
    };

    @node({
        id: '7940a674-fd89-43c3-9293-d9be9c59ae10',
        name: 'list',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.4,
        position: [760, -420],
    })
    List = {
        url: "={{ $('data handler').first().json.api.url }}/recurring-schedules/",
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
        id: '7940a674-fd89-43c3-9293-d9be9c59ae11',
        name: 'get',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.4,
        position: [760, -280],
    })
    Get = {
        url: "={{ $('data handler').first().json.api.url }}/recurring-schedules/{{ $('data handler').first().json.data.series_id }}",
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
        id: '7940a674-fd89-43c3-9293-d9be9c59ae12',
        name: 'create',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.4,
        position: [760, -140],
    })
    Create = {
        method: 'POST',
        url: "={{ $('data handler').first().json.api.url }}/recurring-schedules/",
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
  const data = $('data handler').first().json;
  return Object.fromEntries(Object.entries({
    client_id: data.client.id,
    service_id: data.data.service_id,
    weekday: data.data.weekday,
    start_time: data.data.start_time,
    effective_from: data.data.effective_from,
    effective_until: data.data.effective_until,
  }).filter(([_, value]) => value !== ''));
})() }}`,
        options: {},
    };

    @node({
        id: '7940a674-fd89-43c3-9293-d9be9c59ae13',
        name: 'update',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.4,
        position: [760, 0],
    })
    Update = {
        method: 'PUT',
        url: "={{ $('data handler').first().json.api.url }}/recurring-schedules/{{ $('data handler').first().json.data.series_id }}",
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
  return Object.fromEntries(Object.entries({
    service_id: data.service_id,
    weekday: data.weekday,
    start_time: data.start_time,
    effective_from: data.effective_from,
    effective_until: data.effective_until,
  }).filter(([_, value]) => value !== ''));
})() }}`,
        options: {},
    };

    @node({
        id: '7940a674-fd89-43c3-9293-d9be9c59ae14',
        name: 'pause',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.4,
        position: [760, 140],
    })
    Pause = {
        method: 'POST',
        url: "={{ $('data handler').first().json.api.url }}/recurring-schedules/{{ $('data handler').first().json.data.series_id }}/pause",
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
        id: '7940a674-fd89-43c3-9293-d9be9c59ae15',
        name: 'resume',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.4,
        position: [760, 280],
    })
    Resume = {
        method: 'POST',
        url: "={{ $('data handler').first().json.api.url }}/recurring-schedules/{{ $('data handler').first().json.data.series_id }}/resume",
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
        id: '7940a674-fd89-43c3-9293-d9be9c59ae16',
        name: 'cancel',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.4,
        position: [760, 420],
    })
    Cancel = {
        method: 'POST',
        url: "={{ $('data handler').first().json.api.url }}/recurring-schedules/{{ $('data handler').first().json.data.series_id }}/cancel",
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

    // =====================================================================
    // ROUTAGE ET CONNEXIONS
    // =====================================================================

    @links()
    defineRouting() {
        this.Webhook.out(0).to(this.DataHandler.in(0));
        this.DataHandler.out(0).to(this.Action.in(0));
        this.Action.out(0).to(this.List.in(0));
        this.Action.out(1).to(this.Get.in(0));
        this.Action.out(2).to(this.Create.in(0));
        this.Action.out(3).to(this.Update.in(0));
        this.Action.out(4).to(this.Pause.in(0));
        this.Action.out(5).to(this.Resume.in(0));
        this.Action.out(6).to(this.Cancel.in(0));
    }
}
