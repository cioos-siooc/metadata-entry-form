const { randomUUID } = require("crypto");
const { buildTestApp, signToken, authHeader, envSuperadmin } = require("./helpers");
const { query, pool } = require("../src/db");

describe("regions API", () => {
  let app;
  let superadmin;
  let user;
  const createdIds = [];

  function freshRegionId() {
    const id = `rtest-${randomUUID().slice(0, 8)}`;
    createdIds.push(id);
    return id;
  }

  beforeAll(async () => {
    app = await buildTestApp();
    superadmin = await envSuperadmin();
    user = { email: `user-${randomUUID()}@regions.test` };
    user.token = await signToken({ email: user.email });
  });

  afterAll(async () => {
    for (const id of createdIds) {
      await query("DELETE FROM region_users WHERE region = $1", [id]);
      await query("DELETE FROM regions WHERE id = $1", [id]);
    }
    await query("DELETE FROM users WHERE email LIKE '%@regions.test'");
    await app.close();
    await pool.end();
  });

  test("GET /regions is public and includes backfilled config", async () => {
    const res = await app.inject({ method: "GET", url: "/api/v1/regions" });
    expect(res.statusCode).toBe(200);
    const { regions } = res.json();
    expect(regions.pacific.title.en).toBe("CIOOS Pacific");
    expect(regions.pacific.colors.primary).toBe("#006e90");
    expect(regions.pacific.isRA).toBe(true);
    // display config only
    expect(res.body).not.toContain("record_generator_url");
  });

  test("POST /regions is superadmin-only and validates the id", async () => {
    const denied = await app.inject({
      method: "POST",
      url: "/api/v1/regions",
      headers: authHeader(user.token),
      payload: { id: freshRegionId(), config: { title: { en: "Nope" } } },
    });
    expect(denied.statusCode).toBe(403);

    const badId = await app.inject({
      method: "POST",
      url: "/api/v1/regions",
      headers: authHeader(superadmin.token),
      payload: { id: "Bad_Id!", config: {} },
    });
    expect(badId.statusCode).toBe(422);

    const noConfig = await app.inject({
      method: "POST",
      url: "/api/v1/regions",
      headers: authHeader(superadmin.token),
      payload: { id: freshRegionId() },
    });
    expect(noConfig.statusCode).toBe(422);
  });

  test("superadmin creates a region; it lists, resolves, and rejects duplicates", async () => {
    const id = freshRegionId();
    const config = {
      title: { en: "Test Region", fr: "Région test" },
      colors: { primary: "#123456", secondary: "#654321" },
      showInRegionSelector: true,
    };

    const created = await app.inject({
      method: "POST",
      url: "/api/v1/regions",
      headers: authHeader(superadmin.token),
      payload: { id, config },
    });
    expect(created.statusCode).toBe(201);

    const dup = await app.inject({
      method: "POST",
      url: "/api/v1/regions",
      headers: authHeader(superadmin.token),
      payload: { id, config },
    });
    expect(dup.statusCode).toBe(409);

    const list = await app.inject({ method: "GET", url: "/api/v1/regions" });
    expect(list.json().regions[id]).toEqual(config);

    // the new region's :region routes resolve for a plain member
    const me = await app.inject({
      method: "GET",
      url: `/api/v1/regions/${id}/me`,
      headers: authHeader(user.token),
    });
    expect(me.statusCode).toBe(200);
    expect(me.json()).toMatchObject({ isAdmin: false, isReviewer: false });
  });

  test("PUT /regions/:id replaces config; unknown region 404s", async () => {
    const id = freshRegionId();
    await app.inject({
      method: "POST",
      url: "/api/v1/regions",
      headers: authHeader(superadmin.token),
      payload: { id, config: { title: { en: "Before" } } },
    });

    const denied = await app.inject({
      method: "PUT",
      url: `/api/v1/regions/${id}`,
      headers: authHeader(user.token),
      payload: { config: { title: { en: "Hijack" } } },
    });
    expect(denied.statusCode).toBe(403);

    const updated = await app.inject({
      method: "PUT",
      url: `/api/v1/regions/${id}`,
      headers: authHeader(superadmin.token),
      payload: { config: { title: { en: "After" }, showInRegionSelector: false } },
    });
    expect(updated.statusCode).toBe(200);

    const list = await app.inject({ method: "GET", url: "/api/v1/regions" });
    expect(list.json().regions[id].title.en).toBe("After");

    const missing = await app.inject({
      method: "PUT",
      url: "/api/v1/regions/does-not-exist",
      headers: authHeader(superadmin.token),
      payload: { config: {} },
    });
    expect(missing.statusCode).toBe(404);
  });
});
