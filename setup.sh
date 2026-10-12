#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/app/backend"

echo "Kytickar - setup (balicky)"
npm --prefix "$BACKEND_DIR" install
npm --prefix "$ROOT_DIR/app" install
