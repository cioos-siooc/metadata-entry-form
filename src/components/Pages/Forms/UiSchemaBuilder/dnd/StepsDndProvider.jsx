import React, { createContext, useContext, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MeasuringStrategy,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import {
  restrictToParentElement,
  restrictToVerticalAxis,
  restrictToWindowEdges,
} from "@dnd-kit/modifiers";

import { builderCollisionDetection } from "./collision";
import { resolveDropPlan, samePlan } from "./resolveDropPlan";
import { applyDropPlan } from "./applyDropPlan";
import { buildAnnouncements, buildScreenReaderInstructions } from "./announcements";

/**
 * One DndContext for the whole canvas, holding both kinds of draggable.
 *
 * WHY ONE, AND NOT TWO. dnd-kit resolves `useSortable` to the NEAREST provider.
 * Dragging a field between steps needs every row in a single context spanning all
 * the cards — but a row is a DOM descendant of its card, and the card is itself a
 * sortable. Put a fields context inside each card and it cannot cross steps; put
 * it outside and the cards resolve to it, which breaks step reordering. No
 * arrangement gives both, so there is one context and two draggable TYPES,
 * disambiguated by `data.type` and by each droppable's `accepts` list.
 *
 * Nesting SortableContexts is safe here: during a field drag the steps context
 * has `activeIndex === -1`, so no card is displaced.
 *
 * (This replaces StepsPanel's earlier note that "nested DndContexts are fragile".
 * That was true and is still true — this is not nested contexts.)
 *
 * WHY AN INDICATOR RATHER THAN A SHADOW LIST. In @dnd-kit/sortable a row is only
 * displaced when both `activeIndex` and `overIndex` are valid in ITS context.
 * Within one step both are, so rows part on their own. Across steps the target
 * context has `activeIndex === -1`, so its rows will never part however collision
 * detection is configured — which is why dnd-kit's own multi-container example
 * mutates a shadow copy of the list on every `dragOver`. This does not: the
 * parent's uiSchema stays the single source of truth, exactly one `onChange` is
 * emitted per drop, a cancel is a genuine no-op with nothing to roll back, and
 * the decision is a pure function that can actually be tested. The cost is that a
 * cross-step drop shows an insertion line instead of rows sliding apart.
 */

const DragStateContext = createContext({ activeDrag: null, dropPlan: null });

/** `{activeDrag, dropPlan}` — what to draw while a drag is in flight. */
export const useBuilderDrag = () => useContext(DragStateContext);

export default function StepsDndProvider({
  uiSchema,
  onChange,
  steps,
  unassigned,
  language,
  renderOverlay,
  onDragOverStep,
  children,
}) {
  const [activeDrag, setActiveDrag] = useState(null);
  const [dropPlan, setDropPlan] = useState(null);
  const [dragWidth, setDragWidth] = useState(null);

  // Read inside the announcement callbacks, which dnd-kit holds for the life of
  // the drag; a ref keeps them from closing over a stale array.
  const stepsRef = useRef(steps);
  stepsRef.current = steps;

  const sensors = useSensors(
    // 6px of travel before a drag starts, so clicking a row to select it and
    // dragging it to move it stay distinguishable.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const announcements = useMemo(
    () => buildAnnouncements(language, () => stepsRef.current),
    [language]
  );
  const screenReaderInstructions = useMemo(
    () => buildScreenReaderInstructions(language),
    [language]
  );

  /**
   * Cards expand and collapse mid-drag and the insertion indicator changes
   * layout, so measuring once at dragStart would leave every rect below the
   * change stale. This is also what makes an empty card's drop zone reliable.
   */
  const measuring = useMemo(
    () => ({ droppable: { strategy: MeasuringStrategy.Always } }),
    []
  );

  /**
   * A step is confined to the vertical axis inside its list, which is how the
   * rest of the app's sortable lists behave. A field is not: the overlay has to
   * be able to track the cursor toward a card that is horizontally offset.
   */
  const modifiers = useMemo(
    () =>
      activeDrag?.type === "step"
        ? [restrictToVerticalAxis, restrictToParentElement]
        : [restrictToWindowEdges],
    [activeDrag?.type]
  );

  const planFrom = (event) =>
    resolveDropPlan({
      activeData: event.active?.data?.current,
      overData: event.over?.data?.current,
      steps,
      unassigned,
    });

  const reset = () => {
    setActiveDrag(null);
    setDropPlan(null);
    setDragWidth(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={builderCollisionDetection}
      measuring={measuring}
      modifiers={modifiers}
      accessibility={{ announcements, screenReaderInstructions }}
      onDragStart={(event) => {
        setActiveDrag(event.active?.data?.current || null);
        // Without an explicit width the overlay collapses to its content.
        setDragWidth(event.active?.rect?.current?.initial?.width || null);
      }}
      onDragOver={(event) => {
        const next = planFrom(event);
        setDropPlan((current) => (samePlan(current, next) ? current : next));

        const over = event.over?.data?.current;
        if (onDragOverStep && over) {
          const index =
            over.type === "step"
              ? over.index
              : over.type === "container"
                ? over.container
                : over.container;
          if (typeof index === "number") onDragOverStep(index);
        }
      }}
      onDragEnd={(event) => {
        // Recomputed from THIS event rather than trusting the last dragOver: a
        // drop can land after a final move that produced no dragOver.
        const plan = planFrom(event);
        reset();
        const next = applyDropPlan(uiSchema, plan);
        // Every uiSchemaOps function returns its input when nothing changed, so
        // reference equality is a free "do not dirty the JSON for nothing".
        if (next !== uiSchema) onChange(next);
      }}
      onDragCancel={reset}
    >
      <DragStateContext.Provider
        value={useMemo(() => ({ activeDrag, dropPlan }), [activeDrag, dropPlan])}
      >
        {children}
        {/*
          Portalled to the body because the inspector column is `position:
          sticky`, and a sticky or transformed ancestor is the usual reason a
          DragOverlay ends up mispositioned or clipped.
        */}
        {createPortal(
          <DragOverlay>
            {activeDrag ? renderOverlay(activeDrag, dragWidth) : null}
          </DragOverlay>,
          document.body
        )}
      </DragStateContext.Provider>
    </DndContext>
  );
}
