import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Drives the real firebaseFormStore against an in-memory Realtime Database.
 *
 * The Firebase CLI's RTDB emulator needs a JVM, so instead of skipping this
 * layer entirely the `firebase/database` module is replaced with a tiny tree
 * that behaves the way RTDB does for the operations the store uses. What is
 * under test is the store's own logic — path construction, version
 * immutability, index maintenance, pinning — which is where the risk lives.
 */

/** The fake database tree, reset before each test. */
let tree;

function readPath(path) {
  return String(path)
    .split("/")
    .filter(Boolean)
    .reduce((node, key) => (node == null ? undefined : node[key]), tree);
}

function writePath(path, value) {
  const parts = String(path).split("/").filter(Boolean);
  const last = parts.pop();
  const parent = parts.reduce((node, key) => {
    if (node[key] === undefined || node[key] === null) node[key] = {};
    return node[key];
  }, tree);
  if (value === null) delete parent[last];
  else parent[last] = value;
}

let pushCounter = 0;

/**
 * Realtime Database has no array type and never stores null:
 *
 *   - an array is stored as an object keyed "0", "1", … and comes back that way
 *   - writing null deletes the key rather than storing it
 *
 * Emulating both is what lets this suite catch round-trip mangling of nested
 * structures. A fake that stores arrays as arrays hides the problem entirely,
 * which is exactly what happened here: a JSON Schema is full of nested arrays
 * (`required`, `enum`, `ui:steps`), and they came back as objects in production
 * while every test passed.
 */
function toRtdbShape(value) {
  if (Array.isArray(value)) {
    return value.reduce((acc, item, index) => {
      const converted = toRtdbShape(item);
      if (converted !== null && converted !== undefined) {
        acc[String(index)] = converted;
      }
      return acc;
    }, {});
  }
  if (value === null || typeof value !== "object") return value;
  return Object.entries(value).reduce((acc, [key, item]) => {
    if (item === null || item === undefined) return acc;
    acc[key] = toRtdbShape(item);
    return acc;
  }, {});
}

vi.mock("firebase/database", () => ({
  getDatabase: () => ({}),
  ref: (_db, path) => ({ path: path || "" }),
  get: async (reference) => {
    const value = readPath(reference.path);
    return {
      exists: () => value !== undefined && value !== null,
      val: () => (value === undefined ? null : value),
    };
  },
  set: async (reference, value) =>
    writePath(reference.path, value === null ? null : toRtdbShape(value)),
  update: async (reference, patch) => {
    const existing = readPath(reference.path) || {};
    const merged = { ...existing, ...patch };
    // A null in an update() deletes that key, matching RTDB.
    Object.entries(patch).forEach(([key, value]) => {
      if (value === null || value === undefined) delete merged[key];
    });
    writePath(reference.path, toRtdbShape(merged));
  },
  push: async (reference, value) => {
    pushCounter += 1;
    const key = `key${String(pushCounter).padStart(3, "0")}`;
    writePath(`${reference.path}/${key}`, toRtdbShape(value));
    return { key };
  },
  remove: async (reference) => writePath(reference.path, null),
  child: (reference, path) => ({ path: `${reference.path}/${path}` }),
  onValue: () => () => {},
}));

vi.mock("../../firebase", () => ({ default: {} }));

const store = await import("../store/firebaseFormStore");
const { default: ednaField } = await import("../catalog/edna-field.formtype.json");
const { default: ednaLab } = await import("../catalog/edna-lab.formtype.json");
const { seedFormCatalog } = await import("../catalog");

const REGION = "pacific";
const USER = "user-1";
const IDENTITY = { displayName: "A. Analyst", email: "analyst@cioos.ca" };

beforeEach(() => {
  tree = {};
  pushCounter = 0;
});

describe("global catalog", () => {
  it("writes form types outside any region", async () => {
    await store.saveCatalogFormType(ednaField);
    // The catalog must NOT live under a region key, or every region would need
    // its own copy and they would drift.
    expect(Object.keys(tree)).toEqual(["formTypes"]);
    expect(tree[REGION]).toBeUndefined();
  });

  it("refuses a duplicate slug", async () => {
    await store.saveCatalogFormType(ednaField);
    await expect(store.saveCatalogFormType(ednaField)).rejects.toThrow(
      /already exists/i
    );
  });

  it("refuses a form type with no fields", async () => {
    const empty = await store.saveCatalogFormType({
      slug: "empty",
      title: { en: "Empty", fr: "Vide" },
      jsonSchema: { type: "object", properties: {} },
    });
    await expect(store.publishCatalogFormType(empty.id)).rejects.toThrow(
      /no fields/i
    );
  });

  it("validates the slug format", async () => {
    await expect(
      store.saveCatalogFormType({ ...ednaField, slug: "Not A Slug" })
    ).rejects.toThrow(/slug/i);
  });
});

describe("publishing and version immutability", () => {
  it("starts unpublished at version 0", async () => {
    const saved = await store.saveCatalogFormType(ednaField);
    expect(saved.version).toBe(0);
    expect(await store.listVersions(saved.id)).toEqual([]);
  });

  it("freezes the schema on publish", async () => {
    const saved = await store.saveCatalogFormType(ednaField);
    const published = await store.publishCatalogFormType(saved.id);

    expect(published.version).toBe(1);
    const frozen = await store.getVersion(saved.id, 1);
    expect(Object.keys(frozen.jsonSchema.properties)).toContain("sampleId");
  });

  it("keeps the old version intact when the working copy changes", async () => {
    // This is the defect in the earlier prototype: it bumped the version while
    // overwriting the schema, so submissions pointed at versions nobody could
    // retrieve.
    const saved = await store.saveCatalogFormType(ednaField);
    await store.publishCatalogFormType(saved.id);

    await store.saveCatalogFormType({
      ...saved,
      id: saved.id,
      version: 1,
      jsonSchema: {
        type: "object",
        properties: { onlyField: { type: "string" } },
      },
    });

    const v1 = await store.getVersion(saved.id, 1);
    expect(Object.keys(v1.jsonSchema.properties)).toContain("sampleId");
    expect(Object.keys(v1.jsonSchema.properties)).not.toContain("onlyField");
  });

  it("requires confirmation for a breaking change", async () => {
    const saved = await store.saveCatalogFormType(ednaField);
    await store.publishCatalogFormType(saved.id);

    // Removing a property invalidates existing submissions.
    const narrowed = { ...ednaField.jsonSchema, properties: { sampleId: { type: "string" } } };
    await store.saveCatalogFormType({ ...saved, id: saved.id, version: 1, jsonSchema: narrowed });

    await expect(store.publishCatalogFormType(saved.id)).rejects.toThrow(
      /breaking/i
    );
    const forced = await store.publishCatalogFormType(saved.id, {
      confirmBreaking: true,
    });
    expect(forced.version).toBe(2);
  });

  it("publishes an additive change without confirmation", async () => {
    const saved = await store.saveCatalogFormType(ednaField);
    await store.publishCatalogFormType(saved.id);

    await store.saveCatalogFormType({
      ...saved,
      id: saved.id,
      version: 1,
      jsonSchema: {
        ...ednaField.jsonSchema,
        properties: {
          ...ednaField.jsonSchema.properties,
          newOptional: { type: "string" },
        },
      },
    });

    const published = await store.publishCatalogFormType(saved.id);
    expect(published.version).toBe(2);
    expect(published.changeClass).toBe("additive");
  });
});

describe("per-region activation", () => {
  it("offers nothing before a region enables anything", async () => {
    const saved = await store.saveCatalogFormType(ednaField);
    await store.publishCatalogFormType(saved.id);
    expect(await store.listFormTypes({ region: REGION })).toEqual([]);
  });

  it("offers a form type once the region enables it", async () => {
    const saved = await store.saveCatalogFormType(ednaField);
    await store.publishCatalogFormType(saved.id);
    await store.setRegionActivation(REGION, saved.id, { enabled: true });

    const available = await store.listFormTypes({ region: REGION });
    expect(available.map((f) => f.slug)).toEqual(["edna-field"]);
    expect(available[0].resolvedVersion).toBe(1);
  });

  it("keeps regions independent", async () => {
    const saved = await store.saveCatalogFormType(ednaField);
    await store.publishCatalogFormType(saved.id);
    await store.setRegionActivation(REGION, saved.id, { enabled: true });

    expect(await store.listFormTypes({ region: "atlantic" })).toEqual([]);
  });

  it("stores activation under the region's admin node", async () => {
    const saved = await store.saveCatalogFormType(ednaField);
    await store.setRegionActivation(REGION, saved.id, { enabled: true });
    expect(tree.admin[REGION].formTypes[saved.id].enabled).toBe(true);
  });

  it("serves a pinned version rather than the latest", async () => {
    const saved = await store.saveCatalogFormType(ednaField);
    await store.publishCatalogFormType(saved.id);
    await store.saveCatalogFormType({
      ...saved,
      id: saved.id,
      version: 1,
      jsonSchema: {
        ...ednaField.jsonSchema,
        properties: { ...ednaField.jsonSchema.properties, extra: { type: "string" } },
      },
    });
    await store.publishCatalogFormType(saved.id);

    await store.setRegionActivation(REGION, saved.id, {
      enabled: true,
      pinnedVersion: 1,
    });

    const [available] = await store.listFormTypes({ region: REGION });
    expect(available.resolvedVersion).toBe(1);
    expect(Object.keys(available.jsonSchema.properties)).not.toContain("extra");
  });

  it("applies a region title override without touching the catalog", async () => {
    const saved = await store.saveCatalogFormType(ednaField);
    await store.publishCatalogFormType(saved.id);
    await store.setRegionActivation(REGION, saved.id, {
      enabled: true,
      overrides: { title: { en: "CoastConnect Field Sheet" } },
    });

    const [available] = await store.listFormTypes({ region: REGION });
    expect(available.title.en).toBe("CoastConnect Field Sheet");
    expect(available.title.fr).toBe(ednaField.title.fr);

    const catalogEntry = await store.getCatalogFormType(saved.id);
    expect(catalogEntry.title.en).toBe("eDNA Field Metadata");
  });
});

describe("submissions", () => {
  async function enabledFormType(definition = ednaField) {
    const saved = await store.saveCatalogFormType(definition);
    await store.publishCatalogFormType(saved.id);
    await store.setRegionActivation(REGION, saved.id, { enabled: true });
    return saved;
  }

  it("refuses a submission for a form the region has not enabled", async () => {
    const saved = await store.saveCatalogFormType(ednaField);
    await store.publishCatalogFormType(saved.id);
    await expect(
      store.createSubmission({ region: REGION, formTypeId: saved.id, userID: USER })
    ).rejects.toThrow(/not enabled/i);
  });

  it("pins the version at creation", async () => {
    const formType = await enabledFormType();
    const created = await store.createSubmission({
      region: REGION,
      formTypeId: formType.id,
      userID: USER,
      data: { sampleId: "S1" },
      user: IDENTITY,
    });

    expect(created.formTypeVersion).toBe(1);
    expect(created.status).toBe("draft");
  });

  it("stores submissions under the owning user", async () => {
    const formType = await enabledFormType();
    const created = await store.createSubmission({
      region: REGION,
      formTypeId: formType.id,
      userID: USER,
    });
    expect(tree[REGION].users[USER].formSubmissions[created.id]).toBeDefined();
  });

  it("indexes a submission so it can be found across users", async () => {
    const formType = await enabledFormType();
    const created = await store.createSubmission({
      region: REGION,
      formTypeId: formType.id,
      userID: USER,
    });
    expect(
      tree[REGION].formSubmissionIndex[formType.id][created.id].userID
    ).toBe(USER);
  });

  it("finds a submission through the index without knowing the owner", async () => {
    const formType = await enabledFormType();
    const created = await store.createSubmission({
      region: REGION,
      formTypeId: formType.id,
      userID: USER,
      data: { sampleId: "S1" },
    });

    const found = await store.getSubmission({ region: REGION, id: created.id });
    expect(found.data.sampleId).toBe("S1");
  });

  it("saves data and records who edited it", async () => {
    const formType = await enabledFormType();
    const created = await store.createSubmission({
      region: REGION,
      formTypeId: formType.id,
      userID: USER,
    });

    const saved = await store.saveSubmission({
      region: REGION,
      id: created.id,
      userID: USER,
      data: { sampleId: "S1", siteName: "BI-04" },
      status: "submitted",
      user: IDENTITY,
    });

    expect(saved.status).toBe("submitted");
    expect(saved.data.siteName).toBe("BI-04");
    expect(saved.lastEditedBy.email).toBe(IDENTITY.email);
  });

  it("keeps the index status in step with the submission", async () => {
    const formType = await enabledFormType();
    const created = await store.createSubmission({
      region: REGION,
      formTypeId: formType.id,
      userID: USER,
    });
    await store.saveSubmission({
      region: REGION,
      id: created.id,
      userID: USER,
      data: {},
      status: "submitted",
    });

    expect(
      tree[REGION].formSubmissionIndex[formType.id][created.id].status
    ).toBe("submitted");
  });

  it("lists submissions for one form type only", async () => {
    const field = await enabledFormType(ednaField);
    const lab = await enabledFormType(ednaLab);

    await store.createSubmission({ region: REGION, formTypeId: field.id, userID: USER });
    await store.createSubmission({ region: REGION, formTypeId: lab.id, userID: USER });

    const fieldRows = await store.listSubmissions({
      region: REGION,
      formTypeId: field.id,
    });
    expect(fieldRows).toHaveLength(1);
    expect(fieldRows[0].formTypeId).toBe(field.id);
  });

  it("lists submissions across users for export", async () => {
    const formType = await enabledFormType();
    await store.createSubmission({ region: REGION, formTypeId: formType.id, userID: "user-a" });
    await store.createSubmission({ region: REGION, formTypeId: formType.id, userID: "user-b" });

    const all = await store.listSubmissions({ region: REGION, formTypeId: formType.id });
    expect(all).toHaveLength(2);
    expect(all.map((s) => s.userID).sort()).toEqual(["user-a", "user-b"]);
  });

  it("filters by status", async () => {
    const formType = await enabledFormType();
    const a = await store.createSubmission({ region: REGION, formTypeId: formType.id, userID: USER });
    await store.createSubmission({ region: REGION, formTypeId: formType.id, userID: USER });
    await store.saveSubmission({
      region: REGION,
      id: a.id,
      userID: USER,
      data: {},
      status: "submitted",
    });

    const submitted = await store.listSubmissions({
      region: REGION,
      formTypeId: formType.id,
      status: "submitted",
    });
    expect(submitted).toHaveLength(1);
  });

  it("removes the index entry when a submission is deleted", async () => {
    const formType = await enabledFormType();
    const created = await store.createSubmission({
      region: REGION,
      formTypeId: formType.id,
      userID: USER,
    });

    await store.deleteSubmission({ region: REGION, id: created.id, userID: USER });

    expect(
      tree[REGION].formSubmissionIndex[formType.id]?.[created.id]
    ).toBeUndefined();
    expect(await store.listSubmissions({ region: REGION })).toEqual([]);
  });

  it("renders an old submission against its own version, not the latest", async () => {
    const formType = await enabledFormType();
    const created = await store.createSubmission({
      region: REGION,
      formTypeId: formType.id,
      userID: USER,
      data: { sampleId: "S1" },
    });

    // Publish a second version with a different shape.
    await store.saveCatalogFormType({
      ...formType,
      id: formType.id,
      version: 1,
      jsonSchema: { type: "object", properties: { sampleId: { type: "string" } } },
    });
    await store.publishCatalogFormType(formType.id, { confirmBreaking: true });

    const asStored = await store.getFormType({
      region: REGION,
      slugOrId: formType.id,
      version: created.formTypeVersion,
    });
    expect(Object.keys(asStored.jsonSchema.properties)).toContain("siteName");
  });
});

describe("upgrading a draft", () => {
  it("reports what would change without touching the draft", async () => {
    const saved = await store.saveCatalogFormType(ednaField);
    await store.publishCatalogFormType(saved.id);
    await store.setRegionActivation(REGION, saved.id, { enabled: true });

    const created = await store.createSubmission({
      region: REGION,
      formTypeId: saved.id,
      userID: USER,
      data: { sampleId: "S1", tideState: "ebb" },
    });

    // Drop a field the draft has data in.
    const properties = { ...ednaField.jsonSchema.properties };
    delete properties.tideState;
    await store.saveCatalogFormType({
      ...saved,
      id: saved.id,
      version: 1,
      jsonSchema: { ...ednaField.jsonSchema, properties },
    });
    await store.publishCatalogFormType(saved.id, { confirmBreaking: true });

    const report = await store.upgradeSubmission({
      region: REGION,
      id: created.id,
      userID: USER,
      toVersion: 2,
      dryRun: true,
    });

    expect(report.compatible).toBe(false);
    expect(report.droppedPaths).toContain("tideState");

    // dryRun must not have moved the draft.
    const unchanged = await store.getSubmission({
      region: REGION,
      id: created.id,
      ownerId: USER,
    });
    expect(unchanged.formTypeVersion).toBe(1);
  });

  it("refuses to upgrade a submitted form", async () => {
    const saved = await store.saveCatalogFormType(ednaField);
    await store.publishCatalogFormType(saved.id);
    await store.setRegionActivation(REGION, saved.id, { enabled: true });
    const created = await store.createSubmission({
      region: REGION,
      formTypeId: saved.id,
      userID: USER,
    });
    await store.saveSubmission({
      region: REGION,
      id: created.id,
      userID: USER,
      data: {},
      status: "submitted",
    });

    await expect(
      store.upgradeSubmission({
        region: REGION,
        id: created.id,
        userID: USER,
        toVersion: 1,
      })
    ).rejects.toThrow(/draft/i);
  });
});

describe("seeding and usage", () => {
  it("creates the bundled form types once and is idempotent", async () => {
    const first = await seedFormCatalog(store);
    expect(first.created.sort()).toEqual(["edna-field", "edna-lab"]);

    const second = await seedFormCatalog(store);
    expect(second.created).toEqual([]);
    expect(second.skipped.sort()).toEqual(["edna-field", "edna-lab"]);
  });

  it("does not publish or enable what it seeds", async () => {
    await seedFormCatalog(store);
    const catalog = await store.listCatalog();
    expect(catalog.every((entry) => entry.version === 0)).toBe(true);
    expect(await store.listFormTypes({ region: REGION })).toEqual([]);
  });

  it("reports which regions use a form type", async () => {
    const saved = await store.saveCatalogFormType(ednaField);
    await store.publishCatalogFormType(saved.id);
    await store.setRegionActivation(REGION, saved.id, { enabled: true });
    await store.setRegionActivation("atlantic", saved.id, { enabled: false });
    await store.createSubmission({
      region: REGION,
      formTypeId: saved.id,
      userID: USER,
    });

    const usage = await store.getUsage(saved.id);
    expect(usage.regions).toEqual([REGION]);
    expect(usage.submissionCounts[REGION]).toBe(1);
  });

  it("refuses to delete a form type that has submissions", async () => {
    const saved = await store.saveCatalogFormType(ednaField);
    await store.publishCatalogFormType(saved.id);
    await store.setRegionActivation(REGION, saved.id, { enabled: true });
    await store.createSubmission({
      region: REGION,
      formTypeId: saved.id,
      userID: USER,
    });

    await expect(store.deleteCatalogFormType(saved.id)).rejects.toThrow(
      /Deprecate it instead/i
    );
  });

  it("hides a deprecated form type from the region list", async () => {
    const saved = await store.saveCatalogFormType(ednaField);
    await store.publishCatalogFormType(saved.id);
    await store.setRegionActivation(REGION, saved.id, { enabled: true });
    expect(await store.listFormTypes({ region: REGION })).toHaveLength(1);

    await store.deprecateCatalogFormType(saved.id);
    expect(await store.listFormTypes({ region: REGION })).toHaveLength(0);
  });
});

describe("schema round-tripping through RTDB", () => {
  /**
   * The bug these cover: RTDB has no array type, so `required`, every `enum`,
   * and `ui:steps` came back as objects keyed "0"/"1". Reading any form type
   * then threw "Cannot convert undefined or null to object", which made
   * everything form-related unusable.
   */
  it("returns nested arrays as arrays, not as 0/1-keyed objects", async () => {
    const saved = await store.saveCatalogFormType(ednaField);
    const reread = await store.getCatalogFormType(saved.id);

    expect(Array.isArray(reread.jsonSchema.required)).toBe(true);
    expect(reread.jsonSchema.required).toEqual(ednaField.jsonSchema.required);
    expect(Array.isArray(reread.jsonSchema.properties.weather.enum)).toBe(true);
    expect(Array.isArray(reread.uiSchema["ui:steps"])).toBe(true);
  });

  it("preserves a schema exactly, at every depth", async () => {
    const saved = await store.saveCatalogFormType(ednaField);
    const reread = await store.getCatalogFormType(saved.id);
    expect(reread.jsonSchema).toEqual(ednaField.jsonSchema);
    expect(reread.uiSchema).toEqual(ednaField.uiSchema);
  });

  it("preserves a schema through publish and back", async () => {
    const saved = await store.saveCatalogFormType(ednaField);
    await store.publishCatalogFormType(saved.id);
    const frozen = await store.getVersion(saved.id, 1);
    expect(frozen.jsonSchema).toEqual(ednaField.jsonSchema);
    expect(frozen.uiSchema).toEqual(ednaField.uiSchema);
  });

  it("returns schemas as objects from save, so a saved entry can be re-saved", async () => {
    // The editor spreads its loaded form type straight back into save on
    // publish. If save returned the serialized form, that round-trip failed
    // validation with "uiSchema must be an object".
    const saved = await store.saveCatalogFormType(ednaField);
    expect(typeof saved.jsonSchema).toBe("object");
    await expect(
      store.saveCatalogFormType({ ...saved, id: saved.id })
    ).resolves.toBeTruthy();
  });

  it("survives listCatalog as well as a direct read", async () => {
    await store.saveCatalogFormType(ednaField);
    const [entry] = await store.listCatalog();
    expect(Array.isArray(entry.jsonSchema.required)).toBe(true);
  });

  it("still reads rows written before schemas were serialized", async () => {
    // Already-seeded data is stored as nested objects. Reading it must deep-
    // restore arrays rather than requiring a manual reset.
    const saved = await store.saveCatalogFormType(ednaField);
    // Overwrite storage with the legacy nested form.
    tree.formTypes[saved.id].jsonSchema = toRtdbShape(ednaField.jsonSchema);
    tree.formTypes[saved.id].uiSchema = toRtdbShape(ednaField.uiSchema);

    const reread = await store.getCatalogFormType(saved.id);
    expect(reread.jsonSchema).toEqual(ednaField.jsonSchema);
    expect(Array.isArray(reread.uiSchema["ui:steps"])).toBe(true);
  });
});

describe("submission data round-tripping", () => {
  async function enabled() {
    const saved = await store.saveCatalogFormType(ednaField);
    await store.publishCatalogFormType(saved.id);
    await store.setRegionActivation(REGION, saved.id, { enabled: true });
    return saved;
  }

  const sample = {
    siteName: "BI-04",
    sampleId: "BI-04-S1",
    // The array is the point: RTDB would return this as {0:…,1:…}, which the
    // CSV export would then render as "[object Object]" or drop entirely.
    fieldTeam: ["A. Analyst", "B. Biologist"],
    fieldNotes: { en: "Calm", fr: "Calme" },
  };

  it("preserves an array field through create and read", async () => {
    const formType = await enabled();
    const created = await store.createSubmission({
      region: REGION,
      formTypeId: formType.id,
      userID: USER,
      data: sample,
    });

    const reread = await store.getSubmission({
      region: REGION,
      id: created.id,
      ownerId: USER,
    });
    expect(Array.isArray(reread.data.fieldTeam)).toBe(true);
    expect(reread.data).toEqual(sample);
  });

  it("preserves it through save as well", async () => {
    const formType = await enabled();
    const created = await store.createSubmission({
      region: REGION,
      formTypeId: formType.id,
      userID: USER,
    });
    await store.saveSubmission({
      region: REGION,
      id: created.id,
      userID: USER,
      data: sample,
      status: "submitted",
    });

    const reread = await store.getSubmission({
      region: REGION,
      id: created.id,
      ownerId: USER,
    });
    expect(reread.data).toEqual(sample);
  });

  it("preserves it when listed for export", async () => {
    const formType = await enabled();
    await store.createSubmission({
      region: REGION,
      formTypeId: formType.id,
      userID: USER,
      data: sample,
    });

    const [viaIndex] = await store.listSubmissions({
      region: REGION,
      formTypeId: formType.id,
    });
    expect(viaIndex.data).toEqual(sample);

    const [viaOwner] = await store.listSubmissions({
      region: REGION,
      ownerId: USER,
    });
    expect(viaOwner.data).toEqual(sample);
  });

  it("returns data as an object from create and save", async () => {
    const formType = await enabled();
    const created = await store.createSubmission({
      region: REGION,
      formTypeId: formType.id,
      userID: USER,
      data: sample,
    });
    expect(created.data).toEqual(sample);

    const saved = await store.saveSubmission({
      region: REGION,
      id: created.id,
      userID: USER,
      data: sample,
    });
    expect(saved.data).toEqual(sample);
  });
});

describe("catalog permissions", () => {
  it("lets an administrator of any region manage the catalog", async () => {
    tree.admin = {
      pacific: { permissions: { admins: "pacific-admin@cioos.ca" } },
      atlantic: { permissions: { admins: "atlantic-admin@cioos.ca" } },
    };

    // Either region's admin may edit the shared catalog — cross-region impact is
    // limited by the publish-time guardrails, not by a separate role.
    expect(await store.canManageCatalog("pacific-admin@cioos.ca")).toBe(true);
    expect(await store.canManageCatalog("atlantic-admin@cioos.ca")).toBe(true);
  });

  it("refuses someone who administers no region", async () => {
    tree.admin = { pacific: { permissions: { admins: "admin@cioos.ca" } } };
    expect(await store.canManageCatalog("member@cioos.ca")).toBe(false);
  });

  it("refuses a missing email", async () => {
    tree.admin = { pacific: { permissions: { admins: "admin@cioos.ca" } } };
    expect(await store.canManageCatalog(undefined)).toBe(false);
    expect(await store.canManageCatalog("")).toBe(false);
  });

  it("refuses everyone when no region has admins", async () => {
    tree.admin = {};
    expect(await store.canManageCatalog("admin@cioos.ca")).toBe(false);
  });

  it("ignores a reviewer who is not an admin", async () => {
    tree.admin = {
      pacific: {
        permissions: {
          admins: "admin@cioos.ca",
          reviewers: "reviewer@cioos.ca",
        },
      },
    };
    expect(await store.canManageCatalog("reviewer@cioos.ca")).toBe(false);
  });
});

describe("cross-region impact reporting", () => {
  it("names every region that enabled a form type, with counts", async () => {
    // This is what replaced the superadmin role: publishing shows who else
    // depends on the form type before you commit.
    const saved = await store.saveCatalogFormType(ednaField);
    await store.publishCatalogFormType(saved.id);

    await store.setRegionActivation("pacific", saved.id, { enabled: true });
    await store.setRegionActivation("atlantic", saved.id, { enabled: true });
    await store.setRegionActivation("canwin", saved.id, { enabled: false });

    await store.createSubmission({
      region: "pacific",
      formTypeId: saved.id,
      userID: USER,
    });
    await store.createSubmission({
      region: "atlantic",
      formTypeId: saved.id,
      userID: "user-b",
    });
    await store.createSubmission({
      region: "atlantic",
      formTypeId: saved.id,
      userID: "user-c",
    });

    const usage = await store.getUsage(saved.id);
    expect(usage.regions.sort()).toEqual(["atlantic", "pacific"]);
    expect(usage.submissionCounts.pacific).toBe(1);
    expect(usage.submissionCounts.atlantic).toBe(2);
  });

  it("reports no regions for an unused form type", async () => {
    const saved = await store.saveCatalogFormType(ednaField);
    const usage = await store.getUsage(saved.id);
    expect(usage.regions).toEqual([]);
  });
});
