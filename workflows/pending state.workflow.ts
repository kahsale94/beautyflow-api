import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : pending state
// Nodes   : 4  |  Connections: 3
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// Webhook                            executeWorkflowTrigger
// BackToGetName                      executeWorkflow
// PendingState                       switch
// DataHandler                        set
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// Webhook
//    → DataHandler
//      → PendingState
//        → BackToGetName
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: '2BBY2GXe0CWMszlt',
    name: 'pending state',
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
export class PendingStateWorkflow {
    // =====================================================================
    // CONFIGURATION DES NOEUDS
    // =====================================================================

    @node({
        id: '1dd215f4-2e3e-420d-9450-4404b242714a',
        name: 'webhook',
        type: 'n8n-nodes-base.executeWorkflowTrigger',
        version: 1.1,
        position: [-304, 16],
    })
    Webhook = {
        workflowInputs: {
            values: [
                {
                    name: 'state',
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
        id: '147961cd-ed00-4084-8598-36f8ad07cc4a',
        name: 'back to get name',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [320, 16],
    })
    BackToGetName = {
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
                action: 'name',
                business: `={{ {
  id: $('data handler').item.json.business.id,
  name: $('data handler').item.json.business.name
} }}`,
                api: `={{ {
  url: $('data handler').item.json.api.url,
  token: $('data handler').item.json.api.token,
  evo_instance: $('data handler').item.json.api.evo_instance
} }}`,
                client: `={{ {
  remote_jid: $('data handler').item.json.client.remote_jid,
  message: $('data handler').item.json.client.message
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
        options: {},
    };

    @node({
        id: '08f656ad-308b-46c3-9fea-c96b1ec78d61',
        name: 'pending_state',
        type: 'n8n-nodes-base.switch',
        version: 3.4,
        position: [112, 16],
    })
    PendingState = {
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
                                leftValue: "={{ $('data handler').item.json.state }}",
                                rightValue: 'awaiting_name',
                                operator: {
                                    type: 'string',
                                    operation: 'equals',
                                },
                                id: 'e4dbe532-3cf7-4554-bd0c-b2e1cf1f5b6d',
                            },
                        ],
                        combinator: 'and',
                    },
                    renameOutput: true,
                    outputKey: 'NAME',
                },
            ],
        },
        options: {},
    };

    @node({
        id: '4433ef88-5350-4100-aa2a-c9f84b59c455',
        name: 'data handler',
        type: 'n8n-nodes-base.set',
        version: 3.4,
        position: [-96, 16],
    })
    DataHandler = {
        assignments: {
            assignments: [
                {
                    id: 'ed1a2d0c-3412-4fd4-8b4b-9b546488efe5',
                    name: 'state',
                    value: '={{ $json.state }}',
                    type: 'string',
                },
                {
                    id: '352b0e72-b1eb-4dc5-83f6-d22192950632',
                    name: 'business',
                    value: '={{ $json.business }}',
                    type: 'object',
                },
                {
                    id: '04c4d6f9-1957-4f77-8943-36d861e4f03a',
                    name: 'client',
                    value: '={{ $json.client }}',
                    type: 'object',
                },
                {
                    id: 'deb23a92-cd9a-48d4-95b2-66dee01296bb',
                    name: 'api',
                    value: '={{ $json.api }}',
                    type: 'object',
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
        this.PendingState.out(0).to(this.BackToGetName.in(0));
        this.Webhook.out(0).to(this.DataHandler.in(0));
        this.DataHandler.out(0).to(this.PendingState.in(0));
    }
}
