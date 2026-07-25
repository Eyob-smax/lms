#!/bin/bash
# ==============================================================================
# @lms Enterprise Database Seeder Script
# ==============================================================================
# This script executes the Prisma database seed inside the production 
# Docker container (lms-backend).
#
# Usage: ./seed.sh or bash seed.sh
# ==============================================================================

set -e

echo "================================================================================"
echo "🚀 Triggering Database Seeder in Docker container [lms-backend]..."
echo "================================================================================"

if ! docker ps | grep -q "lms-backend"; then
  echo "❌ Error: Container 'lms-backend' is not running. Please start containers first with:"
  echo "   docker compose -f docker-compose.prod.yml up -d"
  exit 1
fi

# 1. Sync latest seed script to running container
docker cp apps/backend/prisma/seed.ts lms-backend:/app/apps/backend/prisma/seed.ts

# 2. Execute seeder using @swc-node/register for high-speed TS execution
docker exec -i lms-backend node -r @swc-node/register apps/backend/prisma/seed.ts

echo "✅ Seeding script execution complete!"
