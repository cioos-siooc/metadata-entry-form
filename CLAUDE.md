# CLAUDE.md

## Testing

- **Frontend**: Vitest + jsdom. Tests in `src/**/__tests__/`. Run: `npm test`
- **API server**: Jest, integration-style against the dev-compose Postgres (port 5433). Tests in `server/test/`. Run: `cd server && npx jest`
- **Converter**: pytest. Run: `cd converter && python -m pytest test_main.py`
- **CI**: `.github/workflows/run-build-tests.yaml` runs frontend, server (with a Postgres service), and converter tests on push (Node 22.x).
- **Legacy**: `firebase-functions/` is the pre-migration Firebase backend, kept until cutover; its Jest tests are not in CI.

## Local dev stack

`docker compose --env-file deploy/.env -f docker-compose.yml -f docker-compose.dev.yml up -d` — postgres (5433), mailpit (8025), api (3001). The api seeds local dev users author/reviewer/admin@example.org (password "password") via `scripts/seed-dev.js`. Auth is served by the api under `/api/v1/auth` (local email+password + OAuth to Google/Microsoft/ORCID); there is no Keycloak. Frontend: `npm run dev` (proxies /api).
