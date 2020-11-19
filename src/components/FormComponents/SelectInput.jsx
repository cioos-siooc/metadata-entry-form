import React from "react";
import { Select, MenuItem, FormControl, InputLabel } from "@material-ui/core";
import { I18n } from "../I18n";

const SelectInput = ({
  value,
  name,
  options,
  optionLabels,
  onChange,
  disabled,
  showDefaultLabel = true,
}) => {
  return (
    <FormControl disabled={disabled} style={{ minWidth: 120 }}>
      {showDefaultLabel && (
        <InputLabel
          id="demo-simple-select-label"
          style={{ marginLeft: "10px" }}
        >
          <I18n en="Choose" fr="Choisir" />
        </InputLabel>
      )}
      <Select name={name} fullWidth value={value} onChange={onChange}>
        {options.map((v, i) => (
          <MenuItem key={v} value={v}>
            {optionLabels[i]}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
export default SelectInput;
