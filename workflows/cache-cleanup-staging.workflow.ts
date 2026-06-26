import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : cache-cleanup-staging
// Nodes   : 5  |  Connections: 4
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// CleanupSchedule                    scheduleTrigger
// CachePatterns                      code
// FindCacheKeys                      redis                      [creds]
// SplitCacheKeys                     splitOut
// DeleteCacheKey                     redis                      [creds] [retry]
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// CleanupSchedule
//    → CachePatterns
//      → FindCacheKeys
//        → SplitCacheKeys
//          → DeleteCacheKey
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: 'cfrWX2pDQLbefiBu',
    name: 'cache-cleanup-staging',
    active: true,
    isArchived: false,
    projectId: 'UVYVLJNFC5m6HlJG',
    settings: {
        timezone: 'America/Sao_Paulo',
        executionOrder: 'v1',
        availableInMCP: true,
        callerPolicy: 'workflowsFromSameOwner',
    },
})
export class CacheCleanupStagingWorkflow {
    // =====================================================================
    // CONFIGURATION DES NOEUDS
    // =====================================================================

    @node({
        id: 'a79d0686-0487-43de-a658-b2dfdfd37496',
        name: 'cleanup schedule',
        type: 'n8n-nodes-base.scheduleTrigger',
        version: 1.3,
        position: [-480, 0],
    })
    CleanupSchedule = {
        rule: {
            interval: [
                {
                    field: 'days',
                    daysInterval: 1,
                    triggerAtHour: 3,
                    triggerAtMinute: 0,
                },
            ],
        },
    };

    @node({
        id: 'db974ed5-9544-4fc5-bdc4-0efe2dd13c8a',
        name: 'cache patterns',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [-272, 0],
    })
    CachePatterns = {
        jsCode: `const patterns = [
  'beautyflow_bot.*.business_context',
  'beautyflow_bot.*.*.service_context',
  'beautyflow_bot.*.*.professional_context',
  'beautyflow_bot.*.client_context',
  'beautyflow_bot.*.outside_hours_context',
];

return patterns.map(pattern => ({ json: { pattern } }));`,
    };

    @node({
        id: '62c5043a-5e35-47d1-b530-229dbc143353',
        name: 'find cache keys',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [-64, 0],
        credentials: { redis: { id: 'yq1GIl0nbdK5QpYm', name: 'beautyflow test' } },
    })
    FindCacheKeys = {
        operation: 'keys',
        keyPattern: '={{ $json.pattern }}',
        getValues: false,
    };

    @node({
        id: '0229b14b-64b7-4324-90ba-691dca843693',
        name: 'split cache keys',
        type: 'n8n-nodes-base.splitOut',
        version: 1,
        position: [144, 0],
    })
    SplitCacheKeys = {
        fieldToSplitOut: 'keys',
        options: {},
    };

    @node({
        id: 'd7e04a24-5c86-4cef-b02e-9d28c4e2dc5e',
        name: 'delete cache key',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [352, 0],
        credentials: { redis: { id: 'yq1GIl0nbdK5QpYm', name: 'beautyflow test' } },
        retryOnFail: true,
    })
    DeleteCacheKey = {
        operation: 'delete',
        key: '={{ $json.keys }}',
    };

    // =====================================================================
    // ROUTAGE ET CONNEXIONS
    // =====================================================================

    @links()
    defineRouting() {
        this.CleanupSchedule.out(0).to(this.CachePatterns.in(0));
        this.CachePatterns.out(0).to(this.FindCacheKeys.in(0));
        this.FindCacheKeys.out(0).to(this.SplitCacheKeys.in(0));
        this.SplitCacheKeys.out(0).to(this.DeleteCacheKey.in(0));
    }
}
