const crypto = require("crypto");
const { SignJWT, createLocalJWKSet } = require("jose");
const config = require("../config");

// The API signs short-lived RS256 access tokens with its own keypair and
// verifies them locally (plugins/auth.js) — no external IdP round-trip. The
// public key is exposed as a JWK set so the verify path (and any external
// consumer) can validate signatures.

// Node KeyObjects; jose accepts these directly for sign/verify.
const privateKey = crypto.createPrivateKey(config.auth.privateKeyPem);

const publicJwk = crypto.createPublicKey(config.auth.publicKeyPem).export({ format: "jwk" });
publicJwk.kid = config.auth.kid;
publicJwk.alg = "RS256";
publicJwk.use = "sig";

// Local (in-memory) JWK set for jwtVerify. Same callable shape as
// createRemoteJWKSet, so plugins/auth.js can use either interchangeably.
const localJwks = createLocalJWKSet({ keys: [publicJwk] });

// Signs an access token for a users row. sub is our internal user id, so the
// verify path just loads the row by id — no JIT provisioning per request.
async function signAccessToken(user) {
  return new SignJWT({
    email: user.email,
    email_verified: user.email_verified ?? true,
    name: user.display_name || null,
    token_use: "access",
  })
    .setProtectedHeader({ alg: "RS256", kid: config.auth.kid })
    .setSubject(user.id)
    .setIssuer(config.auth.issuer)
    .setAudience(config.auth.audience)
    .setIssuedAt()
    .setJti(crypto.randomUUID())
    .setExpirationTime(config.auth.accessTokenTtl)
    .sign(privateKey);
}

module.exports = { signAccessToken, localJwks, publicJwk };
