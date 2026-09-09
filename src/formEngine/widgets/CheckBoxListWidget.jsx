import React from "react";
import {
  Checkbox,
  FormControlLabel,
  FormGroup,
  Tooltip,
} from "@mui/material";

/**
 * A multi-select rendered as checkboxes rather than a select menu, matching the
 * existing form's treatment of EOVs and topic categories.
 *
 * Applies to `{type: "array", uniqueItems: true, items: {enum: [...]}}`, which
 * is how rjsf signals a checkbox group. Requested explicitly with
 * `"ui:widget": "checkboxList"`.
 *
 * Per-option tooltips come from `ui:options.optionTooltips`, keyed by value —
 * the existing CheckBoxList uses a parallel array, but keying by value means
 * reordering the enum cannot silently mismatch a definition to the wrong option.
 */
export default function CheckBoxListWidget(props) {
  const {
    id,
    value = [],
    onChange,
    disabled,
    readonly,
    options = {},
  } = props;

  const { enumOptions = [], optionTooltips = {}, inline = false } = options;
  const selected = Array.isArray(value) ? value : [];

  const toggle = (optionValue) => () => {
    onChange(
      selected.includes(optionValue)
        ? selected.filter((v) => v !== optionValue)
        : [...selected, optionValue]
    );
  };

  return (
    <FormGroup row={inline}>
      {enumOptions.map((option) => {
        const control = (
          <FormControlLabel
            key={option.value}
            control={
              <Checkbox
                id={`${id}_${option.value}`}
                checked={selected.includes(option.value)}
                onChange={toggle(option.value)}
                disabled={disabled || readonly}
              />
            }
            label={option.label}
          />
        );

        const tooltip = optionTooltips[option.value];
        return tooltip ? (
          <Tooltip key={option.value} title={tooltip} placement="right">
            <span>{control}</span>
          </Tooltip>
        ) : (
          control
        );
      })}
    </FormGroup>
  );
}
