import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : recurring-materialization-staging
// Nodes   : 2  |  Connections: 1
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// RecurringMaterializationSchedule   scheduleTrigger
// MaterializeDueRecurringSchedules   httpRequest                [creds] [retry]
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// RecurringMaterializationSchedule
//    → MaterializeDueRecurringSchedules
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: 'g37NTLLfR2JGaQTq',
    name: 'recurring-materialization-staging',
    active: false,
    isArchived: false,
    settings: {
        errorWorkflow: 'BxyJLKjTEcfzV18k',
        timezone: 'America/Sao_Paulo',
        executionOrder: 'v1',
        availableInMCP: false,
        callerPolicy: 'workflowsFromSameOwner',
    },
})
export class RecurringMaterializationStagingWorkflow {
    // =====================================================================
    // CONFIGURATION DES NOEUDS
    // =====================================================================

    @node({
        id: 'f1f99a2c-aeaf-4a6e-9c1c-d9fe1a6f949a',
        name: 'recurring materialization schedule',
        type: 'n8n-nodes-base.scheduleTrigger',
        version: 1.3,
        position: [0, 0],
    })
    RecurringMaterializationSchedule = {
        rule: {
            interval: [
                {
                    field: 'hours',
                    hoursInterval: 1,
                },
            ],
        },
    };

    @node({
        id: 'dfac2cb8-c4a3-4503-92d6-d1a6583e052a',
        name: 'materialize due recurring schedules',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.4,
        position: [280, 0],
        credentials: { httpBearerAuth: { id: 'GOtlhhje8hFoh3UQ', name: 'n8n beautyflow token - staging' } },
        retryOnFail: true,
        waitBetweenTries: 5000,
    })
    MaterializeDueRecurringSchedules = {
        method: 'POST',
        url: 'http://backend-staging:8000/v1/recurring-schedules/materialize-due',
        authentication: 'genericCredentialType',
        genericAuthType: 'httpBearerAuth',
        options: {},
    };

    // =====================================================================
    // ROUTAGE ET CONNEXIONS
    // =====================================================================

    @links()
    defineRouting() {
        this.RecurringMaterializationSchedule.out(0).to(this.MaterializeDueRecurringSchedules.in(0));
    }
}
