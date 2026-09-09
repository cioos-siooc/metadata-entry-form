/**
 * Merges a global catalog entry with one region's activation settings.
 *
 * Form types are defined once at the top level; each region chooses whether to
 * enable them and may override presentation. This merge is a PURE function on
 * purpose — every adapter returns raw rows and calls this, so the two backends
 * cannot disagree about what a region sees.
 *
 * Overrides are deliberately limited to presentation: title, description, and
 * uiSchema. A region can rename a form or reorder its fields; it cannot change
 * the jsonSchema, because the schema is the data contract and submissions from
 * every region must remain comparable.
 */

/** Deep-merges plain objects; arrays and scalars from `over` replace wholesale. */
export function deepMerge(base, over) {
  if (over === undefined) return base;
  if (
    !base ||
    !over ||
    typeof base !== "object" ||
    typeof over !== "object" ||
    Array.isArray(base) ||
    Array.isArray(over)
  ) {
    return over;
  }

  const out = { ...base };
  Object.entries(over).forEach(([key, value]) => {
    out[key] = key in base ? deepMerge(base[key], value) : value;
  });
  return out;
}

/**
 * Which version of a form type a region should serve.
 * A pinned version wins; otherwise the region tracks the latest published one.
 */
export function resolveVersion(formType, activation) {
  const pinned = activation?.pinnedVersion;
  if (typeof pinned === "number" && pinned > 0) return pinned;
  return formType.version || 0;
}

/**
 * @param {Object} formType   catalog entry
 * @param {Object} [activation] the region's RegionFormType row, if any
 * @param {Object} [versionRow] the frozen FormTypeVersion for the resolved
 *   version. When omitted the working copy on the catalog entry is used, which
 *   is correct only for previewing an unpublished draft.
 */
export function resolveFormType(formType, activation, versionRow) {
  const resolvedVersion = resolveVersion(formType, activation);
  const overrides = activation?.overrides || {};

  const source = versionRow || formType;

  return {
    id: formType.id,
    slug: formType.slug,
    kind: formType.kind || "generic",
    status: formType.status || "draft",

    title: deepMerge(formType.title, overrides.title),
    description: deepMerge(formType.description, overrides.description),

    // The schema is never overridable — it is the data contract.
    jsonSchema: source.jsonSchema || {},
    // The uiSchema is presentation, so a region may adjust it.
    uiSchema: deepMerge(source.uiSchema || {}, overrides.uiSchema),

    resolvedVersion,
    schemaHash: source.schemaHash,

    enabled: Boolean(activation?.enabled),
    sortOrder: activation?.sortOrder ?? 0,
    pinnedVersion: activation?.pinnedVersion ?? null,

    createdAt: formType.createdAt,
    updatedAt: formType.updatedAt,
  };
}

/**
 * Resolves a whole catalog for one region and returns it in display order.
 *
 * @param {Object[]} catalog
 * @param {Object} activations   keyed by formTypeId
 * @param {Object} [versions]    keyed by `${formTypeId}:${version}`
 * @param {Object} [options]
 * @param {boolean} [options.includeDisabled] include types the region has not
 *   enabled, so an admin can see what is available to turn on
 */
export function resolveCatalogForRegion(
  catalog,
  activations = {},
  versions = {},
  { includeDisabled = false } = {}
) {
  return catalog
    .map((formType) => {
      const activation = activations[formType.id];
      const version = resolveVersion(formType, activation);
      return resolveFormType(
        formType,
        activation,
        versions[`${formType.id}:${version}`]
      );
    })
    .filter((resolved) => {
      if (resolved.status === "deprecated" && !includeDisabled) return false;
      // Never serve an unpublished draft to a region.
      if (resolved.resolvedVersion < 1 && !includeDisabled) return false;
      return includeDisabled || resolved.enabled;
    })
    .sort(
      (a, b) =>
        a.sortOrder - b.sortOrder ||
        String(a.slug).localeCompare(String(b.slug))
    );
}

/** Picks the best available label for a form type in the active language. */
export function formTypeLabel(formType, language = "en") {
  const title = formType?.title || {};
  return title[language] || title.en || title.fr || formType?.slug || "";
}
