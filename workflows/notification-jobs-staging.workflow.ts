import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : notification-jobs-staging
// Nodes   : 4  |  Connections: 3
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// NotificationSchedule               scheduleTrigger
// ClaimNotificationJobs              httpRequest                [creds] [retry]
// SplitNotificationJobs              splitOut
// DispatchNotificationJob            httpRequest                [creds]
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// NotificationSchedule
//    → ClaimNotificationJobs
//      → SplitNotificationJobs
//        → DispatchNotificationJob
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: '3aHL57uETapQw6IS',
    name: 'notification-jobs-staging',
    active: true,
    isArchived: false,
    projectId: 'UVYVLJNFC5m6HlJG',
    settings: {
        errorWorkflow: 'BxyJLKjTEcfzV18k',
        timezone: 'America/Sao_Paulo',
        executionOrder: 'v1',
        availableInMCP: false,
        callerPolicy: 'workflowsFromSameOwner',
    },
})
export class NotificationJobsStagingWorkflow {
    // =====================================================================
    // CONFIGURATION DES NOEUDS
    // =====================================================================

    @node({
        id: '4cbb78c8-a48b-438e-8799-cbc03b959401',
        name: 'notification schedule',
        type: 'n8n-nodes-base.scheduleTrigger',
        version: 1.3,
        position: [0, 0],
    })
    NotificationSchedule = {
        rule: {
            interval: [
                {
                    field: 'minutes',
                    minutesInterval: 5,
                },
            ],
        },
    };

    @node({
        id: '4cbb78c8-a48b-438e-8799-cbc03b959402',
        name: 'claim notification jobs',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.4,
        position: [240, 0],
        credentials: { httpBearerAuth: { id: 'GOtlhhje8hFoh3UQ', name: 'n8n beautyflow token - staging' } },
        retryOnFail: true,
        waitBetweenTries: 1000,
    })
    ClaimNotificationJobs = {
        method: 'POST',
        url: 'http://backend-staging:8000/v1/notification-jobs/claim',
        authentication: 'genericCredentialType',
        genericAuthType: 'httpBearerAuth',
        sendBody: true,
        specifyBody: 'json',
        jsonBody: '={{ { limit: 20 } }}',
        options: {},
    };

    @node({
        id: '4cbb78c8-a48b-438e-8799-cbc03b959403',
        name: 'split notification jobs',
        type: 'n8n-nodes-base.splitOut',
        version: 1,
        position: [480, 0],
    })
    SplitNotificationJobs = {
        fieldToSplitOut: 'jobs',
        options: {},
    };

    @node({
        id: '4cbb78c8-a48b-438e-8799-cbc03b959404',
        name: 'dispatch notification job',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.4,
        position: [720, 0],
        credentials: { httpBearerAuth: { id: 'GOtlhhje8hFoh3UQ', name: 'n8n beautyflow token - staging' } },
    })
    DispatchNotificationJob = {
        method: 'POST',
        url: '=http://backend-staging:8000/v1/notification-jobs/{{ $json.id }}/dispatch',
        authentication: 'genericCredentialType',
        genericAuthType: 'httpBearerAuth',
        options: {},
    };

    // =====================================================================
    // ROUTAGE ET CONNEXIONS
    // =====================================================================

    @links()
    defineRouting() {
        this.NotificationSchedule.out(0).to(this.ClaimNotificationJobs.in(0));
        this.ClaimNotificationJobs.out(0).to(this.SplitNotificationJobs.in(0));
        this.SplitNotificationJobs.out(0).to(this.DispatchNotificationJob.in(0));
    }
}
