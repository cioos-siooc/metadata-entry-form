const { randomUUID } = require("crypto");
const { buildTestApp, signToken, authHeader } = require("./helpers");
const { query, pool } = require("../src/db");

const REGION = "test";

const SCHEMA = {
  type: "object",
  properties: {
    name: { type: "string", minLength: 1 },
    depth: { type: "number" },
  },
  required: ["name", "depth"],
};

describe("form submissions API", () => {
  let app;
  let admin;
  let reviewer;
  let owner;
  let stranger;
  let formType;

  async function makeIdentity(role) {
    const email = `${role || "user"}-${randomUUID()}@formsubs.test`;
    const token = await signToken({ email, name: `${role} person` });
    if (role) {
      await query(
        "INSERT INTO region_permissions (region, email, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
        [REGION, email, role],
      );
    }
    return { token, email };
  }

  async function createDraft(identity, data = {}) {
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/regions/${REGION}/form-types/${formType.id}/submissions`,
      headers: authHeader(identity.token),
      payload: { data },
    });
    return res;
  }

  beforeAll(async () => {
    app = await buildTestApp();
    admin = await makeIdentity("admin");
    reviewer = await makeIdentity("reviewer");
    owner = await makeIdentity(null);
    stranger = await makeIdentity(null);

    const created = await app.inject({
      method: "POST",
      url: `/api/v1/regions/${REGION}/form-types`,
      headers: authHeader(admin.token),
      payload: {
        slug: `subs-${randomUUID().slice(0, 8)}`,
        title: { en: "Dive log", fr: "Journal de plongée" },
        jsonSchema: SCHEMA,
      },
    });
    formType = created.json();
  });

  afterAll(async () => {
    await query("DELETE FROM form_submissions WHERE form_type_id = $1", [formType.id]);
    await query("DELETE FROM form_types WHERE id = $1", [formType.id]);
    await query("DELETE FROM region_permissions WHERE email LIKE '%@formsubs.test'");
    await query("DELETE FROM users WHERE email LIKE '%@formsubs.test'");
    await app.close();
    await pool.end();
  });

  test("drafts save without validation; submit validates against the schema", async () => {
    const draft = await createDraft(owner, { name: "" }); // invalid vs schema, fine as draft
    expect(draft.statusCode).toBe(201);
    const submission = draft.json();
    expect(submission.status).toBe("draft");
    expect(submission.formTypeVersion).toBe(formType.version);

    const badSubmit = await app.inject({
      method: "PUT",
      url: `/api/v1/regions/${REGION}/form-submissions/${submission.id}`,
      headers: authHeader(owner.token),
      payload: { data: { name: "" }, status: "submitted" },
    });
    expect(badSubmit.statusCode).toBe(422);
    const { validationErrors } = badSubmit.json();
    expect(validationErrors.length).toBeGreaterThan(0);
    expect(validationErrors.some((e) => e.instancePath === "/name" || e.message.includes("depth"))).toBe(true);

    const goodSubmit = await app.inject({
      method: "PUT",
      url: `/api/v1/regions/${REGION}/form-submissions/${submission.id}`,
      headers: authHeader(owner.token),
      payload: { data: { name: "Dive 1", depth: 12.5 }, status: "submitted" },
    });
    expect(goodSubmit.statusCode).toBe(200);
    expect(goodSubmit.json().status).toBe("submitted");

    // return to draft is allowed
    const reopen = await app.inject({
      method: "PUT",
      url: `/api/v1/regions/${REGION}/form-submissions/${submission.id}`,
      headers: authHeader(owner.token),
      payload: { status: "draft" },
    });
    expect(reopen.statusCode).toBe(200);
    expect(reopen.json().status).toBe("draft");
  });

  test("access: owner and reviewer can read/write, stranger cannot", async () => {
    const submission = (await createDraft(owner, { name: "mine" })).json();
    const url = `/api/v1/regions/${REGION}/form-submissions/${submission.id}`;

    const strangerGet = await app.inject({ method: "GET", url, headers: authHeader(stranger.token) });
    expect(strangerGet.statusCode).toBe(403);

    const strangerPut = await app.inject({
      method: "PUT",
      url,
      headers: authHeader(stranger.token),
      payload: { data: { name: "hijack" } },
    });
    expect(strangerPut.statusCode).toBe(403);

    const reviewerGet = await app.inject({ method: "GET", url, headers: authHeader(reviewer.token) });
    expect(reviewerGet.statusCode).toBe(200);

    const ownerGet = await app.inject({ method: "GET", url, headers: authHeader(owner.token) });
    expect(ownerGet.statusCode).toBe(200);
  });

  test("listing: members are forced to their own; reviewers see all", async () => {
    await createDraft(owner, { name: "owner draft" });
    await createDraft(stranger, { name: "stranger draft" });

    const listUrl = `/api/v1/regions/${REGION}/form-types/${formType.id}/submissions`;

    const ownerList = await app.inject({
      method: "GET",
      // ownerId is ignored for non-elevated callers
      url: `${listUrl}?ownerId=${randomUUID()}`,
      headers: authHeader(owner.token),
    });
    const ownerEmails = ownerList.json().map((s) => s.userinfo.email);
    expect(ownerEmails.every((e) => e === owner.email)).toBe(true);
    expect(ownerEmails.length).toBeGreaterThan(0);

    const reviewerList = await app.inject({
      method: "GET",
      url: listUrl,
      headers: authHeader(reviewer.token),
    });
    const reviewerEmails = reviewerList.json().map((s) => s.userinfo.email);
    expect(reviewerEmails).toContain(owner.email);
    expect(reviewerEmails).toContain(stranger.email);
  });

  test("mine: joined with form type title across the region", async () => {
    const mine = await app.inject({
      method: "GET",
      url: `/api/v1/regions/${REGION}/form-submissions/mine`,
      headers: authHeader(owner.token),
    });
    expect(mine.statusCode).toBe(200);
    const rows = mine.json();
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0].formType.title.en).toBe("Dive log");
  });

  test("delete: owner can delete own submission", async () => {
    const submission = (await createDraft(owner)).json();
    const url = `/api/v1/regions/${REGION}/form-submissions/${submission.id}`;

    const denied = await app.inject({ method: "DELETE", url, headers: authHeader(stranger.token) });
    expect(denied.statusCode).toBe(403);

    const deleted = await app.inject({ method: "DELETE", url, headers: authHeader(owner.token) });
    expect(deleted.statusCode).toBe(200);

    const gone = await app.inject({ method: "GET", url, headers: authHeader(owner.token) });
    expect(gone.statusCode).toBe(404);
  });

  test("draft against a disabled or unknown form type 404s", async () => {
    const missing = await app.inject({
      method: "POST",
      url: `/api/v1/regions/${REGION}/form-types/${randomUUID()}/submissions`,
      headers: authHeader(owner.token),
      payload: { data: {} },
    });
    expect(missing.statusCode).toBe(404);
  });
});
