import React from "react";

import KeywordsInput from "../../components/FormComponents/KeywordsInput";
import useField from "./useField";

/**
 * Keywords are `{en: [], fr: []}` — two parallel lists, not an array — so rjsf's
 * array machinery does not apply. KeywordsInput also cross-suggests the other
 * language's term from src/keywordList.js, which is the reason this stays a
 * custom field rather than two string arrays.
 */
export default function KeywordsField(props) {
  const { value, onEvent, disabled, name } = useField(props);

  return (
    <KeywordsInput
      name={name}
      value={value || { en: [], fr: [] }}
      onChange={onEvent}
      disabled={disabled}
    />
  );
}
