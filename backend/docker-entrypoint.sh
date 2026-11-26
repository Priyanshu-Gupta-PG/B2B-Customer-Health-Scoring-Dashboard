#!/bin/sh
set -e

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is not set on this Render service."
  echo "Fix: Render Dashboard → this API service → Environment → Add Environment Variable"
  echo "  • Key: DATABASE_URL"
  echo "  • Or: Add from → select your Postgres (e.g. b2bhealthscore) → Internal Database URL"
  echo "Then Manual Deploy again. The API cannot start without a database."
  exit 1
fi

echo "Running database migrations..."
npx prisma migrate deploy
echo "Starting Express API..."
exec node dist/src/server.js
