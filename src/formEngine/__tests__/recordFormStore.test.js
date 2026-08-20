import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * recordFormStore against an in-memory Realtime Database.
 *
 * What matters here is that the record tree is left exactly as everything else
 * expects it. firebase-functions' RTDB triggers, firebase_to_xml and
 * cioos-records-update all read `/{region}/users/{uid}/records/{id}` directly,
 * so a record written through the form engine has to be indistinguishable from
 * one written by the hand-built form.
 */

vi.mock("firebase/database", async () =>
  (await import("./helpers/fakeRtdb")).fakeDatabaseModule);
vi.mock("../../firebase", () => ({ default: {} }));

const { resetDatabase, databaseTree } = await import("./helpers/fakeRtdb");
const store = await import("../store/recordFormStore");
const { METADATA_RECORD_SLUG } = await import("../metadataRecordForm");

const REGION = "pacific";
const USER = "user-1";
const IDENTITY = { displayName: "A. Analyst", email: "analyst@cioos.ca" };

const records = () => databaseTree()[REGION]?.users?.[USER]?.records || {};

beforeEach(resetDatabase);

describe("status mapping", () => {
  it("maps a record's empty status to draft, and back", () => {
    expect(store.toSubmissionStatus("")).toBe("draft");
    expect(store.toSubmissionStatus(undefined)).toBe("draft");
    expect(store.toRecordStatus("draft")).toBe("");
    expect(store.toRecordStatus(undefined)).toBe("");
  });

  it("passes the real record statuses straight through", () => {
    ["submitted", "published"].forEach((status) => {
      expect(store.toSubmissionStatus(status)).toBe(status);
      expect(store.toRecordStatus(status)).toBe(status);
    });
  });
});

describe("createSubmission", () => {
  it("writes into the record tree, not formSubmissions", async () => {
    await store.createSubmission({
      region: REGION,
      userID: USER,
      data: { title: { en: "A record", fr: "Un enregistrement" } },
      user: IDENTITY,
    });

    expect(Object.keys(records())).toHaveLength(1);
    expect(databaseTree()[REGION].users[USER].formSubmissions).toBeUndefined();
    // No cross-user index either: records are listed by walking the region.
    expect(databaseTree()[REGION].formSubmissionIndex).toBeUndefined();
  });

  it("stores the record at the top of the row, not as a JSON string", async () => {
    const created = await store.createSubmission({
      region: REGION,
      userID: USER,
      data: { title: { en: "A record", fr: "" } },
      user: IDENTITY,
    });

    const row = records()[created.id];
    // Everything downstream reads record.title, not JSON.parse(row.data).
    expect(row.title.en).toBe("A record");
    expect(row.data).toBeUndefined();
  });

  it("starts a new record as a draft, which on disk is an empty status", async () => {
    const created = await store.createSubmission({
      region: REGION,
      userID: USER,
      data: {},
      user: IDENTITY,
    });

    expect(created.status).toBe("draft");
    // RTDB drops empty-string writes in this fake exactly as it stores them;
    // either way the record must not claim to be submitted.
    expect(records()[created.id].status ?? "").toBe("");
  });

  it("stamps region, userID, recordID and the editor", async () => {
    const created = await store.createSubmission({
      region: REGION,
      userID: USER,
      data: {},
      user: IDENTITY,
    });

    const row = records()[created.id];
    expect(row.region).toBe(REGION);
    expect(row.userID).toBe(USER);
    expect(row.recordID).toBe(created.id);
    expect(row.lastEditedBy.email).toBe(IDENTITY.email);
  });
});

describe("round trip", () => {
  it("returns what it stored, including nested arrays", async () => {
    const data = {
      title: { en: "Salish Sea moorings", fr: "Mouillages de la mer des Salish" },
      contacts: [
        { orgName: "UVic", role: ["custodian", "owner"], inCitation: true },
        { orgName: "DFO", role: ["distributor"], inCitation: false },
      ],
      eov: ["oxygen", "seaSurfaceTemperature"],
      map: { north: "50.1", south: "48.2", east: "-122.9", west: "-125.4" },
    };

    const created = await store.createSubmission({
      region: REGION,
      userID: USER,
      data,
      user: IDENTITY,
    });
    const read = await store.getSubmission({
      region: REGION,
      id: created.id,
      ownerId: USER,
    });

    // RTDB stores arrays as objects keyed "0","1"; firebaseToJSObject undoes it.
    // If that ever regresses, contacts comes back as {0: …} and the form breaks.
    expect(Array.isArray(read.data.contacts)).toBe(true);
    expect(read.data.contacts[0].role).toEqual(["custodian", "owner"]);
    expect(read.data.eov).toEqual(["oxygen", "seaSurfaceTemperature"]);
    expect(read.data.title).toEqual(data.title);
    // Bbox values are STRINGS in the database and must stay that way.
    expect(read.data.map.north).toBe("50.1");
  });

  it("presents a record as a FormSubmission the engine understands", async () => {
    const created = await store.createSubmission({
      region: REGION,
      userID: USER,
      data: { title: { en: "x", fr: "" } },
      user: IDENTITY,
    });
    const read = await store.getSubmission({
      region: REGION,
      id: created.id,
      ownerId: USER,
    });

    expect(read.formTypeId).toBe(METADATA_RECORD_SLUG);
    // Always today's generated schema — there is no version to pin to.
    expect(read.formTypeVersion).toBeNull();
    expect(read.userID).toBe(USER);
    expect(read.region).toBe(REGION);
  });

  it("returns null for a record that does not exist", async () => {
    const read = await store.getSubmission({
      region: REGION,
      id: "nope",
      ownerId: USER,
    });
    expect(read).toBeNull();
  });
});

describe("saveSubmission", () => {
  it("promotes a draft to submitted using the record's own encoding", async () => {
    const created = await store.createSubmission({
      region: REGION,
      userID: USER,
      data: { title: { en: "x", fr: "y" }, language: "en" },
      user: IDENTITY,
    });

    await store.saveSubmission({
      region: REGION,
      id: created.id,
      userID: USER,
      data: { ...created.data, title: { en: "x", fr: "y" }, language: "en" },
      status: "submitted",
      user: IDENTITY,
    });

    expect(records()[created.id].status).toBe("submitted");
  });

  it("stamps timeFirstPublished only the first time", async () => {
    const created = await store.createSubmission({
      region: REGION,
      userID: USER,
      data: { title: { en: "x", fr: "" }, language: "en" },
      user: IDENTITY,
    });

    const save = (data) =>
      store.saveSubmission({
        region: REGION,
        id: created.id,
        userID: USER,
        data,
        status: "published",
        user: IDENTITY,
      });

    const first = await save({ ...created.data, language: "en" });
    const stamped = records()[created.id].timeFirstPublished;
    expect(stamped).toBeTruthy();

    await save(first.data);
    expect(records()[created.id].timeFirstPublished).toBe(stamped);
  });

  it("derives a filename when the record has none", async () => {
    const created = await store.createSubmission({
      region: REGION,
      userID: USER,
      data: { title: { en: "Salish Sea", fr: "" }, language: "en" },
      user: IDENTITY,
    });

    await store.saveSubmission({
      region: REGION,
      id: created.id,
      userID: USER,
      data: { ...created.data, title: { en: "Salish Sea", fr: "" }, language: "en" },
      user: IDENTITY,
    });

    expect(records()[created.id].filename).toBeTruthy();
  });

  it("keeps keys the schema never declared", async () => {
    const created = await store.createSubmission({
      region: REGION,
      userID: USER,
      data: { title: { en: "x", fr: "" }, someForgottenKey: "keep me" },
      user: IDENTITY,
    });

    await store.saveSubmission({
      region: REGION,
      id: created.id,
      userID: USER,
      data: { ...created.data },
      user: IDENTITY,
    });

    expect(records()[created.id].someForgottenKey).toBe("keep me");
  });
});

describe("listSubmissions", () => {
  it("lists a user's records, newest shape included", async () => {
    await store.createSubmission({
      region: REGION,
      userID: USER,
      data: { title: { en: "one", fr: "" } },
      user: IDENTITY,
    });
    await store.createSubmission({
      region: REGION,
      userID: USER,
      data: { title: { en: "two", fr: "" } },
      user: IDENTITY,
    });

    const rows = await store.listSubmissions({ region: REGION, ownerId: USER });
    expect(rows).toHaveLength(2);
    expect(rows.every((r) => r.status === "draft")).toBe(true);
  });

  it("filters by submission status, not record status", async () => {
    const created = await store.createSubmission({
      region: REGION,
      userID: USER,
      data: { title: { en: "one", fr: "" }, language: "en" },
      user: IDENTITY,
    });
    await store.saveSubmission({
      region: REGION,
      id: created.id,
      userID: USER,
      data: created.data,
      status: "submitted",
      user: IDENTITY,
    });

    expect(
      await store.listSubmissions({ region: REGION, ownerId: USER, status: "draft" })
    ).toHaveLength(0);
    expect(
      await store.listSubmissions({
        region: REGION,
        ownerId: USER,
        status: "submitted",
      })
    ).toHaveLength(1);
  });

  it("refuses a region-wide listing rather than walking every user", async () => {
    await expect(store.listSubmissions({ region: REGION })).rejects.toThrow(
      /owner/i
    );
  });

  it("returns nothing for a user with no records", async () => {
    expect(await store.listSubmissions({ region: REGION, ownerId: "nobody" })).toEqual(
      []
    );
  });
});

describe("deleteSubmission", () => {
  it("removes the record", async () => {
    const created = await store.createSubmission({
      region: REGION,
      userID: USER,
      data: { title: { en: "x", fr: "" } },
      user: IDENTITY,
    });

    await store.deleteSubmission({ region: REGION, id: created.id, userID: USER });
    expect(records()[created.id]).toBeUndefined();
  });
});
