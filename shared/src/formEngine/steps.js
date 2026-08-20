/**
 * The `ui:steps` uiSchema extension — how a form is split into tabs.
 *
 * A form type may declare:
 *
 *   "ui:steps": [
 *     { "id": "site",   "title": {"en": "Site", "fr": "Site"},
 *       "fields": ["siteName", "latitude", "longitude"] },
 *     { "id": "lab",    "title": {"en": "Lab", "fr": "Laboratoire"},
 *       "fields": ["extractionDate", "dnaConcentration"],
 *       "visibleIf": { "field": "sampleType", "notIn": ["control"] } }
 *   ]
 *
 * Steps are not a wizard. Users jump between them freely, the same way the
 * existing metadata form's tabs work. Omit `ui:steps` entirely and the form
 * renders as one page.
 *
 * Why filter the schema per step rather than hide fields with
 * `ui:widget: "hidden"`: a hidden field still mounts and still participates in
 * rjsf's `omitExtraData` bookkeeping. Filtering means the fields for other steps
 * are simply not part of the subschema being rendered, while the form data
 * object stays whole.
 */

/**
 * Narrows a schema to the named top-level properties, preserving declaration
 * order and dropping `required` entries that are no longer present.
 *
 * `definitions`/`$defs` are carried over untouched so `$ref`s keep resolving.
 */
export function pickSchemaProperties(schema, fields) {
  if (!schema || !Array.isArray(fields)) return schema;

  const keep = new Set(fields);
  const properties = {};
  Object.entries(schema.properties || {}).forEach(([name, sub]) => {
    if (keep.has(name)) properties[name] = sub;
  });

  const picked = {
    ...schema,
    properties,
    required: (schema.required || []).filter((name) => keep.has(name)),
    // A RENDERING guard, not a validation change, and not data loss.
    //
    // The record schema sets additionalProperties: true on purpose (legacy
    // records carry forgotten keys — see src/schema/index.js). Spreading the
    // schema above carries that through to the subschema, and rjsf then treats
    // every key of formData that this step does NOT declare as an "additional
    // property": it stubs each one into schema.properties and renders it with a
    // key-rename textbox and a delete button (@rjsf/utils retrieveSchema.js,
    // stubExistingAdditionalProperties). On a metadata record that is ~40
    // spurious editable rows on every tab.
    //
    // Closing the PICKED schema stops that. Nothing is dropped from the data:
    // SchemaForm hard-locks omitExtraData={false}, so rjsf never strips keys.
    additionalProperties: false,
  };

  // A root-level conditional would reference fields this step doesn't render,
  // so it cannot be evaluated here. Validation of the whole record happens on
  // submit, against the unfiltered schema.
  delete picked.allOf;
  delete picked.anyOf;
  delete picked.oneOf;
  delete picked.if;
  delete picked.then;
  delete picked.else;

  if (!picked.required.length) delete picked.required;

  return picked;
}

/**
 * Reads the step definitions off a uiSchema.
 *
 * Any property not claimed by a step is appended to a final catch-all step, so
 * adding a field to the schema without touching `ui:steps` can never make it
 * invisible — it shows up rather than silently vanishing.
 */
export function resolveSteps(jsonSchema, uiSchema) {
  const declared = uiSchema?.["ui:steps"];
  const allFields = Object.keys(jsonSchema?.properties || {});

  if (!Array.isArray(declared) || declared.length === 0) {
    // A schema with no properties yields no steps at all, so the caller can say
    // "this form has no fields yet" rather than render an empty tab.
    if (allFields.length === 0) return [];
    return [
      {
        id: "__all",
        title: null,
        fields: allFields,
        implicit: true,
      },
    ];
  }

  const claimed = new Set();
  const steps = declared.map((step, index) => {
    const fields = (step.fields || []).filter((name) =>
      allFields.includes(name)
    );
    fields.forEach((name) => claimed.add(name));
    return {
      id: step.id || `step-${index}`,
      title: step.title || null,
      description: step.description || null,
      fields,
      visibleIf: step.visibleIf,
    };
  });

  const unclaimed = allFields.filter((name) => !claimed.has(name));
  if (unclaimed.length) {
    steps.push({
      id: "__other",
      title: { en: "Other", fr: "Autre" },
      fields: unclaimed,
      unclaimed: true,
    });
  }

  return steps.filter((step) => step.fields.length > 0);
}

/** Best available label for a step in the active language. */
export function stepLabel(step, language = "en", fallback = "") {
  if (!step?.title) return fallback;
  if (typeof step.title === "string") return step.title;
  return step.title[language] || step.title.en || step.title.fr || fallback;
}
