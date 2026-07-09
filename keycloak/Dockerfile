# Keycloak image with the dev realm baked in, for Coolify (which doesn't honor the
# repo bind mount that the plain docker-compose stack uses for realm import).
# The entrypoint resolves the preview URL into the realm before `--import-realm`
# (set in the compose command) imports it.
FROM quay.io/keycloak/keycloak:26.1
COPY --chown=1000:0 dev/realm-export.json /opt/keycloak/data/import/realm-export.json
COPY --chown=1000:0 coolify-entrypoint.sh /opt/keycloak/coolify-entrypoint.sh
RUN chmod 0664 /opt/keycloak/data/import/realm-export.json \
    && chmod 0775 /opt/keycloak/coolify-entrypoint.sh
ENTRYPOINT ["/opt/keycloak/coolify-entrypoint.sh"]
