const argon2 = require("@node-rs/argon2");
const config = require("../config");
const { query } = require("../db");
const { signAccessToken } = require("../lib/tokens");
const {
  issueRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllForUser,
  createEmailToken,
  consumeEmailToken,
} = require("../lib/sessions");
const { sendVerifyEmail, sendPasswordResetEmail } = require("../lib/mailer");
const { startAuth, completeAuth } = require("../lib/oidc");
const { resolveUserForIdentity } = require("../plugins/auth");

const REFRESH_COOKIE = "refresh_token";
const REFRESH_PATH = "/api/v1/auth";
const MIN_PASSWORD = 8;

function refreshCookieOpts() {
  return {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    domain: config.cookie.domain,
    path: REFRESH_PATH,
  };
}

function setRefreshCookie(reply, raw) {
  reply.setCookie(REFRESH_COOKIE, raw, {
    ...refreshCookieOpts(),
    maxAge: config.auth.refreshTokenTtlDays * 24 * 60 * 60,
  });
}

function clearRefreshCookie(reply) {
  reply.clearCookie(REFRESH_COOKIE, refreshCookieOpts());
}

function publicUser(user) {
  return { userID: user.id, email: user.email, displayName: user.display_name };
}

// Issues an access token + a fresh refresh-token session and sets the cookie.
async function startSession(reply, user) {
  const { raw } = await issueRefreshToken(null, user.id);
  setRefreshCookie(reply, raw);
  return signAccessToken(user);
}

// Only ever redirect back to the SPA origin.
function safeReturnTo(returnTo) {
  if (typeof returnTo === "string" && returnTo.startsWith(config.spaBaseUrl)) return returnTo;
  return config.spaBaseUrl;
}

async function authRoutes(app) {
  // --- Local email + password ---------------------------------------------

  app.post("/auth/register", async (request, reply) => {
    const { email, password, name } = request.body || {};
    if (!email || !password || password.length < MIN_PASSWORD) {
      return reply
        .code(400)
        .send({ error: `Email and a password of at least ${MIN_PASSWORD} characters are required` });
    }
    const normEmail = String(email).trim().toLowerCase();
    const passwordHash = await argon2.hash(password);

    const existing = await query("SELECT id, password_hash FROM users WHERE email = $1", [normEmail]);
    if (!existing.rows.length) {
      const inserted = await query(
        "INSERT INTO users (email, display_name, password_hash, email_verified) VALUES ($1, $2, $3, false) RETURNING id",
        [normEmail, name || null, passwordHash],
      );
      const userId = inserted.rows[0].id;
      await query(
        "INSERT INTO user_identities (user_id, provider, provider_subject, email) VALUES ($1, 'local', $1, $2)",
        [userId, normEmail],
      );
      const token = await createEmailToken(userId, "verify_email");
      await sendVerifyEmail(normEmail, token).catch((err) =>
        request.log.error({ err: err.message }, "failed to send verification email"),
      );
    } else if (!existing.rows[0].password_hash) {
      // Social/migrated account adding a local password.
      const userId = existing.rows[0].id;
      await query("UPDATE users SET password_hash = $2 WHERE id = $1", [userId, passwordHash]);
      await query(
        "INSERT INTO user_identities (user_id, provider, provider_subject, email) VALUES ($1, 'local', $1, $2) ON CONFLICT (provider, provider_subject) DO NOTHING",
        [userId, normEmail],
      );
      const token = await createEmailToken(userId, "verify_email");
      await sendVerifyEmail(normEmail, token).catch(() => {});
    }
    // Generic response regardless — no account enumeration.
    return reply.code(201).send({ ok: true });
  });

  app.post("/auth/verify-email", async (request, reply) => {
    const { token } = request.body || {};
    if (!token) return reply.code(400).send({ error: "Missing token" });
    const userId = await consumeEmailToken(token, "verify_email");
    if (!userId) return reply.code(400).send({ error: "Invalid or expired token" });
    await query("UPDATE users SET email_verified = true WHERE id = $1", [userId]);
    return { ok: true };
  });

  app.post("/auth/login", async (request, reply) => {
    const { email, password } = request.body || {};
    if (!email || !password) return reply.code(400).send({ error: "Email and password are required" });
    const normEmail = String(email).trim().toLowerCase();

    const row = await query("SELECT * FROM users WHERE email = $1", [normEmail]);
    const user = row.rows[0];
    // Verify against the stored hash, or a dummy to keep timing ~constant.
    const hash = user?.password_hash;
    const ok = hash
      ? await argon2.verify(hash, password).catch(() => false)
      : await argon2
          .verify(
            "$argon2id$v=19$m=19456,t=2,p=1$c29tZXNhbHRzb21lc2FsdA$0000000000000000000000000000000000000000000",
            password,
          )
          .catch(() => false);
    if (!user || !hash || !ok) {
      return reply.code(401).send({ error: "Invalid email or password" });
    }
    if (!user.email_verified) {
      return reply.code(403).send({ error: "Please verify your email address before signing in" });
    }

    const accessToken = await startSession(reply, user);
    await query("UPDATE users SET last_login_at = now() WHERE id = $1", [user.id]);
    return { accessToken, user: publicUser(user) };
  });

  app.post("/auth/refresh", async (request, reply) => {
    const raw = request.cookies?.[REFRESH_COOKIE];
    if (!raw) return reply.code(401).send({ error: "No session" });
    const rotated = await rotateRefreshToken(raw);
    if (!rotated) {
      clearRefreshCookie(reply);
      return reply.code(401).send({ error: "Session expired" });
    }
    const row = await query("SELECT * FROM users WHERE id = $1", [rotated.userId]);
    if (!row.rows.length) {
      clearRefreshCookie(reply);
      return reply.code(401).send({ error: "Session expired" });
    }
    setRefreshCookie(reply, rotated.raw);
    const accessToken = await signAccessToken(row.rows[0]);
    return { accessToken, user: publicUser(row.rows[0]) };
  });

  app.post("/auth/logout", async (request, reply) => {
    const raw = request.cookies?.[REFRESH_COOKIE];
    if (raw) await revokeRefreshToken(raw);
    clearRefreshCookie(reply);
    return { ok: true };
  });

  app.post("/auth/password/reset/request", async (request, reply) => {
    const { email } = request.body || {};
    if (email) {
      const normEmail = String(email).trim().toLowerCase();
      const row = await query("SELECT id, password_hash FROM users WHERE email = $1", [normEmail]);
      if (row.rows.length && row.rows[0].password_hash) {
        const token = await createEmailToken(row.rows[0].id, "reset_password");
        await sendPasswordResetEmail(normEmail, token).catch((err) =>
          request.log.error({ err: err.message }, "failed to send reset email"),
        );
      }
    }
    // Generic response — no account enumeration.
    return reply.code(200).send({ ok: true });
  });

  app.post("/auth/password/reset", async (request, reply) => {
    const { token, newPassword } = request.body || {};
    if (!token || !newPassword || newPassword.length < MIN_PASSWORD) {
      return reply
        .code(400)
        .send({ error: `A valid token and a password of at least ${MIN_PASSWORD} characters are required` });
    }
    const userId = await consumeEmailToken(token, "reset_password");
    if (!userId) return reply.code(400).send({ error: "Invalid or expired token" });
    const passwordHash = await argon2.hash(newPassword);
    // Resetting via an emailed link also proves control of the address.
    await query("UPDATE users SET password_hash = $2, email_verified = true WHERE id = $1", [
      userId,
      passwordHash,
    ]);
    await revokeAllForUser(userId);
    return { ok: true };
  });

  // --- Social / OIDC providers --------------------------------------------

  app.get("/auth/oauth/:provider/start", async (request, reply) => {
    const { provider } = request.params;
    let flow;
    try {
      flow = await startAuth(provider);
    } catch (err) {
      return reply.code(err.statusCode || 500).send({ error: err.message });
    }
    const expires = new Date(Date.now() + 10 * 60 * 1000);
    await query(
      `INSERT INTO oauth_flows (state, provider, code_verifier, nonce, return_to, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [flow.state, provider, flow.codeVerifier, flow.nonce, safeReturnTo(request.query.returnTo), expires],
    );
    return reply.redirect(flow.url);
  });

  app.get("/auth/oauth/:provider/callback", async (request, reply) => {
    const { provider } = request.params;
    const { state } = request.query;
    const fail = (msg) =>
      reply.redirect(`${config.spaBaseUrl}/#/?auth_error=${encodeURIComponent(msg)}`);

    if (!state) return fail("Missing state");
    const flowRow = await query(
      "DELETE FROM oauth_flows WHERE state = $1 AND provider = $2 RETURNING *",
      [state, provider],
    );
    if (!flowRow.rows.length) return fail("Login session expired, please try again");
    const flow = flowRow.rows[0];
    if (new Date(flow.expires_at) < new Date()) return fail("Login session expired, please try again");

    let identity;
    try {
      const currentUrl = `${config.apiBaseUrl}${request.url}`;
      identity = await completeAuth(provider, currentUrl, {
        codeVerifier: flow.code_verifier,
        nonce: flow.nonce,
        state,
      });
    } catch (err) {
      request.log.info({ err: err.message, provider }, "oauth callback failed");
      return fail("Sign-in failed, please try again");
    }

    let user;
    try {
      user = await resolveUserForIdentity({ provider, ...identity });
    } catch (err) {
      return fail(err.message);
    }

    const { raw } = await issueRefreshToken(null, user.id);
    setRefreshCookie(reply, raw);
    return reply.redirect(safeReturnTo(flow.return_to));
  });
}

module.exports = { authRoutes };
