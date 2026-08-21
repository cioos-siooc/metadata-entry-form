import React from "react";
import {
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Tooltip,
} from "@mui/material";

import { I18n } from "../I18n";

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
}) => {
  return (
    <FormControl
      fullWidth={fullWidth}
      sx={{ minWidth: 200 }}
      disabled={disabled}
    >
      <Select
        name={name}
        fullWidth={fullWidth}
        value={value}
        disabled={disabled}
        displayEmpty
        onChange={onChange}
      >
        <MenuItem value="">
          <InputLabel id="demo-simple-select-label">
            <Typography>
              {label || <I18n en="Choose" fr="Choisir" />}
            </Typography>
          </InputLabel>
        </MenuItem>
        {options.map((v, i) => (
          <MenuItem key={v} value={v}>
            <Tooltip
              enterDelay={1}
              title={optionTooltips[i] ? optionTooltips[i] : ""}
            >
              <div style={{ width: "100%" }}>{optionLabels[i]}</div>
            </Tooltip>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
export default SelectInput;
