import React from "react";
import {
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  ListItemText,
  Input,
} from "@material-ui/core";
import { I18n } from "../I18n";

const SelectMultipleInput = ({
  value,
  name,
  options,
  optionLabels,
  onChange,
  disabled,
}) => {
  return (
    <FormControl disabled={disabled} style={{ minWidth: 120 }}>
      <InputLabel id="demo-simple-select-label">
        <I18n en="Choose" fr="Choisir" />
      </InputLabel>
      <Select
        multiple
        name={name}
        input={<Input />}
        fullWidth
        value={value}
        renderValue={(selected) =>
          selected
            .map((valueCode) => optionLabels[options.indexOf(valueCode)])
            .join(", ")
        }
        onChange={onChange}
      >
        {options.map((v, i) => (
          <MenuItem key={v} value={v}>
            <Checkbox checked={value.includes(v)} />
            <ListItemText primary={optionLabels[i]} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
export default SelectMultipleInput;
