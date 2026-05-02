#!/bin/bash
# Rebuild et redémarre uniquement les services modifiés
# Usage: ./redeploy.sh [backend|frontend|all]

TARGET=${1:-all}

if [ "$TARGET" = "backend" ] || [ "$TARGET" = "all" ]; then
  echo "🔨 Building backend..."
  docker compose build backend --no-cache
  echo "🚀 Restarting backend..."
  docker compose up -d backend
  echo "⏳ Waiting for backend..."
  sleep 8
  docker compose logs backend --tail=5
fi

if [ "$TARGET" = "frontend" ] || [ "$TARGET" = "all" ]; then
  echo "🔨 Building frontend..."
  docker compose build frontend --no-cache
  echo "🚀 Restarting frontend..."
  docker compose up -d frontend
fi

echo "✅ Done. App: http://localhost | API: http://localhost:3000"
docker compose ps
