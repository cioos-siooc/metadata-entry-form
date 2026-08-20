/**
 * The four things every custom field on this form needs from rjsf, plus the two
 * v6 API details that are easy to get wrong and were got wrong more than once.
 *
 *   onChange(value, path)
 *     The PATH is required. Omitting it applies the value at the ROOT of the
 *     form data instead of at this field — so editing one field scatters its
 *     keys across the top level and leaves the field itself unchanged. v5 took
 *     no path; v6 does.
 *
 *   registry.formContext, not props.formContext
 *     props.formContext is undefined in v6. Reading it silently defaults the
 *     language to English and hides whatever the page put in context.
 *
 * `record` is the WHOLE record, not just this field's value. Several of these
 * components need siblings — MapSelect reads resourceType, Instruments reads
 * platforms, the citation preview reads half the record — and FormShell binds
 * every step's form to the whole object precisely so that works.
 */
export default function useField(props) {
  const {
    formData,
    onChange,
    disabled,
    readonly,
    rawErrors = [],
    fieldPathId = {},
    registry,
  } = props;

  const formContext = registry?.formContext || {};

  const setValue = (value) => onChange(value, fieldPathId.path);

  return {
    value: formData,
    setValue,
    /** For the many components here whose onChange emits {target: {name, value}}. */
    onEvent: (event) => setValue(event.target.value),
    disabled: Boolean(disabled || readonly),
    error: rawErrors.length > 0,
    name: fieldPathId.$id || "",
    formContext,
    language: formContext.language === "fr" ? "fr" : "en",
    record: formContext.formData || {},
  };
}
