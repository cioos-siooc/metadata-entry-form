import React from "react";

import DateFnsUtils from "@date-io/date-fns";
import {
  MuiPickersUtilsProvider,
  KeyboardDatePicker,
} from "@material-ui/pickers";

const DateInput = ({ onChange, value, name, disabled }) => {
  return (
    <MuiPickersUtilsProvider utils={DateFnsUtils}>
      <KeyboardDatePicker
        disabled={disabled}
        margin="normal"
        id="date-picker-dialog"
        label="Select date"
        format="MM/dd/yyyy"
        value={value}
        onChange={(dateSelected) =>
          onChange({ target: { name, value: dateSelected } })
        }
        KeyboardButtonProps={{
          "aria-label": "change date",
        }}
      />
    </MuiPickersUtilsProvider>
  );
};

export default DateInput;
