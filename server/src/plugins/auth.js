const fp = require("fastify-plugin");
const { jwtVerify } = require("jose");
const config = require("../config");
const { query, withTransaction } = require("../db");
const { localJwks } = require("../lib/tokens");

// Loads the user for a verified access token. `sub` is our internal users.id
// (the token was minted by a login/refresh route that already provisioned the
// user), so this is a plain lookup — no per-request JIT provisioning.
async function resolveUser(claims) {
  const { sub } = claims;
  const row = await query("SELECT * FROM users WHERE id = $1", [sub]);
  if (!row.rows.length) {
    const err = new Error("User no longer exists");
    err.statusCode = 401;
    throw err;
  }
  return row.rows[0];
}

// Provisions/links a user from an external identity (OAuth provider) or the
// local 'local' provider. Carries the semantics that used to live in the
// per-request path, retargeted at user_identities:
//   1. known (provider, subject) -> that user
//   2. verified email -> claim/link an existing users row (Firebase-migration
//      breadcrumb), else create a new user
//   3. unverified email colliding with an existing row -> 409 (anti-takeover)
async function resolveUserForIdentity({ provider, providerSubject, email, emailVerified, name }) {
  return withTransaction(async (client) => {
    const q = (text, params) => client.query(text, params);

    const linked = await q(
      `SELECT u.* FROM user_identities i JOIN users u ON u.id = i.user_id
       WHERE i.provider = $1 AND i.provider_subject = $2`,
      [provider, providerSubject],
    );
    if (linked.rows.length) {
      const user = linked.rows[0];
      await q(
        "UPDATE user_identities SET last_login_at = now(), email = COALESCE($3, email) WHERE provider = $1 AND provider_subject = $2",
        [provider, providerSubject, email || null],
      );
      await q(
        "UPDATE users SET display_name = COALESCE($2, display_name), last_login_at = now() WHERE id = $1",
        [user.id, name || null],
      );
      return user;
    }

    if (!email) {
      const err = new Error(
        `The ${provider} account did not share an email address, which is required to create an account.`,
      );
      err.statusCode = 403;
      throw err;
    }

    const addIdentity = (userId) =>
      q(
        "INSERT INTO user_identities (user_id, provider, provider_subject, email, last_login_at) VALUES ($1, $2, $3, $4, now())",
        [userId, provider, providerSubject, email],
      );

    if (emailVerified) {
      const byEmail = await q("SELECT * FROM users WHERE email = $1", [email]);
      if (byEmail.rows.length) {
        const user = byEmail.rows[0];
        await addIdentity(user.id);
        await q(
          "UPDATE users SET display_name = COALESCE($2, display_name), email_verified = true, last_login_at = now() WHERE id = $1",
          [user.id, name || null],
        );
        return user;
      }
      const inserted = await q(
        "INSERT INTO users (email, display_name, email_verified, last_login_at) VALUES ($1, $2, true, now()) RETURNING *",
        [email, name || null],
      );
      await addIdentity(inserted.rows[0].id);
      return inserted.rows[0];
    }

    // Unverified email: never attach to an existing account.
    const existing = await q("SELECT 1 FROM users WHERE email = $1", [email]);
    if (existing.rows.length) {
      const err = new Error(
        `An account for ${email} already exists. Sign in with the provider originally used, or ask an administrator to link your account.`,
      );
      err.statusCode = 409;
      throw err;
    }
    const inserted = await q(
      "INSERT INTO users (email, display_name, email_verified, last_login_at) VALUES ($1, $2, false, now()) RETURNING *",
      [email, name || null],
    );
    await addIdentity(inserted.rows[0].id);
    return inserted.rows[0];
  });
}

async function authPlugin(app, opts) {
  // Tests inject a local key resolver + issuer/audience; production verifies
  // against this API's own signing key (lib/tokens.js).
  const issuer = opts.issuer || config.auth.issuer;
  const audience = opts.audience || config.auth.audience;
  const jwks = opts.jwks || localJwks;

  app.decorateRequest("user", null);
  app.decorateRequest("tokenClaims", null);
  app.decorateRequest("isSuperadmin", false);

  app.decorate("authenticate", async (request, reply) => {
    const header = request.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      return reply.code(401).send({ error: "Missing bearer token" });
    }

    let claims;
    try {
      ({ payload: claims } = await jwtVerify(token, jwks, { issuer, audience }));
    } catch (err) {
      request.log.info({ err: err.message }, "token verification failed");
      return reply.code(401).send({ error: "Invalid token" });
    }

    try {
      request.user = await resolveUser(claims);
      request.tokenClaims = claims;
    } catch (err) {
      return reply.code(err.statusCode || 500).send({ error: err.message });
    }

    if (config.superadminEmails.includes(request.user.email.toLowerCase())) {
      request.isSuperadmin = true;
    } else {
      const row = await query("SELECT 1 FROM superadmins WHERE email = $1", [request.user.email]);
      request.isSuperadmin = row.rows.length > 0;
    }
    return undefined;
  });

  // Lives here rather than regionContext so routes without a :region param
  // (e.g. POST /regions, /superadmins) can use it.
  app.decorate("requireSuperadmin", async (request, reply) => {
    if (!request.isSuperadmin) {
      return reply.code(403).send({ error: "Superadmin access required" });
    }
    return undefined;
  });
}

module.exports = { authPlugin: fp(authPlugin), resolveUser, resolveUserForIdentity };
