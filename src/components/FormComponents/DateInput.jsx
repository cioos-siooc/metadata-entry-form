import {
  KeyboardDatePicker,
  MuiPickersUtilsProvider,
} from "@material-ui/pickers";

import DateFnsUtils from "@date-io/date-fns";
import React from "react";

const DateInput = ({ onChange, value, name, disabled }) => {
  return (
    <MuiPickersUtilsProvider utils={DateFnsUtils}>
      <KeyboardDatePicker
        disabled={disabled}
        margin="normal"
        id="date-picker-dialog"
        label="Select date"
        format="yyyy-MM-dd"
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
