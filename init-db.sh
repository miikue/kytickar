#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/app/backend"

echo "Kytickar - init DB"
(
  cd "$BACKEND_DIR"
  npx prisma migrate deploy
  npm run db:seed
)
