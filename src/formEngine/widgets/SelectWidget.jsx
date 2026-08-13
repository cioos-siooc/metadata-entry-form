import React from "react";
import { Widgets } from "@rjsf/mui";

import { inputPresentation } from "../inputLayout";
import { fieldLabels } from "../fields/FieldQuestion";

const { SelectWidget: MuiSelectWidget } = Widgets;

/**
 * Every dropdown in a schema-driven form.
 *
 * This is the widget the original complaint was about: rjsf's MUI select renders
 * a `<TextField select>` with no width, and an empty one has no content to be
 * sized by, so it collapsed to a single character. Width now comes from the
 * option list — see inputLayout.js.
 *
 * The placeholder row is the other half of the fix. Without it an untouched
 * select is simply blank, which reads as "nothing to choose" rather than "you
 * have not chosen yet"; the hand-built form has always shown "Choose" here, so
 * this matches it. rjsf renders the row only when the schema declares no
 * default, which is exactly right — a defaulted field is never unset.
 */
export default function SelectWidget(props) {
  const { schema, uiSchema, options = {}, label, registry } = props;
  const language = registry?.formContext?.language === "fr" ? "fr" : "en";
  const { title } = fieldLabels(uiSchema, language, label);

  const { ariaLabel, ...presentation } = inputPresentation(
    schema,
    uiSchema,
    options,
    options.enumOptions,
    title
  );

  // Both of these travel through rjsf's `mui.rjsfSlotProps` channel because the
  // widget rebuilds `slotProps` after spreading our props — anything passed
  // directly is discarded.
  //
  // `displayEmpty` is what makes the placeholder row visible while the field is
  // unset; without it MUI renders an empty box and "Choose…" appears only once
  // the menu is open.
  const mui = options.mui || {};

  return (
    <MuiSelectWidget
      {...props}
      placeholder={language === "fr" ? "Choisir…" : "Choose…"}
      options={{
        ...options,
        mui: {
          ...mui,
          rjsfSlotProps: {
            ...mui.rjsfSlotProps,
            select: {
              displayEmpty: true,
              // On a MUI select the element carrying `role="combobox"` is the
              // display div, and the only way to name it is SelectDisplayProps.
              // An `aria-label` on the Select itself lands on the hidden native
              // input, which assistive technology does not read here.
              ...(ariaLabel
                ? { SelectDisplayProps: { "aria-label": ariaLabel } }
                : {}),
              ...mui.rjsfSlotProps?.select,
            },
          },
        },
      }}
      {...presentation}
    />
  );
}
