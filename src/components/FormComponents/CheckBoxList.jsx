import React from "react";

import { Checkbox, FormControlLabel, Grid, Tooltip } from "@material-ui/core";

const CheckBoxList = ({
  onChange,
  value = [],
  name,
  options,
  optionLabels,
  optionTooltips = [],
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
            <Tooltip title={optionTooltips[i] || ""}>
              <FormControlLabel
                disabled={disabled}
                control={
                  <Checkbox
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
            </Tooltip>
          </Grid>
        );
      })}
    </Grid>
  );
};

export default CheckBoxList;
