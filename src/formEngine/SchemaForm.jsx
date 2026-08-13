import React from "react";
import Form from "@rjsf/mui";
import validator from "@rjsf/validator-ajv8";

import BilingualTextField from "./fields/BilingualTextField";
import IsoDateTimeWidget from "./widgets/IsoDateTimeWidget";
import CheckBoxListWidget from "./widgets/CheckBoxListWidget";
import SelectWidget from "./widgets/SelectWidget";
import TextareaWidget from "./widgets/TextareaWidget";
import QuestionFieldTemplate from "./templates/QuestionFieldTemplate";
import InputTemplate from "./templates/InputTemplate";
import ListFieldTemplate from "./templates/ListFieldTemplate";
import ListItemTemplate from "./templates/ListItemTemplate";

/**
 * The rjsf boundary.
 *
 * @rjsf/* imports are confined to this file and the presentation wrappers it
 * registers — templates/InputTemplate.jsx, widgets/SelectWidget.jsx, and
 * widgets/TextareaWidget.jsx — each of which exists only to hand rjsf's own MUI
 * component the right presentation props. Nothing else in the app depends on
 * rjsf's API, so upgrading it, or replacing it, touches that short list. An
 * eslint no-restricted-imports rule would be a reasonable way to enforce it.
 *
 * Two settings here are load-bearing and must not be "optimized":
 *
 *   omitExtraData={false}
 *     rjsf's omitExtraData strips any key the schema does not declare. On the
 *     metadata record that would silently delete the `translations` provenance
 *     sibling that BilingualTextInput writes, plus contactID, instrumentID, and
 *     every other undeclared key. Silent data loss, invisible in review. There
 *     is a dev-mode assertion below so nobody re-enables it by accident.
 *
 *   liveValidate={false}
 *     Drafts are saved half-finished by design; validating on every keystroke
 *     would paint a partly-filled form red. Validation runs on submit.
 */

/**
 * Custom FIELDS own a whole subtree; custom WIDGETS render one scalar.
 *
 * Every name a uiSchema may request is declared in shared/formEngine/
 * uiVocabulary.js — that file is what the builder's picker and the uiSchema
 * validator read, so a field implemented but not declared is invisible to
 * authors, and one declared but not implemented silently falls back to rjsf's
 * default.
 */
export const FIELDS = { bilingualText: BilingualTextField };

export const WIDGETS = {
  // Named so a uiSchema can request them explicitly.
  isoDateTime: IsoDateTimeWidget,
  checkboxList: CheckBoxListWidget,
  // Overrides of names rjsf already defines, which is why they are capitalised.
  //
  // DateTimeWidget: rjsf's truncates to minutes, which would rewrite the
  // full-precision ISO timestamps records already store.
  //
  // SelectWidget / TextareaWidget: presentation only — rjsf's own components,
  // handed a width and told not to repeat the question as a second label. See
  // inputLayout.js.
  DateTimeWidget: IsoDateTimeWidget,
  SelectWidget,
  TextareaWidget,
};

const TEMPLATES = {
  FieldTemplate: QuestionFieldTemplate,
  // Presentation only, all three. Every scalar input in the form goes through
  // BaseInputTemplate, so it is the one place a width rule reaches text and
  // number fields alike.
  BaseInputTemplate: InputTemplate,
  ArrayFieldTemplate: ListFieldTemplate,
  ArrayFieldItemTemplate: ListItemTemplate,
};

export default function SchemaForm({
  jsonSchema,
  uiSchema,
  formData,
  onChange,
  onSubmit,
  onError,
  disabled,
  readonly,
  formContext,
  extraErrors,
  idPrefix,
  children,
  omitExtraData,
}) {
  if (import.meta.env?.DEV && omitExtraData) {
    throw new Error(
      "SchemaForm: omitExtraData must stay false — it silently deletes keys the " +
        "schema does not declare (translations provenance, contactID, …). See the " +
        "comment at the top of SchemaForm.jsx."
    );
  }

  return (
    <Form
      schema={jsonSchema || { type: "object", properties: {} }}
      uiSchema={uiSchema || {}}
      formData={formData}
      validator={validator}
      fields={FIELDS}
      widgets={WIDGETS}
      templates={TEMPLATES}
      formContext={formContext}
      extraErrors={extraErrors}
      idPrefix={idPrefix}
      disabled={disabled}
      readonly={readonly}
      onChange={onChange ? (event) => onChange(event.formData) : undefined}
      onSubmit={onSubmit ? (event) => onSubmit(event.formData) : undefined}
      onError={onError}
      liveValidate={false}
      showErrorList={false}
      noHtml5Validate
      omitExtraData={false}
      liveOmit={false}
    >
      {/* Rendering children suppresses rjsf's own submit button, so each page
          owns its actions (Save draft / Submit / Export). */}
      {children ?? <></>}
    </Form>
  );
}
