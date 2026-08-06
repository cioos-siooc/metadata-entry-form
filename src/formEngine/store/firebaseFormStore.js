/**
 * Firebase Realtime Database implementation of the FormStore contract.
 *
 * Paths:
 *   /formTypes/{id}                            GLOBAL catalog (no region segment)
 *   /formTypes/{id}/versions/{n}               immutable published snapshots
 *   /admin/{region}/formTypes/{id}             activation + overrides
 *   /{region}/users/{uid}/formSubmissions/{id} submissions
 *   /{region}/formSubmissionIndex/{ftId}/{id}  {uid, status, updatedAt}
 *
 * Submissions live under `{region}/users/{uid}/` deliberately: the existing
 * rules already grant read at `$region` to any authenticated user and write at
 * `$region/users/$userid` to the owner and to reviewers, so submissions inherit
 * the record access model with no new rule surface.
 *
 * The index exists because RTDB cannot query across users. Listing every
 * submission for a form type — which is what the export needs — would otherwise
 * mean reading every user's subtree.
 *
 * This module returns RAW rows. Merging a region's overrides onto a catalog
 * entry is @shared/formEngine/resolveFormType's job, so the Firebase and API
 * adapters cannot disagree about what a region sees.
 */

import {
  getDatabase,
  ref,
  get,
  set,
  update,
  push,
  remove,
} from "firebase/database";

import firebase from "../../firebase";
import regions from "../../regions";
import {
  resolveFormType,
  resolveCatalogForRegion,
  schemaDiff,
  schemaHash,
  validateFormTypeInput,
  BREAKING,
} from "@shared/formEngine";

const CATALOG_PATH = "formTypes";

const db = () => getDatabase(firebase);

/** RTDB returns objects keyed by id; normalize to an array carrying the id. */
function toArray(snapshotValue, idKey = "id") {
  if (!snapshotValue) return [];
  return Object.entries(snapshotValue).map(([id, value]) => ({
    ...restoreArrays(value),
    [idKey]: id,
  }));
}

/**
 * Firebase's permission errors name no path — "PERMISSION_DENIED: Permission
 * denied" and nothing else — which makes a denial nearly impossible to diagnose
 * from the UI. These wrappers attach the operation and path.
 */
function describeFailure(operation, path, error) {
  const denied =
    /permission_denied|permission denied/i.test(error?.message || "") ||
    error?.code === "PERMISSION_DENIED";
  const wrapped = new Error(
    denied
      ? `Permission denied ${operation} /${path}. ` +
        `You may not have the required role, or the database rules may be out of ` +
        `date — redeploy them with: firebase deploy --only database`
      : `Failed ${operation} /${path}: ${error?.message || error}`
  );
  wrapped.cause = error;
  wrapped.path = path;
  wrapped.denied = denied;
  return wrapped;
}

async function readValue(path) {
  try {
    const snapshot = await get(ref(db(), path));
    return snapshot.exists() ? snapshot.val() : null;
  } catch (error) {
    throw describeFailure("reading", path, error);
  }
}

async function writeValue(path, value) {
  try {
    await set(ref(db(), path), value);
  } catch (error) {
    throw describeFailure("writing", path, error);
  }
}

async function updateValue(path, patch) {
  try {
    await update(ref(db(), path), patch);
  } catch (error) {
    throw describeFailure("updating", path, error);
  }
}

async function pushValue(path, value) {
  try {
    return await push(ref(db(), path), value);
  } catch (error) {
    throw describeFailure("creating under", path, error);
  }
}

async function removeValue(path) {
  try {
    await remove(ref(db(), path));
  } catch (error) {
    throw describeFailure("deleting", path, error);
  }
}

const now = () => new Date().toISOString();

/* ------------------------------------------------------------------ *
 * Schema serialization
 * ------------------------------------------------------------------ */

/**
 * JSON Schema and UI Schema are stored as JSON STRINGS rather than as nested
 * objects.
 *
 * Realtime Database has no array type: it stores an array as an object keyed
 * "0", "1", … and returns it that way. A JSON Schema is full of nested arrays —
 * `required`, every `enum`, `ui:steps` — and `firebaseToJSObject` only restores
 * arrays at the TOP level of a record, so everything deeper came back mangled.
 * Downstream that surfaced as "Cannot convert undefined or null to object" and
 * as `new Set(...)` on a non-iterable.
 *
 * Serializing sidesteps the whole class of problem: a string round-trips
 * unchanged, at any depth, forever. The cost is that schemas are not queryable
 * in the database, which we never needed — they are always read whole.
 */
function serializeSchema(value) {
  return JSON.stringify(value ?? {});
}

/**
 * Reads a schema back, accepting either form.
 *
 * The object branch exists for rows written before this change: it deep-restores
 * arrays from RTDB's "0"/"1" keying so already-seeded form types keep working
 * instead of needing a manual reset.
 */
function deserializeSchema(value) {
  if (value === undefined || value === null) return {};
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  }
  return restoreArrays(value);
}

/**
 * Recursively turns RTDB's array-shaped objects back into arrays.
 *
 * An object is treated as an array when its keys are exactly "0".."n-1" — the
 * shape RTDB produces. Unlike misc.js's objectToArray this recurses through
 * every level and never dereferences null.
 */
export function restoreArrays(value) {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(restoreArrays);

  const keys = Object.keys(value);
  const looksLikeArray =
    keys.length > 0 &&
    keys.every((key, index) => key === String(index));

  if (looksLikeArray) {
    return keys.map((key) => restoreArrays(value[key]));
  }

  return Object.entries(value).reduce((acc, [key, item]) => {
    acc[key] = restoreArrays(item);
    return acc;
  }, {});
}

/* ------------------------------------------------------------------ *
 * Catalog permissions
 * ------------------------------------------------------------------ */

/**
 * True when this user administers ANY region.
 *
 * The form type catalog is shared, so it is managed by region administrators
 * collectively rather than by a separate role. The `.write` rule on /formTypes
 * enumerates the same check server-side; this mirrors it so the UI does not
 * offer actions the server will reject.
 *
 * Cross-region impact is limited by the app's guardrails rather than by
 * restricting who can edit: versions are immutable, a breaking change has to be
 * confirmed against the list of affected regions, and a form type that has
 * submissions can only be deprecated, never deleted.
 */
export async function canManageCatalog(email) {
  if (!email) return false;

  // Read each region's admin list individually. Reading the bare "admin" node
  // is DENIED: the rules only grant .read at admin/$region, and only to that
  // region's reviewers — there is no rule at /admin itself.
  const lists = await Promise.all(
    Object.keys(regions).map((region) =>
      readValue(`admin/${region}/permissions/admins`)
    )
  );

  return lists.some(
    (admins) => typeof admins === "string" && admins.includes(email)
  );
}

/* ------------------------------------------------------------------ *
 * Global catalog
 * ------------------------------------------------------------------ */

export async function listCatalog({ includeDeprecated = false } = {}) {
  const raw = await readValue(CATALOG_PATH);
  return toArray(raw)
    .map(({ versions: _versions, ...formType }) => ({
      ...formType,
      jsonSchema: deserializeSchema(formType.jsonSchema),
      uiSchema: deserializeSchema(formType.uiSchema),
    }))
    .filter((f) => includeDeprecated || f.status !== "deprecated")
    .sort((a, b) => String(a.slug).localeCompare(String(b.slug)));
}

export async function getCatalogFormType(id) {
  const raw = await readValue(`${CATALOG_PATH}/${id}`);
  if (!raw) return null;
  const formType = { ...raw };
  // The versions subtree is fetched separately by listVersions; carrying it on
  // every catalog read would mean shipping every schema ever published.
  delete formType.versions;
  return {
    ...formType,
    jsonSchema: deserializeSchema(raw.jsonSchema),
    uiSchema: deserializeSchema(raw.uiSchema),
    id,
  };
}

export async function listVersions(id) {
  const raw = await readValue(`${CATALOG_PATH}/${id}/versions`);
  if (!raw) return [];
  return Object.entries(raw)
    .map(([version, value]) => ({
      ...value,
      jsonSchema: deserializeSchema(value.jsonSchema),
      uiSchema: deserializeSchema(value.uiSchema),
      formTypeId: id,
      version: Number(version),
    }))
    .sort((a, b) => b.version - a.version);
}

export async function getVersion(id, version) {
  const raw = await readValue(`${CATALOG_PATH}/${id}/versions/${version}`);
  if (!raw) return null;
  return {
    ...raw,
    jsonSchema: deserializeSchema(raw.jsonSchema),
    uiSchema: deserializeSchema(raw.uiSchema),
    formTypeId: id,
    version: Number(version),
  };
}

/**
 * Creates or updates the WORKING COPY. Editing a catalog entry affects nobody
 * until it is published — that is what makes version pinning meaningful.
 */
export async function saveCatalogFormType(formType) {
  const problems = validateFormTypeInput(formType);
  if (problems.length) throw new Error(problems.join("; "));

  const timestamp = now();
  const payload = {
    slug: formType.slug,
    kind: formType.kind || "generic",
    title: formType.title,
    description: formType.description || { en: "", fr: "" },
    jsonSchema: serializeSchema(
      formType.jsonSchema || { type: "object", properties: {} }
    ),
    uiSchema: serializeSchema(formType.uiSchema || {}),
    status: formType.status || "draft",
    version: formType.version || 0,
    updatedAt: timestamp,
  };

  // Returned in the same shape the caller passed in — schemas as objects, not
  // as the serialized strings that go into storage.
  const asObjects = {
    jsonSchema: deserializeSchema(payload.jsonSchema),
    uiSchema: deserializeSchema(payload.uiSchema),
  };

  if (formType.id) {
    const existing = await getCatalogFormType(formType.id);
    if (!existing) throw new Error(`Form type ${formType.id} not found`);
    if (existing.slug !== payload.slug) {
      await assertSlugAvailable(payload.slug, formType.id);
    }
    await updateValue(`${CATALOG_PATH}/${formType.id}`, payload);
    return { ...existing, ...payload, ...asObjects, id: formType.id };
  }

  await assertSlugAvailable(payload.slug);
  const created = {
    ...payload,
    createdAt: timestamp,
    createdBy: formType.createdBy || null,
  };
  const pushed = await pushValue(CATALOG_PATH, created);
  return { ...created, ...asObjects, id: pushed.key };
}

async function assertSlugAvailable(slug, exceptId) {
  const catalog = await listCatalog({ includeDeprecated: true });
  const clash = catalog.find((f) => f.slug === slug && f.id !== exceptId);
  if (clash) {
    throw new Error(
      `A form type with the slug "${slug}" already exists. Slugs are global.`
    );
  }
}

/**
 * Freezes the working copy as the next version.
 *
 * Versions are immutable and append-only. The prototype this replaces bumped
 * `version` while overwriting `json_schema`, which destroyed the schema the old
 * version referred to and left submissions pointing at a version nobody could
 * retrieve.
 *
 * A breaking change requires `confirmBreaking`, so publishing one is always a
 * deliberate act.
 */
export async function publishCatalogFormType(
  id,
  { confirmBreaking = false, publishedBy = null } = {}
) {
  const formType = await getCatalogFormType(id);
  if (!formType) throw new Error(`Form type ${id} not found`);

  const properties = formType.jsonSchema?.properties;
  if (!properties || Object.keys(properties).length === 0) {
    throw new Error("Cannot publish a form type with no fields");
  }

  const nextVersion = (formType.version || 0) + 1;
  const previous =
    formType.version > 0 ? await getVersion(id, formType.version) : null;

  const diff = schemaDiff(previous?.jsonSchema, formType.jsonSchema);
  if (previous && diff.changeClass === BREAKING && !confirmBreaking) {
    const error = new Error(
      "This change is breaking: existing submissions may no longer validate."
    );
    error.changeClass = BREAKING;
    error.changes = diff.changes;
    throw error;
  }

  const versionRow = {
    jsonSchema: serializeSchema(formType.jsonSchema),
    uiSchema: serializeSchema(formType.uiSchema || {}),
    schemaHash: schemaHash(formType.jsonSchema),
    changeClass: previous ? diff.changeClass : "initial",
    publishedAt: now(),
    publishedBy,
  };

  await writeValue(`${CATALOG_PATH}/${id}/versions/${nextVersion}`, versionRow);
  await updateValue(`${CATALOG_PATH}/${id}`, {
    version: nextVersion,
    status: "published",
    schemaHash: versionRow.schemaHash,
    updatedAt: versionRow.publishedAt,
  });

  return {
    ...versionRow,
    jsonSchema: deserializeSchema(versionRow.jsonSchema),
    uiSchema: deserializeSchema(versionRow.uiSchema),
    formTypeId: id,
    version: nextVersion,
  };
}

/** Which regions have enabled a form type, and how many submissions exist. */
export async function getUsage(id) {
  // Per-region reads, for the same reason as canManageCatalog: /admin as a whole
  // is not readable. admin/{region}/formTypes carries an explicit .read override
  // so any authenticated user can discover activations.
  const activations = await Promise.all(
    Object.keys(regions).map(async (region) => [
      region,
      await readValue(`admin/${region}/formTypes/${id}/enabled`),
    ])
  );

  const enabledIn = activations
    .filter(([, enabled]) => enabled === true)
    .map(([region]) => region);

  const submissionCounts = {};
  await Promise.all(
    enabledIn.map(async (region) => {
      const index = await readValue(`${region}/formSubmissionIndex/${id}`);
      submissionCounts[region] = index ? Object.keys(index).length : 0;
    })
  );

  return { regions: enabledIn, submissionCounts };
}

/**
 * Deprecating hides a form type from "start new" while keeping every existing
 * submission renderable. Hard deletion is refused while submissions exist.
 */
export async function deprecateCatalogFormType(id) {
  await updateValue(`${CATALOG_PATH}/${id}`, {
    status: "deprecated",
    updatedAt: now(),
  });
}

export async function deleteCatalogFormType(id) {
  const usage = await getUsage(id);
  const total = Object.values(usage.submissionCounts).reduce((a, b) => a + b, 0);
  if (total > 0) {
    throw new Error(
      `Cannot delete: ${total} submission(s) exist. Deprecate it instead so they stay readable.`
    );
  }
  await removeValue(`${CATALOG_PATH}/${id}`);
}

/* ------------------------------------------------------------------ *
 * Per-region activation
 * ------------------------------------------------------------------ */

export async function getRegionActivations(region) {
  const raw = await readValue(`admin/${region}/formTypes`);
  if (!raw) return {};
  return Object.entries(raw).reduce((acc, [formTypeId, value]) => {
    acc[formTypeId] = {
      formTypeId,
      region,
      enabled: Boolean(value?.enabled),
      sortOrder: value?.sortOrder ?? 0,
      pinnedVersion: value?.pinnedVersion ?? null,
      overrides: restoreArrays(value?.overrides) || {},
      updatedAt: value?.updatedAt,
      updatedBy: value?.updatedBy,
    };
    return acc;
  }, {});
}

export async function setRegionActivation(region, formTypeId, patch) {
  const path = `admin/${region}/formTypes/${formTypeId}`;
  const existing = (await readValue(path)) || {};

  // Firebase rejects undefined; null is how a value is cleared.
  const payload = {
    enabled: patch.enabled ?? existing.enabled ?? false,
    sortOrder: patch.sortOrder ?? existing.sortOrder ?? 0,
    pinnedVersion:
      patch.pinnedVersion === undefined
        ? existing.pinnedVersion ?? null
        : patch.pinnedVersion,
    overrides: patch.overrides ?? existing.overrides ?? {},
    updatedAt: now(),
    updatedBy: patch.updatedBy ?? null,
  };

  await writeValue(path, payload);
  return { ...payload, region, formTypeId };
}

/* ------------------------------------------------------------------ *
 * Region-facing reads
 * ------------------------------------------------------------------ */

/**
 * What a region's members can fill in. `includeDisabled` additionally returns
 * catalog entries the region has NOT enabled, so an admin can see the full menu.
 */
export async function listFormTypes({ region, includeDisabled = false }) {
  const [catalog, activations] = await Promise.all([
    listCatalog({ includeDeprecated: includeDisabled }),
    getRegionActivations(region),
  ]);

  const needed = catalog
    .map((formType) => {
      const activation = activations[formType.id];
      const version = activation?.pinnedVersion || formType.version;
      return version > 0 ? { id: formType.id, version } : null;
    })
    .filter(Boolean);

  const versionRows = await Promise.all(
    needed.map(async ({ id, version }) => [
      `${id}:${version}`,
      await getVersion(id, version),
    ])
  );

  return resolveCatalogForRegion(
    catalog,
    activations,
    Object.fromEntries(versionRows.filter(([, row]) => row)),
    { includeDisabled }
  );
}

/**
 * Resolves one form type for a region. `version` forces a specific frozen
 * version — which is how a submission always renders against its own snapshot.
 */
export async function getFormType({ region, slugOrId, version }) {
  const catalog = await listCatalog({ includeDeprecated: true });
  const formType =
    catalog.find((f) => f.id === slugOrId) ||
    catalog.find((f) => f.slug === slugOrId);
  if (!formType) return null;

  const activations = await getRegionActivations(region);
  const activation = activations[formType.id];
  const wanted = version || activation?.pinnedVersion || formType.version;
  const versionRow = wanted > 0 ? await getVersion(formType.id, wanted) : null;

  return resolveFormType(formType, activation, versionRow);
}

/* ------------------------------------------------------------------ *
 * Submissions
 * ------------------------------------------------------------------ */

/**
 * Submission rows carry `data` as a JSON string, for the same reason schemas do:
 * form data contains arrays (a field team, any multi-select) and RTDB would
 * return them as 0/1-keyed objects, silently corrupting both the form and the
 * export. Everything else on the row stays queryable.
 */
function readSubmission(raw, id) {
  if (!raw) return null;
  return {
    ...restoreArrays(raw),
    data: deserializeSchema(raw.data),
    id,
  };
}

function submissionPath(region, userID, id) {
  return `${region}/users/${userID}/formSubmissions${id ? `/${id}` : ""}`;
}

export async function listSubmissions({
  region,
  formTypeId,
  ownerId,
  status,
} = {}) {
  let rows = [];

  if (ownerId) {
    const owned = (await readValue(submissionPath(region, ownerId))) || {};
    rows = Object.entries(owned).map(([id, value]) => readSubmission(value, id));
  } else {
    // Cross-user listing goes through the index, then fetches each row. RTDB
    // has no join, and reading every user's subtree would not scale.
    const index = formTypeId
      ? { [formTypeId]: await readValue(`${region}/formSubmissionIndex/${formTypeId}`) }
      : (await readValue(`${region}/formSubmissionIndex`)) || {};

    const entries = Object.entries(index).flatMap(([ftId, submissions]) =>
      Object.entries(submissions || {}).map(([id, meta]) => ({
        id,
        formTypeId: ftId,
        userID: meta?.userID,
      }))
    );

    rows = (
      await Promise.all(
        entries.map(async ({ id, userID }) => {
          if (!userID) return null;
          const raw = await readValue(submissionPath(region, userID, id));
          return readSubmission(raw, id);
        })
      )
    ).filter(Boolean);
  }

  return rows
    .filter((row) => !formTypeId || row.formTypeId === formTypeId)
    .filter((row) => !status || row.status === status)
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
}

export async function getSubmission({ region, id, ownerId }) {
  if (ownerId) {
    const raw = await readValue(submissionPath(region, ownerId, id));
    return readSubmission(raw, id);
  }

  // Without an owner we have to find them via the index.
  const index = (await readValue(`${region}/formSubmissionIndex`)) || {};
  const owner = Object.values(index)
    .flatMap((submissions) => Object.entries(submissions || {}))
    .find(([submissionId]) => submissionId === id)?.[1]?.userID;
  if (!owner) return null;

  const raw = await readValue(submissionPath(region, owner, id));
  return readSubmission(raw, id);
}

/**
 * Creates a submission, pinning the form-type version it renders against.
 *
 * Called on the first SAVE, not when a user clicks into a form — otherwise
 * every curious click leaves an empty draft behind.
 */
export async function createSubmission({
  region,
  formTypeId,
  userID,
  data = {},
  user,
}) {
  const formType = await getFormType({ region, slugOrId: formTypeId });
  if (!formType) throw new Error(`Form type ${formTypeId} not found`);
  if (!formType.enabled) {
    throw new Error("This form is not enabled for this region");
  }
  if (!formType.resolvedVersion) {
    throw new Error("This form has no published version yet");
  }

  const timestamp = now();
  const payload = {
    formTypeId: formType.id,
    formTypeVersion: formType.resolvedVersion,
    formTypeSchemaHash: formType.schemaHash || null,
    region,
    userID,
    status: "draft",
    data: serializeSchema(data),
    createdAt: timestamp,
    updatedAt: timestamp,
    lastEditedBy: user ? { displayName: user.displayName, email: user.email } : null,
  };

  const pushed = await pushValue(submissionPath(region, userID), payload);
  await writeValue(
    `${region}/formSubmissionIndex/${formType.id}/${pushed.key}`,
    { userID, status: "draft", updatedAt: timestamp }
  );

  return { ...payload, data, id: pushed.key };
}

export async function saveSubmission({
  region,
  id,
  userID,
  data,
  status,
  user,
}) {
  const existing = await getSubmission({ region, id, ownerId: userID });
  if (!existing) throw new Error(`Submission ${id} not found`);

  const timestamp = now();
  const patch = {
    data: serializeSchema(data ?? existing.data ?? {}),
    updatedAt: timestamp,
    lastEditedBy: user ? { displayName: user.displayName, email: user.email } : null,
  };
  if (status) patch.status = status;

  await updateValue(submissionPath(region, userID, id), patch);
  await updateValue(
    `${region}/formSubmissionIndex/${existing.formTypeId}/${id}`,
    { userID, status: status || existing.status, updatedAt: timestamp }
  );

  return { ...existing, ...patch, data: deserializeSchema(patch.data), id };
}

export async function deleteSubmission({ region, id, userID }) {
  const existing = await getSubmission({ region, id, ownerId: userID });
  await removeValue(submissionPath(region, userID, id));
  if (existing?.formTypeId) {
    await removeValue(`${region}/formSubmissionIndex/${existing.formTypeId}/${id}`);
  }
}

/**
 * Re-points a draft at a newer form-type version.
 *
 * Always user-initiated, and `dryRun` reports what would happen first. Data is
 * never auto-migrated: silently rewriting someone's answers to fit a new schema
 * is the failure mode this whole versioning scheme exists to prevent.
 */
export async function upgradeSubmission({
  region,
  id,
  userID,
  toVersion,
  dryRun = false,
}) {
  const submission = await getSubmission({ region, id, ownerId: userID });
  if (!submission) throw new Error(`Submission ${id} not found`);
  if (submission.status !== "draft") {
    throw new Error("Only drafts can be upgraded");
  }

  const target = await getVersion(submission.formTypeId, toVersion);
  if (!target) throw new Error(`Version ${toVersion} not found`);

  const current = await getVersion(
    submission.formTypeId,
    submission.formTypeVersion
  );
  const diff = schemaDiff(current?.jsonSchema, target.jsonSchema);

  // Fields the new schema no longer declares. The values stay in the stored
  // JSON, but the form stops showing them and the export stops emitting them.
  const before = Object.keys(current?.jsonSchema?.properties || {});
  const after = new Set(Object.keys(target.jsonSchema?.properties || {}));
  const droppedPaths = before
    .filter((key) => !after.has(key))
    .filter((key) => submission.data?.[key] !== undefined);

  const report = {
    from: submission.formTypeVersion,
    to: toVersion,
    changeClass: diff.changeClass,
    changes: diff.changes,
    droppedPaths,
    compatible: diff.changeClass !== BREAKING && droppedPaths.length === 0,
  };

  if (dryRun) return report;

  await updateValue(submissionPath(region, userID, id), {
    formTypeVersion: toVersion,
    formTypeSchemaHash: target.schemaHash,
    updatedAt: now(),
  });

  return report;
}

export const firebaseFormStore = {
  listFormTypes,
  getFormType,
  listCatalog,
  getCatalogFormType,
  saveCatalogFormType,
  publishCatalogFormType,
  listVersions,
  getVersion,
  getUsage,
  deprecateCatalogFormType,
  deleteCatalogFormType,
  getRegionActivations,
  setRegionActivation,
  listSubmissions,
  getSubmission,
  createSubmission,
  saveSubmission,
  deleteSubmission,
  upgradeSubmission,
  canManageCatalog,
};

export default firebaseFormStore;
