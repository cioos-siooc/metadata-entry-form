const { randomUUID } = require("crypto");

const mockMailer = {
  sendVerifyEmail: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
};
jest.mock("../src/lib/mailer", () => mockMailer);
jest.mock("../src/lib/oidc", () => ({ startAuth: jest.fn(), completeAuth: jest.fn() }));

const { buildTestApp, authHeader, signToken } = require("./helpers");
const { query } = require("../src/db");

/**
 * Creates an account the way OAuth does: verified, and with no password.
 * This is the shape that used to be takeable over.
 */
async function createOAuthOnlyUser() {
  const email = `oauth-only-${randomUUID()}@test.example`;
  const row = await query(
    `INSERT INTO users (email, display_name, email_verified, password_hash)
     VALUES ($1, $2, true, NULL) RETURNING id`,
    [email, "Social User"],
  );
  return { email, id: row.rows[0].id };
}

describe("register no longer takes over passwordless accounts", () => {
  let app;
  beforeAll(async () => {
    app = await buildTestApp();
  });
  afterAll(async () => {
    await app.close();
  });
  beforeEach(() => jest.clearAllMocks());

  test("registering against an OAuth account does not set a password", async () => {
    // The original hole: POST /auth/register on an existing passwordless
    // account wrote an attacker-chosen password_hash and left email_verified
    // true, so the attacker could sign in immediately — no mailbox access
    // required, just knowledge of a colleague's address.
    const { email, id } = await createOAuthOnlyUser();

    const register = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: { email, password: "attacker-chosen-pw", name: "Mallory" },
    });
    // Still a generic 201 — no account enumeration.
    expect(register.statusCode).toBe(201);

    const after = await query("SELECT password_hash FROM users WHERE id = $1", [id]);
    expect(after.rows[0].password_hash).toBeNull();

    const login = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email, password: "attacker-chosen-pw" },
    });
    expect(login.statusCode).toBe(401);
  });

  test("and the native login route is not a way around it", async () => {
    const { email } = await createOAuthOnlyUser();
    await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: { email, password: "attacker-chosen-pw" },
    });

    const res = await app.inject({
      method: "POST",
      url: "/api/v1/auth/token",
      payload: { email, password: "attacker-chosen-pw" },
    });
    expect(res.statusCode).toBe(401);
  });

  test("registering a genuinely new account still works", async () => {
    const email = `brand-new-${randomUUID()}@test.example`;
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: { email, password: "sup3rsecret!", name: "New User" },
    });
    expect(res.statusCode).toBe(201);
    expect(mockMailer.sendVerifyEmail).toHaveBeenCalled();

    const row = await query("SELECT password_hash FROM users WHERE email = $1", [email]);
    expect(row.rows[0].password_hash).toBeTruthy();
  });
});

describe("OAuth-only users can obtain a password legitimately", () => {
  let app;
  beforeAll(async () => {
    app = await buildTestApp();
  });
  afterAll(async () => {
    await app.close();
  });
  beforeEach(() => jest.clearAllMocks());

  test("password reset now works for an account with no password", async () => {
    // Previously a silent no-op for exactly the users who needed it, which is
    // what pushed them toward the register hole.
    const { email, id } = await createOAuthOnlyUser();

    const res = await app.inject({
      method: "POST",
      url: "/api/v1/auth/password/reset/request",
      payload: { email },
    });
    expect(res.statusCode).toBe(200);
    expect(mockMailer.sendPasswordResetEmail).toHaveBeenCalledTimes(1);

    // The copy differs — "set a password", not "reset your password".
    const [, token, opts] = mockMailer.sendPasswordResetEmail.mock.calls[0];
    expect(opts).toEqual(expect.objectContaining({ isFirstPassword: true }));

    const reset = await app.inject({
      method: "POST",
      url: "/api/v1/auth/password/reset",
      payload: { token, newPassword: "my-new-password" },
    });
    expect(reset.statusCode).toBe(200);

    const login = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email, password: "my-new-password" },
    });
    expect(login.statusCode).toBe(200);

    // A `local` identity row is created, which register used to do.
    const identities = await query(
      "SELECT 1 FROM user_identities WHERE user_id = $1 AND provider = 'local'",
      [id],
    );
    expect(identities.rows.length).toBe(1);
  });

  test("an existing-password user gets the reset copy, not the set copy", async () => {
    const email = `has-pw-${randomUUID()}@test.example`;
    await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: { email, password: "sup3rsecret!" },
    });
    jest.clearAllMocks();

    await app.inject({
      method: "POST",
      url: "/api/v1/auth/password/reset/request",
      payload: { email },
    });
    const [, , opts] = mockMailer.sendPasswordResetEmail.mock.calls[0];
    expect(opts).toEqual(expect.objectContaining({ isFirstPassword: false }));
  });

  test("requesting a reset for an unknown address is still silent", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/auth/password/reset/request",
      payload: { email: `nobody-${randomUUID()}@test.example` },
    });
    expect(res.statusCode).toBe(200);
    expect(mockMailer.sendPasswordResetEmail).not.toHaveBeenCalled();
  });
});

describe("POST /auth/password", () => {
  let app;
  beforeAll(async () => {
    app = await buildTestApp();
  });
  afterAll(async () => {
    await app.close();
  });

  test("an OAuth-only user can set a first password without a current one", async () => {
    // This is the route the native client uses: deep-linking an emailed token
    // into an app webview is fiddly and an App Store review snag.
    const { email, id } = await createOAuthOnlyUser();
    const token = await signToken({ sub: id, email });

    const res = await app.inject({
      method: "POST",
      url: "/api/v1/auth/password",
      headers: authHeader(token),
      payload: { newPassword: "chosen-in-app" },
    });
    expect(res.statusCode).toBe(200);

    const login = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email, password: "chosen-in-app" },
    });
    expect(login.statusCode).toBe(200);
  });

  test("changing an existing password requires the current one", async () => {
    const email = `change-pw-${randomUUID()}@test.example`;
    await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: { email, password: "original-password" },
    });
    await query("UPDATE users SET email_verified = true WHERE email = $1", [email]);
    const row = await query("SELECT id FROM users WHERE email = $1", [email]);
    const token = await signToken({ sub: row.rows[0].id, email });

    const wrong = await app.inject({
      method: "POST",
      url: "/api/v1/auth/password",
      headers: authHeader(token),
      payload: { currentPassword: "not-it", newPassword: "replacement-pw" },
    });
    expect(wrong.statusCode).toBe(403);

    const right = await app.inject({
      method: "POST",
      url: "/api/v1/auth/password",
      headers: authHeader(token),
      payload: { currentPassword: "original-password", newPassword: "replacement-pw" },
    });
    expect(right.statusCode).toBe(200);
  });

  test("requires authentication", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/auth/password",
      payload: { newPassword: "whatever-goes-here" },
    });
    expect(res.statusCode).toBe(401);
  });
});

describe("safeReturnTo is an origin check, not a prefix match", () => {
  const { safeReturnTo } = require("../src/lib/authShared");
  const config = require("../src/config");

  test("rejects a lookalike domain", () => {
    // `startsWith(spaBaseUrl)` accepted this — an open redirect.
    const evil = `${config.spaBaseUrl}.evil.example/phish`;
    expect(safeReturnTo(evil)).toBe(config.spaBaseUrl);
  });

  test("allows the SPA origin", () => {
    const ok = `${config.spaBaseUrl}/#/records`;
    expect(safeReturnTo(ok)).toBe(new URL(ok).href);
  });

  test("rejects an app scheme unless the flow is native", () => {
    const appUrl = "ca.cioos.metadata://auth";
    expect(safeReturnTo(appUrl)).toBe(config.spaBaseUrl);
  });

  test("rejects unregistered schemes even for native flows", () => {
    expect(safeReturnTo("evilapp://steal", { allowNative: true })).toBe(config.spaBaseUrl);
  });

  test.each([null, undefined, "", "not a url", "javascript:alert(1)"])(
    "falls back safely for %p",
    (input) => {
      expect(safeReturnTo(input)).toBe(config.spaBaseUrl);
    },
  );
});
