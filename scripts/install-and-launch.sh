#!/usr/bin/env bash
set -euo pipefail

if ! command -v node >/dev/null 2>&1; then
  echo "[setup] Node.js is required. Install Node 18+ from https://nodejs.org first." >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${SCRIPT_DIR}/.."
cd "$PROJECT_ROOT"

echo "[setup] Installing dependencies..."
if [ -d node_modules ]; then
  npm install >/dev/null
else
  npm install
fi

echo "[setup] Starting Vite dev server (press Ctrl+C to stop)..."
npm run dev -- --host
