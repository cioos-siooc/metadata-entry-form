import {
  closestCenter,
  closestCorners,
  pointerWithin,
  rectIntersection,
} from "@dnd-kit/core";

/**
 * Which droppable a drag is over.
 *
 * TYPE FILTERING FIRST. Each droppable declares what it `accepts`, and anything
 * that does not accept the active type is removed before any geometry runs. That
 * is what makes a step drag unable to resolve onto a field row, and a field drag
 * unable to resolve onto another step's drag handle — so no handler downstream
 * needs a defensive type check, and `resolveDropPlan` can treat a mismatch as
 * "impossible" rather than "possible but ignored".
 *
 * THEN A STRATEGY PER TYPE.
 *
 * Steps are one flat list of similarly-sized cards, which is exactly what
 * `closestCenter` is good at.
 *
 * Fields are not. Their targets are NESTED and wildly different sizes — a 400px
 * step card contains 36px rows — and centre-distance systematically favours the
 * big one, which makes rows near a card's top or bottom edge unreachable. So:
 * `pointerWithin` first, because it is exact and the nesting makes exactness
 * matter; `rectIntersection` when the pointer is between rows; and
 * `closestCorners` last. That tail is not a nicety — `pointerWithin` returns
 * nothing at all for a KEYBOARD drag, which has no pointer, so without it
 * keyboard dragging would never find a target.
 */
export function builderCollisionDetection(args) {
  const type = args.active?.data?.current?.type;
  if (!type) return closestCenter(args);

  const droppableContainers = args.droppableContainers.filter((container) =>
    (container.data?.current?.accepts || []).includes(type)
  );
  const scoped = { ...args, droppableContainers };

  if (type === "step") return closestCenter(scoped);

  const within = pointerWithin(scoped);
  if (within.length) return within;

  const intersecting = rectIntersection(scoped);
  if (intersecting.length) return intersecting;

  return closestCorners(scoped);
}
