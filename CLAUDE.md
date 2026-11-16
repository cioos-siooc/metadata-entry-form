# CLAUDE.md

## Testing

- **Frontend**: Vitest + jsdom. Tests in `src/**/__tests__/`. Run: `npm test`
- **Firebase Functions**: Jest. Tests in `firebase-functions/functions/test/`. Run: `cd firebase-functions/functions && npx jest`
- **CI**: `.github/workflows/run-build-tests.yaml` runs only frontend tests on push (Node 22.x). Firebase function tests are not in CI.

## UI work

- Read `DESIGN.md` (visual system) and `PRODUCT.md` (users, constraints) before changing UI.
- Design skills: [Impeccable](https://impeccable.style). Install once per machine: `/plugin marketplace add pbakaus/impeccable`, then install it from `/plugin` (or run `npx impeccable install`).
- On UI changes run `/impeccable audit` and `/impeccable critique`; run `/impeccable polish` before merge. Check both colour schemes, extreme region colours, and narrow widths.
