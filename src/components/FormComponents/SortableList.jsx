import React from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { Box } from "@mui/material";

/**
 * SortableItem wraps each draggable item. It renders an <li> so it can sit
 * directly in a <List>. The dnd-kit attributes (role="button", tabIndex) go on
 * the DragHandle, not here: on the wrapper they made every row one extra tab
 * stop that wrapped its own buttons.
 */
export const SortableItem = ({ id, children, sx }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  return (
    <Box
      component="li"
      ref={setNodeRef}
      sx={[
        {
          listStyle: "none",
          position: "relative",
          zIndex: isDragging ? 1 : "auto",
          opacity: isDragging ? 0.5 : 1,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      // dnd-kit updates these every pointer move; they stay inline.
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <DragHandleContext.Provider value={{ listeners, attributes }}>
        {children}
      </DragHandleContext.Provider>
    </Box>
  );
};

export const useStableItemIds = (prefix = "item") => {
  const idMapRef = React.useRef(new WeakMap());
  const counterRef = React.useRef(0);

  return React.useCallback(
    (item, index) => {
      if (item && typeof item === "object") {
        const idMap = idMapRef.current;
        if (!idMap.has(item)) {
          counterRef.current += 1;
          idMap.set(item, `${prefix}-${counterRef.current}`);
        }
        return idMap.get(item);
      }
      return `${prefix}-${index}`;
    },
    [prefix],
  );
};

// Context to pass drag listeners to the handle
export const DragHandleContext = React.createContext({
  listeners: {},
  attributes: {},
});

/**
 * DragHandle passes the drag listeners and attributes straight onto its one
 * child (an IconButton), so the handle is a single focusable control that
 * also works with the keyboard sensor (Space to lift, arrows, Space to drop).
 */
export const DragHandle = ({ children, disabled }) => {
  const { listeners, attributes } = React.useContext(DragHandleContext);

  if (disabled) {
    return children;
  }

  const child = React.Children.only(children);
  return React.cloneElement(child, {
    ...attributes,
    ...listeners,
    sx: [
      { cursor: "grab", touchAction: "none" },
      ...(Array.isArray(child.props.sx) ? child.props.sx : [child.props.sx]),
    ],
  });
};

/**
 * SortableList - a drop-in replacement for react-smooth-dnd Container
 *
 * @param {Array} items - Array of items to sort (must have unique ids or will use index)
 * @param {Function} onDrop - Callback with { removedIndex, addedIndex } when item is dropped
 * @param {Function} children - Render prop or children
 * @param {Function} getItemId - Optional function to get unique id from item (default: uses index)
 */
export const SortableList = ({
  items,
  onDrop,
  children,
  getItemId = (item, index) => `sortable-${index}`,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const itemIds = items.map((item, index) => getItemId(item, index));

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = itemIds.indexOf(active.id);
      const newIndex = itemIds.indexOf(over.id);

      onDrop({
        removedIndex: oldIndex,
        addedIndex: newIndex,
      });
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis]}
    >
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
};

// Re-export arrayMove for convenience
export { arrayMove };

export default SortableList;
