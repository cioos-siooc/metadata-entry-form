# CIOOS Metadata Record Schema

A versioned JSON Schema describing the CIOOS metadata record produced by this form.

Tracking issue: [#526](https://github.com/cioos-siooc/metadata-entry-form/issues/526).

This document records the decisions the schema is built on. Read it before changing
anything under `schema/` or `src/schema/`.

---

## 1. What this schema describes

**The schema describes the *normalized* record — the JavaScript object, not the raw
Realtime Database JSON.**

The RTDB stores arrays as objects keyed `"0"`, `"1"`, … and `src/utils/misc.js`
`firebaseToJSObject()` converts them back to real arrays on read, with two special
cases: `keywords.en` / `keywords.fr` (`Object.values`) and `contacts[].role`
(`Object.values`). Every consumer of a record — the form, `standardizeRecord()`,
the Python converter — sees the normalized shape.

Consequence: **anything validating raw RTDB JSON must normalize first.** The
conformance tooling ports `firebaseToJSObject` to Python for exactly this reason.
Skipping it makes every array-valued field in every record fail.

## 2. Two schemas, not one

| File | Answers |
|---|---|
| `v1/record.schema.json` | *What is a record?* — types, shapes, enums, nested structures |
| `v1/record.submission.schema.json` | *What must a record be to be publishable?* — `allOf: [$ref structural, requirements]`, i.e. today's `recordIsValid()` |

This split is load-bearing. A decade of half-finished drafts will violate the
submission schema and must not violate the structural one. It is also what makes
the conformance policy in §6 expressible.

The inversion that matters: **if a record with `status: "published"` fails the
structural schema, the schema is wrong, not the record.** That record is live in a
public catalogue and has already flowed through `cioos-metadata-conversion` into
ISO 19115-3 XML.

## 3. Dialect: draft-07

`$schema: "http://json-schema.org/draft-07/schema#"`.

- `json-schema-for-humans` (the docs generator, issue #526 step 3) targets draft-07
  and silently ignores 2019-09/2020-12 keywords it does not model.
- `@rjsf/validator-ajv8` defaults to the draft-07 `Ajv` class; 2020-12 needs
  `customizeValidator({ AjvClass: Ajv2020 })`.
- Python `jsonschema` handles draft-07 flawlessly.

So: `definitions` not `$defs`, `dependencies` not `dependentRequired`. Every "at
least one X" rule here means `minContains: 1`, which plain `contains` already
expresses, so nothing is lost.

`src/schema/index.js` takes a `{ dialect }` option and branches in exactly two
places (the `$schema` string and `definitions` vs `$defs`), so emitting a 2020-12
variant later is a generator flag, not a rewrite.

## 4. Versioning

`$id`: `https://schema.cioos.ca/metadata-entry-form/v1/record.schema.json`

Major-versioned by path. That host does not resolve yet; until it does the
canonical fetchable URL is
`https://cioos-siooc.github.io/metadata-entry-form/schema/record.schema.json`
(published via `public/schema/` — see §9).

`x-cioos-schema-version` carries full semver:

- **PATCH** — `title` / `description` / `x-i18n` text, `examples`, doc-only changes.
- **MINOR** — new optional property; enum widened; constraint relaxed; new
  `definitions` entry. **Also: tightening `record.submission.schema.json` alone.**
  The submission schema is a gate, not a storage contract — this is what lets form
  requirements tighten without forcing a major bump on every downstream consumer.
- **MAJOR** — new *required* structural property; property removed or renamed; enum
  narrowed; type narrowed. Bumps the `$id` path. `v1` stays published and frozen,
  regenerated from a tagged commit.

CI fails a PR that changes `schema/v1/*.json` without changing
`x-cioos-schema-version`. Changes are logged in `CHANGELOG.md`.

### `schemaVersion` on records

Records carry an **optional** top-level `schemaVersion` string, `default` = the
current version, deliberately **not** in `required`. `getBlankRecord()` stamps it on
new records.

Without this there is no way to distinguish "written before the schema existed" from
"broken", and every future migration is guesswork. Records predating it are bucketed
as `pre-schema` in conformance reports and given maximum tolerance.

## 5. Type fidelity — the rule that overrides taste

> **Type every existing field with the type it actually has in the database today,
> not the type it should have.**

Known cases, all verified:

- `map.north` / `south` / `east` / `west` are **strings** (`"east": "-160"` in
  `src/__testData__/mockMetadataRecord.js`); `validate.js` `parseFloat`s them. They
  use the `numericString` definition — `{type: ["string","number"], pattern: …}` —
  not `number`.
- `verticalExtentMin` / `Max` are likewise strings, `""` when unset.
- `resourceType` may be a bare string on older records rather than an array. That is
  precisely why `src/utils/normalizeResourceType.js` exists.
- Dates are full ISO-8601 with milliseconds and `Z`
  (`"2023-10-01T19:00:00.000Z"`), not `format: "date"`.
- `keywords.en` / `.fr` are arrays in the normalized shape (objects in raw RTDB).

Every type cleanup is a separate, versioned, deliberately-migrated change. Coercing
a type in the schema silently rewrites the emitted XML.

Relatedly, the root does **not** set `additionalProperties: false`: it breaks under
`allOf` / `if` / `then` composition (subschemas do not see sibling-declared
properties), and legacy records carry keys nobody remembers. "No undeclared
top-level key" is enforced as a conformance *report line* instead, which gives the
discovery value without the failure mode.

## 6. Conformance policy

Severity is tiered by record status:

|                       | structural       | submission     |
|-----------------------|------------------|----------------|
| `status: "published"` | **hard fail**    | fail, budgeted |
| `status: "submitted"` | fail, budgeted   | report only    |
| draft / `""`          | report only      | ignored        |

`conformance-budget.json` holds per-region allowed counts. The job fails when a count
*exceeds* its budget. Lowering a budget is an ordinary PR (a green ratchet); raising
one requires an inline `# reason:` comment and review.

Two permanent severity downgrades, or the reports are unreadable:

- `format: uri` and `format: email` are **warn tier**. Today's `validator.isURL`
  accepts `www.example.ca`; ajv's `format: "uri"` rejects it for lacking a scheme.
  That mismatch alone produces hundreds of hits that are not actually broken. The
  legacy pass runs with `validateFormats: false` and re-runs formats separately.
- Records with no `schemaVersion` are reported in their own `pre-schema` section.

Records are anonymized before anything is written to disk — `userinfo`,
`lastEditedBy`, and `sharedWith` dropped; IDs salted-hashed; emails replaced with
`redacted@example.org` (preserving shape so `format: email` is still exercised).
Raw dumps are never uploaded as CI artifacts.

## 7. Additional constraints not expressible in JSON Schema

Four rules in `src/utils/validate.js` cannot be expressed in any JSON Schema dialect.
Three are carried as `x-`-prefixed ajv custom keywords; the fourth is out of scope.

| Keyword | Rule |
|---|---|
| `x-cioos-bbox-ordered` | `north >= south` and `east >= west` |
| `x-cioos-coordinate-ranges` | `-90 <= lat <= 90`, `-360 <= lon <= 360` (values are strings, so `minimum`/`maximum` do not apply) |
| `x-cioos-polygon-closed` | first coordinate pair equals the last; every pair in range |

Out of scope: async resource-URL liveness (`warnings.distribution` →
the `checkURLActive` callable). Async validation stays in `validate.js`.

Unknown `x-` keywords are ignored by `json-schema-for-humans`, by Python
`jsonschema`, and by ajv with `strict: false`. The artifact therefore stays portable,
and consumers without the keyword implementations degrade to "validates everything
except these three rules" rather than erroring.

They are implemented twice — `src/schema/keywords.js` (JS) and
`schema/tools/cioos_keywords.py` (Python) — and both iterate the shared case table
`schema/tools/keyword_cases.json`, so neither implementation can drift without
turning a test red. Each rule is also restated in the affected field's `description`
so it appears in the generated docs.

## 8. Bilingual annotations

JSON Schema `title` and `description` are single strings. Fields are authored once
in `src/schema/annotations.js` and emit English `title`/`description` plus an inline
`x-i18n: { fr: { title, description } }`.

Inline rather than a JSON-Pointer sidecar: pointers break silently under refactors
and `$ref` extraction with nothing to tell you. Inline annotations move with the
field and diff readably. A flat `{jsonPointer: {en, fr}}` map is still emitted as
`v1/i18n.json`, but it is *derived*, so it cannot rot.

Two further annotations ride along, both feeding the eventual rjsf work:

- `x-cioos-tab` — the tab a field belongs to (values asserted against
  `src/utils/tabs.js`)
- `x-cioos-error` — the `{en, fr}` message pair currently living in `validate.js`

Docs are generated from two derived monolingual files, `record.en.schema.json` and
`record.fr.schema.json` (French hoisted out of `x-i18n`, falling back to English with
a build warning naming every gap).

## 9. Documentation

```
npm run schema:build   regenerate schema/v1/*.json   (Node, via vite-node)
npm run schema:docs    regenerate schema/docs/build/ (Python, via uv)
```

The generated docs are **committed**. That is deliberate, not laziness: the
GitHub Pages workflow runs `npm ci && npm run build` with no Python available,
and `JamesIves/github-pages-deploy-action` replaces the branch wholesale from
`build/`. So the docs cannot be produced at deploy time.

Instead `scripts/copySchemaAssets.mjs` — pure Node, wired into `prebuild` —
stages `schema/v1/*.json` and `schema/docs/build/**` into `public/schema/`,
which Vite copies verbatim into `build/`. The existing deploy then publishes:

```
/schema/                        language picker
/schema/en/, /schema/fr/        field reference + conditional requirements
/schema/record.schema.json      the schema itself
```

`public/schema/` is generated and gitignored; the sources are `schema/v1/` and
`schema/docs/build/`.

Because the JS test suite cannot regenerate Python-built output, the docs
generator stamps `schema/docs/build/SCHEMA_VERSION` and
`src/schema/__tests__/docs.test.js` compares it against `SCHEMA_VERSION`.
Bumping the schema without running `npm run schema:docs` fails CI.

Two things to know about `json-schema-for-humans`:

- **It has no localization.** The French page carries French titles and
  descriptions, but the generator's own chrome ("Type", "Must be", "Required")
  stays English. Fixing that means forking its templates; not worth it yet.
- **Its `js_offline` template emits a `<script>` for a FontAwesome kit it never
  vendors**, which would 404 on the published page. Nothing in the output uses
  a `fa-*` class, so `build_docs.py` strips the tag and a test guards against
  an upgrade quietly reintroducing it. The same post-processing step hoists the
  duplicated bootstrap/jQuery/font assets into a shared `assets/` directory,
  since `js_offline` otherwise writes a full copy beside every page.

The generated reference covers *fields*. The cross-field rules — which
`json-schema-for-humans` renders poorly — are hand-written in
`docs/conditional-requirements.{en,fr}.md`. schema.datacite.org makes the same
split.

## 10. Layout

```
src/schema/            authoring source (ES modules; enums DERIVED from the app's
                       existing vocabulary modules, never copied)
schema/v1/*.json       generated, committed artifacts
schema/tools/          Python conformance + docs tooling
schema/docs/           json-schema-for-humans config and hand-written prose
schema/docs/build/     generated, committed documentation
```

Authored in JS because the enums live in `src/isoCodeLists.js`,
`src/utils/themes.js`, `src/utils/licenses.js`, `src/data/eovs.json`,
`src/platforms.json`, and `src/regions.js` and they change — PR #484 rewrote the
whole topic-category list. Hand-writing JSON that re-declares them would create a
fourth out-of-sync source of truth, which is the problem #526 exists to fix.

Committed as JSON because Python (`json-schema-for-humans`, the conformance tests)
and external consumers need a plain file with no JS runtime.

`npm run schema:build` regenerates. A Vitest test rebuilds in memory and deep-equals
the committed output, so the two cannot drift.

## 11. Open decisions

Two pre-existing inconsistencies that the schema forces a choice on. Both are flagged
rather than silently resolved, because either answer changes user-visible behaviour.

1. **`datasetIdentifier` — are bare DOIs valid?** `validate.js` requires
   `doiRegexp.test(val) && isValidHttpUrl(val)`. `isValidHttpUrl("10.1234/x")` throws
   and returns false, so bare DOIs are **already rejected today** despite the regex
   making the `https://doi.org/` prefix optional. Either encode that (anchor the
   pattern to the URL form) or fix the JS to accept bare DOIs. Currently encoded as
   URL-only, matching present behaviour.

2. **Related-work titles — one language or both?** `validate.js` requires **both**
   `en` and `fr`; `src/components/FormComponents/RelatedWorks.jsx:264` shows the
   field as satisfied with **either**. Currently encoded as "both", matching
   `validate.js`, since that is what actually gates submission.

3. **The lineage statement requirement never fires.** `validate.js` requires
   `statement.en` and `statement.fr` when `lineageStep.scope === "collectionSession"`.
   But `src/components/FormComponents/Lineage.jsx:326` populates `scope` from
   `Object.keys(metadataScopeCodes)`, so it holds a *key* — `"DataCollectionSampling"`
   — while `"collectionSession"` is that entry's `isoValue`, stored separately as
   `scopeIso`. The two can never be equal for any record the form produced, so the
   rule is dead code and no record has ever been blocked by it.

   The schema encodes the **intent** (statement required when
   `scopeIso === "collectionSession"`) and records the mismatch in
   `KNOWN_DIVERGENCES`, so the docs describe the contract that was meant rather
   than an accident. Fixing `validate.js` to match is deliberately *not* bundled
   here: it would make previously-submittable records unsubmittable, which is a
   user-visible change and Colton's call. Either fix the comparison to `scopeIso`,
   or drop the requirement.
