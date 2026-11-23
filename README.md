# B2B Customer Health Scoring Dashboard

Internal Customer Success console: deterministic 0–100 health scores from billing, support, and product usage.

## Layout

```
frontend/        Next.js dashboard (MSW mocks or live API)
backend/         Express + Prisma + node-cron
mock-sources/    Three dummy data websites (Stripe / Zendesk / Product usage)
docker-compose.yml   PostgreSQL 15 + mock sources + API
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

### 2. Dummy data websites (Stripe / Zendesk / Product usage)

Real Stripe, Zendesk, and product APIs are not used. Three local websites serve
changing random metrics that the backend ingests:

```bash
cd mock-sources
npm ci
npm start
```

- Stripe invoices UI: http://localhost:4101  
- Zendesk tickets UI: http://localhost:4102  
- Product usage UI: http://localhost:4103  

Hosted on Vercel: [Ledger Wire](https://ledger-wire-stripe-mock.vercel.app), [Desk Relay](https://desk-relay-zendesk-mock.vercel.app), [Signal Meter](https://signal-meter-product-mock.vercel.app).

Each refresh regenerates values. See [mock-sources/README.md](mock-sources/README.md).

### 3. API

```bash
bash backend/dev.sh
```

Point the API at the hosted mock websites (these are the defaults):

```bash
# backend/.env
STRIPE_MOCK_URL=https://ledger-wire-stripe-mock.vercel.app
ZENDESK_MOCK_URL=https://desk-relay-zendesk-mock.vercel.app
PRODUCT_MOCK_URL=https://signal-meter-product-mock.vercel.app
```

Health scores are calculated only from metrics returned by those three sites
(no local synthetic / jitter fallback).

### 4. UI (another terminal)

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
- Mock sources: :4101 (Stripe), :4102 (Zendesk), :4103 (Product)

Demo users: `admin@company.com` / `Admin123!` and `csm@company.com` / `Csm12345!`.

**Google sign-in** (optional, alongside email/password): create an OAuth 2.0 **Web** client in
[Google Cloud Console](https://console.cloud.google.com/apis/credentials), add your UI origin
(e.g. `http://localhost:3000`) under Authorized JavaScript origins, then set the same Client ID in:

- `backend/.env` → `GOOGLE_CLIENT_ID=...`
- `frontend/.env.local` → `NEXT_PUBLIC_GOOGLE_CLIENT_ID=...`
- optional `GOOGLE_ADMIN_EMAILS=you@company.com` so listed emails become admin on first Google sign-up
  (otherwise the first Google account is admin; later ones are CSM)

With `NEXT_PUBLIC_USE_MOCKS=true` the frontend runs without the API.

Admin **Trigger ingestion** on Settings pulls fresh random metrics from the three
mock websites, recalculates 0–100 health scores, and updates the dashboard.

## Render (production)

You need **two** web services (API + UI), not one Docker service at the repo root.

| Service | URL | Settings |
|---------|-----|----------|
| Backend | `https://b2b-customer-health-scoring-dashboard.onrender.com` | Native **Node**, Root Directory `backend` (or Docker with Dockerfile Path `./Dockerfile` / `./backend/Dockerfile`) |
| Frontend | `https://b2b-health-frontend.onrender.com` | Native **Node**, Root Directory `frontend` (or Docker: Dockerfile Path `./frontend/Dockerfile`, Context `./frontend`) |

### Fix: `open Dockerfile: no such file or directory`

That error means the service is **Docker** with context at the **repo root**, but historically there was no root Dockerfile. Main now includes a root `Dockerfile` that builds the **backend**. After pulling latest `main`, **Manual Deploy** again — or switch the service to:

1. **Language / Environment:** Node (not Docker)
2. **Root Directory:** `backend`
3. **Build Command:** `npm install --include=dev && npx prisma generate && npm run build`
4. **Start Command:** `npm start`
5. **Health Check Path:** `/health`

### After a successful deploy

1. Confirm backend env vars (or rely on code defaults):
   - `STRIPE_MOCK_URL=https://ledger-wire-stripe-mock.vercel.app`
   - `ZENDESK_MOCK_URL=https://desk-relay-zendesk-mock.vercel.app`
   - `PRODUCT_MOCK_URL=https://signal-meter-product-mock.vercel.app`
   - `SEED_ON_BOOT=true` (default) — empty DBs auto-seed on startup (free plan has no Shell)
2. First boot creates `admin@company.com` / `Admin123!` and pulls metrics from the mock sites
3. For Google login, set `GOOGLE_CLIENT_ID` on the API and `NEXT_PUBLIC_GOOGLE_CLIENT_ID` on the UI
   (same Web client ID; add the frontend origin in Google Cloud → Authorized JavaScript origins)
4. App → Settings → **Trigger Data Ingestion** to refresh scores
5. `GET /health` should include `git_sha` and `metric_sources` pointing at those Vercel URLs
