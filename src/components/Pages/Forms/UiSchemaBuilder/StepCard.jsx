import React, { useId } from "react";
import { Box, Collapse, IconButton, Paper, Typography } from "@mui/material";
import { ExpandMore } from "@mui/icons-material";
import { alpha } from "@mui/material/styles";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import FieldRow from "./FieldRow";
import DragGrip from "./DragGrip";
import { MetaTag } from "./primitives";
import {
  ACCEPTS_BOTH,
  ACCEPTS_FIELD,
  containerDropId,
  fieldDragId,
  stepDragId,
} from "./dnd/ids";
import { useBuilderDrag } from "./dnd/StepsDndProvider";
import { localized, pick, plural } from "./language";

/**
 * One step, as a card whose body is nothing but its field list.
 *
 * Replaces the MUI `Accordion` this used to be, for three reasons:
 *
 *   1. Several cards must be open at once. `Accordion` supports that, but the
 *      panel drove it with a single `expanded === index`, so two tabs' field
 *      lists could never be compared — which is most of what an author is doing
 *      when they lay a form out.
 *   2. `Accordion` renders its own dividers, gutters and elevation. Suppressing
 *      all three to get a card back is more code than drawing the card.
 *   3. Its summary is one big button, which leaves nowhere to put a title that is
 *      ITSELF a button — and selecting a step by clicking its name is how the
 *      inspector gets pointed at a step.
 *
 * The `<h3>` is deliberate. `Accordion` wrapped its whole summary in an `h3`
 * heading slot, so the step titles were the canvas's document outline; keeping
 * that level means a screen reader user can still jump between steps. It now
 * wraps only the title, which is what a heading should be.
 */
export default function StepCard({
  step,
  index,
  open,
  onToggle,
  selected,
  onSelectStep,
  jsonSchema,
  uiSchema,
  onChange,
  language,
  steps,
  selectedField,
  onSelectField,
  required,
  properties,
  visibleFields,
}) {
  const headingId = useId();
  const bodyId = useId();

  const { activeDrag, dropPlan } = useBuilderDrag();

  /**
   * The card is BOTH sortable among the other cards and a drop target for
   * fields — that dual role is what makes a drop on a collapsed header work, and
   * why it accepts both types.
   */
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: stepDragId(index),
    data: { type: "step", index, accepts: ACCEPTS_BOTH },
  });

  /**
   * The field list as its own drop target.
   *
   * `minHeight` on the wrapper is not cosmetic: a zero-height container can never
   * win a collision, which is the classic reason an empty sortable list refuses
   * drops. Paired with `MeasuringStrategy.Always` in the provider.
   */
  const list = useDroppable({
    id: containerDropId(index),
    data: { type: "container", container: index, accepts: ACCEPTS_FIELD },
  });

  const title = localized(step.title, language, step.id || `step-${index + 1}`);
  const fields = step.fields || [];

  // Whether a field being dragged is currently aimed at this card.
  const isDropTarget =
    activeDrag?.type === "field" &&
    dropPlan?.kind === "cross" &&
    dropPlan.container === index;
  // Search narrows which rows are drawn, but never which fields the step OWNS —
  // the count and the move-button edges have to keep describing the real list.
  const shown = visibleFields ? fields.filter((n) => visibleFields.has(n)) : fields;

  const countLabel = plural(
    language,
    fields.length,
    "field",
    "fields",
    "champ",
    "champs"
  );

  return (
    <Paper
      ref={setNodeRef}
      variant="outlined"
      sx={(t) => ({
        mb: 0.75,
        borderRadius: 1.5,
        overflow: "hidden",
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        borderColor: isDropTarget
          ? t.palette.primary.main
          : selected
            ? alpha(t.palette.text.primary, 0.28)
            : t.palette.divider,
        boxShadow: isDropTarget
          ? `0 0 0 1px ${t.palette.primary.main}`
          : selected
            ? `inset 0 0 0 1px ${alpha(t.palette.text.primary, 0.12)}`
            : "none",
      })}
    >
      <Box
        sx={(t) => ({
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: 1,
          pl: 0.75,
          pr: 0.5,
          minHeight: 44,
          bgcolor: selected ? t.palette.action.selected : "transparent",
          "&::before": {
            content: '""',
            position: "absolute",
            left: 0,
            top: 8,
            bottom: 8,
            width: 3,
            borderRadius: "0 3px 3px 0",
            bgcolor: selected ? t.palette.primary.main : "transparent",
          },
        })}
      >
        <DragGrip
          attributes={attributes}
          listeners={listeners}
          setActivatorNodeRef={setActivatorNodeRef}
          label={pick(language, `Reorder ${title}`, `Réordonner ${title}`)}
        />

        <Box
          component="h3"
          id={headingId}
          sx={{ flex: 1, minWidth: 0, m: 0, fontSize: "inherit", fontWeight: "inherit" }}
        >
          <Box
            component="button"
            type="button"
            onClick={() => onSelectStep(index)}
            aria-current={selected ? "true" : undefined}
            sx={{
              display: "block",
              width: "100%",
              minWidth: 0,
              textAlign: "left",
              background: "none",
              border: 0,
              p: 0,
              cursor: "pointer",
              color: "inherit",
              font: "inherit",
            }}
          >
            <Typography
              component="span"
              noWrap
              sx={{
                display: "block",
                fontWeight: 600,
                fontSize: "0.9375rem",
                whiteSpace: "nowrap",
              }}
            >
              {title}
            </Typography>
          </Box>
        </Box>

        {step.visibleIf && (
          <MetaTag
            tone="conditional"
            label={pick(language, "conditional", "conditionnel")}
            title={pick(
              language,
              `${title} is conditional`,
              `${title} est conditionnel`
            )}
          />
        )}
        <MetaTag
          label={countLabel}
          title={pick(
            language,
            `${countLabel} in ${title}`,
            `${countLabel} dans ${title}`
          )}
        />

        <IconButton
          size="small"
          onClick={() => onToggle(index)}
          aria-expanded={open}
          aria-controls={bodyId}
          aria-label={
            open
              ? pick(language, `Collapse ${title}`, `Réduire ${title}`)
              : pick(language, `Expand ${title}`, `Développer ${title}`)
          }
        >
          <ExpandMore
            fontSize="small"
            sx={{
              transform: open ? "rotate(180deg)" : "none",
              transition: "transform 150ms",
            }}
          />
        </IconButton>
      </Box>

      {/*
        `unmountOnExit` keeps a 22-field form's DOM small, and means a collapsed
        card genuinely has no rows — which is what lets a drop on the header be
        unambiguous once fields become draggable.
      */}
      <Collapse in={open} unmountOnExit>
        <Box
          id={bodyId}
          role="region"
          aria-labelledby={headingId}
          ref={list.setNodeRef}
          sx={(t) => ({
            px: 1,
            pb: 1,
            pt: 0.5,
            borderTop: 1,
            borderColor: "divider",
            // A zero-height container can never win a collision, so an empty
            // step would silently refuse drops without this floor.
            minHeight: 48,
            ...(list.isOver && activeDrag?.type === "field"
              ? { bgcolor: alpha(t.palette.primary.main, 0.06) }
              : null),
          })}
        >
          <SortableContext
            id={containerDropId(index)}
            items={shown.map(fieldDragId)}
            strategy={verticalListSortingStrategy}
          >
          {fields.length === 0 ? (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", px: 0.5, py: 1 }}
            >
              {pick(
                language,
                "Empty. A tab with no fields is not rendered.",
                "Vide. Un onglet sans champ n'est pas affiché."
              )}
            </Typography>
          ) : shown.length === 0 ? (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", px: 0.5, py: 1 }}
            >
              {pick(
                language,
                "No field here matches the filter.",
                "Aucun champ ici ne correspond au filtre."
              )}
            </Typography>
          ) : (
            shown.map((name) => (
              <FieldRow
                key={name}
                name={name}
                property={properties[name]}
                uiSchema={uiSchema}
                jsonSchema={jsonSchema}
                onChange={onChange}
                language={language}
                steps={steps}
                stepIndex={index}
                required={required.includes(name)}
                selected={selectedField === name}
                onSelect={onSelectField}
                // Edges come from the real list, not the filtered one: nudging a
                // row past a hidden sibling would look like nothing happened.
                canMoveUp={fields.indexOf(name) > 0}
                canMoveDown={fields.indexOf(name) < fields.length - 1}
                // A nudge across a hidden row is a move an author cannot see.
                moveDisabled={Boolean(visibleFields) && shown.length !== fields.length}
                index={fields.indexOf(name)}
                // Same reason: a drag whose neighbours are hidden would land
                // somewhere the author cannot see.
                draggable={!visibleFields || shown.length === fields.length}
              />
            ))
          )}
          </SortableContext>
        </Box>
      </Collapse>
    </Paper>
  );
}
