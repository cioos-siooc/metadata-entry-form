/**
 * What a drop MEANS, decided without touching React or dnd-kit.
 *
 * This is the whole decision layer for dragging in the builder, kept pure for one
 * concrete reason: a real pointer drag cannot be tested in jsdom (no
 * PointerEvent, no setPointerCapture) and neither can collision detection
 * (getBoundingClientRect returns zeros, so every droppable is a degenerate rect
 * at the same coordinates). Putting the decisions here means the part that can
 * actually be wrong is the part that is actually tested, and the untestable part
 * is reduced to "which droppable did the pointer land on", which dnd-kit owns.
 *
 * Returns a PLAN rather than a new uiSchema so the two halves — deciding and
 * applying — can be checked separately, and so a `dragOver` can draw an insertion
 * indicator from the same decision the eventual `dragEnd` will make.
 *
 * @returns {null
 *   | {kind: "noop"}
 *   | {kind: "moveStep", from: number, to: number}
 *   | {kind: "within", container: number, from: number, to: number}
 *   | {kind: "cross", name: string, container: number|null, position: number}}
 *
 * `null` means "nothing to do, and nothing to draw". `{kind: "noop"}` means "a
 * real target, but this move cannot be persisted" — the two are distinguished so
 * the UI can decline to promise an ordering it has nowhere to store.
 */
export function resolveDropPlan({ activeData, overData, steps = [], unassigned = [] }) {
  if (!activeData || !overData) return null;

  const listOf = (container) =>
    container === null || container === undefined
      ? unassigned
      : steps[container]?.fields || [];

  /* ---------------------------------------------------------------- steps */

  if (activeData.type === "step") {
    // Collision detection is filtered by `accepts`, so a step drag can never
    // resolve onto a field row. Checked anyway: this function is the contract.
    if (overData.type !== "step") return null;
    if (overData.index === activeData.index) return null;
    return { kind: "moveStep", from: activeData.index, to: overData.index };
  }

  if (activeData.type !== "field") return null;

  /* --------------------------------------------------------- over a field */

  if (overData.type === "field") {
    const to = overData.container ?? null;
    const list = listOf(to);
    const position = list.indexOf(overData.name);

    if (to === (activeData.container ?? null)) {
      // The unassigned tray's order is derived from Object.keys(properties) and
      // has nowhere to be written, so reordering within it is declined rather
      // than silently dropped. `noop` keeps the UI from drawing an insertion
      // line it cannot honour.
      if (to === null) return { kind: "noop" };

      const from = list.indexOf(activeData.name);
      if (from === -1 || position === -1 || from === position) return null;
      return { kind: "within", container: to, from, to: position };
    }

    return { kind: "cross", name: activeData.name, container: to, position };
  }

  /* ------------------------------------- over a container or a card header */

  // A card header and its field list are collapsed to the same target on
  // purpose, which is what makes "header versus list" a non-question: both mean
  // THIS step, and only the insertion position differs. It is also what makes a
  // drop on a COLLAPSED card work — its body is unmounted, so the card's own
  // droppable is the only thing there to hit.
  if (overData.type === "container" || overData.type === "step") {
    const to =
      overData.type === "step" ? overData.index : overData.container ?? null;

    if (to === (activeData.container ?? null)) return null;

    if (to === null) {
      return { kind: "cross", name: activeData.name, container: null, position: 0 };
    }
    return {
      kind: "cross",
      name: activeData.name,
      container: to,
      position: listOf(to).length,
    };
  }

  return null;
}

/** Whether two plans would draw the same indicator, to avoid re-rendering rows. */
export function samePlan(a, b) {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.kind === b.kind &&
    a.container === b.container &&
    a.from === b.from &&
    a.to === b.to &&
    a.name === b.name &&
    a.position === b.position
  );
}
