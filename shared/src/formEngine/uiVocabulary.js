/**
 * The uiSchema vocabulary this form engine understands, described as data.
 *
 * There is exactly one reason this file exists: the vocabulary is bespoke, and
 * it was previously written down in four places that could drift apart — the
 * widget registry in SchemaForm.jsx, the predicate evaluator in predicate.js,
 * the prose help text in FormTypeEditor.jsx, and the authors' heads. Declaring
 * it once lets the builder UI, the validator, and the docs all read from the
 * same source.
 *
 * Anything added here must be matched by a real implementation:
 *   - a WIDGETS/FIELDS entry in src/formEngine/SchemaForm.jsx, and
 *   - a branch in shared/src/formEngine/predicate.js for an operator.
 *
 * That first rule is enforced rather than trusted: src/formEngine/__tests__/
 * widgetRegistry.test.js fails if this file names a widget the registry does
 * not implement, or vice versa.
 *
 * Pure and dependency-free, like everything else in this directory.
 */

/** Labels are bilingual everywhere in this app; the vocabulary is no exception. */
const t = (en, fr) => ({ en, fr });

/**
 * `ui:widget` and `ui:field` values a form type may request.
 *
 * `types` is the set of JSON Schema `type`s the entry can render. An empty set
 * means "any" — used by `textarea`, which rjsf applies to strings but which is
 * harmless elsewhere.
 *
 * `arrayOf` narrows further for array-typed properties: `checkboxList` only
 * makes sense over an enum, which is how rjsf signals a checkbox group.
 */
export const UI_WIDGETS = [
  {
    name: "isoDateTime",
    kind: "widget",
    label: t("Date and time", "Date et heure"),
    description: t(
      "Full-precision ISO timestamp. Overrides rjsf's DateTimeWidget, which truncates to minutes.",
      "Horodatage ISO complet. Remplace le DateTimeWidget de rjsf, qui tronque aux minutes."
    ),
    types: ["string"],
    options: [],
  },
  {
    name: "checkboxList",
    kind: "widget",
    label: t("Checkbox list", "Liste de cases à cocher"),
    description: t(
      "Multi-select rendered as checkboxes rather than a menu.",
      "Sélection multiple affichée en cases à cocher plutôt qu'en menu."
    ),
    types: ["array"],
    arrayOf: "enum",
    options: ["inline", "optionTooltips"],
  },
  {
    name: "textarea",
    kind: "widget",
    label: t("Multi-line text", "Texte multiligne"),
    description: t("rjsf's built-in textarea.", "Zone de texte intégrée de rjsf."),
    types: ["string"],
    options: ["rows"],
    // rjsf resolves this name to its own TextareaWidget, so there is no entry
    // called `textarea` in SchemaForm's registry — the app re-dresses rjsf's
    // component under the name rjsf uses. Declared here anyway because the
    // builder should offer it and the validator should accept it.
    builtin: true,
  },
  {
    name: "bilingualText",
    kind: "field",
    label: t("Bilingual text", "Texte bilingue"),
    description: t(
      "Two inputs writing {en, fr}. The property must be an object with en/fr.",
      "Deux champs écrivant {en, fr}. La propriété doit être un objet avec en/fr."
    ),
    types: ["object"],
    options: ["labelEn", "labelFr", "multiline", "rows"],
  },

];

/** Fast lookup, and the thing the validator uses to reject unknown names. */
export const UI_WIDGETS_BY_NAME = Object.fromEntries(
  UI_WIDGETS.map((widget) => [widget.name, widget])
);

/** Options accepted under `ui:options`, beyond the engine's own `i18n`/`visibleIf`. */
export const UI_OPTIONS = {
  multiline: { type: "boolean", label: t("Multi-line", "Multiligne") },
  rows: { type: "integer", label: t("Rows", "Lignes") },
  inline: { type: "boolean", label: t("Lay out inline", "Disposition en ligne") },
  labelEn: { type: "string", label: t("Label (en)", "Étiquette (en)") },
  labelFr: { type: "string", label: t("Label (fr)", "Étiquette (fr)") },
  optionTooltips: {
    type: "object",
    label: t("Per-option tooltips", "Infobulles par option"),
  },
  showCitationPreview: {
    type: "boolean",
    label: t("Show citation preview", "Afficher l'aperçu de la citation"),
  },
};

/**
 * Operators in the `visibleIf` predicate DSL.
 *
 * `arity` drives the builder's value input:
 *   "value" — a single value       "list" — an array       "flag" — a boolean
 *
 * Must stay in lockstep with `evaluate` in predicate.js. An operator listed here
 * with no branch there would be silently ignored at render time — which is the
 * exact failure this registry is meant to make visible.
 */
export const PREDICATE_OPERATORS = [
  { name: "equals", arity: "value", label: t("is", "est") },
  { name: "in", arity: "list", label: t("is one of", "est parmi") },
  { name: "notIn", arity: "list", label: t("is not one of", "n'est pas parmi") },
  { name: "truthy", arity: "flag", label: t("is filled in", "est rempli") },
  { name: "exists", arity: "flag", label: t("has a value", "a une valeur") },
];

export const PREDICATE_OPERATOR_NAMES = PREDICATE_OPERATORS.map((op) => op.name);

/** Combinators, handled before operators in `evaluate`. */
export const PREDICATE_COMBINATORS = ["allOf", "anyOf", "not"];

/** Ambient flags a rule may test with `{context: "..."}`. */
export const PREDICATE_CONTEXT_FLAGS = ["canEdit"];

/**
 * rjsf keys that expect a plain string, which authors reliably try to hand an
 * `{en, fr}` object. Doing so makes React throw while rendering the label, so
 * the validator flags it and points at the working equivalent.
 *
 * See the comment at QuestionFieldTemplate.jsx:25-29.
 */
export const RESERVED_STRING_KEYS = {
  "ui:title": "ui:options.i18n.title",
  "ui:help": "ui:options.i18n.help",
  "ui:description": "ui:options.i18n.help",
};

/** Top-level uiSchema keys owned by the engine rather than by rjsf. */
export const ENGINE_ROOT_KEYS = [
  "ui:steps",
  "ui:summaryFields",
];

/**
 * The declared type(s) of a property, always as an array.
 *
 * JSON Schema lets `type` be a union — `{"type": ["string", "number"]}` — and
 * the metadata record uses that for several fields (`verticalExtentMin`,
 * `resourceType`). Treating the raw value as a string silently fails every
 * comparison below, which showed up as a widget being rejected for a property
 * it renders perfectly well.
 *
 * An empty array means "unconstrained", which is also what a `$ref`-only
 * property yields — resolving refs here would mean dragging a resolver into a
 * module that is meant to stay pure, so such properties accept any widget.
 */
function typesOf(property) {
  const type = property?.type;
  if (Array.isArray(type)) return type;
  return type ? [type] : [];
}

/**
 * Widget/field entries that can render a given property.
 *
 * The builder uses this to populate its picker, so a picker can never offer
 * `checkboxList` for a string or `isoDateTime` for a number.
 */
export function widgetsForProperty(property) {
  const types = typesOf(property);
  if (!types.length) return UI_WIDGETS;

  return UI_WIDGETS.filter((widget) => {
    // A union satisfies a widget if ANY member does: `["array", "string"]` can
    // be rendered as a checkbox list, whatever else it may also hold.
    if (widget.types.length && !types.some((type) => widget.types.includes(type))) {
      return false;
    }
    if (widget.arrayOf === "enum" && !property?.items?.enum) return false;
    return true;
  });
}

/** Whether a property can be shown as a column in the submissions table. */
export function isScalarProperty(property) {
  const types = typesOf(property);
  if (!types.length) return true;
  // A union counts as scalar only if no member is composite — one object member
  // is enough to render as raw JSON in a table cell.
  return !types.some((type) => type === "object" || type === "array");
}
