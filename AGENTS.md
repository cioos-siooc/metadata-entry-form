# Agent Guide for metadata-entry-form

This file orients agentic coding tools to build, test, and style the codebase.
Follow existing patterns and avoid introducing new conventions without cause.

## Scope and layout

- Frontend SPA lives in `src/` (React 19 + Vite + MUI).
- Firebase functions live in `firebase-functions/` (JS + Python).
- Root tooling is Node >= 22 and npm >= 10.
- There are no Cursor rules or Copilot instructions files in this repo.

## Install and environment

- Install root deps: `npm ci`
- Local env: copy `.env.sample` to `.env` when running the app locally.
- Firebase emulator scripts are under `firebase-functions/` (see README).

## Build, lint, format

- Dev server: `npm run dev` (or `npm start`)
- Production build: `npm run build`
- Preview build: `npm run preview`
- Lint: `npm run lint`
- Lint fix: `npm run lint:fix`
- Format: `npm run format`

## Tests (frontend, Vitest)

- Run all tests: `npm test`
- Watch mode: `npm run test:watch`
- Coverage: `npm run test:coverage`
- Single test file:
  - `npm test -- --run src/components/__tests__/DateInput.test.jsx`
  - `npm test -- --run src/utils/__tests__/validate.test.js`
- Filter by test name:
  - `npm test -- -t "should render"`

## Tests (Firebase functions, Jest)

- From `firebase-functions/functions`:
  - Install deps: `npm ci`
  - Run all tests: `npm test`
  - Single test file: `npm test -- --runTestsByPath path/to/test.js`
  - Filter by test name: `npm test -- -t "handles"`

## CI notes

- CI builds with Node 22, runs `npm ci`, creates `.env`, then `npm run build` and `npm test`.
- CI ignores `firebase-functions/` in root eslint config.

## Code style (JavaScript/React)

- Use modern ES modules and JSX.
- Prefer double quotes, semicolons, and trailing commas (eslint enforced).
- Use Prettier defaults; run `npm run format` for formatting.
- Keep React components in PascalCase files (e.g., `MetadataForm.jsx`).
- Keep utility modules in `src/utils/` with lowerCamelCase exports.
- Avoid default exports unless the file already uses them.
- Keep functions small and focused; isolate reusable logic in `src/utils/`.

## Imports

- Group imports in this order when possible:
  1. React and third-party packages.
  2. App-level modules (e.g., `../../utils/...`).
  3. Local relative components.
- Keep import paths consistent with existing file patterns.
- Do not introduce new alias paths; use relative paths as in current code.

## Types and data shapes

- This repo is JavaScript-only (no TypeScript).
- Bilingual content uses `{ en: "...", fr: "..." }` objects.
- Many records mirror Firebase JSON shape; use `firebaseToJSObject` or existing helpers.
- Avoid mutating objects directly; prefer shallow copies when updating state.

## State and React patterns

- Both class components and hooks are used; match the file’s existing style.
- If you touch class components, respect `this.state` and `this.setState` patterns.
- When adding hooks to functional components, follow React hooks rules.
- Prefer MUI components and TSS styles as seen in `src/tss-cache.js` usage.

## Error handling and logging

- Prefer user-visible errors for UI flows; follow existing alert/modal patterns.
- `console.error` is allowed when handling unexpected errors.
- Avoid swallowing errors silently; propagate when needed for UI state.

## Firebase conventions

- Frontend uses Firebase client SDK from `src/firebase.js` and helpers in `src/utils/`.
- Avoid direct database shape changes unless you also update validators and helpers.
- When writing to Firebase, mirror existing patterns in `firebase*Functions.js`.

## Testing conventions

- Test files live in `src/**/__tests__/*` or `src/__tests__/*`.
- Use Testing Library patterns; see `src/setupTests.js` for global mocks.
- When adding tests, keep them colocated with existing test suites.

## Files to avoid touching

- `src/serviceWorker.js` is ignored by eslint.
- `build/`, `dist/`, and `node_modules/` are ignored by lint.
- Do not commit `.env` files.

## Suggested workflow for agents

- Read related component and its supporting utils before editing.
- Run `npm run lint` and the smallest relevant test(s) when feasible.
- Keep changes scoped; avoid refactors unless requested.

## Quick references

- Root app entry: `src/index.jsx`
- App shell: `src/components/App.jsx`
- Validation rules: `src/utils/validate.js`
- Blank record schema: `src/utils/blankRecord.js`
- Firebase helpers: `src/utils/firebase*Functions.js`
