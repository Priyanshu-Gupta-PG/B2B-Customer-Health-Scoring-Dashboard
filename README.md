# B2B Customer Health Scoring Dashboard

Internal Customer Success console: deterministic 0–100 health scores from billing, support, and product usage.

## Layout

```
frontend/   Next.js dashboard (MSW mocks or live API)
backend/    Express + Prisma + node-cron
docker-compose.yml   PostgreSQL 15
```

## Quick start

Your Terminal must be inside the cloned repo (the folder that contains `frontend/` and `backend/`).
If the prompt is only `~`, you are in your home folder — `cd backend` and `npm ci` will fail.

```bash
cd ~/Projects/B2B-Customer-Health-Scoring-Dashboard
ls frontend backend
```

### 1. PostgreSQL (pick one)

**Docker Desktop** — only if `docker` works:

```bash
docker compose up -d postgres
```

**Homebrew** — use this when Terminal says `command not found: docker`:

```bash
brew install postgresql@15
brew services start postgresql@15
export PATH="$(brew --prefix postgresql@15)/bin:$PATH"
createuser health_user || true
createdb -O health_user health_db || true
psql -d postgres -c "ALTER USER health_user WITH PASSWORD 'health_password';"
psql -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE health_db TO health_user;"
```

### 2. API

```bash
bash backend/dev.sh
```

### 3. UI (second terminal)

```bash
cd ~/Projects/B2B-Customer-Health-Scoring-Dashboard/frontend
cp .env.example .env.local
# set NEXT_PUBLIC_USE_MOCKS=false to talk to Express
npm ci
npm run dev
```

- UI: http://localhost:3000  
- API: http://localhost:4000/api/v1  
- Health: http://localhost:4000/health  

Sign-up is Google only. Set `GOOGLE_CLIENT_ID` on the API and `NEXT_PUBLIC_GOOGLE_CLIENT_ID` on the UI to the same Google OAuth client ID. The first Google account becomes the administrator. Add more administrators with `GOOGLE_ADMIN_EMAILS`.

With `NEXT_PUBLIC_USE_MOCKS=true` the frontend still loads portfolio data from mocks, but Google sign-up calls the API.
