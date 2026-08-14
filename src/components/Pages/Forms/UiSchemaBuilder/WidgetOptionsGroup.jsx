import React from "react";
import {
  Box,
  Checkbox,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { UI_OPTIONS, setFieldOption } from "@shared/formEngine";
import { MetaTag } from "./primitives";
import { pick } from "./language";

/**
 * The options a chosen widget accepts.
 *
 * These used to be a wrapping row — a checkbox, a 120px number box and a 180px
 * text box, side by side with no group boundary. In a ~400px inspector that wraps
 * into a pile that reads as debris rather than as settings, and there was nothing
 * saying which input belonged to which widget.
 *
 * A real `fieldset`/`legend` instead, one control per row. The `role="group"` that
 * a fieldset carries natively is also what lets a caller address these inputs
 * unambiguously — `labelEn`/`labelFr` are literally labelled "Label (en)" and
 * "Label (fr)" in the vocabulary, colliding with the inspector's own Label
 * section.
 */

function OptionControl({ name, value, onChange, language }) {
  const definition = UI_OPTIONS[name];
  if (!definition) return null;
  const label = definition.label[language] || definition.label.en;

  if (definition.type === "boolean") {
    return (
      <FormControlLabel
        control={
          <Checkbox
            size="small"
            checked={Boolean(value)}
            onChange={(event) => onChange(event.target.checked ? true : undefined)}
          />
        }
        label={<Typography variant="body2">{label}</Typography>}
      />
    );
  }

  if (definition.type === "integer") {
    return (
      <TextField
        size="small"
        type="number"
        label={label}
        value={value ?? ""}
        onChange={(event) => {
          const parsed = parseInt(event.target.value, 10);
          onChange(Number.isNaN(parsed) ? undefined : parsed);
        }}
        sx={{ width: 120 }}
      />
    );
  }

  if (definition.type === "string") {
    return (
      <TextField
        size="small"
        fullWidth
        label={label}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  // Object-valued options (optionTooltips) have no dedicated control; showing the
  // count keeps the author aware it is set rather than hiding it.
  const count = Object.keys(value || {}).length;
  return (
    <MetaTag tone="strong" label={`${label}: ${count}`} title={`${label}: ${count}`} />
  );
}

export default function WidgetOptionsGroup({
  options,
  uiSchema,
  onChange,
  language,
  field,
  values,
}) {
  if (!options?.length) return null;

  const legend = pick(language, "Input options", "Options de saisie");

  return (
    <Box
      component="fieldset"
      sx={(t) => ({
        mt: 1.5,
        mb: 0,
        mx: 0,
        px: 1.25,
        pt: 0.5,
        pb: 1.25,
        borderRadius: 1,
        border: "1px solid",
        borderColor: t.palette.divider,
        minWidth: 0,
      })}
    >
      <Box
        component="legend"
        sx={{
          px: 0.5,
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "text.secondary",
        }}
      >
        {legend}
      </Box>
      <Stack spacing={1.25} alignItems="flex-start">
        {options.map((name) => (
          <OptionControl
            key={name}
            name={name}
            value={values[name]}
            language={language}
            onChange={(value) => onChange(setFieldOption(uiSchema, field, name, value))}
          />
        ))}
      </Stack>
    </Box>
  );
}
