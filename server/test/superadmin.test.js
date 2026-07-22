const { randomUUID } = require("crypto");
const { buildTestApp, signToken, authHeader, envSuperadmin } = require("./helpers");
const { query, pool } = require("../src/db");

// Region no other test file writes permissions for.
const REGION = "hakai";

describe("superadmin", () => {
  let app;
  let superadmin;
  let user;

  beforeAll(async () => {
    app = await buildTestApp();
    superadmin = await envSuperadmin();
    user = { email: `user-${randomUUID()}@superadmin.test` };
    user.token = await signToken({ email: user.email });
  });

  afterAll(async () => {
    await query("DELETE FROM superadmins WHERE email LIKE '%@superadmin.test'");
    await query("DELETE FROM region_permissions WHERE region = $1", [REGION]);
    await query("DELETE FROM users WHERE email LIKE '%@superadmin.test'");
    await app.close();
    await pool.end();
  });

  test("env-configured superadmin is reported by /me; regular user is not", async () => {
    const me = await app.inject({
      method: "GET",
      url: "/api/v1/me",
      headers: authHeader(superadmin.token),
    });
    expect(me.json().isSuperadmin).toBe(true);

    const plain = await app.inject({
      method: "GET",
      url: "/api/v1/me",
      headers: authHeader(user.token),
    });
    expect(plain.json().isSuperadmin).toBe(false);
  });

  test("superadmin has admin+reviewer roles in a region with no permissions row", async () => {
    const me = await app.inject({
      method: "GET",
      url: `/api/v1/regions/${REGION}/me`,
      headers: authHeader(superadmin.token),
    });
    expect(me.json()).toMatchObject({ isSuperadmin: true, isAdmin: true, isReviewer: true });

    const seed = await app.inject({
      method: "PUT",
      url: `/api/v1/regions/${REGION}/admin/permissions`,
      headers: authHeader(superadmin.token),
      payload: { admins: [user.email], reviewers: [] },
    });
    expect(seed.statusCode).toBe(200);
  });

  test("superadmin list management: guarded, list-replace, env grants not revocable", async () => {
    // regular user (even a region admin from the previous test) cannot read or write
    const deniedGet = await app.inject({
      method: "GET",
      url: "/api/v1/superadmins",
      headers: authHeader(user.token),
    });
    expect(deniedGet.statusCode).toBe(403);

    const deniedPut = await app.inject({
      method: "PUT",
      url: "/api/v1/superadmins",
      headers: authHeader(user.token),
      payload: { superadmins: [user.email] },
    });
    expect(deniedPut.statusCode).toBe(403);

    const granted = `granted-${randomUUID()}@superadmin.test`;
    const put = await app.inject({
      method: "PUT",
      url: "/api/v1/superadmins",
      headers: authHeader(superadmin.token),
      payload: { superadmins: [granted] },
    });
    expect(put.statusCode).toBe(200);

    const get = await app.inject({
      method: "GET",
      url: "/api/v1/superadmins",
      headers: authHeader(superadmin.token),
    });
    expect(get.json().superadmins).toContain(granted);
    expect(get.json().envSuperadmins).toContain(superadmin.email);

    // table grant is live: the granted email is a superadmin on next request
    const grantedToken = await signToken({ email: granted });
    const grantedMe = await app.inject({
      method: "GET",
      url: "/api/v1/me",
      headers: authHeader(grantedToken),
    });
    expect(grantedMe.json().isSuperadmin).toBe(true);

    // wiping the table does not revoke the env-configured superadmin
    const wipe = await app.inject({
      method: "PUT",
      url: "/api/v1/superadmins",
      headers: authHeader(superadmin.token),
      payload: { superadmins: [] },
    });
    expect(wipe.statusCode).toBe(200);

    const stillSuper = await app.inject({
      method: "GET",
      url: "/api/v1/me",
      headers: authHeader(superadmin.token),
    });
    expect(stillSuper.json().isSuperadmin).toBe(true);
  });
});
