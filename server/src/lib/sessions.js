const crypto = require("crypto");
const config = require("../config");
const { query, withTransaction } = require("../db");

// Opaque refresh tokens (rotating, reuse-detecting) and single-use email
// tokens. Only SHA-256 hashes are ever stored, so a DB dump cannot be replayed.

function randomToken() {
  return crypto.randomBytes(32).toString("base64url");
}

function hashToken(raw) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

function refreshExpiry() {
  const d = new Date();
  d.setDate(d.getDate() + config.auth.refreshTokenTtlDays);
  return d;
}

// Issues a refresh token. Omit sessionId at login (starts a new family); pass
// the existing sessionId during rotation. Returns { raw, id, sessionId }.
async function issueRefreshToken(client, userId, sessionId = crypto.randomUUID()) {
  const raw = randomToken();
  const run = client ? (t, p) => client.query(t, p) : query;
  const row = await run(
    `INSERT INTO refresh_tokens (user_id, session_id, token_hash, expires_at)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [userId, sessionId, hashToken(raw), refreshExpiry()],
  );
  return { raw, id: row.rows[0].id, sessionId };
}

// Validates + rotates a refresh token. On success returns { raw, userId,
// sessionId } for the new token. Returns null on unknown/expired tokens. On
// reuse of an already-rotated/revoked token, revokes the whole family and
// returns null (forces re-login everywhere).
async function rotateRefreshToken(rawToken) {
  return withTransaction(async (client) => {
    const found = await client.query("SELECT * FROM refresh_tokens WHERE token_hash = $1", [
      hashToken(rawToken),
    ]);
    if (!found.rows.length) return null;
    const token = found.rows[0];

    if (token.revoked_at || token.replaced_by) {
      // Reuse of a rotated/revoked token — treat the session as compromised.
      await client.query(
        "UPDATE refresh_tokens SET revoked_at = now() WHERE session_id = $1 AND revoked_at IS NULL",
        [token.session_id],
      );
      return null;
    }
    if (new Date(token.expires_at) < new Date()) return null;

    const next = await issueRefreshToken(client, token.user_id, token.session_id);
    await client.query("UPDATE refresh_tokens SET replaced_by = $1, revoked_at = now() WHERE id = $2", [
      next.id,
      token.id,
    ]);
    return { raw: next.raw, userId: token.user_id, sessionId: token.session_id };
  });
}

// Revokes the family a token belongs to (logout). Silent if unknown.
async function revokeRefreshToken(rawToken) {
  const found = await query("SELECT session_id FROM refresh_tokens WHERE token_hash = $1", [
    hashToken(rawToken),
  ]);
  if (!found.rows.length) return;
  await query(
    "UPDATE refresh_tokens SET revoked_at = now() WHERE session_id = $1 AND revoked_at IS NULL",
    [found.rows[0].session_id],
  );
}

async function revokeAllForUser(userId) {
  await query("UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL", [
    userId,
  ]);
}

function emailTokenExpiry() {
  const d = new Date();
  d.setHours(d.getHours() + config.auth.emailTokenTtlHours);
  return d;
}

async function createEmailToken(userId, purpose) {
  const raw = randomToken();
  await query(
    "INSERT INTO email_tokens (user_id, purpose, token_hash, expires_at) VALUES ($1, $2, $3, $4)",
    [userId, purpose, hashToken(raw), emailTokenExpiry()],
  );
  return raw;
}

// Consumes a single-use email token. Returns the user_id or null.
async function consumeEmailToken(rawToken, purpose) {
  const row = await query(
    `UPDATE email_tokens SET used_at = now()
     WHERE token_hash = $1 AND purpose = $2 AND used_at IS NULL AND expires_at > now()
     RETURNING user_id`,
    [hashToken(rawToken), purpose],
  );
  return row.rows.length ? row.rows[0].user_id : null;
}

module.exports = {
  issueRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllForUser,
  createEmailToken,
  consumeEmailToken,
};
