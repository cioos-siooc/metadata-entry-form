// Test harness: builds the app with a locally-generated keypair standing in
// for Keycloak, so tests can mint arbitrary identities.
// Requires a running postgres (docker-compose.dev.yml) — set DATABASE_URL or
// default to the dev compose port.

process.env.DATABASE_URL =
  process.env.DATABASE_URL || "postgres://cioos:devpassword@localhost:5433/cioos_metadata";
process.env.KEYCLOAK_ISSUER = process.env.KEYCLOAK_ISSUER || "http://test-issuer/realms/cioos";
process.env.CREDENTIALS_ENC_KEY =
  process.env.CREDENTIALS_ENC_KEY ||
  "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f";

const { generateKeyPairSync, randomUUID } = require("crypto");
const { SignJWT, createLocalJWKSet, exportJWK } = require("jose");

const ISSUER = "http://test-issuer/realms/cioos";
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

// Mints a token for an identity; sub/email default to fresh unique values.
async function signToken({ sub, email, name = "Test User", emailVerified = true } = {}) {
  const id = randomUUID();
  return new SignJWT({
    email: email ?? `user-${id}@test.example`,
    email_verified: emailVerified,
    name,
  })
    .setProtectedHeader({ alg: "RS256", kid: "test-key" })
    .setSubject(sub ?? `sub-${id}`)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime("5m")
    .sign(keyPair.privateKey);
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

module.exports = { buildTestApp, signToken, authHeader };
