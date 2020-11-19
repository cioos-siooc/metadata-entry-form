import {
  KeyboardDatePicker,
  MuiPickersUtilsProvider,
} from "@material-ui/pickers";

import DateFnsUtils from "@date-io/date-fns";
import React from "react";

function formatDate(date) {
  const d = date.getDate();
  const m = date.getMonth();
  const y = date.getFullYear();
  return new Date(y, m, d, 12, 0, 0, 0);
}
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
        onChange={(dateSelected) => {
          return onChange({
            target: { name, value: formatDate(dateSelected) },
          });
        }}
        KeyboardButtonProps={{
          "aria-label": "change date",
        }}
      />
    </MuiPickersUtilsProvider>
  );
};

export default DateInput;
