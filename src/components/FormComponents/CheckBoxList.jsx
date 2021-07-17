import React from "react";

import {
  Checkbox,
  FormControlLabel,
  Grid,
  Tooltip,
  Typography,
} from "@material-ui/core";

const CheckBoxList = ({
  onChange,
  value = [],
  name,
  options,
  optionLabels = options,
  optionTooltips = [],
  disabled,
  labelSize = 3,
}) => {
  // remove array element from array, by value
  function toggleArrayElement(ele, arr) {
    if (arr.includes(ele)) return arr.filter((v) => v !== ele);
    return arr.concat(ele);
  }

  return (
    <Grid container direction="row">
      {options.map((v, i) => {
        return (
          <Grid item key={v} xs={labelSize}>
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

                      onChange(newCheckedValuesArray);
                    }}
                  />
                }
                label={<Typography>{optionLabels[i]}</Typography>}
              />
            </Tooltip>
          </Grid>
        );
      })}
    </Grid>
  );
};

export default CheckBoxList;
