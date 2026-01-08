#!/usr/bin/env bash

# Re-exec with bash if invoked via sh
if [ -z "${BASH_VERSION:-}" ]; then
  exec bash "$0" "$@"
fi

set -euo pipefail

echo "🔪 Stopping Firebase emulators and freeing ports..."

# Kill by known process names (best-effort)
pkill -f "firebase[[:space:]]+emulators:start" 2>/dev/null || true
pkill -f "@google-cloud/firestore-emulator" 2>/dev/null || true
pkill -f "cloud-firestore-emulator.jar" 2>/dev/null || true

# Common emulator ports (include typical defaults and project-specific ones)
ports=(
  4000   # Emulator UI
  5001   # Functions (default)
  5002   # Functions (configured)
  8080   # Firestore (default)
  8081   # Firestore (configured)
  9000   # RTDB (default)
  9001   # RTDB (configured)
  9099   # Auth
  9199   # Pub/Sub
  9299   # Storage (legacy)
  9197   # Storage (alternate)
)

for p in "${ports[@]}"; do
  if lsof -iTCP:"$p" -sTCP:LISTEN -Pn >/dev/null 2>&1; then
    echo "🚫 Killing process on port $p"
    lsof -ti:"$p" -sTCP:LISTEN | xargs -r kill -9 || true
  fi
done

echo "✅ Emulator ports cleared."