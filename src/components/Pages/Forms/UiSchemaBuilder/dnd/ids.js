/**
 * Drag ids for the builder's canvas.
 *
 * Ids here are opaque ROUTING keys. Everything a handler needs to decide what a
 * drop means travels in the `data` payload instead, so no handler parses an id
 * back apart — the one exception being dnd-kit itself, which only ever compares
 * them for equality.
 *
 * Step ids are POSITIONAL on purpose, even though `stepKey` in ../selection.js
 * keys UI state by the author's `step.id`. Two different jobs: `stepKey` has to
 * survive a reorder across renders, whereas a drag id only has to be unique for
 * the duration of one gesture — and `step.id` is free text an author can leave
 * blank or duplicate (only `uniqueStepId` dedupes, at creation; validateUiSchema
 * merely warns). Duplicate dnd-kit ids silently break drops, so position is the
 * safer choice here. Nothing re-renders mid-drag, because the schema is only
 * written on `dragEnd`.
 */

export const CONTAINER_UNASSIGNED = "unassigned";

/** A field row. Unique because these are `jsonSchema.properties` keys. */
export const fieldDragId = (name) => `field:${name}`;

/** A step card. */
export const stepDragId = (index) => `step:${index}`;

/** A step's field list, or the unassigned tray when `index` is null. */
export const containerDropId = (index) =>
  `container:${index === null || index === undefined ? CONTAINER_UNASSIGNED : index}`;

/** Types the two draggables accept, used to filter collisions. */
export const ACCEPTS_FIELD = ["field"];
export const ACCEPTS_BOTH = ["step", "field"];
