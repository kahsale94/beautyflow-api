# WhatsApp providers and CoverCut staging rollout

Beautyflow keeps one provider-agnostic `whatsapp_connections` record per
business. Existing Evolution records are backfilled and remain available through
the compatibility layer. New CoverCut connections use one SaaS subaccount per
business and a stable server-generated `external_id`.

This rollout is staging-only. Do not apply the migration, environment changes,
webhooks, numbers, credentials, or n8n workflow changes to production without a
separate authorization and rollout plan.

## Runtime flows

- Onboarding: authenticated admin -> `WhatsAppConnectionService` -> selected
  provider. CoverCut calls `/saas/create`, stores only identifiers/status, and
  returns the short-lived `direct_link` to the current browser response.
- Reconciliation: the signed CoverCut SaaS webhook associates
  `external_id -> business`, rejects collisions, and stores the exact
  `phone_number_id`. Admin status refresh reads the provider and normalizes its
  state.
- Inbound: CoverCut -> signed Beautyflow webhook -> exact
  `phone_number_id -> connection -> active business/integration` lookup -> event
  receipt/deduplication -> text/audio normalization -> staging n8n webhook.
  Audio is downloaded server-side with a size limit; CoverCut credentials never
  reach n8n.
- Outbound: n8n authenticates with a business-integration token and calls
  `POST /v1/whatsapp/messages`. Beautyflow resolves the connection inside that
  token scope and supplies the provider source identifier. Clients cannot submit
  `from` or a connection identifier.
- Reminders: the backend claims the reminder under a row lock. Evolution keeps
  the legacy text contract; CoverCut sends the approved utility template and
  persists the external message id before marking the reminder sent.

Webhook receipts contain hashes, identifiers, type and processing state, not raw
customer payloads. A duplicate message event cannot be forwarded twice. Status
events older than the last accepted provider timestamp are ignored. An
ambiguous outbound timeout is returned as indeterminate and must not be retried
automatically.

## Selecting a provider

`WHATSAPP_ENABLED_PROVIDERS` controls which adapters may run. An existing
database connection is authoritative. For the first provisioning only, the
backend reads `BusinessIntegration.config.whatsapp_provider`; if absent it uses
`WHATSAPP_DEFAULT_PROVIDER`.

Example staging integration config:

```json
{"whatsapp_provider": "covercut"}
```

Do not store CoverCut API or webhook secrets in this JSON.

The generic n8n authentication header is:

```text
X-WhatsApp-Connection: covercut:<phone_number_id>
```

`X-Evolution-Instance` and `X-Business-Phone` remain accepted as compatibility
inputs for production workflows that have not migrated yet.

## CoverCut configuration

Use the official CoverCut dashboard/account intended for staging:

1. Obtain an API key and API secret and configure them only on the Beautyflow
   backend.
2. Generate separate random secrets for the messages webhook and SaaS events.
3. Configure the global messages webhook as
   `https://<staging-api-host>/v1/webhooks/covercut/messages`.
4. Configure the SaaS notification webhook as
   `https://<staging-api-host>/v1/webhooks/covercut/saas`.
5. Put each corresponding webhook secret in the staging backend environment.
6. Set `COVERCUT_N8N_WEBHOOK_URL` to
   `https://n8n.techlegacy.com.br/webhook/beautyflow-staging` and keep the
   existing `N8N_WEBHOOK_HEADER`/`N8N_WEBHOOK_SECRET` pair aligned with n8n.
7. Enable `covercut` and configure the target business integration as shown
   above.

The server authenticates CoverCut requests with `X-API-Key` and
`X-API-Secret`. Signed webhooks use the raw request body plus
`X-BSP-Signature` and `X-BSP-Timestamp`; SaaS events also require a matching
`X-BSP-Event`. The timestamp must be syntactically valid; replay protection is
provided by event deduplication because the current documentation does not
define a timestamp-expiry window.

The documented account limits are 60 requests/minute on Basic and 180/minute
on Pro. The client applies bounded backoff only to safe reads and documented
idempotent operations; message sends are never retried after an ambiguous
network failure.

CoverCut onboarding is idempotent by stable `external_id`. The `direct_link` is
not persisted or logged. The browser accepts only the documented embedded
signup messages from the exact origin of that URL, and then polls the backend as
the authoritative source of connection status.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `WHATSAPP_ENABLED_PROVIDERS` | yes | Comma-separated adapters, e.g. `evolution,covercut` in staging |
| `WHATSAPP_DEFAULT_PROVIDER` | yes | Provider used only for first provisioning |
| `COVERCUT_API_BASE_URL` | CoverCut | Normally `https://api.covercut.com.br/api/v1` |
| `COVERCUT_API_KEY` | CoverCut | Server-side key from CoverCut |
| `COVERCUT_API_SECRET` | CoverCut | Server-side secret from CoverCut |
| `COVERCUT_REQUEST_TIMEOUT_SECONDS` | no | HTTP timeout, default `15` |
| `COVERCUT_MESSAGE_WEBHOOK_SECRET` | CoverCut | HMAC secret configured for message events |
| `COVERCUT_SAAS_WEBHOOK_SECRET` | CoverCut | HMAC secret configured for SaaS events |
| `COVERCUT_N8N_WEBHOOK_URL` | CoverCut | Beautyflow main n8n webhook for this environment |
| `COVERCUT_EXTERNAL_ID_PREFIX` | no | Stable environment-specific namespace |
| `COVERCUT_MEDIA_MAX_BYTES` | no | Maximum downloaded inbound media size; default 20 MiB |
| `COVERCUT_REMINDER_TEMPLATE_NAME` | CoverCut reminders | Approved template name |
| `COVERCUT_REMINDER_TEMPLATE_LANGUAGE` | CoverCut reminders | Approved language, default `pt_BR` |

Use `.env.staging.example` as a key list. Every `replace-with-*` entry is a
placeholder, never a usable secret.

## Appointment reminder template

Create this template in the staging WABA through CoverCut/Meta:

- Name: `appointment_reminder`
- Category: `UTILITY`
- Language: `pt_BR`
- Body: `Olá, {{1}}! Lembrete de agendamento na {{2}}: {{3}} com {{4}}, {{5}} ({{6}}) às {{7}}.`

Variables, in order:

| Position | Value | Example |
| --- | --- | --- |
| `{{1}}` | client name | `Joana` |
| `{{2}}` | business name | `Salão da Ana` |
| `{{3}}` | service | `Corte` |
| `{{4}}` | professional | `Ana` |
| `{{5}}` | localized weekday | `terça-feira` |
| `{{6}}` | local date | `08/09/2026` |
| `{{7}}` | local time | `12:30` |

Set the exact approved name and language in the two reminder environment
variables. Confirm the template state is `APPROVED` for the staging WABA before
testing scheduled or manual reminders. A Meta App owned by Beautyflow is not
required for this CoverCut BSP implementation. Each test business still needs an
eligible Meta business portfolio/WABA, an eligible test number and any payment
or business verification required by Meta for its account and template use.

## Staging deployment and E2E checklist

1. Deploy this branch only to the isolated staging backend/database/Redis.
2. Fill `.env.staging.example` values in the staging secret manager and run
   `alembic upgrade head` against only the staging database.
3. Configure CoverCut webhooks and secrets, create/approve the utility template,
   and deploy/activate the staging n8n workflows.
4. In an active business-integration link, select CoverCut, open Admin >
   Integrations, click Connect, complete embedded signup with a non-production
   number, and wait for the signed SaaS event. Expected: the panel reports
   connected and the database owns exactly that `phone_number_id`.
5. Send inbound text. Expected: one normalized execution in `main-staging`, one
   gateway outbound and one client reply from the same tenant number.
6. Send inbound audio. Expected: bounded server-side media download, n8n
   transcription and a reply without CoverCut credentials in n8n.
7. Replay the same signed event. Expected: `duplicate` and no second n8n run.
8. Repeat with two businesses/numbers. Expected: no cross-tenant token,
   connection, source number or response.
9. Trigger manual and scheduled reminders. Expected: approved template delivery,
   persisted external message id and `sent`; ambiguous failures remain for
   reconciliation rather than blind retry.
10. Suspend/reconnect the staging number. Expected: normalized disconnected and
    connected states in the admin. Use Remove only when permanent CoverCut
    disconnect is intended.

Real-number E2E cannot be completed until staging credentials, public backend
URL, WABA/test number and approved template are available. Static and mocked
tests do not replace that final validation.

## n8n staging contract

Staging workflows call the backend messaging gateway and contain no Evolution
community nodes or CoverCut credentials. They retain the existing Beautyflow
business-integration bearer credential, Redis staging credential, AI,
Gmail/Calendar and shared Beautyflow webhook authentication. Credential IDs are
preserved during sync. A legacy shared webhook credential may still have
"Evolution" in its display name; it can be renamed manually without changing
its value or ID, but no new credential is required.

Production workflows remain Evolution-based during this phase and must not be
promoted or synchronized from the staging files.

## Migration and rollback

Revision `0013_whatsapp_connections` adds `whatsapp_connections`, backfills every
legacy `evolution_instances` row, and adds `whatsapp_webhook_events`. Unique
constraints enforce one connection per business and globally unique, indexed
provider identifier/external reference. The compatibility table remains in
place.

Downgrade first upserts generic Evolution rows back into
`evolution_instances`, then removes the two new tables. CoverCut-only data has no
legacy representation and is therefore removed on downgrade; export it before
an intentional rollback.
