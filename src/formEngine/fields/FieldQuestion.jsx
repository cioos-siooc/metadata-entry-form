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

/**
 * The Paper-and-question shell every field sits in.
 *
 * Extracted from QuestionFieldTemplate because that template deliberately does
 * NOT wrap containers — an object or array field supplies its own layout, and
 * wrapping it too would nest boxes several deep. That is right for a plain nested
 * object, but a `ui:field` that owns a whole subtree is still ONE question and
 * still needs a heading, a required marker, and its bilingual guidance. Those
 * fields render this shell themselves, because only the field knows where its
 * heading belongs relative to its own chrome.
 *
 * Used today by QuestionFieldTemplate (scalars), BilingualTextField, and
 * ListFieldTemplate. One implementation, so a change to how help renders lands
 * everywhere rather than in a copy per field.
 */

/** Picks the active language out of an `{en, fr}` pair, or passes a string through. */
export function localized(value, language) {
  if (value === undefined || value === null) return null;
  if (typeof value === "string") return value;
  return value[language] || value.en || value.fr || null;
}

/**
 * Reads a field's bilingual label and help out of its uiSchema entry.
 *
 * These live under `ui:options.i18n` rather than `ui:title` / `ui:help` because
 * those two are reserved rjsf keys that expect strings — handing them an
 * {en, fr} object makes React throw while rendering the label.
 */
/**
 * Whether a field has actually been answered.
 *
 * The required marker used to be driven by `!rawErrors.length` alone, in every
 * field and every composite. Validation is deliberately deferred to submit — see
 * SchemaForm — so there are never any rawErrors while someone is filling the
 * form in, and every required field therefore showed a green ✓ from the moment
 * the form opened. A marker that reads "done" before anything has been typed is
 * worse than no marker at all.
 */
export function isAnswered(value) {
  if (value === undefined || value === null || value === "") return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") {
    // An object counts as answered when any leaf is. `translations` provenance
    // siblings are objects too, so "some" rather than "every" is the honest
    // reading of a partly-filled bilingual value.
    return Object.values(value).some((entry) => isAnswered(entry));
  }
  return true;
}

export function fieldLabels(uiSchema = {}, language = "en", fallbackTitle) {
  const i18n = uiSchema["ui:options"]?.i18n || {};
  return {
    title: localized(i18n.title, language) || fallbackTitle,
    help: localized(i18n.help, language),
  };
}

export default function FieldQuestion({
  title,
  help,
  description,
  required,
  passes = true,
  className,
  style,
  children,
}) {
  return (
    <Paper className={className} style={{ ...paperClass, ...style }}>
      {title && (
        <QuestionText>
          {title}
          {required && <RequiredMark passes={passes} />}
          {(help || description) && (
            <SupplementalText>
              {help ? (
                // Markdown so a form author gets lists, links, and emphasis
                // without needing a component — which is how the hand-built
                // form's long-form guidance was written in JSX.
                <Markdown remarkPlugins={[remarkGfm]}>{help}</Markdown>
              ) : (
                description
              )}
            </SupplementalText>
          )}
        </QuestionText>
      )}
      {children}
    </Paper>
  );
}
