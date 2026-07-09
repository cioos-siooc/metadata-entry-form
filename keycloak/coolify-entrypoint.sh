#!/bin/bash
# Keycloak 26 does not reliably substitute ${env.PUBLIC_URL} inside realm-import
# files, so we resolve it ourselves before starting: rewrite the client's
# ${env.PUBLIC_URL:...} placeholder to the actual preview origin (set by Coolify as
# PUBLIC_URL=${SERVICE_URL_WEB}). This makes the imported redirectUris/webOrigins
# match the browser URL, avoiding "Invalid parameter: redirect_uri".
set -euo pipefail

IMPORT_FILE=/opt/keycloak/data/import/realm-export.json
if [ -n "${PUBLIC_URL:-}" ] && [ -f "$IMPORT_FILE" ]; then
  sed -i "s|\${env\.PUBLIC_URL:[^}]*}|${PUBLIC_URL}|g" "$IMPORT_FILE"
fi

exec /opt/keycloak/bin/kc.sh "$@"
