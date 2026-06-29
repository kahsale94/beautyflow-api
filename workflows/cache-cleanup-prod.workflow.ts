import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : cache-cleanup-prod
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
    id: '15JP8jcgfI6ZAAn8',
    name: 'cache-cleanup-prod',
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
export class CacheCleanupProdWorkflow {
    // =====================================================================
    // CONFIGURATION DES NOEUDS
    // =====================================================================

    @node({
        id: '91ee8390-50b2-4978-bdff-206e7a162855',
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
        id: 'e0462d2a-11eb-45e5-80ad-798eeb09a83e',
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
        id: 'be44453e-cc1f-4464-85ec-0b346e83fdae',
        name: 'find cache keys',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [-64, 0],
        credentials: { redis: { id: 'zMk8tatRFuFo6wmp', name: 'beautyflow prod' } },
    })
    FindCacheKeys = {
        operation: 'keys',
        keyPattern: '={{ $json.pattern }}',
        getValues: false,
    };

    @node({
        id: 'e0e78ebd-a1c8-455c-a5fe-afc6bcc481f0',
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
        id: 'a35459d5-8b6e-4892-a939-39bf5053b03f',
        name: 'delete cache key',
        type: 'n8n-nodes-base.redis',
        version: 1,
        position: [352, 0],
        credentials: { redis: { id: 'zMk8tatRFuFo6wmp', name: 'beautyflow prod' } },
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
