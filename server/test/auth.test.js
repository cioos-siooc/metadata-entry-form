const { randomUUID } = require("crypto");

// Capture raw email tokens (normally delivered by email) and stub OIDC.
const mailer = { sendVerifyEmail: jest.fn(), sendPasswordResetEmail: jest.fn() };
jest.mock("../src/lib/mailer", () => mailer);

const oidc = { startAuth: jest.fn(), completeAuth: jest.fn() };
jest.mock("../src/lib/oidc", () => oidc);

const { buildTestApp, authHeader } = require("./helpers");

function cookieValue(res, name) {
  const c = res.cookies.find((x) => x.name === name);
  return c ? c.value : null;
}

describe("local auth", () => {
  let app;
  const email = `local-${randomUUID()}@test.example`;
  const password = "sup3rsecret!";

  beforeAll(async () => {
    app = await buildTestApp();
  });
  afterAll(async () => {
    await app.close();
  });

  it("registers, gates login until verified, then logs in and authenticates", async () => {
    const reg = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: { email, password, name: "Local User" },
    });
    expect(reg.statusCode).toBe(201);
    expect(mailer.sendVerifyEmail).toHaveBeenCalledWith(email, expect.any(String));

    // Login is blocked before verification.
    const early = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email, password },
    });
    expect(early.statusCode).toBe(403);

    // Verify using the token that would have been emailed.
    const verifyToken = mailer.sendVerifyEmail.mock.calls[0][1];
    const verified = await app.inject({
      method: "POST",
      url: "/api/v1/auth/verify-email",
      payload: { token: verifyToken },
    });
    expect(verified.statusCode).toBe(200);

    // Now login succeeds and returns an access token + refresh cookie.
    const login = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email, password },
    });
    expect(login.statusCode).toBe(200);
    const { accessToken } = login.json();
    expect(accessToken).toBeTruthy();
    const refresh = cookieValue(login, "refresh_token");
    expect(refresh).toBeTruthy();

    // The access token authenticates a protected route.
    const me = await app.inject({ method: "GET", url: "/api/v1/me", headers: authHeader(accessToken) });
    expect(me.statusCode).toBe(200);
    expect(me.json().email).toBe(email);
  });

  it("rejects wrong password and unknown email with 401", async () => {
    const bad = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email, password: "wrong-password" },
    });
    expect(bad.statusCode).toBe(401);

    const nobody = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email: `nope-${randomUUID()}@test.example`, password },
    });
    expect(nobody.statusCode).toBe(401);
  });

  it("rotates refresh tokens and detects reuse", async () => {
    const login = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email, password },
    });
    const first = cookieValue(login, "refresh_token");

    const refreshed = await app.inject({
      method: "POST",
      url: "/api/v1/auth/refresh",
      cookies: { refresh_token: first },
    });
    expect(refreshed.statusCode).toBe(200);
    expect(refreshed.json().accessToken).toBeTruthy();
    const second = cookieValue(refreshed, "refresh_token");
    expect(second).toBeTruthy();
    expect(second).not.toBe(first);

    // Reusing the old (rotated) token fails and revokes the family.
    const reused = await app.inject({
      method: "POST",
      url: "/api/v1/auth/refresh",
      cookies: { refresh_token: first },
    });
    expect(reused.statusCode).toBe(401);

    const afterReuse = await app.inject({
      method: "POST",
      url: "/api/v1/auth/refresh",
      cookies: { refresh_token: second },
    });
    expect(afterReuse.statusCode).toBe(401);
  });

  it("logout revokes the session", async () => {
    const login = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email, password },
    });
    const refresh = cookieValue(login, "refresh_token");

    const out = await app.inject({
      method: "POST",
      url: "/api/v1/auth/logout",
      cookies: { refresh_token: refresh },
    });
    expect(out.statusCode).toBe(200);

    const after = await app.inject({
      method: "POST",
      url: "/api/v1/auth/refresh",
      cookies: { refresh_token: refresh },
    });
    expect(after.statusCode).toBe(401);
  });

  it("resets a password via emailed token and invalidates old sessions", async () => {
    const login = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email, password },
    });
    const oldRefresh = cookieValue(login, "refresh_token");

    const req = await app.inject({
      method: "POST",
      url: "/api/v1/auth/password/reset/request",
      payload: { email },
    });
    expect(req.statusCode).toBe(200);
    expect(mailer.sendPasswordResetEmail).toHaveBeenCalledWith(email, expect.any(String));
    const resetToken = mailer.sendPasswordResetEmail.mock.calls[0][1];

    const newPassword = "brandnewsecret!";
    const reset = await app.inject({
      method: "POST",
      url: "/api/v1/auth/password/reset",
      payload: { token: resetToken, newPassword },
    });
    expect(reset.statusCode).toBe(200);

    // Old sessions are revoked; new password works.
    const oldSession = await app.inject({
      method: "POST",
      url: "/api/v1/auth/refresh",
      cookies: { refresh_token: oldRefresh },
    });
    expect(oldSession.statusCode).toBe(401);

    const relogin = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email, password: newPassword },
    });
    expect(relogin.statusCode).toBe(200);
  });
});

describe("oauth (mocked provider)", () => {
  let app;
  beforeAll(async () => {
    process.env.OAUTH_GOOGLE_CLIENT_ID = "test-client";
    process.env.OAUTH_GOOGLE_CLIENT_SECRET = "test-secret";
    app = await buildTestApp();
  });
  afterAll(async () => {
    await app.close();
  });

  it("start stores a flow and redirects; callback provisions a user and sets a session", async () => {
    const state = `state-${randomUUID()}`;
    oidc.startAuth.mockResolvedValue({
      url: "https://accounts.google.com/o/oauth2/v2/auth?state=" + state,
      codeVerifier: "verifier",
      nonce: "nonce",
      state,
    });

    const start = await app.inject({ method: "GET", url: "/api/v1/auth/oauth/google/start" });
    expect(start.statusCode).toBe(302);
    expect(start.headers.location).toContain("accounts.google.com");

    const oauthEmail = `oauth-${randomUUID()}@test.example`;
    oidc.completeAuth.mockResolvedValue({
      providerSubject: `google-${randomUUID()}`,
      email: oauthEmail,
      emailVerified: true,
      name: "OAuth User",
    });

    const cb = await app.inject({
      method: "GET",
      url: `/api/v1/auth/oauth/google/callback?state=${state}&code=abc`,
    });
    expect(cb.statusCode).toBe(302);
    const refresh = cookieValue(cb, "refresh_token");
    expect(refresh).toBeTruthy();

    // The session works and resolves to the provisioned user.
    const refreshed = await app.inject({
      method: "POST",
      url: "/api/v1/auth/refresh",
      cookies: { refresh_token: refresh },
    });
    expect(refreshed.statusCode).toBe(200);
    expect(refreshed.json().user.email).toBe(oauthEmail);
  });
});
