#!/bin/sh
set -e
echo "Running database migrations..."
npx prisma migrate deploy
echo "Starting Express API..."
exec node dist/src/server.js
