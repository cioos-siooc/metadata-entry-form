import React from "react";
import { Templates } from "@rjsf/mui";

import { inputPresentation } from "../inputLayout";
import { fieldLabels } from "../fields/FieldQuestion";

// Reached through the theme's own collection rather than a deep path: the
// package's `exports` map does not expose the component directories, so
// `@rjsf/mui/lib/BaseInputTemplate` resolves in the test runner and then fails
// in the Vite build.
const { BaseInputTemplate } = Templates;

/**
 * Every text- and number-like input in a schema-driven form, and — because
 * rjsf's TextareaWidget delegates here — every long-form one too.
 *
 * A thin wrapper rather than a reimplementation: rjsf's own template carries the
 * `emptyValue` handling, the `examples` datalist, min/max/step plumbing, and the
 * clear-button adornment. Rewriting that to change a few presentation props would
 * trade a real risk of data-entry bugs for nothing.
 *
 * See inputLayout.js for why the width, label, and aria-label props are what
 * they are.
 */
export default function InputTemplate(props) {
  const { schema, uiSchema, options, label, registry, slotProps } = props;

  const language = registry?.formContext?.language === "fr" ? "fr" : "en";
  const { title } = fieldLabels(uiSchema, language, label);
  const { ariaLabel, ...presentation } = inputPresentation(
    schema,
    uiSchema,
    options,
    undefined,
    title
  );

  return (
    <BaseInputTemplate
      {...props}
      {...presentation}
      slotProps={
        ariaLabel
          ? {
              ...slotProps,
              htmlInput: { ...slotProps?.htmlInput, "aria-label": ariaLabel },
            }
          : slotProps
      }
    />
  );
}
