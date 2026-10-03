#!/usr/bin/env bash
# Start the API from this script's folder so a Terminal opened at ~ still works.
set -euo pipefail
cd "$(dirname "$0")"

if [[ ! -f package.json ]]; then
  echo "backend/package.json is missing. cd into the cloned repo first:"
  echo "  cd ~/Projects/B2B-Customer-Health-Scoring-Dashboard"
  exit 1
fi

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Created backend/.env from .env.example"
fi

if [[ ! -d node_modules ]]; then
  npm ci
fi

npx prisma generate
npx prisma migrate deploy

if [[ ! -f .seeded ]]; then
  echo "Seeding demo accounts (first run)..."
  npm run db:seed
  touch .seeded
fi

echo "API:     http://localhost:4000/api/v1"
echo "Health:  http://localhost:4000/health"
npm run dev
