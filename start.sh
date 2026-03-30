#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

if ! command -v ffmpeg &>/dev/null; then
  echo "ERROR: ffmpeg not in PATH."
  echo "  macOS: brew install ffmpeg"
  echo "  Ubuntu: sudo apt install ffmpeg"
  exit 1
fi

if ! command -v node &>/dev/null; then
  echo "ERROR: Node.js 18+ required for npm start."
  exit 1
fi

if [[ ! -d node_modules/concurrently ]]; then
  echo "Installing root devDependencies..."
  npm install
fi

echo "Starting LocalTube (backend + frontend, Ctrl+C stops both)..."
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:8000"
exec npm start
