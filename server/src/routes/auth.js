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
  createNativeAuthCode,
} = require("../lib/sessions");
const { sendVerifyEmail, sendPasswordResetEmail } = require("../lib/mailer");
const { startAuth, completeAuth } = require("../lib/oidc");
const { resolveUserForIdentity } = require("../plugins/auth");
const { getCookie } = require("../lib/cookies");
const {
  REFRESH_COOKIE,
  MIN_PASSWORD,
  setRefreshCookie,
  clearRefreshCookie,
  publicUser,
  safeReturnTo,
} = require("../lib/authShared");

// Issues an access token + a fresh refresh-token session and sets the cookie.
async function startSession(reply, user) {
  const { raw } = await issueRefreshToken(null, user.id);
  setRefreshCookie(reply, raw);
  return signAccessToken(user);
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
        "INSERT INTO user_identities (user_id, provider, provider_subject, email) VALUES ($1, 'local', $2, $3)",
        [userId, userId, normEmail],
      );
      const token = await createEmailToken(userId, "verify_email");
      await sendVerifyEmail(normEmail, token).catch((err) =>
        request.log.error({ err: err.message }, "failed to send verification email"),
      );
    }
    // An account already exists. Do nothing.
    //
    // This branch used to set `password_hash` on any passwordless account,
    // which was an unauthenticated takeover of every OAuth user: OAuth accounts
    // are created with `email_verified = true` (plugins/auth.js), and the login
    // gate below only checks that flag, so an attacker who knew a colleague's
    // Google address could set a password and sign in immediately — without
    // ever receiving the verification email.
    //
    // OAuth-only users who want a password now use the reset flow, which
    // proves control of the mailbox first, or POST /auth/password once signed
    // in. See the reset handler below.

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
    const raw = getCookie(request, REFRESH_COOKIE);
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
    const raw = getCookie(request, REFRESH_COOKIE);
    if (raw) await revokeRefreshToken(raw);
    clearRefreshCookie(reply);
    return { ok: true };
  });

  app.post("/auth/password/reset/request", async (request, reply) => {
    const { email } = request.body || {};
    if (email) {
      const normEmail = String(email).trim().toLowerCase();
      const row = await query("SELECT id, password_hash FROM users WHERE email = $1", [normEmail]);
      // Deliberately does NOT require an existing password_hash. An OAuth-only
      // user has none, and this is their legitimate route to one — clicking an
      // emailed link proves control of the address, which is the same trust
      // model as verify_email. Requiring a hash here made this a silent no-op
      // for exactly the users who needed it, which is what pushed them toward
      // the register hole that used to exist above.
      if (row.rows.length) {
        const isFirstPassword = !row.rows[0].password_hash;
        const token = await createEmailToken(row.rows[0].id, "reset_password");
        await sendPasswordResetEmail(normEmail, token, { isFirstPassword }).catch((err) =>
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
    // An OAuth-only account setting its first password has no `local` identity
    // row yet. Register used to create one; it no longer runs for existing
    // accounts, so do it here.
    await query(
      "INSERT INTO user_identities (user_id, provider, provider_subject, email) " +
        // Casts are required: $1 is a uuid for user_id but text for
        // provider_subject, and Postgres refuses to deduce both from one
        // parameter ("inconsistent types deduced for parameter $1").
        "SELECT $1::uuid, 'local', $1::text, email FROM users WHERE id = $1::uuid " +
        "ON CONFLICT (provider, provider_subject) DO NOTHING",
      [userId],
    );
    await revokeAllForUser(userId);
    return { ok: true };
  });

  // Set or change a password while signed in. This is what the native client
  // uses: deep-linking an emailed token back into an app webview is fiddly and
  // a known App Store review snag.
  app.post("/auth/password", { preHandler: [app.authenticate] }, async (request, reply) => {
    const { currentPassword, newPassword } = request.body || {};
    if (!newPassword || newPassword.length < MIN_PASSWORD) {
      return reply
        .code(400)
        .send({ error: `A password of at least ${MIN_PASSWORD} characters is required` });
    }

    const row = await query("SELECT password_hash FROM users WHERE id = $1", [request.user.id]);
    const existingHash = row.rows[0]?.password_hash;

    // Only required when there is one to prove — an OAuth-only account is
    // already authenticated by its bearer token.
    if (existingHash) {
      const ok =
        Boolean(currentPassword) &&
        (await argon2.verify(existingHash, currentPassword).catch(() => false));
      if (!ok) return reply.code(403).send({ error: "Current password is incorrect" });
    }

    await query("UPDATE users SET password_hash = $2 WHERE id = $1", [
      request.user.id,
      await argon2.hash(newPassword),
    ]);
    await query(
      "INSERT INTO user_identities (user_id, provider, provider_subject, email) " +
        // Casts are required: $1 is a uuid for user_id but text for
        // provider_subject, and Postgres refuses to deduce both from one
        // parameter ("inconsistent types deduced for parameter $1").
        "SELECT $1::uuid, 'local', $1::text, email FROM users WHERE id = $1::uuid " +
        "ON CONFLICT (provider, provider_subject) DO NOTHING",
      [request.user.id],
    );
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

    // A native client identifies itself here and supplies its own PKCE
    // challenge. Both are persisted, because the callback must not take an
    // attacker's word for either — see the comment on safeReturnTo.
    const isNative = request.query.client === "native";
    const appCodeChallenge = isNative ? request.query.codeChallenge : null;
    if (isNative && !appCodeChallenge) {
      return reply.code(400).send({ error: "codeChallenge is required for native sign-in" });
    }

    await query(
      `INSERT INTO oauth_flows
         (state, provider, code_verifier, nonce, return_to, expires_at,
          client_type, app_code_challenge, device_id, device_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        flow.state,
        provider,
        flow.codeVerifier,
        flow.nonce,
        safeReturnTo(request.query.returnTo, { allowNative: isNative }),
        expires,
        isNative ? "native" : "web",
        appCodeChallenge,
        request.query.deviceId || null,
        request.query.deviceName || null,
      ],
    );
    return reply.redirect(flow.url);
  });

  app.get("/auth/oauth/:provider/callback", async (request, reply) => {
    const { provider } = request.params;
    const { state } = request.query;

    // Errors have to land wherever the sign-in started. Until the flow row is
    // read we don't know, so the first two failures necessarily go to the SPA;
    // after that, a native flow is sent back to its own scheme. Without this a
    // failed sign-in leaves the app on a spinner with no way out.
    let failTarget = null;
    const fail = (msg) => {
      const base = failTarget ?? `${config.spaBaseUrl}/#/`;
      const sep = base.includes("?") ? "&" : "?";
      return reply.redirect(`${base}${sep}auth_error=${encodeURIComponent(msg)}`);
    };

    if (!state) return fail("Missing state");
    const flowRow = await query(
      "DELETE FROM oauth_flows WHERE state = $1 AND provider = $2 RETURNING *",
      [state, provider],
    );
    if (!flowRow.rows.length) return fail("Login session expired, please try again");
    const flow = flowRow.rows[0];

    const isNative = flow.client_type === "native";
    if (isNative) failTarget = safeReturnTo(flow.return_to, { allowNative: true });

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

    if (isNative) {
      // Hand back a short-lived single-use code, never the refresh token
      // itself: custom-scheme redirect URLs land in OS logs and any installed
      // app can claim the scheme. The PKCE challenge the app registered at
      // /start is what makes the code unredeemable by anyone else.
      const code = await createNativeAuthCode(user.id, {
        appCodeChallenge: flow.app_code_challenge,
        deviceId: flow.device_id,
        deviceName: flow.device_name,
      });
      const target = new URL(safeReturnTo(flow.return_to, { allowNative: true }));
      target.searchParams.set("code", code);
      return reply.redirect(target.href);
    }

    const { raw } = await issueRefreshToken(null, user.id);
    setRefreshCookie(reply, raw);
    return reply.redirect(safeReturnTo(flow.return_to));
  });
}

module.exports = { authRoutes };
