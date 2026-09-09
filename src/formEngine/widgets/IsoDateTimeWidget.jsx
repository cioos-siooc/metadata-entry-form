import React from "react";
import { TextField } from "@mui/material";

/**
 * A date/time input that preserves FULL ISO-8601 precision.
 *
 * This exists because of a specific data-loss bug. The obvious implementation —
 * and the one in the earlier prototype — does:
 *
 *     onChange(iso.slice(0, 10))
 *
 * which silently truncates `2023-10-01T19:00:00.000Z` to `2023-10-01`. Records
 * in this database store full ISO timestamps with milliseconds, and the ISO
 * 19115 XML output carries them through. Truncating on load would rewrite every
 * date the first time a form was opened and saved, with nothing in the diff to
 * show it.
 *
 * So: the widget renders whatever precision the schema asks for, but round-trips
 * the stored value untouched when the user does not edit the field.
 *
 * `format: "date"`      → a date input, value stored as YYYY-MM-DD
 * `format: "date-time"` → a datetime-local input, value stored as full ISO
 */
export default function IsoDateTimeWidget(props) {
  const {
    id,
    value,
    onChange,
    onBlur,
    onFocus,
    disabled,
    readonly,
    schema = {},
    options = {},
    label,
    rawErrors = [],
    required,
  } = props;

  const dateOnly = (options.format || schema.format) === "date";

  /** Stored value → what the <input> expects, without altering what is stored. */
  const toInputValue = (stored) => {
    if (!stored) return "";
    const text = String(stored);
    if (dateOnly) return text.slice(0, 10);
    // datetime-local wants `YYYY-MM-DDTHH:mm`; the seconds and timezone are
    // dropped for DISPLAY only.
    const match = text.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/);
    return match ? `${match[1]}T${match[2]}` : text.slice(0, 16);
  };

  const handleChange = (event) => {
    const raw = event.target.value;
    if (!raw) {
      onChange(undefined);
      return;
    }
    if (dateOnly) {
      onChange(raw);
      return;
    }
    // Re-expand to full precision. Date parsing here is deliberate: the input
    // gives local wall-clock time, and records store UTC.
    const parsed = new Date(raw);
    onChange(Number.isNaN(parsed.getTime()) ? raw : parsed.toISOString());
  };

  return (
    <TextField
      id={id}
      type={dateOnly ? "date" : "datetime-local"}
      label={label}
      value={toInputValue(value)}
      onChange={handleChange}
      onBlur={onBlur ? (event) => onBlur(id, event.target.value) : undefined}
      onFocus={onFocus ? (event) => onFocus(id, event.target.value) : undefined}
      disabled={disabled || readonly}
      required={required}
      error={rawErrors.length > 0}
      fullWidth
      slotProps={{ inputLabel: { shrink: true } }}
    />
  );
}
