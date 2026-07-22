// Test harness: builds the app with a locally-generated keypair standing in
// for the API's own signing key, so tests can mint arbitrary identities.
// Requires a running postgres (docker-compose.dev.yml) — set DATABASE_URL or
// default to the dev compose port.

process.env.DATABASE_URL =
  process.env.DATABASE_URL || "postgres://cioos:devpassword@localhost:5433/cioos_metadata";
process.env.AUTH_ISSUER = process.env.AUTH_ISSUER || "http://test-issuer";
process.env.CREDENTIALS_ENC_KEY =
  process.env.CREDENTIALS_ENC_KEY ||
  "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f";
process.env.SUPERADMIN_EMAILS = process.env.SUPERADMIN_EMAILS || "env-super@test.example";

const { generateKeyPairSync, randomUUID } = require("crypto");
const { SignJWT, createLocalJWKSet, exportJWK } = require("jose");

const ISSUER = "http://test-issuer";
const AUDIENCE = "metadata-form";

let keyPair;
let jwks;

async function getAuthOptions() {
  if (!jwks) {
    keyPair = generateKeyPairSync("rsa", { modulusLength: 2048 });
    const publicJwk = await exportJWK(keyPair.publicKey);
    publicJwk.kid = "test-key";
    publicJwk.alg = "RS256";
    jwks = createLocalJWKSet({ keys: [publicJwk] });
  }
  return { jwks, issuer: ISSUER, audience: AUDIENCE };
}

function signRaw({ sub, email, name = "Test User", emailVerified = true } = {}) {
  return new SignJWT({
    email: email ?? `user-${randomUUID()}@test.example`,
    email_verified: emailVerified,
    name,
  })
    .setProtectedHeader({ alg: "RS256", kid: "test-key" })
    .setSubject(sub ?? randomUUID())
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime("5m")
    .sign(keyPair.privateKey);
}

// Mints a token for an identity. Verification now loads the user by id
// (sub = users.id), so unless an explicit `sub` is given this provisions a
// users row (idempotent on email) and signs its id — matching how the real
// login/refresh routes mint tokens. Pass an explicit `sub` to mint a token for
// a non-existent user (negative-path tests).
async function signToken({ sub, email, name = "Test User", emailVerified = true } = {}) {
  if (sub) return signRaw({ sub, email, name, emailVerified });
  // eslint-disable-next-line global-require
  const { query } = require("../src/db");
  const mail = email ?? `user-${randomUUID()}@test.example`;
  const row = await query(
    `INSERT INTO users (email, display_name, email_verified)
     VALUES ($1, $2, $3)
     ON CONFLICT (email) DO UPDATE SET display_name = COALESCE(users.display_name, EXCLUDED.display_name)
     RETURNING id, email, display_name`,
    [mail, name, emailVerified],
  );
  const user = row.rows[0];
  return signRaw({ sub: user.id, email: user.email, name: user.display_name, emailVerified });
}

async function buildTestApp() {
  const auth = await getAuthOptions();
  // Late require so DATABASE_URL default above wins.
  // eslint-disable-next-line global-require
  const { buildApp } = require("../src/app");
  const app = buildApp({ logger: false, auth });
  await app.ready();
  return app;
}

function authHeader(token) {
  return { authorization: `Bearer ${token}` };
}

// Shared env-configured superadmin (SUPERADMIN_EMAILS above). Pre-provisions
// the user row so parallel test files can all mint tokens for it.
async function envSuperadmin() {
  const email = "env-super@test.example";
  return { email, token: await signToken({ email, name: "Env Superadmin" }) };
}

module.exports = { buildTestApp, signToken, authHeader, envSuperadmin };
