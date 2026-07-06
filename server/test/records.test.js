const { randomUUID } = require("crypto");
const { buildTestApp, signToken, authHeader } = require("./helpers");
const { query, pool } = require("../src/db");

const REGION = "test";

describe("records API", () => {
  let app;
  let owner; // { token, email }
  let reviewer;
  let stranger;
  let sharedUser;

  async function makeIdentity(role) {
    const email = `${role || "user"}-${randomUUID()}@records.test`;
    const token = await signToken({ email, name: `${role} person` });
    if (role) {
      await query(
        "INSERT INTO region_permissions (region, email, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
        [REGION, email, role],
      );
    }
    return { token, email };
  }

  async function userIdFor(app_, identity) {
    // Hit /me so the user is provisioned, then read the id.
    const res = await app_.inject({
      method: "GET",
      url: "/api/v1/me",
      headers: authHeader(identity.token),
    });
    return res.json().userID;
  }

  beforeAll(async () => {
    app = await buildTestApp();
    owner = await makeIdentity(null);
    reviewer = await makeIdentity("reviewer");
    stranger = await makeIdentity(null);
    sharedUser = await makeIdentity(null);
  });

  afterAll(async () => {
    await query("DELETE FROM region_permissions WHERE email LIKE '%@records.test'");
    await query(
      "DELETE FROM records WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@records.test')",
    );
    await query("DELETE FROM users WHERE email LIKE '%@records.test'");
    await app.close();
  });

  async function createRecord(identity, body = {}) {
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/regions/${REGION}/records`,
      headers: authHeader(identity.token),
      payload: {
        title: { en: "Test dataset", fr: "Jeu de données" },
        language: "en",
        identifier: randomUUID(),
        ...body,
      },
    });
    expect(res.statusCode).toBe(201);
    return res.json();
  }

  test("create returns a Firebase-shaped record with '' draft status", async () => {
    const record = await createRecord(owner);
    expect(record.status).toBe("");
    expect(record.recordID).toBeTruthy();
    expect(record.title.en).toBe("Test dataset");
    // standardizeRecord defaults applied
    expect(record.eov).toEqual([]);
    expect(record.map).toEqual({ north: "", south: "", east: "", west: "", polygon: "" });
  });

  test("owner can update; stranger cannot; reviewer can", async () => {
    const record = await createRecord(owner);
    const url = `/api/v1/regions/${REGION}/records/${record.recordID}`;

    const ownerEdit = await app.inject({
      method: "PUT",
      url,
      headers: authHeader(owner.token),
      payload: { ...record, title: { en: "Edited", fr: "" } },
    });
    expect(ownerEdit.statusCode).toBe(200);
    expect(ownerEdit.json().title.en).toBe("Edited");

    const strangerEdit = await app.inject({
      method: "PUT",
      url,
      headers: authHeader(stranger.token),
      payload: { ...record, title: { en: "Hacked", fr: "" } },
    });
    expect(strangerEdit.statusCode).toBe(403);

    const reviewerEdit = await app.inject({
      method: "PUT",
      url,
      headers: authHeader(reviewer.token),
      payload: { ...record, title: { en: "Reviewed", fr: "" } },
    });
    expect(reviewerEdit.statusCode).toBe(200);
  });

  test("sharing grants write access", async () => {
    const record = await createRecord(owner);
    const sharedUserId = await userIdFor(app, sharedUser);
    const url = `/api/v1/regions/${REGION}/records/${record.recordID}`;

    const before = await app.inject({
      method: "PUT",
      url,
      headers: authHeader(sharedUser.token),
      payload: record,
    });
    expect(before.statusCode).toBe(403);

    const share = await app.inject({
      method: "PUT",
      url: `${url}/shares`,
      headers: authHeader(owner.token),
      payload: { userIds: [sharedUserId] },
    });
    expect(share.statusCode).toBe(200);

    const after = await app.inject({
      method: "PUT",
      url,
      headers: authHeader(sharedUser.token),
      payload: { ...record, title: { en: "Shared edit", fr: "" } },
    });
    expect(after.statusCode).toBe(200);

    const sharedList = await app.inject({
      method: "GET",
      url: `/api/v1/regions/${REGION}/records/shared-with-me`,
      headers: authHeader(sharedUser.token),
    });
    expect(sharedList.json().map((r) => r.recordID)).toContain(record.recordID);
  });

  test("submit sets status and backfills filename; publish is reviewer-only", async () => {
    const record = await createRecord(owner);
    const statusUrl = `/api/v1/regions/${REGION}/records/${record.recordID}/status`;

    const submit = await app.inject({
      method: "PUT",
      url: statusUrl,
      headers: authHeader(owner.token),
      payload: { status: "submitted" },
    });
    expect(submit.statusCode).toBe(200);
    expect(submit.json().status).toBe("submitted");
    expect(submit.json().filename).toMatch(/^test_dataset_/);

    const ownerPublish = await app.inject({
      method: "PUT",
      url: statusUrl,
      headers: authHeader(owner.token),
      payload: { status: "published" },
    });
    expect(ownerPublish.statusCode).toBe(403);

    const reviewerPublish = await app.inject({
      method: "PUT",
      url: statusUrl,
      headers: authHeader(reviewer.token),
      payload: { status: "published" },
    });
    expect(reviewerPublish.statusCode).toBe(200);
    expect(reviewerPublish.json().timeFirstPublished).toBeTruthy();

    // return to draft
    const demote = await app.inject({
      method: "PUT",
      url: statusUrl,
      headers: authHeader(owner.token),
      payload: { status: "" },
    });
    expect(demote.statusCode).toBe(200);
    expect(demote.json().status).toBe("");
  });

  test("clone resets identity fields into caller's records", async () => {
    const record = await createRecord(owner, { title: { en: "Original", fr: "Originale" } });
    const clone = await app.inject({
      method: "POST",
      url: `/api/v1/regions/${REGION}/records/${record.recordID}/clone`,
      headers: authHeader(stranger.token),
      payload: {},
    });
    expect(clone.statusCode).toBe(201);
    const cloned = clone.json();
    expect(cloned.title.en).toBe("Original (Copy)");
    expect(cloned.status).toBe("");
    expect(cloned.identifier).not.toBe(record.identifier);
    expect(cloned.recordID).not.toBe(record.recordID);

    const strangerId = await userIdFor(app, stranger);
    const list = await app.inject({
      method: "GET",
      url: `/api/v1/regions/${REGION}/records?ownerId=${strangerId}`,
      headers: authHeader(stranger.token),
    });
    expect(list.json().map((r) => r.recordID)).toContain(cloned.recordID);
  });

  test("transfer moves ownership by email", async () => {
    const record = await createRecord(owner);
    const transfer = await app.inject({
      method: "POST",
      url: `/api/v1/regions/${REGION}/records/${record.recordID}/transfer`,
      headers: authHeader(owner.token),
      payload: { email: stranger.email },
    });
    expect(transfer.statusCode).toBe(200);

    const got = await app.inject({
      method: "GET",
      url: `/api/v1/regions/${REGION}/records/${record.recordID}`,
      headers: authHeader(stranger.token),
    });
    expect(got.json().userinfo.email).toBe(stranger.email);
  });

  test("optimistic concurrency returns 409 on stale If-Unmodified-Since", async () => {
    const record = await createRecord(owner);
    const url = `/api/v1/regions/${REGION}/records/${record.recordID}`;

    const stale = await app.inject({
      method: "PUT",
      url,
      headers: {
        ...authHeader(owner.token),
        "if-unmodified-since": new Date(0).toISOString(),
      },
      payload: record,
    });
    expect(stale.statusCode).toBe(409);
  });

  test("status filter uses API shape (draft = empty string)", async () => {
    const record = await createRecord(owner);
    const list = await app.inject({
      method: "GET",
      url: `/api/v1/regions/${REGION}/records?ownerId=me&status=`,
      headers: authHeader(owner.token),
    });
    expect(list.statusCode).toBe(200);
    expect(list.json().map((r) => r.recordID)).toContain(record.recordID);
    expect(list.json().every((r) => r.status === "")).toBe(true);
  });
});

describe("saved entities API", () => {
  let app;
  let identity;
  let userId;

  beforeAll(async () => {
    app = await buildTestApp();
    const email = `entities-${randomUUID()}@records.test`;
    identity = { token: await signToken({ email }), email };
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/me",
      headers: authHeader(identity.token),
    });
    userId = res.json().userID;
  });

  afterAll(async () => {
    await query("DELETE FROM users WHERE email LIKE '%@records.test'");
    await app.close();
    await pool.end();
  });

  test("contact CRUD round-trip returns keyed objects", async () => {
    const base = `/api/v1/regions/${REGION}/users/${userId}/contacts`;
    const created = await app.inject({
      method: "POST",
      url: base,
      headers: authHeader(identity.token),
      payload: { givenNames: "Jane", lastName: "Doe", orgName: "CIOOS" },
    });
    expect(created.statusCode).toBe(201);
    const { id } = created.json();

    const list = await app.inject({ method: "GET", url: base, headers: authHeader(identity.token) });
    expect(list.json()[id].lastName).toBe("Doe");

    const updated = await app.inject({
      method: "PUT",
      url: `${base}/${id}`,
      headers: authHeader(identity.token),
      payload: { givenNames: "Janet", lastName: "Doe" },
    });
    expect(updated.statusCode).toBe(200);

    const del = await app.inject({
      method: "DELETE",
      url: `${base}/${id}`,
      headers: authHeader(identity.token),
    });
    expect(del.statusCode).toBe(200);

    const after = await app.inject({ method: "GET", url: base, headers: authHeader(identity.token) });
    expect(after.json()[id]).toBeUndefined();
  });
});
