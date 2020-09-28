import React, { useState } from "react";

import {
  Checkbox,
  FormControlLabel,
  FormControl,
  InputLabel,
} from "@material-ui/core";

const CheckBoxList = ({
  onChange,
  value,
  name,
  label,
  options,
  optionLabels,
  disabled,
}) => {
  const [checkedValues, setChecked] = useState([]);

  function toggleArrayElement(ele, arr) {
    if (arr.includes(ele)) return arr.filter((v) => v !== ele);
    else return arr.concat(ele);
  }
  return (
    <FormControl style={{ minWidth: 120 }}>
      <InputLabel id="demo-simple-select-label">{label}</InputLabel>
      {options.map((v, i) => {
        return (
          <FormControlLabel
            key={v}
            disabled={disabled}
            control={
              <Checkbox
                key={v}
                value={v}
                name={name}
                checked={value.includes(v)}
                onChange={(e) => {
                  const val = e.target.value;
                  const newCheckedValuesArray = toggleArrayElement(
                    val,
                    checkedValues
                  );
                  setChecked(newCheckedValuesArray);

                  onChange({
                    target: { name, value: newCheckedValuesArray },
                  });
                }}
              />
            }
            label={optionLabels[i]}
          />
        );
      })}
    </FormControl>
  );
};

export default CheckBoxList;
