import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : availabilities-prod
// Nodes   : 10  |  Connections: 9
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// Webhook                            executeWorkflowTrigger
// Sucess                             set
// GetSlots                           httpRequest                [onError→out(1)]
// DataHandler                        set
// Aggregate                          aggregate
// ErrorReport8                       stopAndError
// HasRequestedStart                  if
// CheckAndSuggest                    httpRequest                [onError→out(1)]
// CheckSuggestSuccess                set
// ErrorReportCheckAndSuggest         stopAndError
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// Webhook
//    → DataHandler
//      → HasRequestedStart
//        → CheckAndSuggest
//          → CheckSuggestSuccess
//         .out(1) → ErrorReportCheckAndSuggest
//       .out(1) → GetSlots
//          → Aggregate
//            → Sucess
//         .out(1) → ErrorReport8
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: 'Mt6dV4M7Z3aoPihh',
    name: 'availabilities-prod',
    active: true,
    isArchived: false,
    projectId: 'UVYVLJNFC5m6HlJG',
    tags: ['Kaiky', 'beautyflow-api'],
    settings: {
        executionOrder: 'v1',
        availableInMCP: true,
        binaryMode: 'separate',
        timeSavedMode: 'fixed',
        errorWorkflow: 'bWdz3xBVwmycvfwW',
        timezone: 'America/Sao_Paulo',
        callerPolicy: 'workflowsFromSameOwner',
    },
})
export class AvailabilitiesProdWorkflow {
    // =====================================================================
    // CONFIGURATION DES NOEUDS
    // =====================================================================

    @node({
        id: '7d870f07-e772-4eda-a43c-25fc849dd327',
        name: 'webhook',
        type: 'n8n-nodes-base.executeWorkflowTrigger',
        version: 1.1,
        position: [-1488, 3488],
    })
    Webhook = {
        workflowInputs: {
            values: [
                {
                    name: 'service_id',
                    type: 'any',
                },
                {
                    name: 'professional_id',
                    type: 'any',
                },
                {
                    name: 'date',
                    type: 'any',
                },
                {
                    name: 'requested_start',
                    type: 'any',
                },
                {
                    name: 'max_suggestions',
                    type: 'any',
                },
                {
                    name: 'search_days_ahead',
                    type: 'any',
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
        id: 'fc9d2d34-51a6-410e-a897-e0dd4c68175c',
        name: 'sucess',
        type: 'n8n-nodes-base.set',
        version: 3.4,
        position: [-352, 3488],
    })
    Sucess = {
        assignments: {
            assignments: [
                {
                    id: '47280dde-f574-420a-aad5-2f0ab42abf9a',
                    name: 'sucess',
                    value: true,
                    type: 'boolean',
                },
                {
                    id: 'efa277d9-3e4a-4938-a6c4-86420ebd2152',
                    name: 'slots',
                    value: "={{ $('aggregate').first().json.slots }}",
                    type: 'array',
                },
            ],
        },
        options: {},
    };

    @node({
        id: 'b12020b3-e37f-46f9-bdd8-d398c9337397',
        name: 'get slots',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.3,
        position: [-800, 3504],
        onError: 'continueErrorOutput',
        alwaysOutputData: false,
    })
    GetSlots = {
        url: "={{ $('data handler').first().json.api.url }}/",
        sendQuery: true,
        queryParameters: {
            parameters: [
                {
                    name: 'professional_id',
                    value: "={{ $('data handler').first().json.data.professional_id }}",
                },
                {
                    name: 'service_id',
                    value: "={{ $('data handler').first().json.data.service_id }}",
                },
                {
                    name: 'date',
                    value: "={{ $('data handler').first().json.data.date }}",
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
        id: 'be1c8e86-0453-4405-b560-15965a2c19b5',
        name: 'data handler',
        type: 'n8n-nodes-base.set',
        version: 3.4,
        position: [-1264, 3488],
    })
    DataHandler = {
        assignments: {
            assignments: [
                {
                    id: 'bccd3750-dfb9-40e6-a88d-1c5d12d857b4',
                    name: 'data.professional_id',
                    value: '={{ $json.professional_id }}',
                    type: 'string',
                },
                {
                    id: '93d4851d-2f2f-4717-98c2-9927bf04763a',
                    name: 'data.service_id',
                    value: '={{ $json.service_id }}',
                    type: 'string',
                },
                {
                    id: 'afcf3dc6-ac01-49f1-8423-32e554ff77c7',
                    name: 'data.date',
                    value: "={{ $json.date || String($json.requested_start || '').split('T')[0] }}",
                    type: 'string',
                },
                {
                    id: '9e7c7b45-649b-410b-8043-ff9a8db64b88',
                    name: 'data.requested_start',
                    value: "={{ String($json.requested_start || '').trim() }}",
                    type: 'string',
                },
                {
                    id: '855a93ad-2f0f-42b4-9de9-33b909002322',
                    name: 'data.max_suggestions',
                    value: '={{ Number($json.max_suggestions || 3) }}',
                    type: 'number',
                },
                {
                    id: '151abb28-a2ba-4e37-9124-19662107f070',
                    name: 'data.search_days_ahead',
                    value: '={{ Number($json.search_days_ahead || 7) }}',
                    type: 'number',
                },
                {
                    id: 'e6f11e62-b572-4ddb-a5fe-7f38833fe05d',
                    name: 'data.has_requested_start',
                    value: "={{ !!String($json.requested_start || '').trim() }}",
                    type: 'boolean',
                },
                {
                    id: 'c58fb11c-cc59-45e3-a817-2fa06e3a5c53',
                    name: 'api',
                    value: `={{ {
  ...$json.api,
  url: $json.api.url + '/availabilities'
} }}`,
                    type: 'object',
                },
                {
                    id: '794b0694-019f-48ff-8718-c143ee66d287',
                    name: 'business',
                    value: '={{ $json.business }}',
                    type: 'object',
                },
                {
                    id: 'c4ae904b-d2b7-4871-9be0-3505fb6d7e89',
                    name: 'client',
                    value: '={{ $json.client }}',
                    type: 'object',
                },
            ],
        },
        options: {},
    };

    @node({
        id: 'ffab22b5-34e3-45f1-a260-bf76d3a11c5c',
        name: 'aggregate',
        type: 'n8n-nodes-base.aggregate',
        version: 1,
        position: [-576, 3488],
    })
    Aggregate = {
        aggregate: 'aggregateAllItemData',
        destinationFieldName: 'slots',
        options: {},
    };

    @node({
        id: '709bdfe3-cae5-4562-a7ec-2457b2843ada',
        name: 'error report 8',
        type: 'n8n-nodes-base.stopAndError',
        version: 1,
        position: [-800, 3648],
    })
    ErrorReport8 = {
        errorType: 'errorObject',
        errorObject: `={
  "error": {
    "workflow": "{{ $workflow.id }}",
    "execution": "{{ $execution.id }}",
    "type": "business.availability_get_slots",
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
    "token": "{{ $('data handler').first().json.api?.token || '' }}",
    "evo_instance": "{{ $('data handler').first().json.api?.evo_instance || '' }}"
  }
}`,
    };

    @node({
        id: 'f5de7fd0-38e9-4272-b58a-7145c7310b7e',
        name: 'has requested start?',
        type: 'n8n-nodes-base.if',
        version: 2.2,
        position: [-1056, 3488],
    })
    HasRequestedStart = {
        conditions: {
            options: {
                caseSensitive: true,
                leftValue: '',
                typeValidation: 'strict',
                version: 2,
            },
            conditions: [
                {
                    id: '1b20abb4-d039-4ece-af16-5d865a0a9b4c',
                    leftValue: "={{ $('data handler').first().json.data.has_requested_start }}",
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
        options: {},
    };

    @node({
        id: 'd71b6acc-f631-45a4-960f-c26b40ba0668',
        name: 'check and suggest',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.3,
        position: [-800, 3184],
        onError: 'continueErrorOutput',
        alwaysOutputData: false,
    })
    CheckAndSuggest = {
        method: 'POST',
        url: "={{ $('data handler').first().json.api.url }}/check-and-suggest",
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
                    name: 'professional_id',
                    value: "={{ Number($('data handler').first().json.data.professional_id) }}",
                },
                {
                    name: 'service_id',
                    value: "={{ Number($('data handler').first().json.data.service_id) }}",
                },
                {
                    name: 'requested_start',
                    value: "={{ $('data handler').first().json.data.requested_start }}",
                },
                {
                    name: 'max_suggestions',
                    value: "={{ Number($('data handler').first().json.data.max_suggestions || 3) }}",
                },
                {
                    name: 'search_days_ahead',
                    value: "={{ Number($('data handler').first().json.data.search_days_ahead || 7) }}",
                },
            ],
        },
        options: {},
    };

    @node({
        id: '4dbecd6a-1640-46ea-af18-5c7a32a49f26',
        name: 'check suggest success',
        type: 'n8n-nodes-base.set',
        version: 3.4,
        position: [-576, 3168],
    })
    CheckSuggestSuccess = {
        assignments: {
            assignments: [
                {
                    id: '1ce7ff5f-508b-4835-9a5f-cc3c287379f5',
                    name: 'sucess',
                    value: true,
                    type: 'boolean',
                },
                {
                    id: '1a4ce6d0-b026-46ed-9b3b-e880b262f5cd',
                    name: 'mode',
                    value: 'check_and_suggest',
                    type: 'string',
                },
                {
                    id: 'ba8a7ac3-ac61-417d-a5e1-adfeb513a81b',
                    name: 'available',
                    value: '={{ $json.available }}',
                    type: 'boolean',
                },
                {
                    id: '0d2d61f5-2942-4aff-9424-2bd6bfc74466',
                    name: 'reason',
                    value: "={{ $json.reason || '' }}",
                    type: 'string',
                },
                {
                    id: '47787ec1-7c32-4f22-b395-7661b060319b',
                    name: 'requested_start',
                    value: '={{ $json.requested_start }}',
                    type: 'string',
                },
                {
                    id: 'a13fddc0-95f7-4352-8613-89f723d11cc8',
                    name: 'requested_end',
                    value: '={{ $json.requested_end }}',
                    type: 'string',
                },
                {
                    id: '32f90a5b-550e-46f6-9373-b0ec543fbaae',
                    name: 'suggestions',
                    value: '={{ $json.suggestions || [] }}',
                    type: 'array',
                },
            ],
        },
        options: {},
    };

    @node({
        id: '7c7e3a77-930a-4369-9916-d287d954e62b',
        name: 'error report check and suggest',
        type: 'n8n-nodes-base.stopAndError',
        version: 1,
        position: [-800, 3328],
    })
    ErrorReportCheckAndSuggest = {
        errorType: 'errorObject',
        errorObject: `={
  "error": {
    "workflow": "{{ $workflow.id }}",
    "execution": "{{ $execution.id }}",
    "type": "business.availability_check_and_suggest",
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
    "token": "{{ $('data handler').first().json.api?.token || '' }}",
    "evo_instance": "{{ $('data handler').first().json.api?.evo_instance || '' }}"
  }
}`,
    };

    // =====================================================================
    // ROUTAGE ET CONNEXIONS
    // =====================================================================

    @links()
    defineRouting() {
        this.Webhook.out(0).to(this.DataHandler.in(0));
        this.DataHandler.out(0).to(this.HasRequestedStart.in(0));
        this.HasRequestedStart.out(0).to(this.CheckAndSuggest.in(0));
        this.HasRequestedStart.out(1).to(this.GetSlots.in(0));
        this.CheckAndSuggest.out(0).to(this.CheckSuggestSuccess.in(0));
        this.CheckAndSuggest.out(1).to(this.ErrorReportCheckAndSuggest.in(0));
        this.GetSlots.out(0).to(this.Aggregate.in(0));
        this.GetSlots.out(1).to(this.ErrorReport8.in(0));
        this.Aggregate.out(0).to(this.Sucess.in(0));
    }
}
