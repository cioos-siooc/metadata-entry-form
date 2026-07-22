import React from "react";
import BilingualTextInput from "../../FormComponents/BilingualTextInput";

// RJSF *field* (it owns an object subtree, not a leaf) adapting the existing
// BilingualTextInput to schema-driven forms. Use with a schema like
//   { "type": "object", "properties": { "en": {"type":"string"}, "fr": {"type":"string"} } }
// and `"ui:field": "bilingualText"` in the UI Schema.
export default function BilingualTextField(props) {
  const { formData, onChange, disabled, readonly, uiSchema, idSchema } = props;
  return (
    <BilingualTextInput
      name={idSchema?.$id || "bilingualText"}
      value={formData || {}}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled || readonly}
      multiline={Boolean(uiSchema?.["ui:options"]?.multiline)}
    />
  );
}
