import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : availabilities-staging
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
    id: '249kJRLhcloHLPCk',
    name: 'availabilities-staging',
    active: true,
    isArchived: false,
    tags: ['Kaiky', 'beautyflow-api'],
    settings: {
        executionOrder: 'v1',
        availableInMCP: true,
        binaryMode: 'separate',
        timeSavedMode: 'fixed',
        errorWorkflow: 'BxyJLKjTEcfzV18k',
        timezone: 'America/Sao_Paulo',
        callerPolicy: 'workflowsFromSameOwner',
    },
})
export class AvailabilitiesStagingWorkflow {
    // =====================================================================
    // CONFIGURATION DES NOEUDS
    // =====================================================================

    @node({
        id: '611765fc-140d-4fc0-92e3-5e37b8a1899a',
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
                    name: 'exclude_appointment_id',
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
                    name: 'replacement_mode',
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
        id: '33198a3d-2f61-433a-9bf9-4d1d86f4037c',
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
        id: 'e2e3dfa2-dfc1-48f4-9d6c-156927896875',
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
        id: '539d57b5-01a0-4a12-9e2a-ea49e6051abb',
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
                    id: 'bd80df92-6d31-4553-9e25-baa1a53b7cc7',
                    name: 'data.exclude_appointment_id',
                    value: "={{ ($json.replacement_mode === true || String($json.replacement_mode).toLowerCase() === 'true') ? '' : String($json.exclude_appointment_id || '').trim() }}",
                    type: 'string',
                },
                {
                    id: 'e94485a5-c4bc-4ffc-b81b-fb36d76093ae',
                    name: 'data.replacement_mode',
                    value: '={{ $json.replacement_mode === true || String($json.replacement_mode).toLowerCase() === "true" }}',
                    type: 'boolean',
                },
                {
                    id: '855a93ad-2f0f-42b4-9de9-33b909002322',
                    name: 'data.max_suggestions',
                    value: '={{ Math.min(10, Math.max(1, Number($json.max_suggestions ?? 3) || 3)) }}',
                    type: 'number',
                },
                {
                    id: '151abb28-a2ba-4e37-9124-19662107f070',
                    name: 'data.search_days_ahead',
                    value: '={{ Math.min(60, Math.max(0, Number($json.search_days_ahead ?? 7))) }}',
                    type: 'number',
                },
                {
                    id: 'e6f11e62-b572-4ddb-a5fe-7f38833fe05d',
                    name: 'data.has_requested_start',
                    value: "={{ !!String($json.requested_start || '').trim() }}",
                    type: 'boolean',
                },
                {
                    id: 'fa06b47a-b816-4f25-b312-fbc87b6d1fa8',
                    name: 'data.studio_mode',
                    value: "={{ Boolean($json.business?.features?.capacity_based_booking) && !String($json.professional_id || '').trim() }}",
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
        id: '6f73ffbf-aca1-445d-9a7a-151bcb15090f',
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
        id: '2cce2dac-c2b2-4d68-b71d-053f7662d8e1',
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
    "token": "",
    "connection_key": "{{ $('data handler').first().json.api?.connection_key || '' }}"
  }
}`,
    };

    @node({
        id: '038a3405-2c46-4f1c-9187-e480cf044840',
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
        id: '10c64e06-1faf-4ef0-8536-83213f59d12f',
        name: 'check and suggest',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.3,
        position: [-800, 3184],
        onError: 'continueErrorOutput',
        alwaysOutputData: false,
    })
    CheckAndSuggest = {
        method: 'POST',
        url: "={{ $('data handler').first().json.api.url }}/{{ $('data handler').first().json.data.studio_mode ? 'studio/check-and-suggest' : 'check-and-suggest' }}",
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
  const client = $('data handler').first().json.client || {};
  const optionalNumber = (value) => {
    const text = String(value ?? '').trim();
    if (!text) return undefined;
    const number = Number(text);
    return Number.isFinite(number) && number > 0 ? number : undefined;
  };

  return Object.fromEntries(
    Object.entries({
      professional_id: data.studio_mode ? undefined : Number(data.professional_id),
      service_id: Number(data.service_id),
      requested_start: data.requested_start,
      client_id: optionalNumber(client.id),
      exclude_appointment_id: optionalNumber(data.exclude_appointment_id),
      max_suggestions: Math.min(10, Math.max(1, Number(data.max_suggestions ?? 3) || 3)),
      search_days_ahead: Math.min(60, Math.max(0, Number(data.search_days_ahead ?? 7))),
    }).filter(([_, value]) => value !== undefined && value !== null && String(value).trim() !== '')
  );
})() }}`,
        options: {},
    };

    @node({
        id: 'e0563caa-6650-41dd-8351-cddd20e739a8',
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
                    value: "={{ $('data handler').first().json.data.studio_mode ? 'studio_capacity' : 'check_and_suggest' }}",
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
                    value: `={{ ($json.suggestions || [])
  .filter(slot => String(slot.start_datetime || '') !== String($json.requested_start || ''))
  .slice(0, Math.min(10, Math.max(1, Number($('data handler').first().json.data.max_suggestions ?? 3) || 3)))
  .map((slot, index) => ({
    ...slot,
    index: index + 1,
    start_datetime: slot.start_datetime,
    end_datetime: slot.end_datetime
  })) }}`,
                    type: 'array',
                },
                {
                    id: '3de62736-9209-44df-b274-7020c3daef65',
                    name: 'weekday',
                    value: "={{ $json.weekday || '' }}",
                    type: 'string',
                },
                {
                    id: '52d0e902-fb86-443e-821b-86f24bd2b5cd',
                    name: 'capacity',
                    value: '={{ ({ total: $json.total_capacity ?? null, occupied: $json.occupied ?? null, remaining: $json.remaining_capacity ?? null, professionals: $json.professionals || [] }) }}',
                    type: 'object',
                },
                {
                    id: '33298483-d01a-475f-80f8-38d608b4a744',
                    name: 'replacement_mode',
                    value: "={{ $('data handler').first().json.data.replacement_mode }}",
                    type: 'boolean',
                },
                {
                    id: 'ad68046c-36d3-4dd6-8405-36ba638ef2cb',
                    name: 'replacement_ready',
                    value: `={{ $('data handler').first().json.data.replacement_mode
  ? (!$json.available && Array.isArray($json.suggestions) && $json.suggestions.length > 0)
  : false }}`,
                    type: 'boolean',
                },
            ],
        },
        options: {},
    };

    @node({
        id: '8af5aa98-0822-4125-93b3-a11e6258d7ee',
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
    "token": "",
    "connection_key": "{{ $('data handler').first().json.api?.connection_key || '' }}"
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
