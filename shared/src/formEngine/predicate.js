/**
 * A tiny predicate evaluator for conditional visibility.
 *
 * Visibility lives in the uiSchema, NOT in the JSON Schema. That separation is
 * deliberate and load-bearing: rjsf's handling of `dependencies` and `oneOf`
 * rewrites formData when a branch switches and can delete keys, which is
 * exactly the "breaks the resulting JSON" failure we must avoid. JSON Schema
 * decides what is VALID; the uiSchema decides what is SHOWN.
 *
 * Supported forms (deliberately minimal — this covers every case in the
 * existing form, and a general expression language would be a liability):
 *
 *   { field: "metadataScopeIso", notIn: ["model"] }
 *   { field: "sampleType", equals: "control" }
 *   { field: "eov", in: ["oxygen", "nutrients"] }
 *   { field: "noTaxa", truthy: false }
 *   { context: "canEdit" }
 *   { allOf: [...] }  { anyOf: [...] }  { not: {...} }
 */

/** Reads a dot-separated path out of the form data. */
function readPath(data, path) {
  return String(path)
    .split(".")
    .reduce((node, key) => (node == null ? undefined : node[key]), data);
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  return value === undefined || value === null ? [] : [value];
}

/**
 * @param {Object|undefined} rule   omitted or null means "always visible"
 * @param {Object} data             the form data
 * @param {Object} [context]        ambient flags, e.g. {canEdit: true}
 * @returns {boolean}
 */
export function evaluate(rule, data = {}, context = {}) {
  if (rule === undefined || rule === null) return true;
  if (typeof rule === "boolean") return rule;

  if (Array.isArray(rule.allOf)) {
    return rule.allOf.every((sub) => evaluate(sub, data, context));
  }
  if (Array.isArray(rule.anyOf)) {
    return rule.anyOf.some((sub) => evaluate(sub, data, context));
  }
  if (rule.not !== undefined) {
    return !evaluate(rule.not, data, context);
  }

  if (rule.context !== undefined) {
    return Boolean(context[rule.context]);
  }

  if (rule.field === undefined) {
    // An unrecognized rule must not silently hide a field.
    return true;
  }

  const value = readPath(data, rule.field);

  if (rule.equals !== undefined) return value === rule.equals;
  if (rule.truthy !== undefined) return Boolean(value) === Boolean(rule.truthy);

  if (rule.in !== undefined) {
    const allowed = asArray(rule.in);
    // For an array-valued field, "in" means intersects.
    if (Array.isArray(value)) return value.some((v) => allowed.includes(v));
    return allowed.includes(value);
  }
  if (rule.notIn !== undefined) {
    const blocked = asArray(rule.notIn);
    if (Array.isArray(value)) return !value.some((v) => blocked.includes(v));
    return !blocked.includes(value);
  }

  if (rule.exists !== undefined) {
    const present =
      value !== undefined &&
      value !== null &&
      value !== "" &&
      !(Array.isArray(value) && value.length === 0);
    return present === Boolean(rule.exists);
  }

  return true;
}

/** Every field path named anywhere in a rule, so callers know what to watch. */
export function referencedFields(rule, acc = new Set()) {
  if (!rule || typeof rule !== "object") return acc;
  if (rule.field) acc.add(rule.field);
  ["allOf", "anyOf"].forEach((key) => {
    if (Array.isArray(rule[key])) {
      rule[key].forEach((sub) => referencedFields(sub, acc));
    }
  });
  if (rule.not) referencedFields(rule.not, acc);
  return acc;
}
