# Beautyflow API

Multi-tenant backend for appointment management, an administrative panel, and
automated WhatsApp service flows.

Beautyflow manages businesses, users, clients, professionals, services,
availability rules, schedule blocks, and appointments. When a business is
created without a slug, the backend generates one automatically. The application
also provisions one Evolution API WhatsApp instance per business and connects
the conversation flow to n8n workflows.

## Main Features

- Versioned REST API under `/v1`.
- Server-rendered admin panel under `/admin`.
- Business-scoped data isolation.
- User, professional, service, and integration activation/deactivation.
- Client management, weekly availability, and schedule blocks.
- Appointment creation, update, confirmation, completion, and cancellation.
- Configurable booking notice, scheduling horizon, slot interval, and
  cancellation rules.
- PostgreSQL-level protection against appointment and schedule block overlaps.
- JWT authentication with access tokens and revocable refresh tokens.
- WhatsApp onboarding with QR Code through Evolution API.
- n8n automation for conversation handling and scheduling tools.
- Redis-backed rate limiting with an in-memory fallback.
- Liveness and readiness health checks.
- Alembic migrations, automated tests, and CI validation.

## Architecture

```text
Admin user
    |
    v
Admin /admin -----------+
                       |
API client ----> FastAPI ----> Services ----> Repositories ----> PostgreSQL
                       |                           |
                       |                           +--> business rules and scope
                       |
                       +--> Redis
                       |    - rate limiting
                       |    - workflow state support
                       |
                       +--> Evolution API
                       |    - one WhatsApp instance per business
                       |    - QR Code, status, logout, and removal
                       |
                       +--> n8n
                            - automated service flow
                            - scheduling tools
                            - error handling
```

### Components

| Component | Responsibility |
| --- | --- |
| FastAPI | API, admin panel, authentication, and business rules |
| PostgreSQL | Transactional data, constraints, and concurrency protection |
| Redis | Rate limiting and workflow state support |
| Evolution API | WhatsApp connection for each business |
| n8n | Service automation and API orchestration |
| Alembic | Database migration versioning |

## Technology Stack

- Python 3.14
- FastAPI 0.136
- SQLAlchemy 2
- PostgreSQL 16
- Redis 7.2
- Alembic
- Jinja2
- Pydantic 2
- Pytest
- Docker and Docker Compose
- n8n and n8n-as-code
- Evolution API with `WHATSAPP-BAILEYS`

## Project Structure

```text
.
|-- alembic/                    # Active database migrations
|-- src/
|   |-- admin/                  # Admin dependencies and routes
|   |-- api/
|   |   |-- health_routes.py    # Liveness and readiness endpoints
|   |   `-- v1/                 # Public API endpoints
|   |-- clients/                # Evolution API HTTP client
|   |-- core/                   # Config, database, logging, errors
|   |-- middlewares/            # Logging, rate limit, security headers
|   |-- models/                 # SQLAlchemy models
|   |-- repositories/           # Data access layer
|   |-- schemas/                # Pydantic contracts
|   |-- security/               # JWT, passwords, refresh tokens
|   |-- services/               # Business rules
|   |-- static/admin/           # Admin CSS and JavaScript
|   `-- templates/admin/        # Admin Jinja templates
|-- tests/                      # Automated tests
|-- workflows/                  # n8n workflows as TypeScript
|-- docker-compose.yml          # Production stack
|-- Dockerfile                  # Backend image
|-- n8nac-config.json           # n8n-as-code environments
`-- PRODUCTION_CHECKLIST.md     # Release checklist
```

## API Domains

Business endpoints use the `/v1` prefix.

| Domain | Prefix | Main operations |
| --- | --- | --- |
| Authentication | `/v1/auth` | User login, refresh, logout, integration login |
| Users | `/v1/users` | Profile, list, create, update, deactivate |
| Businesses | `/v1/businesses` | Lookup, create, configure, deactivate |
| Clients | `/v1/clients` | Create, search, update |
| Professionals | `/v1/professionals` | Create, update, deactivate |
| Services | `/v1/services` | Create, update, deactivate |
| Professional services | `/v1/professional-services` | Professional-service links |
| Availabilities | `/v1/availabilities` | Weekly availability, slots, suggestions |
| Schedule blocks | `/v1/schedule-blocks` | Create, list, cancel |
| Appointments | `/v1/appointments` | List, create, update, confirm, complete, cancel |
| Integrations | `/v1/integrations` | External integration credentials |
| Business integrations | `/v1/business-integrations` | Per-business integration links and config |

Interactive docs are available in development:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

Docs and the OpenAPI schema are disabled when `ENVIRONMENT=production`.

## Admin Panel

The admin panel is available at `/admin/login` and includes:

- dashboard and business selection for super admins;
- monthly, weekly, daily, and list calendar views;
- appointment and schedule block management;
- client, professional, service, and user management;
- business configuration and booking rules;
- professional-service links;
- weekly availability configuration;
- integration management;
- WhatsApp connection through QR Code;
- authenticated user password changes.

The panel uses `HttpOnly` cookies, CSRF protection for mutating actions, and
requires secure cookies in production.

## Authentication and Scope

The system has three token contexts with independent secrets:

| Context | Usage |
| --- | --- |
| User | API and admin panel access |
| Integration | Authenticates an external system, such as n8n |
| Business integration | Restricts automation to one business |

User login returns the access token in the response body and stores the refresh
token in an `HttpOnly` cookie. The refresh token can also be sent in the request
body for non-cookie clients, but it must never be sent in the URL.

To obtain a per-business integration token:

1. authenticate the integration;
2. call `POST /v1/auth/integration`;
3. send `X-Evolution-Instance` with the Evolution instance name;
4. use `X-Business-Phone` only as a legacy fallback.

Business operations use the `business_id` from the token. A regular user cannot
switch business scope through request parameters.

## Booking Rules

Booking rules are configured per business:

| Field | Default | Rule |
| --- | ---: | --- |
| `booking_enabled` | `true` | Allows new bookings |
| `slot_interval_minutes` | `15` | Time slot step, from 1 to 240 minutes |
| `minimum_notice_minutes` | `0` | Minimum booking notice |
| `maximum_schedule_days` | `30` | Scheduling horizon, from 1 to 365 days |
| `allow_client_cancel` | `true` | Allows client-side cancellation |
| `cancel_limit_hours` | `24` | Cancellation deadline |
| `appointment_confirmation_required` | `false` | Creates appointments as pending confirmation |

Before creating or updating an appointment, the application validates:

- active business, professional, service, and client;
- professional-service link;
- business timezone;
- slot alignment;
- minimum notice and maximum scheduling horizon;
- weekly availability;
- active schedule blocks;
- conflicts with existing appointments.

PostgreSQL exclusion constraints also prevent overlapping scheduled
appointments or active schedule blocks for the same professional. Time ranges
are treated as `[start, end)`, so one appointment can start exactly when the
previous one ends.

Current schedule block reasons are `lunch`, `day_off`, `vacation`, and `sick`.

## WhatsApp and Evolution API

Each business can have one persisted Evolution API instance. New instance names
are deterministic:

```text
<EVOLUTION_INSTANCE_PREFIX>-<business_slug>-<business_id>
```

With the default prefix, this produces names such as
`beautyflow-business-slug-7`. For legacy businesses without a slug, the backend
uses `business` as the slug. If the final name exceeds the 100-character
database limit, the prefix and slug are shortened while the business id remains
appended to avoid collisions.

The admin panel flow:

1. validates the active business-integration link;
2. checks the instance in Evolution API;
3. creates it with `WHATSAPP-BAILEYS` when it does not exist;
4. configures the authenticated `MESSAGES_UPSERT` webhook;
5. requests and displays the QR Code;
6. stores instance name, remote id, state, phone, and timestamps;
7. allows status/QR refresh, logout, and removal.

The Evolution client detects the API version returned by the server and sends a
webhook payload compatible with Evolution v2 or v3.

QR Codes and the global Evolution API key are not persisted in the database.
The global key must stay in environment variables only.

## n8n Workflows

Beautyflow production workflows are versioned in `workflows/`. Staging workflow
files are intentionally ignored by Git and can be kept locally for manual n8n
testing. The workflow tests discover local staging files when they exist, but CI
only depends on the versioned production files.

The repository currently tracks 10 production workflow files:

| Workflow files | Responsibility |
| --- | --- |
| `main-prod` | Webhook intake, memory, agent, and tool routing |
| `businesses-prod` | Business context and configuration |
| `clients-prod` | Client identification and maintenance |
| `professionals-prod` | Professional lookup and selection |
| `services-prod` | Service lookup and selection |
| `availabilities-prod` | Slot checks and suggestions |
| `appointments-prod` | Appointment creation, reminders, and maintenance |
| `pending state-prod` | Intermediate conversation state |
| `cache-cleanup-prod` | Redis/conversation state cleanup |
| `error-prod` | n8n failures and backend error reports |

Workflow notes:

- Local staging workflow files are manual test artifacts. Keep them ignored
  unless a staging workflow is intentionally promoted into the versioned set.
- Static validation warns for `n8n-nodes-evolution-api` community nodes because
  their schemas are not available to `n8nac`; those nodes still require runtime
  credential and execution testing in n8n.

As of the production-readiness audit on 2026-06-26, `npx --yes n8nac list`
reported the Beautyflow workflow set with zero conflicts. Remote-only or local
staging workflows in the same n8n project are outside the Git-tracked production
set and should remain untouched unless they are intentionally adopted or removed.

### n8n Prerequisites

- n8n instance compatible with the versioned workflows;
- API, AI, Redis, Gmail/Calendar, and Evolution credentials required by nodes;
- community node `n8n-nodes-evolution-api` installed and tested;
- main webhook matching `EVOLUTION_WEBHOOK_URL`;
- shared header and secret matching `N8N_WEBHOOK_HEADER` and
  `N8N_WEBHOOK_SECRET`.

n8n credentials and secrets are not stored in Git.

### n8n-as-code Flow

Run commands from this repository root:

```bash
npx --yes n8nac update-ai
npx --yes n8nac env status --json
npx --yes n8nac list
```

Use the `workflowsPath` returned by `env status`; it is the source of truth for
the active environment.

Before editing an existing remote workflow:

```bash
npx --yes n8nac pull <workflow-id>
```

After editing:

```bash
npx --yes n8nac skills validate "workflows/<file>.workflow.ts"
npx --yes n8nac push "workflows/<file>.workflow.ts" --verify
```

Static validation can warn about Evolution community nodes. Those nodes also
need runtime testing in the installed n8n instance.

## Local Development

### Prerequisites

- Python 3.14
- PostgreSQL 16 with `btree_gist`, `pg_trgm`, and `unaccent`
- Redis 7.2
- Deno 2 for admin JavaScript checks
- Node.js/npm for n8n-as-code commands

### Install

```bash
python -m venv .venv
```

PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

Linux/macOS:

```bash
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
```

Create a local `.env`. Minimal configuration:

```dotenv
ENVIRONMENT=development
DATABASE_URL=postgresql+psycopg://beautyflow:beautyflow@localhost:5432/beautyflow
REDIS_URL=redis://localhost:6379/0

ALGORITHM=HS256
USER_SECRET_KEY=development-user-secret
INTEGRATION_SECRET_KEY=development-integration-secret
BUSINESS_INTEGRATION_SECRET_KEY=development-business-integration-secret

USER_ACCESS_TOKEN_EXPIRE_MINUTES=30
USER_REFRESH_TOKEN_EXPIRE_DAYS=7
INTEGRATION_TOKEN_EXPIRE_DAYS=30
BUSINESS_INTEGRATION_TOKEN_EXPIRE_MINUTES=30

CORS_ORIGINS=http://localhost:8000,http://localhost:5173
USER_REFRESH_COOKIE_SECURE=false
ADMIN_COOKIE_SECURE=false
```

To test the full WhatsApp flow, add:

```dotenv
N8N_ERROR_WEBHOOK_URL=https://n8n.example.com/webhook/beautyflow-error
N8N_WEBHOOK_HEADER=X-Beautyflow-Webhook-Secret
N8N_WEBHOOK_SECRET=replace-with-a-shared-secret

EVOLUTION_API_URL=https://evolution.example.com
EVOLUTION_API_KEY=replace-with-the-global-api-key
EVOLUTION_WEBHOOK_URL=https://n8n.example.com/webhook/beauty-api
EVOLUTION_INSTANCE_PREFIX=beautyflow-development
EVOLUTION_REQUEST_TIMEOUT_SECONDS=15
```

Do not use development values in production.

### Database and App

```bash
alembic upgrade head
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

Local URLs:

- API: `http://localhost:8000`
- admin panel: `http://localhost:8000/admin/login`
- health: `http://localhost:8000/health/live`
- Swagger: `http://localhost:8000/docs`

## Environment Variables

`.env.production.example` contains the production template.

### Application and Authentication

| Variable | Required | Description |
| --- | --- | --- |
| `ENVIRONMENT` | no | `development` or `production` |
| `DATABASE_URL` | yes | PostgreSQL SQLAlchemy URL |
| `REDIS_URL` | no | Application Redis URL |
| `ALGORITHM` | yes | `HS256`, `HS384`, or `HS512` |
| `USER_SECRET_KEY` | yes | User token secret |
| `USER_SECRET_KEY_ID` | no | Key id written as `kid` on new user JWTs |
| `USER_SECRET_KEY_FALLBACKS` | no | Previous user secrets accepted only for validation |
| `INTEGRATION_SECRET_KEY` | yes | Integration token secret |
| `INTEGRATION_SECRET_KEY_ID` | no | Key id written as `kid` on new integration JWTs |
| `INTEGRATION_SECRET_KEY_FALLBACKS` | no | Previous integration secrets accepted only for validation |
| `BUSINESS_INTEGRATION_SECRET_KEY` | yes | Per-business token secret |
| `BUSINESS_INTEGRATION_SECRET_KEY_ID` | no | Key id written as `kid` on new business integration JWTs |
| `BUSINESS_INTEGRATION_SECRET_KEY_FALLBACKS` | no | Previous business integration secrets accepted only for validation |
| `USER_ACCESS_TOKEN_EXPIRE_MINUTES` | yes | Access token duration |
| `USER_REFRESH_TOKEN_EXPIRE_DAYS` | yes | Refresh token duration |
| `INTEGRATION_TOKEN_EXPIRE_DAYS` | yes | Integration token duration |
| `BUSINESS_INTEGRATION_TOKEN_EXPIRE_MINUTES` | yes | Business token duration |
| `CORS_ORIGINS` | production | Allowed origins, comma-separated |

### JWT Secret Rotation

`USER_SECRET_KEY`, `INTEGRATION_SECRET_KEY`, and
`BUSINESS_INTEGRATION_SECRET_KEY` are the current signing secrets. New JWTs are
issued with a `kid` header from the matching `*_SECRET_KEY_ID` variable. The
`*_SECRET_KEY_FALLBACKS` variables are comma-separated previous secrets accepted
only for validation during a rotation window. A fallback entry can be either
`kid:secret` or just `secret`; bare secrets support legacy tokens that were
issued before `kid` existed.

Recommended rotation process:

1. Deploy code that supports rotation while keeping the existing current secret.
2. For one token family at a time, set a new current secret and key id, and move
   the previous current secret into that family's fallback list.
3. Keep user fallbacks for at least `USER_REFRESH_TOKEN_EXPIRE_DAYS`, integration
   fallbacks for at least `INTEGRATION_TOKEN_EXPIRE_DAYS`, and business
   integration fallbacks for at least `BUSINESS_INTEGRATION_TOKEN_EXPIRE_MINUTES`
   plus the deploy propagation window.
4. After the window, remove the old fallback and restart the service. Tokens
   signed only by that removed secret will then fail validation.

For user refresh tokens, the stored `jti_hash` is generated with the current user
secret. During rotation, refresh and logout lookups also try hashes generated
with configured user fallbacks. A successful refresh replaces the old record with
a new refresh token and a current-key `jti_hash`. Admin CSRF tokens use the same
user fallback window.

### Security and Rate Limiting

| Variable | Default | Description |
| --- | --- | --- |
| `RATE_LIMIT_REDIS_URL` | `REDIS_URL` | Redis used by the rate limiter |
| `RATE_LIMIT_MAX_REQUESTS` | `300` | General request limit per window |
| `RATE_LIMIT_WINDOW_SECONDS` | `60` | General window in seconds |
| `RATE_LIMIT_AUTH_MAX_REQUESTS` | `10` | Login and refresh limit |
| `RATE_LIMIT_AUTH_WINDOW_SECONDS` | `60` | Auth window in seconds |
| `TRUSTED_PROXY_IPS` | empty | Proxies trusted to forward real client IP |
| `FORWARDED_ALLOW_IPS` | `127.0.0.1` | Proxies accepted by Uvicorn |
| `USER_REFRESH_COOKIE_SECURE` | production: `true` | Requires HTTPS for the refresh cookie |
| `ADMIN_COOKIE_SECURE` | production: `true` | Requires HTTPS for admin cookies |

Cookie names, paths, and `SameSite` values can also be customized through
`USER_REFRESH_COOKIE_*` and `ADMIN_*_COOKIE` variables.

### n8n and Evolution

| Variable | Required in production | Description |
| --- | --- | --- |
| `N8N_ERROR_WEBHOOK_URL` | yes | Webhook that receives unexpected errors |
| `N8N_WEBHOOK_HEADER` | yes | Shared header name |
| `N8N_WEBHOOK_SECRET` | yes | Secret shared with n8n |
| `EVOLUTION_API_URL` | yes | Evolution API base URL |
| `EVOLUTION_API_KEY` | yes | Global Evolution API key |
| `EVOLUTION_WEBHOOK_URL` | yes | n8n message webhook URL |
| `EVOLUTION_INSTANCE_PREFIX` | no | Instance name prefix |
| `EVOLUTION_REQUEST_TIMEOUT_SECONDS` | no | HTTP timeout, default `15` |

In production, the app fails at startup when:

- a JWT secret is shorter than 32 characters;
- authentication cookies are not marked as `Secure`;
- `CORS_ORIGINS` is empty or contains `*`;
- n8n error reporting is not configured;
- Evolution API or the WhatsApp webhook is not configured.

## Tests and Quality

Run the test suite:

```bash
python -m pytest -q
```

Other checks used by CI:

```bash
python -m compileall -q src tests alembic
deno check src/static/admin/js/admin.js src/static/admin/js/calendar.js
alembic upgrade head
alembic check
docker compose config --quiet
docker build -t beautyflow-api:local .
```

The CI pipeline also:

- starts isolated PostgreSQL and Redis services;
- validates all Jinja templates;
- audits `requirements-prod.txt` with `pip-audit`;
- applies and checks migrations;
- builds the production image.

`pytest.ini` adds the project root to `PYTHONPATH`, so `python -m pytest -q`
can import the local `src` package both locally and in GitHub Actions.

## Production Docker

`docker-compose.yml` is designed for production. It runs:

- PostgreSQL with a persistent volume;
- password-protected Redis with AOF enabled;
- a migration job that must finish before the backend starts;
- the backend without publishing a host port directly.

Both networks are external and must exist before deployment:

```bash
docker network create beautyflow-network
docker network create beautyflow-network-ext
```

The second network name must match `BEAUTYFLOW_EXTERNAL_NETWORK`. It allows
private communication between the backend, Redis, n8n, and the reverse proxy.

Prepare the environment:

```bash
cp .env.production.example .env.production
```

Replace every `replace-with` value, keep the three JWT secrets different, and
use strong PostgreSQL and Redis passwords.

Validate and start:

```bash
docker compose --env-file .env.production config --quiet
docker compose --env-file .env.production up -d --build
docker compose --env-file .env.production ps
```

The backend exposes port `8000` only inside Docker networks. Publish the app
through an HTTPS reverse proxy connected to the external network and pointing to
`beautyflow_backend:8000`.

Follow startup logs:

```bash
docker compose --env-file .env.production logs -f db-migrate backend
```

## Health and Observability

| Endpoint | Purpose |
| --- | --- |
| `GET /health/live` | Confirms the process is responding |
| `GET /health/ready` | Checks PostgreSQL, Redis, and current Alembic revision |

Readiness returns HTTP `503` while a required dependency is not ready. Use
`/health/ready` in the reverse proxy and external monitor; the internal
container health check uses `/health/live`.

Unexpected errors receive an `error_id`, are logged without exposing details to
clients, and are sent to the authenticated n8n error webhook. The application
also applies security headers, an admin-panel content security policy, and HSTS
in production when requests arrive through HTTPS.

## Migrations

Create a revision:

```bash
alembic revision --autogenerate -m "describe the change"
```

Review the generated file and apply:

```bash
alembic upgrade head
alembic check
```

Deployments run `alembic upgrade head` in a separate container before starting
the backend. Back up PostgreSQL before production migrations.

## Production Release

The code includes runtime protections and CI validation, but final readiness
depends on infrastructure and external services. Before sending real traffic,
complete every item in [`PRODUCTION_CHECKLIST.md`](PRODUCTION_CHECKLIST.md),
including:

- passing CI and publishing a versioned image;
- validating TLS, proxy, DNS, networks, and volumes;
- testing backup and restore;
- applying migrations;
- checking n8n credentials and the Evolution community node;
- creating an instance, scanning the QR Code, and exchanging messages;
- enabling monitoring, alerts, and a rollback plan.
