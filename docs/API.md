# PulseScore REST API

Base URL: `{API_ORIGIN}/api/v1`  
Auth: `Authorization: Bearer <JWT>` (except auth + `/health`)

## Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | public | Process, Postgres, cron, mock source URLs |

## Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/login` | public | Email/password → JWT |
| POST | `/auth/google` | public | GIS `id_token` → JWT (signup/login) |
| GET | `/auth/google/config` | public | `{ client_id, configured }` |

## Accounts & dashboard

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/accounts` | JWT | List (`status`, `search`, `limit`, `offset`) |
| GET | `/accounts/:id` | JWT | Detail + metrics |
| GET | `/accounts/:id/history` | JWT | Score snapshots (`days` 1–90; UI uses 30/60/90) |
| GET | `/dashboard/summary` | JWT | KPIs, distribution, top at-risk |

## Scoring rules

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/rules` | JWT | Active/inactive rules |
| PUT | `/rules` | admin | Bulk update weights → batch recalc |
| PATCH | `/rules/:id` | admin | Patch one rule → batch recalc |

## Ingestion

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/ingest/trigger` | admin | Run mock Stripe/Zendesk/product ingest + recalc |

## Playbooks (PRD F-011)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/playbooks` | JWT | List tasks (`status=open\|done`, `limit`, `offset`) |
| POST | `/playbooks/:id/complete` | admin | Mark task done |

## Audit

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/audit-logs` | JWT | Paginated audit trail |
| GET | `/audit-logs/actors` | JWT | Distinct actor emails |

## Side-effect env vars

| Env | PRD | Behavior |
|-----|-----|----------|
| `ALERT_WEBHOOK_URL` | F-010 | Slack-compatible POST when an account becomes Critical |
| `CRM_SYNC_URL` | F-009 | POST full score set after each recalculation |
| `GOOGLE_CLIENT_ID` | Auth | GIS audience |
| `STRIPE_MOCK_URL` / `ZENDESK_MOCK_URL` / `PRODUCT_MOCK_URL` | F-001 | Mock ingestion sources |
