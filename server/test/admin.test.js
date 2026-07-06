const { randomUUID } = require("crypto");
const { buildTestApp, signToken, authHeader, envSuperadmin } = require("./helpers");
const { query, pool } = require("../src/db");
const { encryptSecret, decryptSecret } = require("../src/lib/crypto");

// Use a region the records tests don't touch, and clean permissions so the
// bootstrap path is testable.
const REGION = "canwin";

describe("crypto", () => {
  test("encrypt/decrypt round-trip", () => {
    const secret = "datacite-hash-abc123==";
    const enc = encryptSecret(secret);
    expect(enc.length).toBeGreaterThan(28);
    expect(decryptSecret(enc)).toBe(secret);
    // unique IV per encryption
    expect(encryptSecret(secret).equals(enc)).toBe(false);
  });
});

describe("admin API", () => {
  let app;
  let admin;
  let user;
  let superadmin;

  beforeAll(async () => {
    app = await buildTestApp();
    await query("DELETE FROM region_permissions WHERE region = $1", [REGION]);
    await query("DELETE FROM region_credentials WHERE region = $1", [REGION]);
    admin = { email: `admin-${randomUUID()}@admin.test` };
    admin.token = await signToken({ email: admin.email });
    user = { email: `user-${randomUUID()}@admin.test` };
    user.token = await signToken({ email: user.email });
    superadmin = await envSuperadmin();
  });

  afterAll(async () => {
    await query("DELETE FROM region_permissions WHERE region = $1", [REGION]);
    await query("DELETE FROM region_credentials WHERE region = $1", [REGION]);
    await query("DELETE FROM region_projects WHERE region = $1", [REGION]);
    await query("DELETE FROM users WHERE email LIKE '%@admin.test'");
    await app.close();
    await pool.end();
  });

  test("permissions are admin-only; superadmin seeds a region's first admins", async () => {
    const url = `/api/v1/regions/${REGION}/admin/permissions`;

    // no bootstrap: an empty region rejects writes from regular users
    const takeoverAttempt = await app.inject({
      method: "PUT",
      url,
      headers: authHeader(user.token),
      payload: { admins: [user.email], reviewers: [] },
    });
    expect(takeoverAttempt.statusCode).toBe(403);

    const seed = await app.inject({
      method: "PUT",
      url,
      headers: authHeader(superadmin.token),
      payload: { admins: [admin.email], reviewers: [] },
    });
    expect(seed.statusCode).toBe(200);

    const takeover = await app.inject({
      method: "PUT",
      url,
      headers: authHeader(user.token),
      payload: { admins: [user.email], reviewers: [] },
    });
    expect(takeover.statusCode).toBe(403);

    const adminUpdate = await app.inject({
      method: "PUT",
      url,
      headers: authHeader(admin.token),
      payload: { admins: [admin.email], reviewers: [user.email] },
    });
    expect(adminUpdate.statusCode).toBe(200);

    const get = await app.inject({ method: "GET", url, headers: authHeader(user.token) });
    expect(get.json()).toEqual({ admins: [admin.email], reviewers: [user.email] });
  });

  test("datacite credentials: write-only secret, presence flag, prefix exposed via /me", async () => {
    const url = `/api/v1/regions/${REGION}/admin/datacite-credentials`;

    const denied = await app.inject({
      method: "PUT",
      url,
      headers: authHeader(user.token),
      payload: { prefix: "10.9999", dataciteHash: "nope" },
    });
    expect(denied.statusCode).toBe(403);

    const put = await app.inject({
      method: "PUT",
      url,
      headers: authHeader(admin.token),
      payload: { prefix: "10.9999", apiDomain: "api.test.datacite.org", dataciteHash: "c2VjcmV0" },
    });
    expect(put.statusCode).toBe(200);

    const get = await app.inject({ method: "GET", url, headers: authHeader(admin.token) });
    expect(get.json()).toEqual({
      prefix: "10.9999",
      apiDomain: "api.test.datacite.org",
      hasCredentials: true,
    });
    expect(get.body).not.toContain("c2VjcmV0");

    // hash is encrypted at rest
    const row = await query(
      "SELECT secret_enc FROM region_credentials WHERE region = $1 AND kind = 'datacite'",
      [REGION],
    );
    expect(row.rows[0].secret_enc.toString()).not.toContain("c2VjcmV0");
    expect(decryptSecret(row.rows[0].secret_enc)).toBe("c2VjcmV0");

    const me = await app.inject({
      method: "GET",
      url: `/api/v1/regions/${REGION}/me`,
      headers: authHeader(user.token),
    });
    expect(me.json().datacitePrefix).toBe("10.9999");
  });

  test("github credentials: token kept when omitted on update, masked on read", async () => {
    const url = `/api/v1/regions/${REGION}/admin/github-credentials`;

    const put = await app.inject({
      method: "PUT",
      url,
      headers: authHeader(admin.token),
      payload: { owner: "cioos-siooc", repo: "forms", branch: "main", token: "ghp_secret123" },
    });
    expect(put.statusCode).toBe(200);

    // reviewer can read config (needed to publish), token masked
    const get = await app.inject({ method: "GET", url, headers: authHeader(user.token) });
    expect(get.statusCode).toBe(200);
    expect(get.json()).toMatchObject({ owner: "cioos-siooc", repo: "forms", hasToken: true });
    expect(get.body).not.toContain("ghp_secret123");

    const updateNoToken = await app.inject({
      method: "PUT",
      url,
      headers: authHeader(admin.token),
      payload: { owner: "cioos-siooc", repo: "forms2", branch: "dev" },
    });
    expect(updateNoToken.statusCode).toBe(200);

    const row = await query(
      "SELECT secret_enc, config FROM region_credentials WHERE region = $1 AND kind = 'github'",
      [REGION],
    );
    expect(decryptSecret(row.rows[0].secret_enc)).toBe("ghp_secret123");
    expect(row.rows[0].config.repo).toBe("forms2");
  });

  test("projects: reviewer can write, members read via /projects", async () => {
    const put = await app.inject({
      method: "PUT",
      url: `/api/v1/regions/${REGION}/admin/projects`,
      headers: authHeader(user.token), // user is a reviewer from earlier test
      payload: { projects: ["Project A", "Project B"] },
    });
    expect(put.statusCode).toBe(200);

    const get = await app.inject({
      method: "GET",
      url: `/api/v1/regions/${REGION}/projects`,
      headers: authHeader(user.token),
    });
    expect(get.json()).toEqual(["Project A", "Project B"]);
  });

  test("record generator URL round-trip", async () => {
    const url = `/api/v1/regions/${REGION}/admin/record-generator-url`;
    const put = await app.inject({
      method: "PUT",
      url,
      headers: authHeader(admin.token),
      payload: { url: "https://api.example.org/" },
    });
    expect(put.statusCode).toBe(200);

    const get = await app.inject({ method: "GET", url, headers: authHeader(admin.token) });
    expect(get.json().url).toBe("https://api.example.org/");

    // reset
    await app.inject({ method: "PUT", url, headers: authHeader(admin.token), payload: {} });
  });
});
