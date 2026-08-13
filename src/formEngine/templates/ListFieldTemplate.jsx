import React from "react";
import { Box, Button, Typography } from "@mui/material";
import { Add } from "@mui/icons-material";

import FieldQuestion, { fieldLabels } from "../fields/FieldQuestion";

/**
 * A repeatable list of simple values — "one entry per person", a set of station
 * codes, a list of filter lot numbers.
 *
 * rjsf's MUI array template renders each entry in its own elevated Paper with a
 * vertical button stack beside it. That is a fair default for an array of
 * objects and far too much furniture for a list of names. It also drops the
 * question's heading and bilingual help on the floor: the eDNA field form's
 * "Members of the field team" arrived as a bare heading over an unlabelled "+",
 * with its "Add one entry per person" guidance nowhere on screen.
 *
 * So this renders the same FieldQuestion shell as every other field — heading,
 * required marker, markdown help — then the rows, then a labelled Add button. An
 * empty list says it is empty instead of showing nothing at all.
 *
 * The per-row layout lives in ListItemTemplate: by rjsf v6, `items` here are
 * already-rendered elements, so a row's controls are not this template's to
 * arrange.
 *
 * This applies to arrays of objects too. Those get the same heading and Add
 * button, and ListItemTemplate gives each entry a card — which is what rjsf's
 * default was reaching for, minus the nesting. The composite fields (contacts,
 * instruments, the map) never reach here at all: they own their whole subtree.
 */
export default function ListFieldTemplate(props) {
  const {
    items = [],
    canAdd,
    onAddClick,
    disabled,
    readonly,
    required,
    title,
    uiSchema = {},
    registry,
    rawErrors = [],
  } = props;

  const language = registry?.formContext?.language === "fr" ? "fr" : "en";
  const labels = fieldLabels(uiSchema, language, title);

  const body = (
    <Box>
      {items}

      {items.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          {language === "fr" ? "Aucune entrée." : "No entries yet."}
        </Typography>
      )}

      {canAdd && (
        <Button
          startIcon={<Add />}
          onClick={onAddClick}
          disabled={disabled || readonly}
          size="small"
          sx={{ mt: 1 }}
        >
          {language === "fr" ? "Ajouter" : "Add"}
        </Button>
      )}
    </Box>
  );

  // Where a caller has drawn one shared heading over several fields, the list
  // renders bare rather than adding a second — the same `inGroup` hook
  // inputLayout.js honours.
  if (uiSchema["ui:options"]?.inGroup) return body;

  return (
    <FieldQuestion
      title={labels.title}
      help={labels.help}
      required={required}
      // Honest rather than decorative: a required list is satisfied when it has
      // an entry, not merely because nothing has been validated yet.
      passes={!rawErrors.length && items.length > 0}
    >
      {body}
    </FieldQuestion>
  );
}
