import React from "react";
import { Paper } from "@mui/material";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

import {
  QuestionText,
  SupplementalText,
  paperClass,
} from "../../components/FormComponents/QuestionStyles";
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
    help,
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
  const title = localized(i18n.title, language) || label;
  const helpText = localized(i18n.help, language);

  // The root object and nested objects/arrays supply their own layout; wrapping
  // them in a Paper too would nest boxes several deep.
  const isContainer = schema.type === "object" || schema.type === "array";
  if (isContainer || !displayLabel) {
    return (
      <div className={classNames} style={style} id={id}>
        {children}
        {errors}
      </div>
    );
  }

  return (
    <Paper className={classNames} style={{ ...paperClass, ...style }}>
      {title && (
        <QuestionText>
          {title}
          {required && <RequiredMark passes={!props.rawErrors?.length} />}
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
      {help}
    </Paper>
  );
}
