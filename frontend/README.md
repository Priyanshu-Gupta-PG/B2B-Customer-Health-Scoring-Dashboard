# Health Dashboard frontend

Next.js (App Router) UI for the B2B Customer Health Scoring Dashboard. Talks to Express at `/api/v1` when the backend is up, or to [MSW](https://mswjs.io) mocks when `NEXT_PUBLIC_USE_MOCKS=true`.

## Prerequisites

- Node.js 20+
- npm 10+

## Run locally

```bash
cd frontend
npm ci
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app redirects `/` to `/dashboard` (then `/login` if you have no session).

### Environment

Copy `.env.example` to `.env.local`. All variables are public (`NEXT_PUBLIC_*`) and are baked in at build time.

| Variable | Default | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000/api/v1` | Express API base. `GET /health` is called on the origin of this URL. |
| `NEXT_PUBLIC_USE_MOCKS` | `true` in `.env.example` | `true` starts the MSW worker and intercepts `/api/v1` + `/health`. Set `false` once Express is running. |

### Demo credentials (MSW only)

From `src/mocks/db.ts`, shown on the login form when mocks are on:

| Role | Email | Password |
| --- | --- | --- |
| Administrator | `admin@company.com` | `Admin123!` |
| CSM (read-only) | `csm@company.com` | `Csm12345!` |

Admin can edit scoring weights and trigger ingestion. CSM can view every screen but cannot save rules or run ingest.

## Scripts

```bash
npm run dev          # next dev
npm run lint
npm run type-check
npm run build
npm start            # next start (after build)
```

## Docker

`next.config.ts` uses `output: "standalone"`. Build from this directory:

```bash
docker build -t health-dashboard-frontend \
  --build-arg NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1 \
  --build-arg NEXT_PUBLIC_USE_MOCKS=false \
  .
docker run --rm -p 3000:3000 health-dashboard-frontend
```

`NEXT_PUBLIC_*` values must be passed as build args; they are inlined at compile time.

## API contract gaps

See [API-GAPS.md](./API-GAPS.md) for mock-only endpoints the UX needs that API-B2B-01 does not define (`GET /dashboard/summary`, `PUT /rules`, `GET /accounts/:id`, audit filters, optional health timestamps).

## Screens

`/login` · `/dashboard` · `/accounts` · `/accounts/[id]` · `/rules` · `/audit-log` · `/settings`
