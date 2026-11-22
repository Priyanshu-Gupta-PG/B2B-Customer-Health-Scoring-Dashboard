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

Point the API at the mock websites (defaults already match local ports):

```bash
# backend/.env
STRIPE_MOCK_URL=http://localhost:4101
ZENDESK_MOCK_URL=http://localhost:4102
PRODUCT_MOCK_URL=http://localhost:4103
```

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

With `NEXT_PUBLIC_USE_MOCKS=true` the frontend runs without the API.

Admin **Trigger ingestion** on Settings pulls fresh random metrics from the three
mock websites, recalculates 0–100 health scores, and updates the dashboard.
