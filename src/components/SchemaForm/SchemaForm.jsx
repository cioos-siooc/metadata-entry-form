import React from "react";
import Form from "@rjsf/mui";
import validator from "@rjsf/validator-ajv8";
import BilingualTextField from "./fields/BilingualTextField";
import DateWidget from "./widgets/DateWidget";

// The single wrapper around react-jsonschema-form: the only module that
// imports @rjsf/*. Registers the project's custom controls so form-type
// authors can opt in from the UI Schema ("ui:field": "bilingualText"; date
// fields get the project DatePicker automatically via format: "date").
const fields = { bilingualText: BilingualTextField };
const widgets = { DateWidget };

export default function SchemaForm({
  jsonSchema,
  uiSchema,
  formData,
  onChange,
  onSubmit,
  disabled,
  children,
}) {
  return (
    <Form
      schema={jsonSchema}
      uiSchema={uiSchema}
      formData={formData}
      validator={validator}
      fields={fields}
      widgets={widgets}
      disabled={disabled}
      onChange={onChange ? (event) => onChange(event.formData) : undefined}
      onSubmit={onSubmit ? (event) => onSubmit(event.formData) : undefined}
      liveValidate={false}
      showErrorList="top"
      // let drafts hold partial data; full validation runs on submit
      noHtml5Validate
    >
      {children}
    </Form>
  );
}
