#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Kytickar - build"
npm --prefix "$ROOT_DIR/app" run build
