# Health Dashboard backend

Express + Prisma API for the B2B Customer Health Scoring Dashboard. Matches the frontend contract in `frontend/src/types/api.ts` and [frontend/API-GAPS.md](../frontend/API-GAPS.md).

## Prerequisites

- Node.js 20+
- PostgreSQL 15 — Docker Desktop **or** `brew install postgresql@15`

`docker` is not required. If Terminal says `command not found: docker`, use Homebrew Postgres (see the root README).

## Run locally

Always `cd` into the cloned repo first (not `~`). Then either:

```bash
bash backend/dev.sh
```

Or, from the **repo root**:

```bash
# API + Postgres together
docker compose up --build

# or just Postgres, then run the API on the host
docker compose up -d postgres
cd backend
cp .env.example .env
npm ci
npx prisma generate
npx prisma migrate deploy
npm run db:seed
npm run dev
```

API: [http://localhost:4000](http://localhost:4000)  
Health: [http://localhost:4000/health](http://localhost:4000/health)

Sign-up is Google only. There is no email/password account form.

Set `GOOGLE_CLIENT_ID` to the same OAuth client ID as `NEXT_PUBLIC_GOOGLE_CLIENT_ID`. The first Google account becomes the administrator. Later accounts are read-only unless their email is listed in `GOOGLE_ADMIN_EMAILS` (comma-separated).

Point the frontend at this API:

```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_USE_MOCKS=false
```

## Scripts

```bash
npm run dev          # tsx watch
npm run test:unit    # ScoringCalculator
npm run type-check
npm run db:seed
```

## Jobs

- Ingestion every 15 minutes (jitter mock Stripe / Zendesk / usage metrics, then recalc)
- Daily midnight score snapshots for Recharts
- Manual `POST /api/v1/ingest/trigger` (admin JWT)

Auth is a Google ID token exchanged for an RS256 session JWT. In development, keys are created in `backend/.dev-keys/` on first start.
