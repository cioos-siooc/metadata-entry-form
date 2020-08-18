import React from "react";
import { Select, MenuItem, FormControl, InputLabel } from "@material-ui/core";

const SelectInput = ({
  value,
  name,
  label,
  options,
  optionLabels,
  onChange,
}) => {
  return (
    <FormControl style={{ minWidth: 120 }}>
      <InputLabel id="demo-simple-select-label">{label}</InputLabel>
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
const areEqual = (prevProps, nextProps) => prevProps.value === nextProps.value;
export default React.memo(SelectInput, areEqual);
