#!/bin/sh
set -e

echo "Running database migrations..."
./node_modules/.bin/prisma migrate deploy 2>&1 || echo "Warning: migration failed, DB may already be up to date"

echo "Seeding database..."
node scripts/seed.mjs 2>&1 || echo "Warning: seed failed, data may already exist"

echo "Starting server on port ${PORT:-3001}..."
exec node server.js
