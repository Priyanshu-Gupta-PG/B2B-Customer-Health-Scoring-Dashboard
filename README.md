# B2B Customer Health Scoring Dashboard

Internal Customer Success console: deterministic 0–100 health scores from billing, support, and product usage.

## Layout

```
frontend/   Next.js dashboard (MSW mocks or live API)
backend/    Express + Prisma + node-cron
docker-compose.yml   PostgreSQL 15
```

## Quick start

```bash
# 1. Database
docker compose up -d postgres

# 2. API
cd backend
cp .env.example .env
npm ci
npx prisma generate
npx prisma migrate deploy
npm run db:seed
npm run dev

# 3. UI (second terminal)
cd frontend
cp .env.example .env.local
# set NEXT_PUBLIC_USE_MOCKS=false to talk to Express
npm ci
npm run dev
```

- UI: http://localhost:3000  
- API: http://localhost:4000/api/v1  
- Health: http://localhost:4000/health  

Demo users: `admin@company.com` / `Admin123!` and `csm@company.com` / `Csm12345!`.

With `NEXT_PUBLIC_USE_MOCKS=true` the frontend runs without the API.
