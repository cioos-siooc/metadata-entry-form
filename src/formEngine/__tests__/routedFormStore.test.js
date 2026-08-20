import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The router decides which tree a user's work is written to, so getting it wrong
 * means a record saved where nothing else can find it.
 */

vi.mock("firebase/database", async () =>
  (await import("./helpers/fakeRtdb")).fakeDatabaseModule);
vi.mock("../../firebase", () => ({ default: {} }));

const { resetDatabase, databaseTree } = await import("./helpers/fakeRtdb");
const { default: store } = await import("../store/routedFormStore");
const { METADATA_RECORD_SLUG } = await import("../metadataRecordForm");
const { default: ednaField } = await import("../catalog/edna-field.formtype.json");
const catalogStore = await import("../store/firebaseFormStore");

const REGION = "pacific";
const USER = "user-1";
const IDENTITY = { displayName: "A", email: "a@cioos.ca" };

beforeEach(resetDatabase);

/** Publishes and enables a generic form type so submissions can be made. */
async function enableGenericForm() {
  const saved = await catalogStore.saveCatalogFormType(ednaField);
  await catalogStore.publishCatalogFormType(saved.id, { confirmBreaking: true });
  await catalogStore.setRegionActivation(REGION, saved.id, { enabled: true });
  return saved;
}

describe("the record form type", () => {
  it("is available without being seeded or enabled anywhere", async () => {
    // The record IS the app. It must not fail closed on a missing database row.
    const formType = await store.getFormType({
      region: REGION,
      slugOrId: METADATA_RECORD_SLUG,
    });

    expect(formType.kind).toBe("metadataRecord");
    expect(formType.enabled).toBe(true);
    expect(databaseTree().formTypes).toBeUndefined();
  });

  it("has no pinned version, because its schema is generated", async () => {
    const formType = await store.getFormType({
      region: REGION,
      slugOrId: METADATA_RECORD_SLUG,
    });
    expect(formType.resolvedVersion).toBeNull();
  });

  it("is listed first, ahead of the stored catalog", async () => {
    await enableGenericForm();
    const list = await store.listFormTypes({ region: REGION });
    expect(list[0].slug).toBe(METADATA_RECORD_SLUG);
    expect(list.length).toBeGreaterThan(1);
  });
});

describe("routing submissions", () => {
  it("sends a record to the record tree", async () => {
    await store.createSubmission({
      region: REGION,
      formTypeId: METADATA_RECORD_SLUG,
      userID: USER,
      data: { title: { en: "A record", fr: "" } },
      user: IDENTITY,
    });

    const user = databaseTree()[REGION].users[USER];
    expect(Object.keys(user.records)).toHaveLength(1);
    expect(user.formSubmissions).toBeUndefined();
  });

  it("sends a generic submission to the formSubmissions tree", async () => {
    const saved = await enableGenericForm();

    await store.createSubmission({
      region: REGION,
      formTypeId: saved.id,
      userID: USER,
      data: { siteName: "BI-04" },
      user: IDENTITY,
    });

    const user = databaseTree()[REGION].users[USER];
    expect(Object.keys(user.formSubmissions)).toHaveLength(1);
    expect(user.records).toBeUndefined();
  });

  it("finds a record by id alone, with no form type named", async () => {
    const created = await store.createSubmission({
      region: REGION,
      formTypeId: METADATA_RECORD_SLUG,
      userID: USER,
      data: { title: { en: "findable", fr: "" } },
      user: IDENTITY,
    });

    const found = await store.getSubmission({
      region: REGION,
      id: created.id,
      ownerId: USER,
    });
    expect(found.data.title.en).toBe("findable");
    expect(found.formTypeId).toBe(METADATA_RECORD_SLUG);
  });

  it("finds a generic submission by id alone", async () => {
    const saved = await enableGenericForm();
    const created = await store.createSubmission({
      region: REGION,
      formTypeId: saved.id,
      userID: USER,
      data: { siteName: "BI-04" },
      user: IDENTITY,
    });

    const found = await store.getSubmission({
      region: REGION,
      id: created.id,
      ownerId: USER,
    });
    expect(found.formTypeId).toBe(saved.id);
  });

  it("lists both kinds together when no form type is named", async () => {
    const saved = await enableGenericForm();
    await store.createSubmission({
      region: REGION,
      formTypeId: METADATA_RECORD_SLUG,
      userID: USER,
      data: { title: { en: "a record", fr: "" } },
      user: IDENTITY,
    });
    await store.createSubmission({
      region: REGION,
      formTypeId: saved.id,
      userID: USER,
      data: { siteName: "BI-04" },
      user: IDENTITY,
    });

    const rows = await store.listSubmissions({ region: REGION, ownerId: USER });
    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.formTypeId).sort()).toEqual(
      [METADATA_RECORD_SLUG, saved.id].sort()
    );
  });

  it("returns null rather than guessing for an id in neither tree", async () => {
    expect(
      await store.getSubmission({ region: REGION, id: "nope", ownerId: USER })
    ).toBeNull();
  });
});
