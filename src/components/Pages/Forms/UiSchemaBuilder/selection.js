/**
 * What the inspector is pointed at, and which step cards are open.
 *
 * Both are derived rather than stored wherever that is possible, because both
 * can be invalidated by an edit made somewhere else: the JSON Schema tab can
 * delete the selected property, and reordering or deleting a step shifts every
 * index after it. The version this replaces kept the open card as a bare index
 * and re-pointed it after a drag with `setExpanded(addedIndex)`, which was right
 * for a drag and wrong for a delete.
 *
 * Pure and dependency-free, so the index arithmetic is unit-testable without
 * rendering a 22-field panel.
 */

/**
 * A step's identity for UI state.
 *
 * `step.id` is free text an author types, so it can be blank or duplicated —
 * `uniqueStepId` only dedupes at creation and `validateUiSchema` merely warns.
 * Falling back to a positional key keeps this total; the `#` prefix cannot
 * collide with a real id because `uniqueStepId` strips everything that is not
 * `[a-z0-9-]`.
 */
export function stepKey(step, index) {
  return step?.id ? `id:${step.id}` : `#${index}`;
}

/** Keys for every step, in order. */
export function stepKeys(steps) {
  return (steps || []).map(stepKey);
}

/**
 * Resolves a requested selection against the schema as it is NOW.
 *
 * @param {{kind: "field"|"step", name?: string, key?: string, index?: number}|null} requested
 * @returns {{kind: "field", name: string}|{kind: "step", index: number}|null}
 *
 * Falls back to the first property rather than to nothing, for two reasons: an
 * empty inspector beside a full canvas looks broken, and several behaviours —
 * editing a label, reading a widget list — should work the moment the panel
 * opens without a click.
 *
 * A step request carries BOTH a key and the index it was made at, and they cover
 * different failures. The key survives a reorder, where the index would now name
 * a different step. The index survives an id EDIT, where the key stops matching —
 * and the step id field lives in the step's own settings panel, so without the
 * index fallback the panel would deselect itself on the first keystroke typed
 * into it. Only when neither resolves is the step really gone.
 */
export function resolveSelection(requested, jsonSchema, steps) {
  const fieldNames = Object.keys(jsonSchema?.properties || {});
  const firstField = fieldNames[0] || null;
  const asField = (name) => (name ? { kind: "field", name } : null);

  if (requested?.kind === "step") {
    const byKey = stepKeys(steps).indexOf(requested.key);
    if (byKey !== -1) return { kind: "step", index: byKey };

    const at = requested.index;
    if (typeof at === "number" && (steps || [])[at]) {
      return { kind: "step", index: at };
    }

    // Deleted. A field is always a safe landing place, and it is where the
    // panel started.
    return asField(firstField);
  }

  if (requested?.kind === "field") {
    if (requested.name && fieldNames.includes(requested.name)) {
      return asField(requested.name);
    }
    return asField(firstField);
  }

  return asField(firstField);
}

/** Index of the step holding a property, or null when no step claims it. */
export function stepIndexOfField(steps, name) {
  const index = (steps || []).findIndex((step) =>
    (step?.fields || []).includes(name)
  );
  return index === -1 ? null : index;
}

/**
 * The step keys whose cards must be rendered open.
 *
 * Derived, not stored: on top of what the author explicitly opened, a card is
 * forced open when it holds the current selection or a search hit. That is what
 * makes "the selected field is always reachable" true by construction instead of
 * by an effect that re-opens cards after the fact.
 */
export function renderedOpenKeys({
  steps,
  open = new Set(),
  selection = null,
  matchedFields = null,
}) {
  const keys = new Set(open);

  if (selection?.kind === "step" && steps[selection.index]) {
    keys.add(stepKey(steps[selection.index], selection.index));
  }
  if (selection?.kind === "field") {
    const index = stepIndexOfField(steps, selection.name);
    if (index !== null) keys.add(stepKey(steps[index], index));
  }
  if (matchedFields) {
    steps.forEach((step, index) => {
      if ((step.fields || []).some((name) => matchedFields.has(name))) {
        keys.add(stepKey(step, index));
      }
    });
  }

  return keys;
}
