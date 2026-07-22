const { randomUUID } = require("crypto");
const { buildTestApp, signToken, authHeader } = require("./helpers");
const { query, pool } = require("../src/db");

const REGION = "test";

const SIMPLE_SCHEMA = {
  type: "object",
  properties: {
    name: { type: "string" },
    count: { type: "integer" },
  },
  required: ["name"],
};

describe("form types API", () => {
  let app;
  let admin;
  let member;

  async function makeIdentity(role) {
    const email = `${role || "user"}-${randomUUID()}@formtypes.test`;
    const token = await signToken({ email, name: `${role} person` });
    if (role) {
      await query(
        "INSERT INTO region_permissions (region, email, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
        [REGION, email, role],
      );
    }
    return { token, email };
  }

  async function createType(payload = {}) {
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/regions/${REGION}/form-types`,
      headers: authHeader(admin.token),
      payload: {
        slug: `type-${randomUUID().slice(0, 8)}`,
        title: { en: "Cruise report", fr: "Rapport de croisière" },
        jsonSchema: SIMPLE_SCHEMA,
        uiSchema: { name: { "ui:autofocus": true } },
        ...payload,
      },
    });
    return res;
  }

  beforeAll(async () => {
    app = await buildTestApp();
    admin = await makeIdentity("admin");
    member = await makeIdentity(null);
  });

  afterAll(async () => {
    await query(
      `DELETE FROM form_submissions WHERE form_type_id IN
       (SELECT id FROM form_types WHERE created_by IN (SELECT id FROM users WHERE email LIKE '%@formtypes.test'))`,
    );
    await query(
      "DELETE FROM form_types WHERE created_by IN (SELECT id FROM users WHERE email LIKE '%@formtypes.test')",
    );
    await query("DELETE FROM region_permissions WHERE email LIKE '%@formtypes.test'");
    await query("DELETE FROM users WHERE email LIKE '%@formtypes.test'");
    await app.close();
    await pool.end();
  });

  test("admin creates a form type; member can read it", async () => {
    const created = await createType();
    expect(created.statusCode).toBe(201);
    const type = created.json();
    expect(type.version).toBe(1);
    expect(type.jsonSchema).toEqual(SIMPLE_SCHEMA);

    const get = await app.inject({
      method: "GET",
      url: `/api/v1/regions/${REGION}/form-types/${type.id}`,
      headers: authHeader(member.token),
    });
    expect(get.statusCode).toBe(200);
    expect(get.json().slug).toBe(type.slug);

    const list = await app.inject({
      method: "GET",
      url: `/api/v1/regions/${REGION}/form-types`,
      headers: authHeader(member.token),
    });
    expect(list.json().map((t) => t.id)).toContain(type.id);
  });

  test("writes are admin-only", async () => {
    const denied = await app.inject({
      method: "POST",
      url: `/api/v1/regions/${REGION}/form-types`,
      headers: authHeader(member.token),
      payload: { slug: "nope", title: { en: "x" }, jsonSchema: SIMPLE_SCHEMA },
    });
    expect(denied.statusCode).toBe(403);
  });

  test("uncompilable schema and duplicate slug are rejected", async () => {
    const bad = await createType({ jsonSchema: { type: "nope" } });
    expect(bad.statusCode).toBe(422);
    expect(bad.json().error).toMatch(/does not compile/);

    const slug = `dup-${randomUUID().slice(0, 8)}`;
    const first = await createType({ slug });
    expect(first.statusCode).toBe(201);
    const dup = await createType({ slug });
    expect(dup.statusCode).toBe(409);
  });

  test("schema edits bump version; metadata edits do not", async () => {
    const type = (await createType()).json();

    const metaEdit = await app.inject({
      method: "PUT",
      url: `/api/v1/regions/${REGION}/form-types/${type.id}`,
      headers: authHeader(admin.token),
      payload: { title: { en: "Renamed", fr: "Renommé" } },
    });
    expect(metaEdit.statusCode).toBe(200);
    expect(metaEdit.json().version).toBe(1);
    expect(metaEdit.json().title.en).toBe("Renamed");

    const schemaEdit = await app.inject({
      method: "PUT",
      url: `/api/v1/regions/${REGION}/form-types/${type.id}`,
      headers: authHeader(admin.token),
      payload: { jsonSchema: { ...SIMPLE_SCHEMA, required: [] } },
    });
    expect(schemaEdit.json().version).toBe(2);
  });

  test("disabled types are hidden from members but admins see them with includeDisabled", async () => {
    const type = (await createType({ enabled: false })).json();

    const memberList = await app.inject({
      method: "GET",
      url: `/api/v1/regions/${REGION}/form-types`,
      headers: authHeader(member.token),
    });
    expect(memberList.json().map((t) => t.id)).not.toContain(type.id);

    const memberGet = await app.inject({
      method: "GET",
      url: `/api/v1/regions/${REGION}/form-types/${type.id}`,
      headers: authHeader(member.token),
    });
    expect(memberGet.statusCode).toBe(404);

    const adminList = await app.inject({
      method: "GET",
      url: `/api/v1/regions/${REGION}/form-types?includeDisabled=1`,
      headers: authHeader(admin.token),
    });
    expect(adminList.json().map((t) => t.id)).toContain(type.id);
  });

  test("delete: blocked while submissions exist, allowed when unreferenced", async () => {
    const type = (await createType()).json();

    const submission = await app.inject({
      method: "POST",
      url: `/api/v1/regions/${REGION}/form-types/${type.id}/submissions`,
      headers: authHeader(member.token),
      payload: { data: { name: "partial" } },
    });
    expect(submission.statusCode).toBe(201);

    const blocked = await app.inject({
      method: "DELETE",
      url: `/api/v1/regions/${REGION}/form-types/${type.id}`,
      headers: authHeader(admin.token),
    });
    expect(blocked.statusCode).toBe(409);

    await query("DELETE FROM form_submissions WHERE form_type_id = $1", [type.id]);
    const deleted = await app.inject({
      method: "DELETE",
      url: `/api/v1/regions/${REGION}/form-types/${type.id}`,
      headers: authHeader(admin.token),
    });
    expect(deleted.statusCode).toBe(200);
  });
});
