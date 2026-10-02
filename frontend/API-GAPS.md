# API gaps vs API-B2B-01

The UI follows UX-B2B-01. Several screens need endpoints or fields that **API-B2B-01 does not define**. Those calls are implemented in MSW (`src/mocks/handlers.ts`) and typed in `src/types/api.ts` so the frontend can ship before Express exists.

When the backend lands, either add the gaps below or the frontend will need a follow-up to drop the extra calls.

Base path is `/api/v1` unless noted. Auth is `Authorization: Bearer <jwt>` except `GET /health`.

## Confirmed gaps the UX depends on

### 1. `GET /dashboard/summary` — entire endpoint missing

- **Used by:** `/dashboard` KPI cards, risk donut, top at-risk table, cron badge.
- **Mock:** `GET /api/v1/dashboard/summary` → `DashboardSummary`.
- **Spec:** no dashboard resource at all.
- **Time range:** UX copy mentions changing the dashboard time range. The mock **does not** accept `from` / `to` / `range`. The live UI has no range picker yet (portfolio is “current snapshot”). Adding a range control later requires a query such as `?from=&to=` or `?range=7d|30d|90d` on this endpoint.

### 2. `PUT /rules` — atomic bulk weight update

- **Used by:** Scoring Rules “Edit Scoring Algorithm” modal. Active weights must total exactly 100% in one save so a mid-save portfolio never has weights that do not add to 100.
- **Mock:** `PUT /api/v1/rules` with `{ rules: [{ id, weight_percentage, is_active }] }` → `{ message, rules, accounts_recalculated, duration_ms }`. Admin only. 422 if the active total is not 100.
- **Spec:** only `PATCH /api/v1/rules/:id`. Sequential patches would leave a transient invalid total and trigger N recalculations.
- **Also mocked (spec-compliant, unused by UI):** `PATCH /api/v1/rules/:id` and `useUpdateRule()` exist for a future single-rule editor.

### 3. `GET /accounts/:id` — account detail with raw metrics

- **Used by:** `/accounts/[id]` info card + “Raw metrics” list.
- **Mock:** `GET /api/v1/accounts/:id` → `AccountDetail` (`AccountSummary` plus `domain`, `plan`, `owner_csm`, `created_at`, `metrics[]`).
- **Spec:** list (`GET /accounts`) and history (`GET /accounts/:id/history`) only. No single-account resource and no raw ingested metrics.

### 4. Audit log filters and actor list

- **Used by:** `/audit-log` date + admin dropdown.
- **Mock:**
  - `GET /api/v1/audit-logs?limit=&offset=&actor=&from=&to=`
  - `GET /api/v1/audit-logs/actors` → `{ data: string[] }` (distinct actor emails)
- **Spec:** `GET /audit-logs` with pagination only. No `actor`, `from`, or `to` query params and no actors catalog.

### 5. `GET /health` — optional ingestion timestamps

- **Used by:** Settings (last / next ingest) and `CronStatusIndicator` tooltip.
- **Mock:** `GET {apiOrigin}/health` (outside `/api/v1`, matching the spec’s health placement) includes `last_ingestion_at` and `next_ingestion_at`.
- **Spec:** health reports process/DB/cron status. Those two timestamps are optional extras the UI already treats as optional (`string | null | undefined`).

## Spec endpoints the mock already implements

| Method | Path | Notes |
| --- | --- | --- |
| `POST` | `/api/v1/auth/login` | Seed users below |
| `GET` | `/api/v1/accounts` | `status`, `search`, `limit`, `offset`. UI currently fetches `limit=500` and filters client-side. |
| `GET` | `/api/v1/accounts/:id/history` | `days` 1–90 (UI uses 7 / 30 / 90) |
| `GET` | `/api/v1/rules` | `{ data: ScoringRule[] }` |
| `PATCH` | `/api/v1/rules/:id` | Admin; mocked, not called by the modal |
| `POST` | `/api/v1/ingest/trigger` | Admin; 202 `{ status: "processing" }`; 409 if already running |
| `GET` | `/api/v1/audit-logs` | Pagination plus the gap filters above |
| `GET` | `/health` | Origin, not under `/api/v1` |

## Other mock-only behavior (not extra routes)

No additional HTTP paths exist beyond the tables above. Mock-only **behavior** worth knowing:

- Login seed users (not part of the API spec): `admin@company.com` / `Admin123!` and `csm@company.com` / `Csm12345!`.
- JWT is a base64 JSON blob, not a signed token.
- Manual ingest mutates ~20% of accounts after ~3.5s and writes an `INGESTION_TRIGGERED` audit row.
- Bulk rule save writes `RULES_BULK_UPDATED` (and related) audit actions. Spec only names per-rule updates.
- RFC 7807 `application/problem+json` bodies on 4xx.

## Frontend clients

- `apiClient` (`src/lib/axiosClient.ts`) → `NEXT_PUBLIC_API_URL` (default `http://localhost:4000/api/v1`).
- `originClient` → origin of that URL, used only for `GET /health`.
- 401 on any non-login `apiClient` call clears the session and redirects to `/login?reason=expired`.
