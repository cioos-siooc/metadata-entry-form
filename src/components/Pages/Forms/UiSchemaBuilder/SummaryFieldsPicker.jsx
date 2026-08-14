import React from "react";
import {
  Autocomplete,
  Box,
  Chip,
  TextField,
  Typography,
} from "@mui/material";

import { isScalarProperty, setSummaryFields } from "@shared/formEngine";
import { FieldName, SectionHeader } from "./primitives";
import { localized, pick } from "./language";

/**
 * Chooses the columns that identify a submission in the reviewers' table.
 *
 * Only scalar properties are offered: an object or array renders as raw JSON in
 * a table cell, which tells a reader nothing (see exportSubmissions.js).
 *
 * An Autocomplete rather than a multi-select because column ORDER is meaningful
 * and Autocomplete appends in the order picked, where MUI's `Select multiple`
 * reorders to match the option list.
 */
export default function SummaryFieldsPicker({
  jsonSchema,
  uiSchema,
  onChange,
  language,
}) {
  const properties = jsonSchema?.properties || {};
  const choices = Object.keys(properties).filter((name) =>
    isScalarProperty(properties[name])
  );

  // Rendered as-is, including any name the schema no longer has: the validator
  // flags those and the chip below marks them, which beats dropping them
  // silently on the author's first unrelated edit.
  const value = Array.isArray(uiSchema?.["ui:summaryFields"])
    ? uiSchema["ui:summaryFields"]
    : [];

  return (
    <Box>
      <SectionHeader title={pick(language, "Summary columns", "Colonnes du résumé")} />
      <Typography variant="caption" color="text.secondary" component="div" sx={{ mb: 1 }}>
        {pick(
          language,
          "Fields shown as columns in the submissions list, in this order. Leave empty to let the app pick.",
          "Champs affichés en colonnes dans la liste des soumissions, dans cet ordre. Laissez vide pour un choix automatique."
        )}
      </Typography>

      <Autocomplete
        multiple
        size="small"
        options={choices}
        value={value}
        onChange={(_event, next) => onChange(setSummaryFields(uiSchema, next))}
        filterSelectedOptions
        getOptionLabel={(name) => name}
        renderOption={(props, name) => {
          const { key, ...rest } = props;
          return (
            <Box component="li" key={key} {...rest}>
              <Box>
                <FieldName sx={{ display: "block" }}>{name}</FieldName>
                <Typography variant="caption" color="text.secondary">
                  {localized(
                    uiSchema?.[name]?.["ui:options"]?.i18n?.title,
                    language,
                    properties[name]?.title || ""
                  )}
                </Typography>
              </Box>
            </Box>
          );
        }}
        renderValue={(picked, getItemProps) =>
          picked.map((name, index) => {
            const { key, ...itemProps } = getItemProps({ index });
            return (
              <Chip
                key={key}
                size="small"
                label={name}
                color={name in properties ? "default" : "warning"}
                {...itemProps}
              />
            );
          })
        }
        renderInput={(params) => (
          <TextField
            {...params}
            label={pick(language, "Columns", "Colonnes")}
            placeholder={pick(language, "Add a field", "Ajouter un champ")}
          />
        )}
      />
    </Box>
  );
}
