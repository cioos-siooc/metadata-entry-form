/**
 * Annotation helpers.
 *
 * JSON Schema's `title` and `description` are single strings, but every label in
 * this form is bilingual. Fields are authored once here and emit English
 * title/description plus an inline `x-i18n` block carrying the French.
 *
 * Inline rather than a JSON-Pointer sidecar: pointers break silently under
 * refactors and $ref extraction with nothing to tell you, while inline
 * annotations move with the field and diff readably. The flat pointer map in
 * v1/i18n.json is derived from these, so it cannot rot.
 *
 * Unknown `x-` keywords are ignored by json-schema-for-humans, Python
 * jsonschema, and ajv with strict:false — so annotated schemas stay portable.
 */

/**
 * @param {object} spec
 * @param {{title: string, description?: string}} spec.en  English label
 * @param {{title: string, description?: string}} [spec.fr] French label
 * @param {string} [spec.tab]   tab key from src/utils/tabs.js
 * @param {{en: string, fr: string}} [spec.error] validation message pair
 * @param {object} [spec.schema] the JSON Schema body for this field
 */
export function field({ en, fr, tab, error, schema = {} }) {
  const annotated = { ...schema };

  if (en?.title) annotated.title = en.title;
  if (en?.description) annotated.description = en.description;

  if (fr?.title || fr?.description) {
    const frBlock = {};
    if (fr.title) frBlock.title = fr.title;
    if (fr.description) frBlock.description = fr.description;
    annotated["x-i18n"] = { fr: frBlock };
  }

  if (tab) annotated["x-cioos-tab"] = tab;
  if (error) annotated["x-cioos-error"] = error;

  return annotated;
}

function escapePointer(token) {
  return String(token).replace(/~/g, "~0").replace(/\//g, "~1");
}

/**
 * Keywords whose value is a MAP of name → schema. The container itself is not
 * a schema, so it must never be read for title/description — otherwise a field
 * literally named "title" or "description" (and this record has both) gets
 * mistaken for an annotation on its parent.
 */
const SCHEMA_MAPS = new Set([
  "properties",
  "definitions",
  "$defs",
  "patternProperties",
  "dependentSchemas",
]);

/** Keywords whose value is a single subschema. */
const SCHEMA_VALUES = new Set([
  "items",
  "additionalItems",
  "additionalProperties",
  "contains",
  "propertyNames",
  "not",
  "if",
  "then",
  "else",
]);

/** Keywords whose value is an array of subschemas. */
const SCHEMA_ARRAYS = new Set(["allOf", "anyOf", "oneOf", "prefixItems"]);

/**
 * Yields [pointer, subschema] for every schema reachable from `schema`,
 * respecting JSON Schema structure rather than walking every object blindly.
 */
function* walkSchemas(schema, pointer) {
  if (!schema || typeof schema !== "object" || Array.isArray(schema)) return;

  yield [pointer, schema];

  for (const [key, value] of Object.entries(schema)) {
    if (!value || typeof value !== "object") continue;
    const keyPointer = `${pointer}/${escapePointer(key)}`;

    if (SCHEMA_MAPS.has(key)) {
      for (const [name, sub] of Object.entries(value)) {
        yield* walkSchemas(sub, `${keyPointer}/${escapePointer(name)}`);
      }
    } else if (SCHEMA_ARRAYS.has(key) && Array.isArray(value)) {
      for (const [i, sub] of value.entries()) {
        yield* walkSchemas(sub, `${keyPointer}/${i}`);
      }
    } else if (SCHEMA_VALUES.has(key)) {
      if (Array.isArray(value)) {
        for (const [i, sub] of value.entries()) {
          yield* walkSchemas(sub, `${keyPointer}/${i}`);
        }
      } else {
        yield* walkSchemas(value, keyPointer);
      }
    }
  }
}

/**
 * Collects every label into a flat {jsonPointer: {en, fr}} map for the rjsf
 * uiSchema builder. Derived output — never hand-maintained.
 */
export function extractI18n(schema, pointer = "#") {
  const acc = {};

  for (const [ptr, sub] of walkSchemas(schema, pointer)) {
    const entry = {};
    if (sub.title || sub.description) {
      entry.en = {};
      if (sub.title) entry.en.title = sub.title;
      if (sub.description) entry.en.description = sub.description;
    }
    if (sub["x-i18n"]?.fr) entry.fr = sub["x-i18n"].fr;
    if (entry.en || entry.fr) acc[ptr] = entry;
  }

  return acc;
}

/**
 * Produces a monolingual copy for the docs generator, which only reads
 * `title` and `description`.
 *
 * For "fr", French strings are hoisted into title/description; anything with no
 * French translation falls back to English and is reported via onFallback so
 * translation gaps are visible at build time rather than silently English.
 */
export function toMonolingual(schema, language, onFallback = () => {}, pointer = "#") {
  if (!schema || typeof schema !== "object" || Array.isArray(schema)) {
    return schema;
  }

  const out = {};
  const translated = schema["x-i18n"]?.[language];

  for (const [key, value] of Object.entries(schema)) {
    if (key === "x-i18n") continue;
    const keyPointer = `${pointer}/${escapePointer(key)}`;

    if (!value || typeof value !== "object") {
      out[key] = value;
    } else if (SCHEMA_MAPS.has(key)) {
      // A map of name → schema. Recurse into the values, never the container.
      out[key] = Object.fromEntries(
        Object.entries(value).map(([name, sub]) => [
          name,
          toMonolingual(sub, language, onFallback, `${keyPointer}/${escapePointer(name)}`),
        ])
      );
    } else if (SCHEMA_ARRAYS.has(key) || SCHEMA_VALUES.has(key)) {
      out[key] = Array.isArray(value)
        ? value.map((sub, i) =>
            toMonolingual(sub, language, onFallback, `${keyPointer}/${i}`)
          )
        : toMonolingual(value, language, onFallback, keyPointer);
    } else {
      // Not a schema-bearing keyword (enum, required, x-cioos-error, …) —
      // copy through untouched.
      out[key] = value;
    }
  }

  if (language !== "en") {
    ["title", "description"].forEach((key) => {
      if (typeof schema[key] !== "string") return;
      if (translated?.[key]) {
        out[key] = translated[key];
      } else {
        onFallback({ pointer, key, english: schema[key] });
      }
    });
  }

  return out;
}
