#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

FRONTEND_DIR="$ROOT_DIR/app"
BACKEND_DIR="$ROOT_DIR/app/backend"

if [[ ! -f "$FRONTEND_DIR/package.json" ]]; then
  echo "Chyba: frontend package.json nebyl nalezen v $FRONTEND_DIR"
  exit 1
fi

if [[ ! -f "$BACKEND_DIR/package.json" ]]; then
  echo "Chyba: backend package.json nebyl nalezen v $BACKEND_DIR"
  exit 1
fi

cleanup() {
  local exit_code=$?

  if [[ -n "${BACK_PID:-}" ]] && kill -0 "$BACK_PID" 2>/dev/null; then
    kill "$BACK_PID" 2>/dev/null || true
  fi

  if [[ -n "${FRONT_PID:-}" ]] && kill -0 "$FRONT_PID" 2>/dev/null; then
    kill "$FRONT_PID" 2>/dev/null || true
  fi

  wait "${BACK_PID:-}" 2>/dev/null || true
  wait "${FRONT_PID:-}" 2>/dev/null || true

  exit "$exit_code"
}

trap cleanup EXIT INT TERM

echo "Spoustim backend (http://localhost:4000)"
npm --prefix "$BACKEND_DIR" run dev &
BACK_PID=$!

echo "Spoustim frontend (Vite URL bude vypsana v logu)"
npm --prefix "$FRONTEND_DIR" run dev &
FRONT_PID=$!

while true; do
  if ! kill -0 "$BACK_PID" 2>/dev/null; then
    wait "$BACK_PID" || true
    break
  fi

  if ! kill -0 "$FRONT_PID" 2>/dev/null; then
    wait "$FRONT_PID" || true
    break
  fi

  sleep 1
done
