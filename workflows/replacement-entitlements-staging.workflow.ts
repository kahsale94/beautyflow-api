import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : replacement-entitlements-staging
// Nodes   : 7  |  Connections: 6
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// Webhook                            executeWorkflowTrigger
// DataHandler                        set
// Action                             switch
// List                               httpRequest
// Get                                httpRequest
// CancelWithReplacement              httpRequest
// Use                                httpRequest
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// Webhook
//    → DataHandler
//      → Action
//        → List
//       .out(1) → Get
//       .out(2) → CancelWithReplacement
//       .out(3) → Use
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: 'PwsI7k9PNKMowO6v',
    name: 'replacement-entitlements-staging',
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
export class ReplacementEntitlementsStagingWorkflow {
    // =====================================================================
    // CONFIGURATION DES NOEUDS
    // =====================================================================

    @node({
        id: '310acc11-ff0b-4592-a53f-931408355401',
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
                    name: 'entitlement_id',
                },
                {
                    name: 'appointment_id',
                },
                {
                    name: 'start_datetime',
                },
                {
                    name: 'professional_id',
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
        id: '310acc11-ff0b-4592-a53f-931408355402',
        name: 'data handler',
        type: 'n8n-nodes-base.set',
        version: 3.4,
        position: [240, 0],
    })
    DataHandler = {
        assignments: {
            assignments: [
                {
                    id: '310acc11-ff0b-4592-a53f-931408355403',
                    name: 'data',
                    value: `={{ (() => {
  const clean = (value) => {
    const text = String(value ?? '').trim();
    return !text || ['null', 'undefined'].includes(text.toLowerCase()) ? '' : text;
  };
  return {
    action: (clean($json.action) || 'list').toLowerCase(),
    entitlement_id: clean($json.entitlement_id),
    appointment_id: clean($json.appointment_id),
    start_datetime: clean($json.start_datetime),
    professional_id: clean($json.professional_id),
  };
})() }}`,
                    type: 'object',
                },
                {
                    id: '310acc11-ff0b-4592-a53f-931408355404',
                    name: 'client',
                    value: '={{ $json.client }}',
                    type: 'object',
                },
                {
                    id: '310acc11-ff0b-4592-a53f-931408355405',
                    name: 'business',
                    value: '={{ $json.business }}',
                    type: 'object',
                },
                {
                    id: '310acc11-ff0b-4592-a53f-931408355406',
                    name: 'api',
                    value: '={{ $json.api }}',
                    type: 'object',
                },
            ],
        },
        options: {},
    };

    @node({
        id: '310acc11-ff0b-4592-a53f-931408355407',
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
                                id: '310acc11-ff0b-4592-a53f-931408355408',
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
                                id: '310acc11-ff0b-4592-a53f-931408355409',
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
                                id: '310acc11-ff0b-4592-a53f-931408355410',
                                leftValue: "={{ $('data handler').item.json.data.action }}",
                                rightValue: 'cancel_with_replacement',
                                operator: {
                                    type: 'string',
                                    operation: 'equals',
                                },
                            },
                        ],
                        combinator: 'and',
                    },
                    renameOutput: true,
                    outputKey: 'CANCEL_WITH_REPLACEMENT',
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
                                id: '310acc11-ff0b-4592-a53f-931408355411',
                                leftValue: "={{ $('data handler').item.json.data.action }}",
                                rightValue: 'use',
                                operator: {
                                    type: 'string',
                                    operation: 'equals',
                                },
                            },
                        ],
                        combinator: 'and',
                    },
                    renameOutput: true,
                    outputKey: 'USE',
                },
            ],
        },
        looseTypeValidation: true,
        options: {},
    };

    @node({
        id: '310acc11-ff0b-4592-a53f-931408355412',
        name: 'list',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.4,
        position: [760, -210],
    })
    List = {
        url: "={{ $('data handler').first().json.api.url }}/replacement-entitlements/",
        sendQuery: true,
        queryParameters: {
            parameters: [
                {
                    name: 'client_id',
                    value: "={{ $('data handler').first().json.client.id }}",
                },
                {
                    name: 'status',
                    value: 'available',
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
        id: '310acc11-ff0b-4592-a53f-931408355413',
        name: 'get',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.4,
        position: [760, -70],
    })
    Get = {
        url: "={{ $('data handler').first().json.api.url }}/replacement-entitlements/{{ $('data handler').first().json.data.entitlement_id }}",
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
        id: '310acc11-ff0b-4592-a53f-931408355414',
        name: 'cancel with replacement',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.4,
        position: [760, 70],
    })
    CancelWithReplacement = {
        method: 'POST',
        url: "={{ $('data handler').first().json.api.url }}/replacement-entitlements/from-client-cancellation/{{ $('data handler').first().json.data.appointment_id }}",
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
        id: '310acc11-ff0b-4592-a53f-931408355415',
        name: 'use',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.4,
        position: [760, 210],
    })
    Use = {
        method: 'POST',
        url: "={{ $('data handler').first().json.api.url }}/replacement-entitlements/{{ $('data handler').first().json.data.entitlement_id }}/use",
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
    start_datetime: data.start_datetime,
    professional_id: data.professional_id,
  }).filter(([_, value]) => value !== ''));
})() }}`,
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
        this.Action.out(2).to(this.CancelWithReplacement.in(0));
        this.Action.out(3).to(this.Use.in(0));
    }
}
