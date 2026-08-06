/**
 * The storage contract for the form engine.
 *
 * There is no implementation here on purpose. The engine talks only to this
 * shape, so it can run against Firebase Realtime Database today and the
 * Fastify/Postgres API later without the UI changing. Adapters live in
 * src/formEngine/store/.
 *
 * Two invariants the adapters must uphold, because the engine relies on them:
 *
 *  1. Resolution is a PURE function. Adapters return raw rows; merging a
 *     region's overrides onto a catalog entry happens in resolveFormType.js,
 *     never in SQL and never in a Firebase query. This is what actually keeps
 *     the engine backend-neutral.
 *
 *  2. Rendering always uses the submission's own formTypeVersion, never
 *     "latest". A draft started against v3 renders v3 forever, even once v7
 *     exists.
 *
 * @typedef {Object} FormType  A global catalog entry.
 * @property {string} id
 * @property {string} slug              globally unique, /^[a-z0-9-]+$/
 * @property {"generic"|"metadataRecord"} kind
 * @property {{en: string, fr: string}} title
 * @property {{en: string, fr: string}} description
 * @property {Object} jsonSchema        working copy; editing affects nobody
 * @property {Object} uiSchema          working copy
 * @property {number} version           latest PUBLISHED version; 0 = never published
 * @property {string} [schemaHash]
 * @property {"draft"|"published"|"deprecated"} status
 * @property {string} [createdBy]
 * @property {string} createdAt
 * @property {string} updatedAt
 *
 * @typedef {Object} FormTypeVersion  Immutable, append-only snapshot.
 * @property {string} formTypeId
 * @property {number} version
 * @property {Object} jsonSchema
 * @property {Object} uiSchema
 * @property {string} schemaHash
 * @property {"additive"|"breaking"} [changeClass]
 * @property {string} publishedAt
 * @property {string} [publishedBy]
 *
 * @typedef {Object} RegionFormType  Per-region activation.
 * @property {string} region
 * @property {string} formTypeId
 * @property {boolean} enabled        default FALSE — activation is opt-in
 * @property {number} sortOrder
 * @property {number|null} pinnedVersion  null = track latest published
 * @property {Object} overrides       {title?, description?, uiSchema?}
 * @property {string} [updatedBy]
 * @property {string} [updatedAt]
 *
 * @typedef {Object} ResolvedFormType  A catalog entry as one region sees it.
 *   Shaped like a FormType, but jsonSchema/uiSchema come from the pinned
 *   version and title/description/uiSchema have the region's overrides applied.
 * @property {number} resolvedVersion
 * @property {boolean} enabled
 * @property {number} sortOrder
 *
 * @typedef {Object} FormSubmission
 * @property {string} id
 * @property {string} region
 * @property {string} formTypeId
 * @property {number} formTypeVersion       snapshot — always used to render
 * @property {string} [formTypeSchemaHash]
 * @property {string} userID
 * @property {"draft"|"submitted"} status
 * @property {Object} data
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {Object} [lastEditedBy]
 *
 * @typedef {Object} FormStore
 *
 * Region-scoped reads, for any member of the region:
 * @property {(args: {region: string, includeDisabled?: boolean}) => Promise<ResolvedFormType[]>} listFormTypes
 * @property {(args: {region: string, slugOrId: string, version?: number}) => Promise<ResolvedFormType>} getFormType
 *
 * The global catalog, for superadmins:
 * @property {(args?: {includeDeprecated?: boolean}) => Promise<FormType[]>} listCatalog
 * @property {(id: string) => Promise<FormType>} getCatalogFormType
 * @property {(formType: Partial<FormType>) => Promise<FormType>} saveCatalogFormType
 * @property {(id: string, args?: {changeClass?: string, confirmBreaking?: boolean}) => Promise<FormTypeVersion>} publishCatalogFormType
 * @property {(id: string) => Promise<FormTypeVersion[]>} listVersions
 * @property {(id: string, version: number) => Promise<FormTypeVersion>} getVersion
 * @property {(id: string) => Promise<{regions: string[], submissionCounts: Object}>} getUsage
 * @property {(id: string) => Promise<void>} deleteCatalogFormType
 *
 * Per-region activation, for region admins:
 * @property {(region: string) => Promise<RegionFormType[]>} getRegionActivations
 * @property {(region: string, formTypeId: string, patch: Partial<RegionFormType>) => Promise<RegionFormType>} setRegionActivation
 *
 * Submissions:
 * @property {(args: {region: string, formTypeId?: string, ownerId?: string, status?: string}) => Promise<FormSubmission[]>} listSubmissions
 * @property {(args: {region: string, id: string, ownerId?: string}) => Promise<FormSubmission>} getSubmission
 * @property {(args: {region: string, formTypeId: string, data?: Object}) => Promise<FormSubmission>} createSubmission
 * @property {(args: {region: string, id: string, data: Object, status?: string}) => Promise<FormSubmission>} saveSubmission
 * @property {(args: {region: string, id: string, toVersion: number, dryRun?: boolean}) => Promise<Object>} upgradeSubmission
 * @property {(args: {region: string, id: string}) => Promise<void>} deleteSubmission
 */

/** Slugs must be URL-safe and stable — they appear in routes. */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const FORM_TYPE_KINDS = ["generic", "metadataRecord"];
export const FORM_TYPE_STATUSES = ["draft", "published", "deprecated"];
export const SUBMISSION_STATUSES = ["draft", "submitted"];

/**
 * Validates a catalog entry before it is written. Returns an array of problems;
 * empty means valid. Kept here rather than in the adapter so both the Firebase
 * and API paths reject the same things.
 */
export function validateFormTypeInput(formType) {
  const problems = [];

  if (!formType || typeof formType !== "object") {
    return ["form type must be an object"];
  }
  if (typeof formType.slug !== "string" || !SLUG_PATTERN.test(formType.slug)) {
    problems.push(
      "slug must be lowercase letters, digits, and single hyphens (e.g. edna-field)"
    );
  }
  if (!formType.title || typeof formType.title !== "object") {
    problems.push("title must be an object with en and fr");
  } else if (!formType.title.en && !formType.title.fr) {
    problems.push("title needs at least one language");
  }
  if (formType.kind && !FORM_TYPE_KINDS.includes(formType.kind)) {
    problems.push(`kind must be one of: ${FORM_TYPE_KINDS.join(", ")}`);
  }
  if (formType.jsonSchema && typeof formType.jsonSchema !== "object") {
    problems.push("jsonSchema must be an object");
  }
  if (formType.uiSchema && typeof formType.uiSchema !== "object") {
    problems.push("uiSchema must be an object");
  }

  return problems;
}
