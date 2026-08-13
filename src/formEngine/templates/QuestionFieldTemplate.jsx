import React from "react";

import FieldQuestion, { fieldLabels, isAnswered } from "../fields/FieldQuestion";
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

export default function QuestionFieldTemplate(props) {
  const {
    id,
    classNames,
    style,
    label,
    required,
    children,
    errors,
    help,
    description,
    hidden,
    displayLabel,
    formData,
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

  const { title, help: helpText } = fieldLabels(uiSchema, language, label);

  // A schema offering a real CHOICE of shapes is rendered by rjsf as two nested
  // fields — the branch point, then the chosen branch — and both reach this
  // template with the same uiSchema, so both would draw the same question. The
  // branch point steps back and lets the branch draw it, since the branch is the
  // level that holds an input; any selector rjsf renders for picking a branch
  // still comes through in `children`.
  //
  // Alternatives that merely express VALIDITY never get this far: renderSchema
  // removes them before rjsf sees them. See shared/formEngine/renderSchema.js.
  const isBranchPoint = Array.isArray(schema.anyOf) || Array.isArray(schema.oneOf);

  // The root object and nested objects/arrays supply their own layout; wrapping
  // them in a Paper too would nest boxes several deep.
  const isContainer = schema.type === "object" || schema.type === "array";
  if (isContainer || isBranchPoint || !displayLabel) {
    return (
      <div className={classNames} style={style} id={id}>
        {children}
        {errors}
      </div>
    );
  }

  return (
    <FieldQuestion
      className={classNames}
      style={style}
      title={title}
      help={helpText}
      description={description}
      required={required}
      passes={!props.rawErrors?.length && isAnswered(formData)}
    >
      {children}
      {errors}
      {help}
    </FieldQuestion>
  );
}
