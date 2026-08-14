import React from "react";
import { Box, Paper, Typography } from "@mui/material";
import { DragIndicator } from "@mui/icons-material";

import { FieldName, MetaTag, ROW_HEIGHT } from "./primitives";
import { localized, plural } from "./language";

/**
 * What follows the cursor during a drag.
 *
 * Two shapes, and the step one is deliberately NOT the whole card: dragging a
 * card that contains a field list looks terrible at cursor size, and remounting
 * its contents into the overlay would also remount any focused input inside it.
 * The header alone says everything needed — which step is moving.
 *
 * The width has to be passed in. An overlay is absolutely positioned outside the
 * list, so it has no container to derive a width from and collapses to its
 * content; the provider captures the source row's initial width at dragStart.
 */
export default function FieldRowGhost({
  activeDrag,
  width,
  steps,
  properties,
  uiSchema,
  required,
  language,
}) {
  const common = {
    display: "flex",
    alignItems: "center",
    gap: 1,
    px: 1,
    borderRadius: 1,
    width: width || "auto",
    cursor: "grabbing",
  };

  if (activeDrag.type === "step") {
    const step = steps[activeDrag.index];
    if (!step) return null;
    const title = localized(
      step.title,
      language,
      step.id || `step-${activeDrag.index + 1}`
    );

    return (
      <Paper elevation={8} sx={{ ...common, minHeight: 44 }}>
        <DragIndicator fontSize="small" sx={{ color: "text.disabled" }} />
        <Typography
          sx={{ flex: 1, fontWeight: 600, fontSize: "0.9375rem", whiteSpace: "nowrap" }}
        >
          {title}
        </Typography>
        <MetaTag
          label={plural(
            language,
            (step.fields || []).length,
            "field",
            "fields",
            "champ",
            "champs"
          )}
        />
      </Paper>
    );
  }

  const name = activeDrag.name;
  const property = properties?.[name];
  const type = property?.type;
  const typeLabel = Array.isArray(type) ? type.join(" | ") : type || "any";
  const label = localized(
    uiSchema?.[name]?.["ui:options"]?.i18n?.title,
    language,
    ""
  );

  return (
    <Paper elevation={8} sx={{ ...common, height: ROW_HEIGHT }}>
      <DragIndicator fontSize="small" sx={{ color: "text.disabled" }} />
      <FieldName>{name}</FieldName>
      <Typography
        variant="caption"
        color="text.secondary"
        noWrap
        sx={{ flex: 1, minWidth: 0 }}
      >
        {label}
      </Typography>
      <MetaTag label={typeLabel} />
      <Box
        component="span"
        sx={{
          width: 12,
          textAlign: "center",
          color: "error.main",
          fontWeight: 700,
          fontSize: 15,
          lineHeight: 1,
        }}
      >
        {required?.includes(name) ? "*" : ""}
      </Box>
      {/* No action buttons: they would be unusable mid-drag. */}
    </Paper>
  );
}
