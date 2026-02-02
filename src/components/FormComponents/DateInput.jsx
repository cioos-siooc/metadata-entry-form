import React from "react";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

import { I18n } from "../I18n";

function formatDate(date) {
  try {
    const d = date.getDate();
    const m = date.getMonth();
    const y = date.getFullYear();
    // This is to get around the issue of timezones and dates
    return (new Date(y, m, d, 12, 0, 0, 0)).toISOString();
  } catch (e) {
    return null;
  }
}

const DateInput = ({ onChange, value, name, disabled, dateStart, dateEnd }) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <DatePicker
        disabled={disabled}
        label={<I18n en="Select date" fr="Sélectionner une date" />}
        format="yyyy-MM-dd"
        value={value ? new Date(value) : null}
        minDate={dateStart ? new Date(dateStart) : new Date("1100-01-01")}
        maxDate={dateEnd ? new Date(dateEnd) : undefined}
        onChange={(dateSelected) => {
          return onChange({
            target: { name, value: formatDate(dateSelected) },
          });
        }}
        slotProps={{
          textField: {
            margin: "normal",
            id: "date-picker-dialog",
          },
          openPickerButton: {
            "aria-label": "change date",
          },
        }}
      />
    </LocalizationProvider>
  );
};

export default DateInput;
