import React from "react";

import { Checkbox, FormControlLabel, Grid } from "@material-ui/core";

const CheckBoxList = ({
  onChange,
  value,
  name,
  options,
  optionLabels,
  disabled,
}) => {
  function toggleArrayElement(ele, arr) {
    if (arr.includes(ele)) return arr.filter((v) => v !== ele);
    return arr.concat(ele);
  }

  return (
    <Grid container direction="row">
      {options.map((v, i) => {
        return (
          <Grid item xs={3} key={v}>
            <FormControlLabel
              disabled={disabled}
              control={
                <Checkbox
                  key={v}
                  value={v || []}
                  name={name}
                  checked={value.includes(v)}
                  onChange={(e) => {
                    const val = e.target.value;
                    const newCheckedValuesArray = toggleArrayElement(
                      val,
                      value
                    );

                    onChange({
                      target: { name, value: newCheckedValuesArray },
                    });
                  }}
                />
              }
              label={optionLabels[i]}
            />
          </Grid>
        );
      })}
    </Grid>
  );
};

export default CheckBoxList;
