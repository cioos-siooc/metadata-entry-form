import React from "react";
import { Paper } from "@mui/material";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

import {
  QuestionText,
  SupplementalText,
} from "../../components/FormComponents/QuestionStyles";

/**
 * One question's card.
 *
 * Deliberately NOT the shared `paperClass`, which is `width: 90%` with a 20px
 * margin on all four sides. Stacked, that leaves every question inset from a
 * ragged right edge with doubled vertical gaps between cards. A question fills
 * its column and separates from the next one below it.
 */
const questionPaper = {
  padding: "20px 24px",
  marginBottom: "16px",
  width: "auto",
};
import RequiredMark from "../../components/FormComponents/RequiredMark";
import { evaluate } from "@shared/formEngine";

/**
 * Wraps every field so a schema-driven form looks like the hand-built one:
 * a Paper containing the question, a required marker, help text, then the input.
 *
 * Two extensions a form type can use, both under `ui:options`:
 *
 *   "ui:options": { "i18n": { "title": {en, fr}, "help": {en, fr} } }
 *       Bilingual labels and help. Help is rendered as markdown, so a form
 *       author gets lists, links, and emphasis without needing a component —
 *       which is how the existing form's long-form guidance is written in JSX.
 *
 *       These live under `ui:options` rather than in `ui:title` / `ui:help`
 *       because those two are RESERVED rjsf keys that expect strings. Putting an
 *       {en, fr} object there makes rjsf pass the object straight through as a
 *       label, and React throws trying to render it. `ui:options` is the
 *       documented home for arbitrary extras.
 *
 *   "ui:options": { "visibleIf": {...} }
 *       Conditional visibility, evaluated against the whole form data. This is
 *       deliberately NOT JSON Schema `dependencies`/`oneOf`: rjsf rewrites
 *       formData when those branches switch and can delete keys, which is
 *       exactly the silent data loss we must avoid. Visibility is presentation;
 *       validity is the schema's job.
 */

function localized(value, language) {
  if (value === undefined || value === null) return null;
  if (typeof value === "string") return value;
  return value[language] || value.en || value.fr || null;
}

export default function QuestionFieldTemplate(props) {
  const {
    id,
    classNames,
    style,
    label,
    required,
    children,
    errors,
    description,
    hidden,
    displayLabel,
    schema = {},
    uiSchema = {},
    registry,
  } = props;

  // rjsf renders hidden fields as an empty wrapper; keep that behaviour.
  if (hidden) return <div style={{ display: "none" }}>{children}</div>;

  // rjsf v6 gives templates `registry`, not `formContext` directly. Reading
  // props.formContext yields undefined and silently defaults to English.
  const formContext = registry?.formContext || {};
  const language = formContext.language === "fr" ? "fr" : "en";
  const options = uiSchema["ui:options"] || {};

  if (!evaluate(options.visibleIf, formContext.formData || {}, formContext)) {
    return null;
  }

  const i18n = options.i18n || {};
  // ui:title before rjsf's `label`: for arrays and objects rjsf hands the
  // FieldTemplate an empty label, because its own Array/ObjectFieldTemplate
  // owns the heading. Reading only `label` therefore made every composite look
  // titleless and fall through to the bare branch below.
  const title = localized(i18n.title, language) || uiSchema["ui:title"] || label;
  const helpText = localized(i18n.help ?? options.help, language);

  // Decide on CONTENT, not on rjsf's flags.
  //
  // rjsf sets displayLabel=false for every object, for non-multiselect arrays,
  // and for anything carrying a "ui:field" (@rjsf/utils getDisplayLabel.js).
  // Keying the Paper off displayLabel or schema.type therefore strips the
  // question, help and required marker from precisely the fields that need them
  // most — contacts, platforms, lineage, the map, every composite on the record.
  //
  // So: if there is a title to show, show it. Two deliberate exits below.
  //
  // ui:options.ownChrome — the field renders its own Paper and RequiredMark
  // (MapSelect, DOIInput, Platform, Instruments all do). Wrapping those again
  // nests boxes two deep and shows the required marker twice.
  //
  // A container is only a question if the form type says so, with a ui:field or
  // a requiredField. That keeps the form ROOT — an object whose title is the
  // schema's own title — and the item objects inside an array unwrapped, while
  // letting contacts/map/title/abstract have their Paper back.
  const isContainer = schema.type === "object" || schema.type === "array";
  const isQuestion = Boolean(uiSchema["ui:field"] || options.requiredField);

  const bare =
    options.ownChrome ||
    !title ||
    (isContainer ? !isQuestion : !displayLabel);

  if (bare) {
    return (
      <div className={classNames} style={style} id={id}>
        {children}
        {errors}
      </div>
    );
  }

  // Requiredness on the metadata record does NOT live in the schema's `required`
  // array — buildSubmissionSchema puts it all in allOf conditionals, which
  // pickSchemaProperties strips per step. And with liveValidate={false},
  // rawErrors is empty until submit, so `passes` off rawErrors is always green.
  // The generator names the property in ui:options.requiredField, and the page
  // supplies isFieldValid through formContext — which keeps src/utils/validate.js
  // (and its firebase imports) out of the form engine.
  const requiredField = options.requiredField;
  const showRequired = required || Boolean(requiredField);
  const passes = requiredField
    ? Boolean(formContext.isFieldValid?.(requiredField))
    : !props.rawErrors?.length;

  return (
    <Paper className={classNames} style={{ ...questionPaper, ...style }}>
      {title && (
        <QuestionText>
          {title}
          {showRequired && <RequiredMark passes={passes} />}
          {(helpText || description) && (
            <SupplementalText>
              {helpText ? (
                <Markdown remarkPlugins={[remarkGfm]}>{helpText}</Markdown>
              ) : (
                description
              )}
            </SupplementalText>
          )}
        </QuestionText>
      )}
      {children}
      {errors}
    </Paper>
  );
}
