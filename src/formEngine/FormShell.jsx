import React, { useMemo, useState } from "react";
import { Alert, Box, Tab, Tabs, Typography } from "@mui/material";

import SchemaForm from "./SchemaForm";
import { I18n } from "../components/I18n";
import {
  pickSchemaProperties,
  resolveSteps,
  stepLabel,
  evaluate,
} from "@shared/formEngine";

/**
 * Renders a schema-driven form, split into tabs when the form type declares
 * `ui:steps`.
 *
 * Not a wizard: users move between steps freely, the same way the existing
 * metadata form's tabs work. Forms without `ui:steps` render as one page.
 *
 * Each step renders its own <SchemaForm> over a FILTERED subschema, but bound to
 * the whole formData object, and changes are merged back into the whole. Two
 * consequences worth stating:
 *
 *   - Filtering rather than hiding matters. A field hidden with
 *     `ui:widget: "hidden"` still mounts and still participates in rjsf's
 *     bookkeeping; a filtered field simply is not part of the subschema.
 *
 *   - Validation on submit runs against the UNFILTERED schema, because
 *     cross-field rules span steps.
 */
export default function FormShell({
  jsonSchema,
  uiSchema,
  formData,
  onChange,
  onSubmit,
  disabled,
  readonly,
  language = "en",
  context = {},
  errorsByStep = {},
  actions,
  extraSteps = [],
}) {
  const [activeStep, setActiveStep] = useState(0);

  const steps = useMemo(
    () => [
      ...resolveSteps(jsonSchema, uiSchema, { language }),
      // Steps that render their own content instead of a subschema. resolveSteps
      // drops any step with no fields, so a panel like the record's Submit tab —
      // which is a summary and a button, not questions — cannot be expressed as
      // schema properties and is appended here instead.
      ...extraSteps,
    ],
    [jsonSchema, uiSchema, language, extraSteps]
  );

  const visibleSteps = useMemo(
    () =>
      steps.filter((step) =>
        evaluate(step.visibleIf, formData || {}, context)
      ),
    [steps, formData, context]
  );

  if (!visibleSteps.length) {
    return (
      <Alert severity="info">
        <I18n
          en="This form has no fields yet."
          fr="Ce formulaire n'a pas encore de champs."
        />
      </Alert>
    );
  }

  // A step can disappear when a predicate flips, so clamp rather than trusting
  // the stored index.
  const currentIndex = Math.min(activeStep, visibleSteps.length - 1);
  const step = visibleSteps[currentIndex];
  const single = visibleSteps.length === 1 && step.implicit;

  const stepSchema = single
    ? jsonSchema
    : pickSchemaProperties(jsonSchema, step.fields || []);

  const formContext = { ...context, language, formData };

  const handleChange = (stepData) => {
    if (!onChange) return;
    // Merge rather than replace: the step only rendered part of the object.
    onChange({ ...(formData || {}), ...stepData });
  };

  return (
    // minWidth: 0 is load-bearing. A flex/grid child defaults to
    // `min-width: auto`, meaning it refuses to shrink below its content's
    // intrinsic width — and a scrollable <Tabs> still reports the full width of
    // every tab laid end to end. Without this the whole form column becomes as
    // wide as all eleven step names, and the PAGE scrolls sideways instead of
    // the tab strip.
    <Box sx={{ minWidth: 0, maxWidth: "100%" }}>
      {!single && (
        <Tabs
          value={currentIndex}
          onChange={(_event, index) => setActiveStep(index)}
          variant="scrollable"
          // Always show the arrows, never "auto". With eleven steps the strip
          // always overflows, and "auto" hides the arrows on a wide screen —
          // so the tabs beyond the fold look like they do not exist.
          scrollButtons
          allowScrollButtonsMobile
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            mb: 2,
            maxWidth: "100%",
            // Keep the arrows visible rather than collapsing them to zero width
            // when a direction is exhausted, so the strip does not jump.
            "& .MuiTabs-scrollButtons.Mui-disabled": { opacity: 0.3 },
            // Sentence case fits noticeably more of a long step name than MUI's
            // default uppercase, which matters at eleven steps.
            "& .MuiTab-root": { textTransform: "none", fontSize: "0.95rem" },
          }}
        >
          {visibleSteps.map((s) => {
            const errorCount = errorsByStep[s.id]?.length || 0;
            return (
              <Tab
                key={s.id}
                label={
                  errorCount
                    ? `${stepLabel(s, language, s.id)} (${errorCount})`
                    : stepLabel(s, language, s.id)
                }
                sx={errorCount ? { color: "error.main" } : undefined}
                id={`form-step-${s.id}`}
              />
            );
          })}
        </Tabs>
      )}

      {step.description && (
        <Typography variant="body2" sx={{ mx: 2, mb: 1 }}>
          {stepLabel({ title: step.description }, language, "")}
        </Typography>
      )}

      {step.render ? (
        step.render({ formData, disabled, readonly, language, context })
      ) : (
        <SchemaForm
          // Remounting per step keeps rjsf's internal state from leaking between
          // subschemas, which would otherwise surface as stale validation errors.
          key={step.id}
          jsonSchema={stepSchema}
          uiSchema={uiSchema}
          formData={formData}
          onChange={handleChange}
          onSubmit={onSubmit}
          disabled={disabled}
          readonly={readonly}
          formContext={formContext}
          idPrefix={`step_${step.id}`}
        >
          {actions}
        </SchemaForm>
      )}
    </Box>
  );
}
