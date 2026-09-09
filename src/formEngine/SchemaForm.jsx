import React from "react";
import Form from "@rjsf/mui";
import validator from "@rjsf/validator-ajv8";

import BilingualTextField from "./fields/BilingualTextField";
import IsoDateTimeWidget from "./widgets/IsoDateTimeWidget";
import CheckBoxListWidget from "./widgets/CheckBoxListWidget";
import QuestionFieldTemplate from "./templates/QuestionFieldTemplate";

/**
 * The one and only module that imports @rjsf/*.
 *
 * Keeping that boundary means the rest of the app never depends on rjsf's API,
 * so upgrading it — or replacing it — touches one file. An eslint
 * no-restricted-imports rule would be a reasonable way to enforce this.
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

const FIELDS = { bilingualText: BilingualTextField };

const WIDGETS = {
  // Named so a uiSchema can request them explicitly.
  isoDateTime: IsoDateTimeWidget,
  checkboxList: CheckBoxListWidget,
  // Override rjsf's defaults: its DateTimeWidget truncates to minutes, which
  // would rewrite the full-precision ISO timestamps records already store.
  DateTimeWidget: IsoDateTimeWidget,
};

const TEMPLATES = { FieldTemplate: QuestionFieldTemplate };

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
