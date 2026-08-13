/**
 * Immutable edit operations on a uiSchema.
 *
 * The visual builder is a lens over the JSON, not a replacement format for it,
 * and these functions are where that promise is kept. Two rules hold for every
 * operation here:
 *
 *   1. Keys this module does not understand are carried through untouched. An
 *      author who hand-writes an rjsf key the builder has no control for must
 *      not lose it by opening the builder tab.
 *   2. An edit that empties a container removes the container. Otherwise a few
 *      minutes of clicking leaves `{"ui:options": {"i18n": {}}}` scattered over
 *      the document, which then shows up as noise in the published version diff.
 *
 * Keeping the operations here rather than inside the components makes them
 * testable without rendering, and keeps the components presentational.
 */

import { UI_WIDGETS_BY_NAME } from "./uiVocabulary";

const isPlainObject = (value) =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const isEmptyObject = (value) =>
  isPlainObject(value) && Object.keys(value).length === 0;

/** Treats "" and null as "unset", so clearing an input removes the key. */
const isBlank = (value) =>
  value === undefined || value === null || value === "";

/** Shallow copy without one key. */
function omit(target, key) {
  if (!(key in target)) return target;
  const remaining = { ...target };
  delete remaining[key];
  return remaining;
}

/**
 * Immutable deep set. A blank value deletes the key and then prunes any
 * ancestor the deletion emptied — that is rule 2 above.
 */
function setDeep(target, path, value) {
  const [key, ...rest] = path;
  const base = isPlainObject(target) ? target : {};

  if (rest.length === 0) {
    if (isBlank(value)) return omit(base, key);
    if (base[key] === value) return base;
    return { ...base, [key]: value };
  }

  const child = setDeep(base[key], rest, value);
  if (isEmptyObject(child)) return omit(base, key);
  return { ...base, [key]: child };
}

/** Reads a deep path, tolerating missing intermediates. */
function getDeep(target, path) {
  return path.reduce(
    (node, key) => (isPlainObject(node) ? node[key] : undefined),
    target
  );
}

function withSteps(uiSchema, steps) {
  const cleaned = steps.filter(Boolean);
  if (cleaned.length === 0) return omit(uiSchema || {}, "ui:steps");
  return { ...(uiSchema || {}), "ui:steps": cleaned };
}

function readSteps(uiSchema) {
  const steps = uiSchema?.["ui:steps"];
  return Array.isArray(steps) ? steps : [];
}

/** Moves an array element, returning a new array. */
export function moveItem(items, from, to) {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) {
    return items;
  }
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

/* ------------------------------------------------------------------ fields */

/**
 * Sets one half of a bilingual label or help string.
 *
 * @param {string} kind  "title" or "help"
 * @param {string} lang  "en" or "fr"
 */
export function setFieldI18n(uiSchema, field, kind, lang, value) {
  return setDeep(uiSchema, [field, "ui:options", "i18n", kind, lang], value);
}

/**
 * Requests a custom widget or field, or clears both when `name` is blank.
 *
 * Which key it lands under is decided by the registry rather than the caller,
 * because `bilingualText` is a `ui:field` while everything else is a
 * `ui:widget`, and putting one under the other's key silently does nothing.
 */
export function setFieldWidget(uiSchema, field, name) {
  const cleared = setDeep(
    setDeep(uiSchema, [field, "ui:widget"], undefined),
    [field, "ui:field"],
    undefined
  );
  if (isBlank(name)) return cleared;

  const entry = UI_WIDGETS_BY_NAME[name];
  const key = entry?.kind === "field" ? "ui:field" : "ui:widget";
  return setDeep(cleared, [field, key], name);
}

/** Name of the widget or field currently requested for a property, if any. */
export function getFieldWidget(uiSchema, field) {
  return (
    getDeep(uiSchema, [field, "ui:widget"]) ??
    getDeep(uiSchema, [field, "ui:field"]) ??
    ""
  );
}

export function setFieldOption(uiSchema, field, option, value) {
  return setDeep(uiSchema, [field, "ui:options", option], value);
}

export function setFieldVisibleIf(uiSchema, field, rule) {
  const value = isPlainObject(rule) && Object.keys(rule).length ? rule : undefined;
  return setDeep(uiSchema, [field, "ui:options", "visibleIf"], value);
}

/* ------------------------------------------------------------------- steps */

/**
 * Derives an id from a title, falling back to a positional one, and
 * de-duplicates against the ids already in use.
 *
 * Ids are stable handles: `errorsByStep` keys off them and FormShell remounts
 * on them, so a colliding id would merge two tabs' error counts.
 */
function uniqueStepId(steps, seed) {
  const base =
    String(seed || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || `step-${steps.length + 1}`;

  const taken = new Set(steps.map((step) => step?.id).filter(Boolean));
  if (!taken.has(base)) return base;

  let suffix = 2;
  while (taken.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

/**
 * Appends a step.
 *
 * When a form had no `ui:steps` at all it was rendering as a single implicit
 * page; adding the first step must therefore also claim every existing property,
 * or the author would see their whole form jump into an "Other" tab.
 */
export function addStep(uiSchema, { title, allFields = [] } = {}) {
  const steps = readSteps(uiSchema);
  const first = steps.length === 0;

  const step = {
    id: uniqueStepId(steps, title?.en || title?.fr),
    title: title || { en: "", fr: "" },
    fields: first ? [...allFields] : [],
  };

  return withSteps(uiSchema, [...steps, step]);
}

/** Merges a patch into one step. Passing `undefined` for a key removes it. */
export function updateStep(uiSchema, index, patch) {
  const steps = readSteps(uiSchema);
  if (!steps[index]) return uiSchema;

  const next = { ...steps[index], ...patch };
  Object.entries(patch).forEach(([key, value]) => {
    if (value === undefined) delete next[key];
  });

  return withSteps(uiSchema, steps.map((step, i) => (i === index ? next : step)));
}

export function setStepVisibleIf(uiSchema, index, rule) {
  const value = isPlainObject(rule) && Object.keys(rule).length ? rule : undefined;
  return updateStep(uiSchema, index, { visibleIf: value });
}

/**
 * Deletes a step. Its fields become unassigned rather than hidden — `resolveSteps`
 * sweeps them into the catch-all "Other" tab — and their per-field configuration
 * (titles, help, widgets) is left completely alone, so deleting a step by mistake
 * costs an author nothing but the grouping.
 */
export function removeStep(uiSchema, index) {
  const steps = readSteps(uiSchema);
  if (!steps[index]) return uiSchema;
  return withSteps(uiSchema, steps.filter((_step, i) => i !== index));
}

export function moveStep(uiSchema, from, to) {
  const steps = readSteps(uiSchema);
  const moved = moveItem(steps, from, to);
  return moved === steps ? uiSchema : withSteps(uiSchema, moved);
}

/**
 * Puts a field in exactly one step, or in none.
 *
 * Removing it from every other step first is what makes the panel's drag-and-drop
 * safe: a field claimed twice renders only in the first step that names it
 * (steps.js:91), so a "copy" would look like a silent deletion from the second.
 *
 * @param {number|null} stepIndex  null unassigns the field
 * @param {number} [position]      insertion index within the target step
 */
export function assignFieldToStep(uiSchema, field, stepIndex, position) {
  const steps = readSteps(uiSchema);
  if (steps.length === 0) return uiSchema;

  const stripped = steps.map((step) => ({
    ...step,
    fields: (step.fields || []).filter((name) => name !== field),
  }));

  if (stepIndex === null || stepIndex === undefined || !stripped[stepIndex]) {
    return withSteps(uiSchema, stripped);
  }

  const target = stripped[stepIndex];
  const fields = [...target.fields];
  const at = position === undefined ? fields.length : Math.max(0, Math.min(position, fields.length));
  fields.splice(at, 0, field);

  return withSteps(
    uiSchema,
    stripped.map((step, i) => (i === stepIndex ? { ...step, fields } : step))
  );
}

export function moveFieldWithinStep(uiSchema, stepIndex, from, to) {
  const steps = readSteps(uiSchema);
  const step = steps[stepIndex];
  if (!step) return uiSchema;

  const moved = moveItem(step.fields || [], from, to);
  if (moved === step.fields) return uiSchema;

  return withSteps(
    uiSchema,
    steps.map((s, i) => (i === stepIndex ? { ...s, fields: moved } : s))
  );
}

/** Every property named by some step, in step order. */
export function assignedFields(uiSchema) {
  return readSteps(uiSchema).flatMap((step) => step.fields || []);
}

/* ---------------------------------------------------------- summary fields */

export function setSummaryFields(uiSchema, names) {
  const cleaned = Array.isArray(names) ? names : [];
  if (cleaned.length === 0) return omit(uiSchema || {}, "ui:summaryFields");
  return { ...(uiSchema || {}), "ui:summaryFields": cleaned };
}
