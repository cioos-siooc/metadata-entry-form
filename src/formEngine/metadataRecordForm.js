/**
 * Generates the metadata record's form type from `src/schema/`.
 *
 * The record is not authored as a form definition the way the eDNA forms are
 * (`catalog/*.formtype.json`). It is DERIVED, every time, from the schema that
 * already describes it — because `src/schema/properties/*.js` is the single
 * source of truth for the record and has been since it was introduced. Every
 * property there is annotated by `field({en, fr, tab, error, schema})`, which
 * emits exactly what a uiSchema needs:
 *
 *   title / description + x-i18n.fr   →  bilingual labels and help
 *   x-cioos-tab                       →  which tab the question belongs on
 *   x-cioos-error                     →  the field is required, and the message
 *
 * So adding a field to the record means editing one file, and it appears in the
 * form with its label, its help and its required marker. That is the whole point
 * of the migration; the moment this file needs a hand-written entry per property,
 * the point has been lost.
 *
 * It deliberately does NOT live under `catalog/` — `catalog/index.js` exports
 * `seedFormTypes`, and everything there is static, seedable, version-pinnable
 * data. This is none of those things.
 */

import { buildSubmissionSchema } from "../schema";
import tabs from "../utils/tabs";

export const METADATA_RECORD_SLUG = "metadata-record";
export const METADATA_RECORD_KIND = "metadataRecord";

/**
 * Properties carrying an `x-cioos-tab` that must never be rendered as questions:
 * the app derives them. Their values still round-trip — SchemaForm hard-locks
 * `omitExtraData={false}`, so rjsf never strips a key it is not shown.
 *
 * Dropping them from `properties` rather than using `ui:widget: "hidden"`,
 * because a hidden field still mounts and still takes part in rjsf's bookkeeping.
 */
const DERIVED = new Set([
  "metadataScopeIso", // set from metadataScope in standardizeRecord()
  "doiCreationStatus", // written by DOIInput as a sibling of datasetIdentifier
  "noTaxa", // the taxa field renders this opt-out itself, as TaxaTab did
]);

/**
 * Has an `x-cioos-error` (so it validates) but does not count towards
 * completeness. Mirrors `optional: true` in src/utils/validate.js:99 — the
 * annotations have no way to express optionality, so this is the one fact about
 * requiredness the schema cannot tell us.
 */
const OPTIONAL = new Set(["datasetIdentifier"]);

/** Internal identifiers inside array items. Persisted, never asked. */
const HIDDEN_NESTED = new Set([
  "contactID",
  "instrumentID",
  "platformID",
  "association_type_iso", // derived from association_type
  "scopeIso", // derived from scope
]);

/**
 * Top-level properties whose subtree a custom component owns outright.
 *
 * Everything absent from this table renders through native rjsf — including the
 * arrays (contacts, distribution, associated_resources, history, platforms,
 * instruments), whose leaves are handled by the derivation in `uiForNode`.
 *
 *   ownChrome   the component draws its own Paper and RequiredMark, so
 *               QuestionFieldTemplate must not draw a second one
 *   replacesAnyOf  see the datasetIdentifier note below
 *   library     wire the "add from / save to saved library" array template
 */
const OVERRIDES = {
  title: { field: "bilingualText" },
  abstract: { field: "bilingualText", options: { multiline: true, rows: 8 } },
  keywords: { field: "keywords" },
  eov: { field: "eov" },
  resourceType: { field: "topicCategory" },
  sharedWith: { field: "sharedUsers", ownChrome: true },
  map: { field: "mapExtent", ownChrome: true },
  taxa: { field: "taxa", ownChrome: true },
  // datasetIdentifier is {type: "string", anyOf: [{const: ""}, {pattern: …}]}.
  // rjsf nulls out the field component for any anyOf/oneOf that is not a plain
  // enum (SchemaField: `if ((schema.anyOf || schema.oneOf) && !isSelect(schema))`)
  // and mounts AnyOfField — an "Option 1 / Option 2" dropdown — instead. The only
  // way to keep our own field is to claim the anyOf explicitly.
  datasetIdentifier: { field: "doi", ownChrome: true, replacesAnyOf: true },
  contacts: { library: "contacts" },
  platforms: { library: "platforms" },
  instruments: { library: "instruments" },
  projects: { widget: "checkboxList" },
};

/** Steps whose visibility depends on the record. */
const STEP_VISIBILITY = {
  // Models have no platform. Replaces the hand-written check in MetadataForm.
  platform: { field: "metadataScopeIso", notIn: ["model"] },
  platformInstruments: { field: "metadataScopeIso", notIn: ["model"] },
};

const refName = (node) =>
  typeof node?.$ref === "string" ? node.$ref.split("/").pop() : null;

const localize = (node, language) =>
  language === "fr" ? node?.["x-i18n"]?.fr || {} : {};

/**
 * Derives the uiSchema for one node from its shape, recursively.
 *
 * Driven by `$ref` target rather than by property name, so a bilingual field
 * added to `contact` or `lineageStep` next year gets the right editor without
 * anyone remembering to come back here.
 */
function uiForNode(node, { language, name, defs = {} } = {}) {
  if (!node || typeof node !== "object") return {};

  if (HIDDEN_NESTED.has(name)) return { "ui:widget": "hidden" };

  const ref = refName(node);

  if (ref === "bilingualText" || ref === "bilingualTextRequired" || ref === "bilingualTextAtLeastOne") {
    return { "ui:field": "bilingualText" };
  }
  if (ref === "isoDateTime") return { "ui:widget": "isoDateTime" };
  if (ref === "translations") return { "ui:widget": "hidden" };

  // Everything below needs the node's real shape. Array items are written as
  // `{$ref: "#/definitions/contact"}`, so without resolving we would stop at the
  // ref and silently emit nothing for every array item's sub-fields.
  const resolved = ref && defs[ref] ? { ...defs[ref], ...node } : node;

  // An array of enum values is a checkbox list, not an add/remove list of
  // dropdowns — which is what rjsf would otherwise render.
  if (resolved.items?.enum) return { "ui:widget": "checkboxList" };

  if (resolved.properties) {
    const ui = {};
    Object.entries(resolved.properties).forEach(([child, sub]) => {
      const childUi = uiForNode(sub, { language, name: child, defs });
      const label = labelFor(sub, language);
      if (label.title) childUi["ui:title"] = label.title;
      if (label.help) childUi["ui:options"] = { ...(childUi["ui:options"] || {}), help: label.help };
      if (Object.keys(childUi).length) ui[child] = childUi;
    });
    return ui;
  }

  if (resolved.items) {
    const itemUi = uiForNode(resolved.items, { language, defs });
    return Object.keys(itemUi).length ? { items: itemUi } : {};
  }

  return {};
}

function labelFor(node, language) {
  const fr = localize(node, language);
  return {
    title: fr.title || node?.title || null,
    help: fr.description || node?.description || null,
  };
}

/**
 * Substitutes the placeholders long-form guidance is allowed to use, so help
 * text can name the region's catalogue without the schema importing regions.js.
 */
function interpolate(text, values) {
  if (typeof text !== "string") return text;
  return text.replace(/\{(\w+)\}/g, (match, key) =>
    key in values ? values[key] : match
  );
}

/**
 * @param {object} options
 * @param {"en"|"fr"} options.language    active UI language
 * @param {object} [options.regionInfo]   entry from src/regions.js, for help interpolation
 * @param {string[]} [options.projects]   the region's project list, from /admin/{region}/projects
 * @returns {{jsonSchema: object, uiSchema: object}}
 */
export function buildMetadataRecordForm({
  language = "en",
  regionInfo = {},
  projects = [],
} = {}) {
  const lang = language === "fr" ? "fr" : "en";
  const full = buildSubmissionSchema();

  const placeholders = {
    regionTitle: regionInfo?.title?.[lang] || regionInfo?.title?.en || "",
    catalogueUrl: regionInfo?.catalogueURL?.[lang] || regionInfo?.catalogueURL?.en || "",
  };

  const properties = {};
  const uiSchema = {};
  const byTab = {};

  Object.entries(full.properties).forEach(([name, node]) => {
    const tab = node["x-cioos-tab"];
    if (!tab || DERIVED.has(name)) return;

    let rendered = node;
    // The project list is per-region and lives in the database, so the static
    // schema cannot carry it.
    if (name === "projects" && projects.length) {
      rendered = { ...node, items: { ...node.items, enum: [...projects] } };
    }

    properties[name] = rendered;
    (byTab[tab] ||= []).push(name);

    const override = OVERRIDES[name] || {};
    const label = labelFor(node, lang);
    const ui = uiForNode(rendered, {
      language: lang,
      name,
      defs: full.definitions,
    });

    if (override.field) {
      ui["ui:field"] = override.field;
      // A custom field owns the whole subtree, so any widget the derivation
      // picked for it is dead weight that only confuses the next reader.
      delete ui["ui:widget"];
    }
    if (override.widget) ui["ui:widget"] = override.widget;
    if (override.replacesAnyOf) ui["ui:fieldReplacesAnyOrOneOf"] = true;

    if (label.title) ui["ui:title"] = label.title;

    const uiOptions = { ...(ui["ui:options"] || {}), ...(override.options || {}) };
    if (label.help) uiOptions.help = interpolate(label.help, placeholders);
    if (override.ownChrome) uiOptions.ownChrome = true;
    if (override.library) uiOptions.library = override.library;
    // Names the property RequiredMark should ask about. Requiredness is not in
    // the schema's `required` array — buildSubmissionSchema puts it all in allOf
    // conditionals, which pickSchemaProperties strips per step.
    if (node["x-cioos-error"] && !OPTIONAL.has(name)) uiOptions.requiredField = name;

    // QuestionFieldTemplate draws the question for this field, so silence rjsf's
    // own ArrayFieldTitleTemplate — otherwise a native array shows its label
    // twice, once as the question and once as an <h5> above the add button.
    if (rendered.type === "array" && !override.field) {
      uiOptions.label = false;
      // rjsf-mui wraps every array in an elevation-2 Paper. Inside the question
      // card that reads as an empty grey box with a stray + in it, which is what
      // an array with no rows actually looked like. Flatten it.
      uiOptions.mui = {
        ...(uiOptions.mui || {}),
        rjsfSlotProps: { arrayPaper: { elevation: 0 } },
      };
    }

    // A bare MUI Select sizes itself to its content, so an empty enum collapses
    // to a ~60px box that clips its own label ("Rv." for "Resource type").
    if (rendered.enum && !override.field && !override.widget) {
      uiOptions.mui = { ...(uiOptions.mui || {}), fullWidth: true };
    }

    if (Object.keys(uiOptions).length) ui["ui:options"] = uiOptions;
    if (Object.keys(ui).length) uiSchema[name] = ui;
  });

  uiSchema["ui:steps"] = Object.keys(tabs)
    .filter((tab) => byTab[tab]?.length)
    .map((tab) => ({
      id: tab,
      title: tabs[tab],
      fields: byTab[tab],
      ...(STEP_VISIBILITY[tab] ? { visibleIf: STEP_VISIBILITY[tab] } : {}),
    }));

  return {
    jsonSchema: {
      ...full,
      // The rendered schema carries no root label: QuestionFieldTemplate would
      // otherwise wrap the entire form in a Paper titled "CIOOS Metadata Record".
      title: undefined,
      description: undefined,
      properties,
    },
    uiSchema,
  };
}

export default buildMetadataRecordForm;
