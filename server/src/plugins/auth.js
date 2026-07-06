const fp = require("fastify-plugin");
const { createRemoteJWKSet, jwtVerify } = require("jose");
const config = require("../config");
const { query } = require("../db");

// Verifies Keycloak bearer tokens and JIT-provisions users.
//
// Provisioning order matters for the Firebase migration: rows imported from
// RTDB have email + firebase_uid but no keycloak_sub. The first verified-email
// login claims that row; later logins match on keycloak_sub directly.
async function resolveUser(claims) {
  const { sub, email, email_verified: emailVerified, name } = claims;

  const bySub = await query("SELECT * FROM users WHERE keycloak_sub = $1", [sub]);
  if (bySub.rows.length) {
    const user = bySub.rows[0];
    await query(
      "UPDATE users SET display_name = COALESCE($2, display_name), last_login_at = now() WHERE id = $1",
      [user.id, name || null],
    );
    return user;
  }

  if (!email) {
    const err = new Error("Token has no email claim; cannot provision user");
    err.statusCode = 403;
    throw err;
  }

  if (emailVerified) {
    // Claim a pre-provisioned (migrated) row by verified email.
    const linked = await query(
      `UPDATE users SET keycloak_sub = $1, display_name = COALESCE($2, display_name), last_login_at = now()
       WHERE email = $3 AND keycloak_sub IS NULL RETURNING *`,
      [sub, name || null, email],
    );
    if (linked.rows.length) return linked.rows[0];
  }

  const inserted = await query(
    `INSERT INTO users (keycloak_sub, email, display_name, last_login_at)
     VALUES ($1, $2, $3, now())
     ON CONFLICT (email) DO NOTHING
     RETURNING *`,
    [sub, email, name || null],
  );
  if (inserted.rows.length) return inserted.rows[0];

  // Email row exists but is owned by a different keycloak account (or the
  // email is unverified and the row is pre-provisioned) — refuse rather than
  // allow account takeover via an unverified address.
  const err = new Error(
    `An account for ${email} already exists. Sign in with the provider originally used, or ask an administrator to link your account.`,
  );
  err.statusCode = 409;
  throw err;
}

async function authPlugin(app, opts) {
  // Tests inject a local key resolver + issuer/audience; production resolves
  // Keycloak's JWKS endpoint.
  const issuer = opts.issuer || config.keycloak.issuer;
  const audience = opts.audience || config.keycloak.audience;
  const jwks =
    opts.jwks ||
    createRemoteJWKSet(
      new URL(
        `${config.keycloak.internalIssuer || config.keycloak.issuer}/protocol/openid-connect/certs`,
      ),
    );

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

module.exports = { authPlugin: fp(authPlugin), resolveUser };
