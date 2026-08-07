/**
 * Classifies a schema change as additive or breaking.
 *
 * This is what turns "we bumped a version" into a safety property. Publishing a
 * new version asks this module what changed:
 *
 *   additive  — existing data still validates, so drafts can safely re-pin to
 *               the new version the next time they are opened
 *   breaking  — existing data may stop validating, so drafts stay pinned to the
 *               version they were started against and the publish dialog warns
 *               how many are affected, per region
 *
 * When in doubt this reports `breaking`. A false "breaking" costs a warning
 * dialog; a false "additive" silently invalidates real submissions.
 */

const ADDITIVE = "additive";
const BREAKING = "breaking";

function isObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function toTypeSet(type) {
  if (!type) return null;
  return new Set(Array.isArray(type) ? type : [type]);
}

/** True when `next` accepts every type `prev` did. */
function typeWidened(prev, next) {
  const before = toTypeSet(prev);
  const after = toTypeSet(next);
  if (!before) return true; // was unconstrained
  if (!after) return true; // became unconstrained
  return [...before].every((t) => after.has(t));
}

function pointer(path) {
  return path.length ? `/${path.join("/")}` : "";
}

/**
 * Walks two schemas and collects every difference.
 * @returns {{changeClass: string, changes: Array<{path: string, kind: string, detail: string}>}}
 */
export function schemaDiff(previous, next) {
  const changes = [];

  function record(path, kind, detail) {
    changes.push({ path: pointer(path), kind, detail });
  }

  function compare(prev, curr, path) {
    if (!isObject(prev) || !isObject(curr)) {
      if (JSON.stringify(prev) !== JSON.stringify(curr)) {
        record(path, BREAKING, "subschema replaced");
      }
      return;
    }

    // --- type ---
    if (JSON.stringify(prev.type) !== JSON.stringify(curr.type)) {
      record(
        path,
        typeWidened(prev.type, curr.type) ? ADDITIVE : BREAKING,
        `type ${JSON.stringify(prev.type)} → ${JSON.stringify(curr.type)}`
      );
    }

    // --- enum: removing a member invalidates data that used it ---
    if (prev.enum || curr.enum) {
      const before = new Set(prev.enum || []);
      const after = new Set(curr.enum || []);
      const removed = [...before].filter((v) => !after.has(v));
      const added = [...after].filter((v) => !before.has(v));
      if (removed.length) {
        record(path, BREAKING, `enum removed: ${removed.join(", ")}`);
      }
      if (added.length) {
        record(path, ADDITIVE, `enum added: ${added.join(", ")}`);
      }
      if (!prev.enum && curr.enum) {
        record(path, BREAKING, "enum introduced where any value was allowed");
      }
    }

    // --- required ---
    const requiredBefore = new Set(prev.required || []);
    const requiredAfter = new Set(curr.required || []);
    [...requiredAfter]
      .filter((k) => !requiredBefore.has(k))
      .forEach((k) => record([...path, k], BREAKING, "became required"));
    [...requiredBefore]
      .filter((k) => !requiredAfter.has(k))
      .forEach((k) => record([...path, k], ADDITIVE, "no longer required"));

    // --- properties ---
    const propsBefore = prev.properties || {};
    const propsAfter = curr.properties || {};

    Object.keys(propsBefore).forEach((key) => {
      if (!(key in propsAfter)) {
        // The data survives in the stored JSON, but the form stops showing it
        // and the export stops emitting a column for it.
        record([...path, "properties", key], BREAKING, "property removed");
      }
    });
    Object.keys(propsAfter).forEach((key) => {
      if (!(key in propsBefore)) {
        record(
          [...path, "properties", key],
          requiredAfter.has(key) ? BREAKING : ADDITIVE,
          "property added"
        );
      }
    });
    Object.keys(propsAfter)
      .filter((key) => key in propsBefore)
      .forEach((key) =>
        compare(propsBefore[key], propsAfter[key], [...path, "properties", key])
      );

    // --- array items ---
    if (prev.items || curr.items) {
      if (isObject(prev.items) && isObject(curr.items)) {
        compare(prev.items, curr.items, [...path, "items"]);
      } else if (JSON.stringify(prev.items) !== JSON.stringify(curr.items)) {
        record([...path, "items"], BREAKING, "items schema replaced");
      }
    }

    // --- numeric and length bounds: tightening can invalidate stored data ---
    const tighten = [
      ["minLength", (a, b) => b > a],
      ["maxLength", (a, b) => b < a],
      ["minimum", (a, b) => b > a],
      ["maximum", (a, b) => b < a],
      ["minItems", (a, b) => b > a],
      ["maxItems", (a, b) => b < a],
    ];
    tighten.forEach(([keyword, isTighter]) => {
      const before = prev[keyword];
      const after = curr[keyword];
      if (before === after) return;
      if (before === undefined) {
        record([...path, keyword], BREAKING, `${keyword} introduced`);
      } else if (after === undefined) {
        record([...path, keyword], ADDITIVE, `${keyword} removed`);
      } else {
        record(
          [...path, keyword],
          isTighter(before, after) ? BREAKING : ADDITIVE,
          `${keyword} ${before} → ${after}`
        );
      }
    });

    if (prev.pattern !== curr.pattern) {
      record(
        [...path, "pattern"],
        curr.pattern === undefined ? ADDITIVE : BREAKING,
        "pattern changed"
      );
    }
    if (prev.format !== curr.format) {
      record(
        [...path, "format"],
        curr.format === undefined ? ADDITIVE : BREAKING,
        "format changed"
      );
    }
  }

  compare(previous || {}, next || {}, []);

  return {
    changeClass: changes.some((c) => c.kind === BREAKING) ? BREAKING : ADDITIVE,
    changes,
  };
}

/**
 * Stable hash of a schema, used to identify versions and to key compiled
 * validators. Keys are sorted so formatting churn doesn't produce a new hash.
 *
 * FNV-1a rather than crypto: this identifies content, it is not a security
 * boundary, and it must run identically in the browser and on a server without
 * pulling in a dependency.
 */
export function schemaHash(schema) {
  const canonical = JSON.stringify(sortKeys(schema ?? {}));
  let hash = 0x811c9dc5;
  for (let i = 0; i < canonical.length; i += 1) {
    hash ^= canonical.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  // >>> 0 keeps it an unsigned 32-bit value
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (!isObject(value)) return value;
  return Object.keys(value)
    .sort()
    .reduce((acc, key) => {
      acc[key] = sortKeys(value[key]);
      return acc;
    }, {});
}

export { ADDITIVE, BREAKING };
