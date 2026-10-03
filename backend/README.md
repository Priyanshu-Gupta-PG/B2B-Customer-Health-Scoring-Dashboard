# Health Dashboard backend

Express + Prisma API for the B2B Customer Health Scoring Dashboard. Matches the frontend contract in `frontend/src/types/api.ts` and [frontend/API-GAPS.md](../frontend/API-GAPS.md).

## Prerequisites

- Node.js 20+
- Docker Desktop (for PostgreSQL)

## Run locally

From the **repo root**:

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

Seed users (same as the frontend mocks):

| Role | Email | Password |
|------|--------|----------|
| Administrator | `admin@company.com` | `Admin123!` |
| CSM | `csm@company.com` | `Csm12345!` |

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

Auth is RS256 JWT. In development, keys are created in `backend/.dev-keys/` on first start.
