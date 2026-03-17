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

/**
 * SortableItem wraps each draggable item
 * Provides drag handle via the handleSelector class
 */
export const SortableItem = ({ id, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <DragHandleContext.Provider value={{ listeners, attributes }}>
        {children}
      </DragHandleContext.Provider>
    </div>
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
 * DragHandle component - use this instead of className="drag-handle"
 * Wrap your drag handle icon/button with this component
 */
export const DragHandle = ({ children, disabled }) => {
  const { listeners, attributes } = React.useContext(DragHandleContext);

  if (disabled) {
    return children;
  }

  return (
    <span
      {...listeners}
      {...attributes}
      style={{ cursor: "grab", touchAction: "none" }}
    >
      {children}
    </span>
  );
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
