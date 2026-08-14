import React, { useMemo, useState } from "react";
import { Alert, Box, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import { pickSchemaProperties, renderSchema } from "@shared/formEngine";
import SchemaForm from "../../../../formEngine/SchemaForm";
import { pick } from "./language";

/**
 * The selection, rendered by the real form renderer.
 *
 * Preview used to be a separate top-level tab, so checking what a label or a
 * widget choice actually did meant leaving the builder and losing your place.
 * This is the same renderer — `SchemaForm` with the same widgets, templates and
 * width rules a respondent gets — over a subschema containing only what is
 * selected.
 *
 * Built the same way FormShell builds a step's schema, deliberately:
 * `pickSchemaProperties` then `renderSchema`. Reusing both is what stops the
 * preview diverging from production — `renderSchema` in particular is what keeps
 * a property declaring both a `type` and a validity-only `anyOf` (the DOI case)
 * from rendering as two inputs for one value.
 */

/**
 * Owns the sample data, and is remounted by `key` whenever the subject changes.
 *
 * Keeping the state INSIDE the keyed component is the point: changing field or
 * widget throws away rjsf's internal bookkeeping and the typed sample together,
 * so switching a text field to a checkbox list cannot leave the old value behind
 * or surface a stale validation error. FormShell does the same thing per step.
 */
function PreviewForm({ jsonSchema, uiSchema, language, idPrefix }) {
  const [data, setData] = useState({});

  return (
    <SchemaForm
      jsonSchema={jsonSchema}
      uiSchema={uiSchema}
      formData={data}
      onChange={setData}
      // `language` because QuestionFieldTemplate reads it from the registry's
      // formContext and silently falls back to English otherwise — which would
      // defeat the point of previewing a French label. `formData` because the
      // template evaluates visibleIf against formContext.formData, not against
      // rjsf's own copy. `canEdit` so a {context: "canEdit"} rule cannot hide
      // the very thing being previewed.
      formContext={{ language, canEdit: true, formData: data }}
      // Every rjsf input id derives from this, and a collision with the editor's
      // own Preview tab would break each label's `for` association.
      idPrefix={idPrefix}
    />
  );
}

export default function InspectorPreview({
  jsonSchema,
  uiSchema,
  language,
  selection,
  steps,
}) {
  const isStep = selection.kind === "step";
  const step = isStep ? steps[selection.index] : null;

  const fields = useMemo(
    () => (isStep ? step?.fields || [] : [selection.name]),
    [isStep, step, selection.name]
  );

  const previewSchema = useMemo(
    () => renderSchema(pickSchemaProperties(jsonSchema, fields)),
    [jsonSchema, fields]
  );

  /**
   * A conditional field has to show up in its own preview.
   *
   * `QuestionFieldTemplate` returns null when `visibleIf` is false, and against
   * empty sample data almost every rule is false — so previewing a conditional
   * field would render an empty box that looks like a bug. Its own rule is
   * stripped and the fact is stated on screen instead.
   *
   * A STEP preview keeps every rule: watching sibling fields appear and disappear
   * as you type is exactly what that preview is for.
   */
  const conditional = !isStep && Boolean(uiSchema?.[selection.name]?.["ui:options"]?.visibleIf);

  const previewUi = useMemo(() => {
    if (!conditional) return uiSchema;
    const entry = uiSchema[selection.name];
    const options = { ...entry["ui:options"] };
    delete options.visibleIf;
    return { ...uiSchema, [selection.name]: { ...entry, "ui:options": options } };
  }, [conditional, uiSchema, selection.name]);

  if (fields.length === 0) {
    return (
      <Alert severity="info">
        {pick(
          language,
          "This tab has no fields to preview yet.",
          "Cet onglet n'a pas encore de champs à prévisualiser."
        )}
      </Alert>
    );
  }

  // Remount on the subject AND on the requested widget, so sample data never
  // outlives the input that produced it.
  const widget =
    (!isStep && (uiSchema?.[selection.name]?.["ui:widget"] ||
      uiSchema?.[selection.name]?.["ui:field"])) || "";
  const subject = isStep ? `step-${selection.index}` : selection.name;

  return (
    <Box>
      {conditional && (
        <Typography
          variant="caption"
          color="text.secondary"
          component="div"
          sx={{ mb: 1 }}
        >
          {pick(
            language,
            "This field is conditional. It is shown here regardless of its rule.",
            "Ce champ est conditionnel. Il est affiché ici indépendamment de sa règle."
          )}
        </Typography>
      )}

      <Box
        // A named region: the previewed label is by design the same string the
        // canvas row and the panel heading show, so this is what tells the three
        // apart — for a screen reader user moving by landmark as much as for a
        // test.
        role="region"
        aria-label={pick(language, "Field preview", "Aperçu du champ")}
        sx={(t) => ({
          p: 1,
          borderRadius: 1.5,
          border: "1px dashed",
          borderColor: t.palette.divider,
          bgcolor: alpha(t.palette.text.primary, 0.03),
          // The renderer's question shell carries the hand-built form's furniture
          // — `paperClass` is `margin: 20px; width: 90%` — which inside a 400px
          // panel leaves the input inset and clipped. Neutralised here only.
          "& .MuiPaper-root": {
            margin: 0,
            width: "auto",
            boxShadow: "none",
            backgroundColor: "transparent",
          },
        })}
      >
        <PreviewForm
          key={`${subject}:${widget}`}
          jsonSchema={previewSchema}
          uiSchema={previewUi}
          language={language}
          idPrefix={`ui-preview-${subject.replace(/[^\w-]/g, "_")}`}
        />
      </Box>

      <Typography
        variant="caption"
        color="text.secondary"
        component="div"
        sx={{ mt: 1 }}
      >
        {pick(
          language,
          "Rendered by the real form renderer. Nothing typed here is saved.",
          "Rendu par le moteur de formulaire réel. Rien de ce qui est saisi ici n'est enregistré."
        )}
      </Typography>
    </Box>
  );
}
