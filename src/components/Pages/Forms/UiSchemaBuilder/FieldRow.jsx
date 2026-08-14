import React, { useId, useState } from "react";
import {
  Box,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from "@mui/material";
import { ArrowDownward, ArrowUpward, MoreVert } from "@mui/icons-material";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { moveFieldWithinStep, assignFieldToStep } from "@shared/formEngine";
import {
  FieldName,
  MetaTag,
  rowSelectButtonSx,
  selectableRowSx,
} from "./primitives";
import DragGrip from "./DragGrip";
import { fieldDragId, ACCEPTS_FIELD } from "./dnd/ids";
import { useBuilderDrag } from "./dnd/StepsDndProvider";
import { localized, pick } from "./language";

/**
 * One property, as a row in a step's field list.
 *
 * The row is scannable on purpose: name, label, type and required-ness are
 * always visible so a step can be read as a column and checked for coverage,
 * while the controls that act on the row appear on hover or focus. Before, every
 * row carried two arrow buttons and a 130px step dropdown at full strength,
 * which on a six-field step rendered six dropdowns and buried the content.
 *
 * `data-row-actions` is what `selectableRowSx` targets to reveal them; see the
 * note there about why that is done with `opacity` and never `visibility`.
 */

/**
 * The insertion line, as a pseudo-element so it takes up no layout.
 *
 * Adding a real 2px element between rows would change every rect below it on
 * every hover, which with `MeasuringStrategy.Always` means re-measuring the whole
 * list continuously.
 */
const insertionSx = (edge) => (t) => ({
  "&::after": {
    content: '""',
    position: "absolute",
    left: 0,
    right: 0,
    [edge]: -2,
    height: 2,
    borderRadius: 1,
    bgcolor: t.palette.primary.main,
  },
});

/** Nudges a field one place up or down within its step. */
function shiftField(uiSchema, stepIndex, name, delta) {
  const fields = uiSchema?.["ui:steps"]?.[stepIndex]?.fields || [];
  const from = fields.indexOf(name);
  return moveFieldWithinStep(uiSchema, stepIndex, from, from + delta);
}

export default function FieldRow({
  name,
  property,
  uiSchema,
  language,
  selected,
  onSelect,
  stepIndex,
  steps,
  onChange,
  canMoveUp,
  canMoveDown,
  required,
  moveDisabled,
  index,
  draggable = true,
}) {
  const menuId = useId();
  const [menuAnchor, setMenuAnchor] = useState(null);

  const { dropPlan, activeDrag } = useBuilderDrag();

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: fieldDragId(name),
    disabled: !draggable,
    data: { type: "field", name, container: stepIndex, index, accepts: ACCEPTS_FIELD },
  });

  /**
   * Where the insertion line goes.
   *
   * Across steps the target list's rows cannot part to make room — see the note
   * in StepsDndProvider — so this line IS the feedback. Drawn as an absolutely
   * positioned element so it never changes the row's height mid-drag, which would
   * invalidate every rect below it.
   */
  const insertion = (() => {
    if (!dropPlan || !activeDrag || activeDrag.type !== "field") return null;
    if (dropPlan.kind === "cross") {
      if (dropPlan.container !== stepIndex) return null;
      if (dropPlan.position === index) return "before";
      // Appending past the last row.
      if (dropPlan.position === index + 1) return "after";
      return null;
    }
    return null;
  })();

  const label = localized(
    uiSchema?.[name]?.["ui:options"]?.i18n?.title,
    language,
    ""
  );

  const type = property?.type;
  const typeLabel = Array.isArray(type) ? type.join(" | ") : type || "any";

  return (
    <Box
      ref={setNodeRef}
      sx={[
        selectableRowSx,
        {
          transform: CSS.Transform.toString(transform),
          transition,
          // The overlay carries the visual while dragging; the source stays in
          // place, faded, so the list does not collapse under the cursor.
          opacity: isDragging ? 0.4 : 1,
        },
        insertion === "before" && insertionSx("top"),
        insertion === "after" && insertionSx("bottom"),
      ]}
      data-selected={selected ? "true" : "false"}
    >
      <DragGrip
        attributes={attributes}
        listeners={listeners}
        setActivatorNodeRef={setActivatorNodeRef}
        disabled={!draggable}
        reveal
        label={pick(language, `Drag ${name}`, `Glisser ${name}`)}
      />

      <Box
        component="button"
        type="button"
        onClick={() => onSelect(name)}
        sx={rowSelectButtonSx}
      >
        <FieldName>{name}</FieldName>
        <Typography
          variant="caption"
          color="text.secondary"
          noWrap
          sx={{ minWidth: 0, flex: 1 }}
        >
          {label || (
            <Box component="span" sx={{ fontStyle: "italic" }}>
              {pick(language, "no label", "sans étiquette")}
            </Box>
          )}
        </Typography>
      </Box>

      <MetaTag label={typeLabel} title={typeLabel} />

      {/*
        A fixed-width slot, occupied or not. Without it the type badges form a
        ragged column: a row with no required marker lets its badge slide right
        into the empty space, and the eye reads that as misalignment rather than
        as information.

        A bare glyph rather than a bordered MetaTag — a box drawn around a single
        asterisk reads as a broken badge, and this matches the app's own
        RequiredMark, which is a coloured glyph too.
      */}
      <Box
        component="span"
        aria-label={required ? pick(language, "required", "obligatoire") : undefined}
        title={required ? pick(language, "required", "obligatoire") : undefined}
        sx={{
          width: 12,
          flexShrink: 0,
          textAlign: "center",
          color: "error.main",
          fontWeight: 700,
          fontSize: 15,
          lineHeight: 1,
        }}
      >
        {required ? "*" : ""}
      </Box>

      <Box data-row-actions>
        {stepIndex !== null && (
          <>
            <IconButton
              size="small"
              disabled={!canMoveUp || moveDisabled}
              aria-label={pick(
                language,
                `Move ${name} up`,
                `Déplacer ${name} vers le haut`
              )}
              onClick={() => onChange(shiftField(uiSchema, stepIndex, name, -1))}
            >
              <ArrowUpward fontSize="inherit" />
            </IconButton>
            <IconButton
              size="small"
              disabled={!canMoveDown || moveDisabled}
              aria-label={pick(
                language,
                `Move ${name} down`,
                `Déplacer ${name} vers le bas`
              )}
              onClick={() => onChange(shiftField(uiSchema, stepIndex, name, 1))}
            >
              <ArrowDownward fontSize="inherit" />
            </IconButton>
          </>
        )}

        {steps.length > 0 && (
          <>
            {/*
              A menu rather than the 130px `Select` this replaces. Six fields in a
              step meant six dropdowns drawn at full strength, which buried the
              names they were describing; and a stock small Select is 40px tall,
              taller than the whole row.

              The ellipsis lives in the tooltip, not the accessible name — a name
              containing a Unicode "…" is a needless tax on every query that has
              to match it.
            */}
            <Tooltip title={pick(language, "Move to…", "Déplacer vers…")}>
              <IconButton
                size="small"
                aria-haspopup="menu"
                aria-controls={menuAnchor ? menuId : undefined}
                aria-expanded={menuAnchor ? "true" : undefined}
                aria-label={pick(
                  language,
                  `Move ${name} to`,
                  `Déplacer ${name} vers`
                )}
                onClick={(event) => setMenuAnchor(event.currentTarget)}
              >
                <MoreVert fontSize="inherit" />
              </IconButton>
            </Tooltip>
            <Menu
              id={menuId}
              anchorEl={menuAnchor}
              open={Boolean(menuAnchor)}
              onClose={() => setMenuAnchor(null)}
            >
              {steps.map((step, index) => (
                <MenuItem
                  key={step.id || index}
                  // The current step stays enabled and merely marked: a disabled
                  // item reads as "this menu is broken", and choosing it is a
                  // harmless identity call.
                  selected={index === stepIndex}
                  onClick={() => {
                    setMenuAnchor(null);
                    onChange(assignFieldToStep(uiSchema, name, index));
                  }}
                >
                  {localized(step.title, language, step.id || `step-${index + 1}`)}
                </MenuItem>
              ))}
              <Divider />
              <MenuItem
                selected={stepIndex === null}
                onClick={() => {
                  setMenuAnchor(null);
                  onChange(assignFieldToStep(uiSchema, name, null));
                }}
              >
                {pick(language, "Unassigned", "Non assigné")}
              </MenuItem>
            </Menu>
          </>
        )}
      </Box>
    </Box>
  );
}
