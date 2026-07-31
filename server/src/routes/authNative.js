const config = require("../config");
const { query } = require("../db");
const { signAccessToken } = require("../lib/tokens");
const {
  issueRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  consumeNativeAuthCode,
} = require("../lib/sessions");
const {
  publicUser,
  verifyCredentials,
  accessTokenTtlSeconds,
} = require("../lib/authShared");

// Native session endpoints, in a namespace of their own.
//
// A parallel namespace rather than content-negotiation on the existing routes:
// the browser's four auth routes stay byte-for-byte unchanged, the native
// contract is independently testable, and there is no header-sniffing branch
// where a mistake would silently change SPA behaviour.
//
// The whole difference is transport. A native client has no useful cookie jar
// — HttpOnly means nothing outside a browser, and with bundled Capacitor-style
// assets the API is cross-origin anyway — so refresh tokens travel in the
// body and the app stores them in the OS keychain. Rotation and reuse
// detection are unchanged.

async function nativeSessionPayload(user, raw) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + config.auth.nativeRefreshTokenTtlDays);
  return {
    accessToken: await signAccessToken(user),
    expiresIn: accessTokenTtlSeconds(),
    refreshToken: raw,
    refreshTokenExpiresAt: expiresAt.toISOString(),
    user: publicUser(user),
  };
}

async function loadUser(userId) {
  const row = await query("SELECT * FROM users WHERE id = $1", [userId]);
  return row.rows[0] || null;
}

async function authNativeRoutes(app) {
  // Email + password. Same gate as the browser login, different transport.
  app.post("/auth/token", async (request, reply) => {
    const { email, password, deviceId, deviceName } = request.body || {};

    const result = await verifyCredentials(email, password);
    if (result.error) return reply.code(result.status).send({ error: result.error });

    const { raw } = await issueRefreshToken(null, result.user.id, undefined, {
      clientType: "native",
      deviceId,
      deviceName,
    });
    await query("UPDATE users SET last_login_at = now() WHERE id = $1", [result.user.id]);

    return nativeSessionPayload(result.user, raw);
  });

  // Rotate. The grace window in lib/sessions.js means a retry after a lost
  // response succeeds instead of destroying the session — the difference
  // between a dropped LTE handoff being a hiccup and being a lockout at sea.
  app.post("/auth/token/refresh", async (request, reply) => {
    const { refreshToken } = request.body || {};
    if (!refreshToken) return reply.code(400).send({ error: "refreshToken is required" });

    const rotated = await rotateRefreshToken(refreshToken);
    if (!rotated) return reply.code(401).send({ error: "Invalid or expired refresh token" });

    const user = await loadUser(rotated.userId);
    if (!user) return reply.code(401).send({ error: "User no longer exists" });

    return nativeSessionPayload(user, rotated.raw);
  });

  app.post("/auth/token/revoke", async (request, reply) => {
    const { refreshToken } = request.body || {};
    if (refreshToken) await revokeRefreshToken(refreshToken);
    // Always ok: signing out must not depend on the token still being valid.
    return reply.code(200).send({ ok: true });
  });

  // Completes native OAuth. The app opened the provider in a system browser,
  // we redirected back to its scheme with a single-use code, and it now trades
  // that code — plus the PKCE verifier only it holds — for real tokens.
  app.post("/auth/token/exchange", async (request, reply) => {
    const { code, codeVerifier, deviceId, deviceName } = request.body || {};
    if (!code || !codeVerifier) {
      return reply.code(400).send({ error: "code and codeVerifier are required" });
    }

    const consumed = await consumeNativeAuthCode(code, codeVerifier);
    if (!consumed) return reply.code(400).send({ error: "Invalid or expired code" });

    const user = await loadUser(consumed.userId);
    if (!user) return reply.code(401).send({ error: "User no longer exists" });

    const { raw } = await issueRefreshToken(null, user.id, undefined, {
      clientType: "native",
      deviceId: deviceId || consumed.deviceId,
      deviceName: deviceName || consumed.deviceName,
    });
    await query("UPDATE users SET last_login_at = now() WHERE id = $1", [user.id]);

    return nativeSessionPayload(user, raw);
  });

  // "Sign out my lost phone." Schema-ready thanks to the device columns.
  app.get("/auth/sessions", { preHandler: [app.authenticate] }, async (request) => {
    const rows = await query(
      `SELECT DISTINCT ON (session_id)
         session_id, client_type, device_id, device_name, created_at, last_used_at, expires_at
       FROM refresh_tokens
       WHERE user_id = $1 AND revoked_at IS NULL AND expires_at > now()
       ORDER BY session_id, created_at DESC`,
      [request.user.id],
    );
    return rows.rows.map((r) => ({
      sessionId: r.session_id,
      clientType: r.client_type,
      deviceId: r.device_id,
      deviceName: r.device_name,
      createdAt: r.created_at,
      lastUsedAt: r.last_used_at,
      expiresAt: r.expires_at,
    }));
  });

  app.delete(
    "/auth/sessions/:sessionId",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      // Scoped to the caller's own sessions — a session id must not be usable
      // to sign out somebody else.
      const result = await query(
        `UPDATE refresh_tokens SET revoked_at = now()
         WHERE session_id = $1 AND user_id = $2 AND revoked_at IS NULL
         RETURNING id`,
        [request.params.sessionId, request.user.id],
      );
      if (!result.rows.length) return reply.code(404).send({ error: "Session not found" });
      return { ok: true };
    },
  );
}

module.exports = { authNativeRoutes };
