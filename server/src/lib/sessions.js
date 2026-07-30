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

function refreshExpiry(clientType = "web") {
  const d = new Date();
  const days =
    clientType === "native"
      ? config.auth.nativeRefreshTokenTtlDays
      : config.auth.refreshTokenTtlDays;
  d.setDate(d.getDate() + days);
  return d;
}

// Issues a refresh token. Omit sessionId at login (starts a new family); pass
// the existing sessionId during rotation. Returns { raw, id, sessionId }.
//
// `meta` carries native-session fields. Defaulted so the three existing web
// call sites are unaffected.
async function issueRefreshToken(
  client,
  userId,
  sessionId = crypto.randomUUID(),
  meta = {},
) {
  const { clientType = "web", deviceId = null, deviceName = null } = meta;
  const raw = randomToken();
  const run = client ? (t, p) => client.query(t, p) : query;
  const row = await run(
    `INSERT INTO refresh_tokens
       (user_id, session_id, token_hash, expires_at, client_type, device_id, device_name)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [userId, sessionId, hashToken(raw), refreshExpiry(clientType), clientType, deviceId, deviceName],
  );
  return { raw, id: row.rows[0].id, sessionId };
}

// True when a native client is replaying a token we rotated moments ago.
//
// Rotation normally treats any replay as a stolen token and revokes the whole
// family. That is right for a browser, where a lost response is rare and the
// user can simply log in again. It is wrong on a boat: if the refresh response
// is lost to a dropped LTE handoff, the app still holds the token it just
// spent, retries, and the family is destroyed — logging the user out in the
// field with no connectivity to recover. Inside a short window, a *native*
// replay is far more likely a lost response than an attack.
//
// Deliberately gated on client_type so browser behaviour is unchanged, and
// deliberately narrow: outside the window, reuse still nukes the family.
function isWithinNativeGrace(token) {
  if (token.client_type !== "native") return false;
  if (!token.revoked_at) return false;
  const graceMs = config.auth.nativeRefreshGraceSeconds * 1000;
  return Date.now() - new Date(token.revoked_at).getTime() <= graceMs;
}

// Validates + rotates a refresh token. On success returns { raw, userId,
// sessionId } for the new token. Returns null on unknown/expired tokens. On
// reuse of an already-rotated/revoked token, revokes the whole family and
// returns null (forces re-login everywhere) — except within the native grace
// window, where a fresh token is issued in the same family instead.
async function rotateRefreshToken(rawToken) {
  return withTransaction(async (client) => {
    const found = await client.query("SELECT * FROM refresh_tokens WHERE token_hash = $1", [
      hashToken(rawToken),
    ]);
    if (!found.rows.length) return null;
    const token = found.rows[0];

    if (token.revoked_at || token.replaced_by) {
      if (isWithinNativeGrace(token)) {
        // Treat as a lost response: hand back a new token in the same family
        // rather than revoking it. The successor from the original rotation is
        // retired so only one live token remains.
        if (token.replaced_by) {
          await client.query(
            "UPDATE refresh_tokens SET revoked_at = now() WHERE id = $1 AND revoked_at IS NULL",
            [token.replaced_by],
          );
        }
        const retry = await issueRefreshToken(client, token.user_id, token.session_id, {
          clientType: token.client_type,
          deviceId: token.device_id,
          deviceName: token.device_name,
        });
        await client.query("UPDATE refresh_tokens SET replaced_by = $1 WHERE id = $2", [
          retry.id,
          token.id,
        ]);
        return {
          raw: retry.raw,
          userId: token.user_id,
          sessionId: token.session_id,
          clientType: token.client_type,
          replayed: true,
        };
      }

      // Reuse of a rotated/revoked token — treat the session as compromised.
      await client.query(
        "UPDATE refresh_tokens SET revoked_at = now() WHERE session_id = $1 AND revoked_at IS NULL",
        [token.session_id],
      );
      return null;
    }
    if (new Date(token.expires_at) < new Date()) return null;

    // Carry the session's identity onto the successor.
    const next = await issueRefreshToken(client, token.user_id, token.session_id, {
      clientType: token.client_type,
      deviceId: token.device_id,
      deviceName: token.device_name,
    });
    await client.query(
      "UPDATE refresh_tokens SET replaced_by = $1, revoked_at = now(), last_used_at = now() WHERE id = $2",
      [next.id, token.id],
    );
    return {
      raw: next.raw,
      userId: token.user_id,
      sessionId: token.session_id,
      clientType: token.client_type,
      replayed: false,
    };
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

// --- Native OAuth codes ----------------------------------------------------
//
// Same single-use shape as email tokens, but seconds-lived and bound to a PKCE
// challenge the app generated. The code travels in a custom-scheme redirect,
// which is inherently leaky — OS logs, and any app may claim the scheme — so
// possession of the code alone must not be enough. Only the app holding the
// matching verifier can redeem it.

function pkceChallengeFor(verifier) {
  return crypto.createHash("sha256").update(verifier).digest("base64url");
}

async function createNativeAuthCode(userId, { appCodeChallenge, deviceId, deviceName }) {
  const raw = randomToken();
  const expires = new Date(Date.now() + config.auth.nativeAuthCodeTtlSeconds * 1000);
  await query(
    `INSERT INTO native_auth_codes
       (code_hash, user_id, app_code_challenge, device_id, device_name, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [hashToken(raw), userId, appCodeChallenge, deviceId || null, deviceName || null, expires],
  );
  return raw;
}

/**
 * Consumes a native auth code, verifying the PKCE verifier.
 *
 * Marks used atomically so a race cannot redeem it twice, then checks the
 * challenge. Returns { userId, deviceId, deviceName } or null.
 */
async function consumeNativeAuthCode(rawCode, codeVerifier) {
  if (!rawCode || !codeVerifier) return null;

  const row = await query(
    `UPDATE native_auth_codes SET used_at = now()
     WHERE code_hash = $1 AND used_at IS NULL AND expires_at > now()
     RETURNING user_id, app_code_challenge, code_challenge_method, device_id, device_name`,
    [hashToken(rawCode)],
  );
  if (!row.rows.length) return null;

  const record = row.rows[0];
  if (record.code_challenge_method !== "S256") return null;

  const expected = Buffer.from(record.app_code_challenge);
  const actual = Buffer.from(pkceChallengeFor(codeVerifier));
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
    return null;
  }

  return {
    userId: record.user_id,
    deviceId: record.device_id,
    deviceName: record.device_name,
  };
}

module.exports = {
  issueRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllForUser,
  createEmailToken,
  consumeEmailToken,
  createNativeAuthCode,
  consumeNativeAuthCode,
  pkceChallengeFor,
};
