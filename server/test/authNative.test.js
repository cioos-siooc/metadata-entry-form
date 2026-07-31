// Must precede the helpers require, which loads config. An unset value is the
// correct production default — a deployment that has not registered an app
// scheme must not accept redirects to one — so the test opts in explicitly.
process.env.NATIVE_REDIRECT_SCHEMES = "ca.cioos.metadata";

const { createHash, randomBytes, randomUUID } = require("crypto");

const mockMailer = {
  sendVerifyEmail: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
};
jest.mock("../src/lib/mailer", () => mockMailer);

const mockOidc = { startAuth: jest.fn(), completeAuth: jest.fn() };
jest.mock("../src/lib/oidc", () => mockOidc);

const { buildTestApp, authHeader } = require("./helpers");
const { query } = require("../src/db");

const pkce = () => {
  const verifier = randomBytes(32).toString("base64url");
  return { verifier, challenge: createHash("sha256").update(verifier).digest("base64url") };
};

/** Creates a verified local account and returns a native session for it. */
async function nativeLogin(app, { email, password = "sup3rsecret!", deviceName } = {}) {
  const mail = email ?? `native-${randomUUID()}@test.example`;
  await app.inject({
    method: "POST",
    url: "/api/v1/auth/register",
    payload: { email: mail, password, name: "Native Tester" },
  });
  await query("UPDATE users SET email_verified = true WHERE email = $1", [mail]);

  const res = await app.inject({
    method: "POST",
    url: "/api/v1/auth/token",
    payload: { email: mail, password, deviceId: "device-1", deviceName: deviceName || "iPhone" },
  });
  return { email: mail, password, res, body: res.json() };
}

describe("native sessions", () => {
  let app;
  beforeAll(async () => {
    app = await buildTestApp();
  });
  afterAll(async () => {
    await app.close();
  });

  describe("POST /auth/token", () => {
    test("returns tokens in the body and sets no cookie", async () => {
      const { res, body } = await nativeLogin(app);

      expect(res.statusCode).toBe(200);
      expect(typeof body.accessToken).toBe("string");
      expect(typeof body.refreshToken).toBe("string");
      expect(body.expiresIn).toBeGreaterThan(0);
      expect(body.user.email).toBeTruthy();

      // The whole point of the native namespace: no Set-Cookie to depend on.
      expect(res.cookies.find((c) => c.name === "refresh_token")).toBeUndefined();
    });

    test("native refresh tokens outlive web ones", async () => {
      const { body } = await nativeLogin(app);
      const days =
        (new Date(body.refreshTokenExpiresAt) - Date.now()) / (1000 * 60 * 60 * 24);
      // 90-day default, well beyond the web 30.
      expect(days).toBeGreaterThan(60);
    });

    test("records the device so a lost phone can be signed out", async () => {
      const { body } = await nativeLogin(app, { deviceName: "Deck iPad" });

      const sessions = await app.inject({
        method: "GET",
        url: "/api/v1/auth/sessions",
        headers: authHeader(body.accessToken),
      });
      expect(sessions.statusCode).toBe(200);
      const mine = sessions.json();
      expect(mine.some((s) => s.deviceName === "Deck iPad" && s.clientType === "native")).toBe(
        true,
      );
    });

    test("rejects an unverified account", async () => {
      const email = `unverified-${randomUUID()}@test.example`;
      await app.inject({
        method: "POST",
        url: "/api/v1/auth/register",
        payload: { email, password: "sup3rsecret!", name: "Unverified" },
      });
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/auth/token",
        payload: { email, password: "sup3rsecret!" },
      });
      expect(res.statusCode).toBe(403);
    });

    test("rejects a wrong password", async () => {
      const { email } = await nativeLogin(app);
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/auth/token",
        payload: { email, password: "wrong-password" },
      });
      expect(res.statusCode).toBe(401);
    });
  });

  describe("POST /auth/token/refresh", () => {
    const refresh = (refreshToken) =>
      app.inject({ method: "POST", url: "/api/v1/auth/token/refresh", payload: { refreshToken } });

    test("rotates: the old token stops working, the new one works", async () => {
      const { body } = await nativeLogin(app);

      const first = await refresh(body.refreshToken);
      expect(first.statusCode).toBe(200);
      expect(first.json().refreshToken).not.toBe(body.refreshToken);

      const second = await refresh(first.json().refreshToken);
      expect(second.statusCode).toBe(200);
    });

    test("a replay inside the grace window succeeds and keeps the session alive", async () => {
      // THE test for this feature. A refresh response lost to a dropped LTE
      // handoff leaves the app holding a spent token. Without the grace
      // window, retrying revokes the whole family and logs the user out in the
      // field with no connectivity to log back in.
      const { body } = await nativeLogin(app);

      const rotated = await refresh(body.refreshToken);
      expect(rotated.statusCode).toBe(200);

      // The app never saw that response, so it retries with the old token.
      const replay = await refresh(body.refreshToken);
      expect(replay.statusCode).toBe(200);

      // And the token it gets back is usable — the session survived.
      const after = await refresh(replay.json().refreshToken);
      expect(after.statusCode).toBe(200);
    });

    test("a replay outside the window still revokes the family", async () => {
      // The grace window must be narrow, not a hole: past it, reuse is still
      // treated as a compromised session.
      const { body } = await nativeLogin(app);
      const userId = body.user.userID;
      const rotated = await refresh(body.refreshToken);
      const live = rotated.json().refreshToken;

      // Backdate this user's revocations past the grace window. Scoped by
      // user_id so parallel test files are unaffected, and computed in JS
      // rather than SQL so it needs no pgcrypto extension.
      await query(
        `UPDATE refresh_tokens SET revoked_at = now() - interval '1 hour'
         WHERE user_id = $1 AND revoked_at IS NOT NULL`,
        [userId],
      );

      const replay = await refresh(body.refreshToken);
      expect(replay.statusCode).toBe(401);

      // The whole family is gone, including the token that was still live.
      expect((await refresh(live)).statusCode).toBe(401);
    });

    test("rejects an unknown token", async () => {
      expect((await refresh("not-a-real-token")).statusCode).toBe(401);
    });

    test("requires a token", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/auth/token/refresh",
        payload: {},
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe("POST /auth/token/revoke", () => {
    test("signs out, and is idempotent", async () => {
      const { body } = await nativeLogin(app);

      const first = await app.inject({
        method: "POST",
        url: "/api/v1/auth/token/revoke",
        payload: { refreshToken: body.refreshToken },
      });
      expect(first.statusCode).toBe(200);

      const reuse = await app.inject({
        method: "POST",
        url: "/api/v1/auth/token/refresh",
        payload: { refreshToken: body.refreshToken },
      });
      expect(reuse.statusCode).toBe(401);

      // Signing out twice must not error — the client may retry offline.
      const again = await app.inject({
        method: "POST",
        url: "/api/v1/auth/token/revoke",
        payload: { refreshToken: body.refreshToken },
      });
      expect(again.statusCode).toBe(200);
    });
  });

  describe("native OAuth code exchange", () => {
    // Returns the state it used. Looking the flow up afterwards by
    // `ORDER BY expires_at` is unreliable: every flow inside the same 10-minute
    // window shares that timestamp, so it picks an arbitrary row — including
    // one belonging to another test.
    const startNative = async (returnTo, challenge) => {
      const state = `state-${randomUUID()}`;
      mockOidc.startAuth.mockResolvedValue({
        state,
        codeVerifier: "our-verifier-toward-the-idp",
        nonce: "nonce",
        url: "https://provider.example/authorize",
      });
      await app.inject({
        method: "GET",
        url:
          `/api/v1/auth/oauth/google/start?client=native&codeChallenge=${challenge}` +
          `&returnTo=${encodeURIComponent(returnTo)}&deviceName=iPhone`,
      });
      return state;
    };

    const completeCallback = async (state, email) => {
      mockOidc.completeAuth.mockResolvedValue({
        providerSubject: `google-${randomUUID()}`,
        email,
        emailVerified: true,
        name: "OAuth Native User",
      });
      return app.inject({
        method: "GET",
        url: `/api/v1/auth/oauth/google/callback?state=${state}&code=idp-code`,
      });
    };

    test("redirects to the app scheme with a code, never a refresh token", async () => {
      const { challenge } = pkce();
      const state = await startNative("ca.cioos.metadata://auth", challenge);

      const cb = await completeCallback(state, `oauth-native-${randomUUID()}@test.example`);
      expect(cb.statusCode).toBe(302);

      const location = cb.headers.location;
      expect(location.startsWith("ca.cioos.metadata://")).toBe(true);

      const url = new URL(location);
      expect(url.searchParams.get("code")).toBeTruthy();
      // The refresh token must never travel in a custom-scheme URL.
      expect(location).not.toContain("refreshToken");
      expect(cb.cookies.find((c) => c.name === "refresh_token")).toBeUndefined();
    });

    test("the code exchanges for tokens with the right verifier", async () => {
      const { verifier, challenge } = pkce();
      const state = await startNative("ca.cioos.metadata://auth", challenge);
      const cb = await completeCallback(state, `oauth-native-${randomUUID()}@test.example`);
      const code = new URL(cb.headers.location).searchParams.get("code");

      const res = await app.inject({
        method: "POST",
        url: "/api/v1/auth/token/exchange",
        payload: { code, codeVerifier: verifier, deviceName: "iPhone" },
      });
      expect(res.statusCode).toBe(200);
      expect(typeof res.json().refreshToken).toBe("string");
    });

    test("a stolen code is useless without the verifier", async () => {
      // The reason PKCE is here at all: custom-scheme URLs leak into OS logs,
      // and any installed app can register the same scheme.
      const { challenge } = pkce();
      const state = await startNative("ca.cioos.metadata://auth", challenge);
      const cb = await completeCallback(state, `oauth-native-${randomUUID()}@test.example`);
      const code = new URL(cb.headers.location).searchParams.get("code");

      const res = await app.inject({
        method: "POST",
        url: "/api/v1/auth/token/exchange",
        payload: { code, codeVerifier: pkce().verifier },
      });
      expect(res.statusCode).toBe(400);
    });

    test("a code is single use", async () => {
      const { verifier, challenge } = pkce();
      const state = await startNative("ca.cioos.metadata://auth", challenge);
      const cb = await completeCallback(state, `oauth-native-${randomUUID()}@test.example`);
      const code = new URL(cb.headers.location).searchParams.get("code");

      const exchange = () =>
        app.inject({
          method: "POST",
          url: "/api/v1/auth/token/exchange",
          payload: { code, codeVerifier: verifier },
        });

      expect((await exchange()).statusCode).toBe(200);
      expect((await exchange()).statusCode).toBe(400);
    });

    test("native start requires a code challenge", async () => {
      mockOidc.startAuth.mockResolvedValue({
        state: `state-${randomUUID()}`,
        codeVerifier: "v",
        nonce: "n",
        url: "https://provider.example/authorize",
      });
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/auth/oauth/google/start?client=native&returnTo=ca.cioos.metadata://auth",
      });
      expect(res.statusCode).toBe(400);
    });
  });
});
