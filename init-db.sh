#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/app/backend"

echo "Kytickar - init DB"
npm --prefix "$BACKEND_DIR" exec prisma migrate deploy
npm --prefix "$BACKEND_DIR" run db:seed
