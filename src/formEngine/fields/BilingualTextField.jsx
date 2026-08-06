import React from "react";
import { Grid, TextField } from "@mui/material";

/**
 * An `{en, fr}` object rendered as two inputs.
 *
 * Requested from a uiSchema with `"ui:field": "bilingualText"`.
 *
 * This owns the whole object rather than letting rjsf render `en` and `fr` as
 * separate string properties, for one important reason: bilingual values on this
 * project carry a sibling `translations: {<lang>: {verified, message}}` object
 * recording machine-translation provenance. rjsf would have no idea that key
 * exists. Spreading the incoming formData on every change preserves it.
 *
 * The active language is shown first so a reader scanning top to bottom sees
 * their own language.
 *
 * Two rjsf v6 API details that are easy to get wrong, and were:
 *
 *   onChange(value, path)
 *     The PATH is required. Omitting it applies the value at the ROOT of the
 *     form data rather than at this field — so editing a bilingual field would
 *     scatter `en`/`fr`/`translations` across the top level and leave the field
 *     itself unchanged. v5 took no path; v6 does.
 *
 *   registry.formContext, not props.formContext
 *     Reading props.formContext yields undefined, which silently defaults the
 *     language to English and breaks the French-first ordering.
 */
export default function BilingualTextField(props) {
  const {
    formData = {},
    onChange,
    disabled,
    readonly,
    schema = {},
    uiSchema = {},
    fieldPathId = {},
    rawErrors = [],
    registry,
  } = props;

  const formContext = registry?.formContext || {};
  const language = formContext.language === "fr" ? "fr" : "en";
  const order = language === "fr" ? ["fr", "en"] : ["en", "fr"];

  const options = uiSchema["ui:options"] || {};
  const multiline = Boolean(
    options.multiline ?? uiSchema["ui:widget"] === "textarea"
  );
  const rows = options.rows || 4;

  const labels = {
    en: options.labelEn || "English",
    fr: options.labelFr || "Français",
  };

  const update = (lang) => (event) => {
    // Spread formData so `translations` and any other sibling survives, and
    // pass fieldPathId.path so the value lands on this field.
    onChange({ ...formData, [lang]: event.target.value }, fieldPathId.path);
  };

  return (
    <Grid container direction="column" spacing={2}>
      {order.map((lang) => (
        <Grid key={lang}>
          <TextField
            id={`${fieldPathId.$id || "bilingual"}_${lang}`}
            label={labels[lang]}
            value={formData?.[lang] ?? ""}
            onChange={update(lang)}
            disabled={disabled || readonly}
            error={rawErrors.length > 0}
            multiline={multiline}
            minRows={multiline ? rows : undefined}
            fullWidth
            placeholder={schema.examples?.[0]}
          />
        </Grid>
      ))}
    </Grid>
  );
}
