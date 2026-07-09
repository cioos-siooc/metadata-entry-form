# Keycloak image with the dev realm baked in, for Coolify (which doesn't honor the
# repo bind mount that the plain docker-compose stack uses for realm import).
# `--import-realm` (set in the compose command) imports this on first start.
FROM quay.io/keycloak/keycloak:26.1
COPY dev/realm-export.json /opt/keycloak/data/import/realm-export.json
