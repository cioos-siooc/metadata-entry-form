import React, { useId } from "react";
import {
  Select,
  MenuItem,
  FormControl,
  Typography,
  Tooltip,
  Box,
} from "@mui/material";

import { I18n } from "../I18n";
import { useFieldContext } from "../FormShell/FormField";

const SelectInput = ({
  value = "",
  name,
  options,
  optionLabels,
  optionTooltips = [],
  onChange,
  disabled,
  label,
  fullWidth = true,
  ariaLabel,
}) => {
  const field = useFieldContext();
  const id = useId();
  // Named by the FormField label when inside one, else by `label` (the
  // placeholder text), plus the chosen value, e.g. "Platform type Buoy".
  // Without this, an empty select had no accessible name at all.
  const labelId = field?.labelId || `${id}-label`;
  const displayProps = ariaLabel
    ? { "aria-label": ariaLabel }
    : { id: `${id}-value`, "aria-labelledby": `${labelId} ${id}-value` };
  return (
    <FormControl
      fullWidth={fullWidth}
      sx={fullWidth ? undefined : { minWidth: 200 }}
      disabled={disabled}
    >
      {!field && !ariaLabel && (
        <span id={`${id}-label`} hidden>
          {label || <I18n en="Choose" fr="Choisir" />}
        </span>
      )}
      <Select
        name={name}
        fullWidth={fullWidth}
        value={value}
        disabled={disabled}
        displayEmpty
        onChange={onChange}
        SelectDisplayProps={displayProps}
      >
        <MenuItem value="">
          {/* Placeholder row. Plain text, not an InputLabel — the theme now
              styles outlined InputLabels as captions stacked above a field,
              which is not what this is. */}
          <Typography color="text.secondary">
            {label || <I18n en="Choose" fr="Choisir" />}
          </Typography>
        </MenuItem>
        {options.map((v, i) => (
          <MenuItem key={v} value={v}>
            <Tooltip
              enterDelay={1}
              title={optionTooltips[i] ? optionTooltips[i] : ""}
            >
              <Box sx={{ width: "100%" }}>{optionLabels[i]}</Box>
            </Tooltip>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
export default SelectInput;
