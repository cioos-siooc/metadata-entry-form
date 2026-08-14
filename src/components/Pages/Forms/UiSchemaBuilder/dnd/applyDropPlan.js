import {
  assignFieldToStep,
  moveFieldWithinStep,
  moveStep,
} from "@shared/formEngine";

/**
 * Turns a drop plan into the next uiSchema.
 *
 * Two properties worth stating, because callers depend on both:
 *
 * ONE CALL FOR A CROSS-STEP MOVE. `assignFieldToStep` already strips the field
 * from EVERY step before inserting it (uiSchemaOps.js:232), so pairing it with an
 * explicit "remove from the old step" would be redundant and worse — it would
 * produce an intermediate uiSchema the parent could serialize. Its `position`
 * argument already exists and is clamped, so cross-step dropping needs no change
 * to the shared package at all.
 *
 * IDENTITY ON A NO-OP. Every operation in uiSchemaOps returns its input
 * unchanged when it would not alter anything. Returning that value through means
 * a caller can compare by reference and skip `onChange` entirely, which is what
 * keeps a drag that lands where it started from dirtying the JSON tab.
 */
export function applyDropPlan(uiSchema, plan) {
  if (!plan) return uiSchema;

  switch (plan.kind) {
    case "moveStep":
      return moveStep(uiSchema, plan.from, plan.to);
    case "within":
      return moveFieldWithinStep(uiSchema, plan.container, plan.from, plan.to);
    case "cross":
      return assignFieldToStep(uiSchema, plan.name, plan.container, plan.position);
    case "noop":
    default:
      return uiSchema;
  }
}
