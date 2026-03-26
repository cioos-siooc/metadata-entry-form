# CLAUDE.md

## Testing

- **Frontend**: Vitest + jsdom. Tests in `src/**/__tests__/`. Run: `npm test`
- **Firebase Functions**: Jest. Tests in `firebase-functions/functions/test/`. Run: `cd firebase-functions/functions && npx jest`
- **CI**: `.github/workflows/run-build-tests.yaml` runs only frontend tests on push (Node 22.x). Firebase function tests are not in CI.
