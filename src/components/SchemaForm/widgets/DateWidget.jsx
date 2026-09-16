import React from "react";
import DateInput from "../../FormComponents/DateInput";

// Overrides RJSF's stock date widget (schema `format: "date"`) with the
// project's DatePicker. DateInput emits full ISO strings; trim to the date
// part so the value round-trips ajv's `format: "date"` validation.
export default function DateWidget({ value, onChange, disabled, readonly }) {
  return (
    <DateInput
      name="date"
      value={value || null}
      disabled={disabled || readonly}
      onChange={(event) => {
        const iso = event.target.value;
        onChange(iso ? iso.slice(0, 10) : undefined);
      }}
    />
  );
}
