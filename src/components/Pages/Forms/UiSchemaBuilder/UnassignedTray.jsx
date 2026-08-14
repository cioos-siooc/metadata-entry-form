import React from "react";
import { Box, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

import FieldRow from "./FieldRow";
import { MetaTag, SectionHeader } from "./primitives";
import {
  ACCEPTS_FIELD,
  containerDropId,
  fieldDragId,
} from "./dnd/ids";
import { useBuilderDrag } from "./dnd/StepsDndProvider";
import { pick, plural } from "./language";

/**
 * Properties no step claims.
 *
 * Rendered whenever there are steps at all, even when it is EMPTY — previously it
 * appeared only when it had something in it, which meant there was nowhere to
 * drop a field in order to unassign it.
 *
 * Reordering within the tray is deliberately not offered. This order is derived
 * from `Object.keys(jsonSchema.properties)`, and this panel does not own the JSON
 * Schema, so there is nowhere to write a different one. `resolveDropPlan` returns
 * a `noop` for such a drag and no insertion line is drawn, so the UI never
 * promises an ordering it cannot keep.
 */
export default function UnassignedTray({
  names,
  shown,
  hasSteps,
  properties,
  required,
  uiSchema,
  onChange,
  language,
  steps,
  selectedField,
  onSelectField,
  filtering,
  draggable,
}) {
  const { activeDrag } = useBuilderDrag();

  const droppable = useDroppable({
    id: containerDropId(null),
    data: { type: "container", container: null, accepts: ACCEPTS_FIELD },
  });

  const count = plural(language, names.length, "field", "fields", "champ", "champs");
  const active = activeDrag?.type === "field";

  return (
    <Box sx={{ mt: 2 }}>
      <SectionHeader
        title={
          hasSteps
            ? pick(language, "Not in any tab", "Dans aucun onglet")
            : pick(language, "Fields", "Champs")
        }
        hint={
          hasSteps
            ? pick(
                language,
                'These render in a trailing "Other" tab rather than disappearing.',
                "Ceux-ci s'affichent dans un onglet « Autre » plutôt que de disparaître."
              )
            : undefined
        }
        action={
          hasSteps ? (
            <MetaTag
              tone={names.length ? "conditional" : "neutral"}
              label={String(names.length)}
              title={count + pick(language, " in no tab", " dans aucun onglet")}
            />
          ) : null
        }
      />

      <Box
        ref={droppable.setNodeRef}
        sx={(t) => ({
          minHeight: names.length ? 0 : 44,
          borderRadius: 1,
          transition: t.transitions.create("background-color", { duration: 120 }),
          ...(droppable.isOver && active
            ? { bgcolor: alpha(t.palette.primary.main, 0.06) }
            : null),
          ...(names.length === 0
            ? { border: "1px dashed", borderColor: t.palette.divider }
            : null),
        })}
      >
        {names.length === 0 ? (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", px: 1, py: 1.5 }}
          >
            {pick(
              language,
              "Every field is in a tab. Drop one here to take it out of all of them.",
              "Chaque champ est dans un onglet. Déposez-en un ici pour le retirer de tous."
            )}
          </Typography>
        ) : (
          <SortableContext
            id={containerDropId(null)}
            items={shown.map(fieldDragId)}
            strategy={verticalListSortingStrategy}
          >
            {shown.map((name, position) => (
              <FieldRow
                key={name}
                name={name}
                property={properties[name]}
                uiSchema={uiSchema}
                onChange={onChange}
                language={language}
                steps={steps}
                stepIndex={null}
                index={position}
                required={required.includes(name)}
                selected={selectedField === name}
                onSelect={onSelectField}
                draggable={draggable && !filtering}
              />
            ))}
          </SortableContext>
        )}
      </Box>
    </Box>
  );
}
