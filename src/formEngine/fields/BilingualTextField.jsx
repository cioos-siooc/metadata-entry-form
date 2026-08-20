import React from "react";

import BilingualTextInput from "../../components/FormComponents/BilingualTextInput";
import useField from "./useField";

/**
 * An `{en, fr}` value, edited through the app's real bilingual input.
 *
 * This owns the whole object rather than letting rjsf render `en` and `fr` as
 * two string properties, because a bilingual value here carries a sibling
 * `translations: {<lang>: {verified, message}}` recording machine-translation
 * provenance. rjsf has no idea that key exists, and BilingualTextInput both
 * writes and reads it.
 *
 * Requested with `"ui:field": "bilingualText"`, which the generator derives from
 * the schema's `$ref` — so every bilingual field, at any depth, gets this
 * automatically.
 */
export default function BilingualTextField(props) {
  const { value, onEvent, disabled, error, name } = useField(props);
  const options = props.uiSchema?.["ui:options"] || {};

  return (
    <BilingualTextInput
      name={name}
      value={value || { en: "", fr: "" }}
      onChange={onEvent}
      disabled={disabled}
      error={error}
      multiline={Boolean(options.multiline)}
    />
  );
}
