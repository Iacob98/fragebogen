#!/bin/sh
set -e

echo "Pushing database schema..."
./node_modules/.bin/prisma db push --accept-data-loss 2>&1 || echo "Warning: db push failed, schema may already be up to date"

echo "Seeding database..."
node scripts/seed.mjs 2>&1 || echo "Warning: seed failed, data may already exist"

echo "Starting server on port ${PORT:-3001}..."
exec node server.js
