#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/app/backend"

echo "Kytickar - setup"
echo ""

echo "1/3 Instalace balicku (backend + frontend)..."
npm --prefix "$BACKEND_DIR" install
npm --prefix "$ROOT_DIR/app" install

echo "2/3 Build frontendu..."
bash "$ROOT_DIR/build.sh"

echo "3/3 Init DB a seed..."
bash "$ROOT_DIR/init-db.sh"

echo ""
echo "Setup dokoncen."
echo "Pro systemd sluzby pouzij: sudo ./setup-services.sh"
