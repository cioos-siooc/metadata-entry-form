import {
  KeyboardDatePicker,
  MuiPickersUtilsProvider,
} from "@material-ui/pickers";

import DateFnsUtils from "@date-io/date-fns";
import React from "react";

import { I18n } from "../I18n";

function formatDate(date) {
  try {
    const d = date.getDate();
    const m = date.getMonth();
    const y = date.getFullYear();
    // This is to get around the issue of timezones and dates
    return new Date(y, m, d, 12, 0, 0, 0);
  } catch (e) {
    return null;
  }
}
const DateInput = ({ onChange, value, name, disabled, dateStart, dateEnd }) => {
  return (
    <MuiPickersUtilsProvider utils={DateFnsUtils}>
      <KeyboardDatePicker
        disabled={disabled}
        margin="normal"
        id="date-picker-dialog"
        label={<I18n en="Select date" fr="Sélectionner une date" />}
        format="yyyy-MM-dd"
        value={value}
        minDate={dateStart}
        maxDate={dateEnd}
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
