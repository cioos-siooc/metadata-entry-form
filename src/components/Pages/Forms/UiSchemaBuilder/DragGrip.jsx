import React from "react";
import { Box } from "@mui/material";
import { DragIndicator } from "@mui/icons-material";

/**
 * The handle a drag starts from.
 *
 * Handle-only activation, not whole-row: a field row's name is a button that
 * selects it, and a step card's title is a button that selects the step. If the
 * whole thing were the drag activator its Space/Enter handling would fight those
 * buttons', and clicking to select would compete with dragging to move.
 *
 * Not built on the app's shared `SortableList` DragHandle, which spreads
 * `attributes` onto both the item wrapper and the handle — producing two nodes
 * that each claim `role="button"` and an `aria-roledescription` — and never wires
 * `setActivatorNodeRef`, so dnd-kit does not know which node actually started the
 * drag. That matters for keyboard focus after a drop.
 */
export default function DragGrip({
  attributes,
  listeners,
  setActivatorNodeRef,
  label,
  disabled,
  reveal,
}) {
  if (disabled) {
    return (
      <Box
        sx={{
          width: 24,
          display: "flex",
          justifyContent: "center",
          flexShrink: 0,
        }}
      />
    );
  }

  return (
    <Box
      component="button"
      type="button"
      ref={setActivatorNodeRef}
      aria-label={label}
      // Opted into by field rows, whose grips fade in on hover; step cards keep
      // theirs visible, there being only a handful of them. `opacity` and never
      // `visibility`, so the button stays reachable either way.
      {...(reveal ? { "data-row-grip": "" } : null)}
      {...attributes}
      {...listeners}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 24,
        height: 24,
        flexShrink: 0,
        p: 0,
        border: 0,
        borderRadius: 0.75,
        background: "none",
        color: "text.disabled",
        cursor: "grab",
        // Without this the browser scrolls the page instead of starting a drag.
        touchAction: "none",
        "&:hover": { color: "text.secondary" },
        "&:active": { cursor: "grabbing" },
      }}
    >
      <DragIndicator fontSize="small" />
    </Box>
  );
}
