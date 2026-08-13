/**
 * Strips constraint-only alternatives from a schema before it is rendered.
 *
 * A schema can use `anyOf` for two quite different jobs. It can offer a genuine
 * CHOICE — three shapes a value may take, which a form must let someone pick
 * between — or it can express a CONSTRAINT, as the metadata record's DOI does:
 *
 *     datasetIdentifier: {
 *       type: "string",
 *       anyOf: [{ const: "" }, { pattern: "^https://doi\\.org/10\\..." }]
 *     }
 *
 * which says only "empty, or a valid doi.org URL". rjsf cannot tell those apart.
 * It sees `anyOf`, renders the property as a multi-schema field, and — because
 * the property ALSO declares `type: "string"` — renders the string widget twice:
 * once for the type, once for the chosen branch. On screen that was a DOI
 * question containing a second identical DOI question, each with its own input,
 * either of which could be typed into.
 *
 * Dropping those branches for RENDERING only is safe because it changes nothing
 * about validity: submission validates against the unfiltered schema (see
 * FormFill), so the pattern is still enforced, and rjsf does not validate while
 * someone is typing (`liveValidate={false}`). It is the same division of labour
 * the engine already runs on — the JSON Schema decides what is valid, and the
 * presentation layer decides what is drawn.
 *
 * A real choice is left alone. See `isConstraintOnly` for exactly where the line
 * falls, and renderSchema.test.js for the cases it was drawn around.
 */

/** Keys that make a branch a distinct SHAPE rather than a restriction. */
const STRUCTURAL_KEYS = ["type", "properties", "items", "$ref", "title", "required"];

/** Keys that make a branch one option in an enumeration. */
const ENUMERATING_KEYS = ["const", "enum"];

const has = (branch, keys) =>
  keys.some((key) => branch != null && branch[key] !== undefined);

/**
 * Whether a set of branches only restricts a value rather than describing
 * alternative forms of it.
 *
 * Three questions, in order:
 *
 *   Does any branch declare a shape or carry a label? Then it is a real choice —
 *     `anyOf: [{$ref: point}, {$ref: polygon}]`, or a titled option list — and
 *     rjsf's multi-schema rendering is what the author asked for.
 *
 *   Does EVERY branch name a value? Then it is an enumeration, which rjsf
 *     renders as a select. Stripping it would silently turn a dropdown into a
 *     free-text box, which is the worst outcome available here.
 *
 *   Otherwise at least one branch is a bare restriction — a pattern, a length, a
 *     numeric bound — and the alternatives describe validity, not form.
 */
export function isConstraintOnly(branches) {
  if (!Array.isArray(branches) || branches.length === 0) return false;
  if (branches.some((branch) => has(branch, STRUCTURAL_KEYS))) return false;
  if (branches.every((branch) => has(branch, ENUMERATING_KEYS))) return false;
  return branches.every((branch) => branch && typeof branch === "object");
}

/**
 * A copy of the schema with constraint-only `anyOf`/`oneOf` removed, everywhere
 * it appears.
 *
 * The subschema keeps its own `type`, so rjsf still knows what to draw. Where a
 * subschema has constraint-only branches and NO type of its own, the branches
 * stay: removing them would leave rjsf nothing to render at all.
 */
export function renderSchema(schema) {
  if (!schema || typeof schema !== "object") return schema;
  if (Array.isArray(schema)) return schema.map(renderSchema);

  const next = { ...schema };

  ["anyOf", "oneOf"].forEach((key) => {
    if (next.type !== undefined && isConstraintOnly(next[key])) {
      delete next[key];
    }
  });

  if (next.properties && typeof next.properties === "object") {
    next.properties = Object.fromEntries(
      Object.entries(next.properties).map(([name, sub]) => [name, renderSchema(sub)])
    );
  }

  ["definitions", "$defs"].forEach((key) => {
    if (next[key] && typeof next[key] === "object") {
      next[key] = Object.fromEntries(
        Object.entries(next[key]).map(([name, sub]) => [name, renderSchema(sub)])
      );
    }
  });

  if (next.items) next.items = renderSchema(next.items);

  return next;
}
