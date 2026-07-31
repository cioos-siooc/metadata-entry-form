require("dotenv").config();
const { generateKeyPairSync, createPrivateKey, createPublicKey } = require("crypto");

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable ${name}`);
  return value;
}

// Builds the ordered list of PEM interpretations to try for a raw env value:
// raw PEM, \n-unescaped PEM, and base64-decoded PEM. Deduped.
function pemCandidates(raw) {
  const trimmed = raw.trim();
  const out = [trimmed, trimmed.replace(/\\n/g, "\n")];
  try {
    const decoded = Buffer.from(trimmed, "base64").toString("utf8");
    if (decoded.includes("BEGIN")) out.push(decoded, decoded.replace(/\\n/g, "\n"));
  } catch {
    // not base64; ignore
  }
  return [...new Set(out)];
}

// Loads and VALIDATES an RSA signing key from env. Accepts raw PEM (real or
// \n-escaped) or base64-encoded PEM, so the value survives any env/UI field.
// Throws a clear, redacted error (never the opaque OpenSSL DECODER trace) if
// nothing parses.
function loadKey(name, kind) {
  const raw = process.env[name];
  if (!raw) return null;
  const parse = kind === "private" ? createPrivateKey : createPublicKey;
  for (const pem of pemCandidates(raw)) {
    try {
      parse(pem);
      return pem;
    } catch {
      // try next interpretation
    }
  }
  const t = raw.trim();
  throw new Error(
    `${name} could not be parsed as an RSA ${kind} key ` +
      `(length=${t.length}, hasBEGIN=${t.includes("BEGIN")}, ` +
      `looksBase64=${/^[A-Za-z0-9+/=\s]+$/.test(t)}). ` +
      `Provide a PEM or base64-encoded PEM (base64 -w0 jwt.${kind === "private" ? "key" : "pub"}).`,
  );
}

// The API signs its own access tokens (RS256). Outside production we fall back
// to an ephemeral keypair so `npm run dev` works with no setup — tokens just
// don't survive a restart.
function loadSigningKeys() {
  let privateKey = loadKey("JWT_PRIVATE_KEY", "private");
  let publicKey = loadKey("JWT_PUBLIC_KEY", "public");
  if (!privateKey || !publicKey) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_PRIVATE_KEY and JWT_PUBLIC_KEY are required in production");
    }
    const pair = generateKeyPairSync("rsa", { modulusLength: 2048 });
    privateKey = pair.privateKey.export({ type: "pkcs8", format: "pem" });
    publicKey = pair.publicKey.export({ type: "spki", format: "pem" });
    console.warn("[config] JWT_PRIVATE_KEY/JWT_PUBLIC_KEY not set; using an ephemeral dev keypair");
  } else {
    console.log("[config] auth signing keys loaded and validated");
  }
  return { privateKey, publicKey };
}

function oauthProvider(prefix, discoveryUrl, scopes) {
  const clientId = process.env[`OAUTH_${prefix}_CLIENT_ID`] || null;
  const clientSecret = process.env[`OAUTH_${prefix}_CLIENT_SECRET`] || null;
  return {
    clientId,
    clientSecret,
    discoveryUrl: process.env[`OAUTH_${prefix}_DISCOVERY_URL`] || discoveryUrl,
    scopes,
    enabled: Boolean(clientId && clientSecret),
  };
}

const signingKeys = loadSigningKeys();

// e.g. https://form.example.org — origin of the SPA. Used for OAuth redirect
// targets, email links, and the redirect/CORS allowlist.
const spaBaseUrl = (process.env.SPA_URL || process.env.PUBLIC_URL || "http://localhost:3000").replace(
  /\/+$/,
  "",
);

// Public origin the API is reached at (for OAuth redirect_uri). In the
// same-origin nginx setup this equals spaBaseUrl; override with API_URL only
// if the API is served from a different host.
const apiBaseUrl = (process.env.API_URL || spaBaseUrl).replace(/\/+$/, "");

const oauth = {
  google: oauthProvider(
    "GOOGLE",
    "https://accounts.google.com/.well-known/openid-configuration",
    ["openid", "email", "profile"],
  ),
  microsoft: oauthProvider(
    "MICROSOFT",
    "https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration",
    ["openid", "email", "profile"],
  ),
  orcid: oauthProvider("ORCID", "https://orcid.org/.well-known/openid-configuration", ["openid"]),
};

const config = {
  port: parseInt(process.env.PORT || "3001", 10),
  host: process.env.HOST || "0.0.0.0",
  logLevel: process.env.LOG_LEVEL || "info",

  databaseUrl: required("DATABASE_URL"),

  // This API is its own token issuer. `issuer`/`audience` are baked into the
  // access tokens it signs and checked on every request in plugins/auth.js.
  auth: {
    issuer: process.env.AUTH_ISSUER || spaBaseUrl,
    audience: process.env.AUTH_AUDIENCE || "metadata-form",
    kid: process.env.JWT_KID || "cioos-1",
    privateKeyPem: signingKeys.privateKey,
    publicKeyPem: signingKeys.publicKey,
    accessTokenTtl: process.env.ACCESS_TOKEN_TTL || "15m",
    // Refresh token lifetime in days.
    refreshTokenTtlDays: parseInt(process.env.REFRESH_TOKEN_TTL_DAYS || "30", 10),
    // Native clients get longer: a field crew can be offline for most of a
    // season, and 30 days is not enough to guarantee they can still sign in.
    nativeRefreshTokenTtlDays: parseInt(
      process.env.NATIVE_REFRESH_TOKEN_TTL_DAYS || "90",
      10,
    ),
    // Grace period for refresh-token reuse from a NATIVE client only.
    //
    // Rotation normally treats a replayed token as a compromised session and
    // revokes the whole family. That is right in a browser and dangerous on a
    // boat: if the refresh response is lost to a dropped LTE handoff, the app
    // still holds a token it has already spent, retries, and the user is
    // logged out in the field with no network to log back in. Inside this
    // window a native replay is treated as a lost response, not an attack.
    nativeRefreshGraceSeconds: parseInt(
      process.env.NATIVE_REFRESH_GRACE_SECONDS || "60",
      10,
    ),
    // Single-use code handed to a native app after OAuth, exchanged for tokens.
    nativeAuthCodeTtlSeconds: parseInt(
      process.env.NATIVE_AUTH_CODE_TTL_SECONDS || "60",
      10,
    ),
    // Verify/reset email links valid for this many hours.
    emailTokenTtlHours: parseInt(process.env.EMAIL_TOKEN_TTL_HOURS || "24", 10),
  },

  // URL schemes a native build may be redirected back to after OAuth, e.g.
  // "ca.cioos.metadata". Empty by default: a deployment that has not
  // registered an app scheme must not accept redirects to one.
  nativeRedirectSchemes: (process.env.NATIVE_REDIRECT_SCHEMES || "")
    .split(",")
    .map((s) => s.trim().replace(/:$/, ""))
    .filter(Boolean),

  // Cookie attributes for the refresh cookie (path-scoped to /api/v1/auth) and
  // the transient OAuth flow cookie. sameSite=lax is correct for a same-origin
  // SPA; switch to "none" (with secure) only if the SPA and API are cross-origin.
  cookie: {
    secure: process.env.COOKIE_SECURE !== "false",
    sameSite: process.env.COOKIE_SAMESITE || "lax",
    domain: process.env.COOKIE_DOMAIN || undefined,
  },

  spaBaseUrl,
  apiBaseUrl,
  oauth,
  enabledProviders: Object.entries(oauth)
    .filter(([, p]) => p.enabled)
    .map(([name]) => name),

  // 32-byte hex key for AES-256-GCM encryption of per-region credentials
  credentialsEncKey: process.env.CREDENTIALS_ENC_KEY || null,

  // Comma-separated emails treated as superadmins in addition to the
  // superadmins table (bootstrap path, not revocable via the API).
  superadminEmails: (process.env.SUPERADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),

  smtp: {
    host: process.env.SMTP_HOST || null,
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER || null,
    pass: process.env.SMTP_PASS || null,
    from: process.env.SMTP_FROM || process.env.SMTP_USER || null,
  },

  cohereApiKey: process.env.COHERE_API_KEY || null,
  // token used to open GitHub issues for hakai submissions (issue.js port)
  githubAuth: process.env.GITHUB_AUTH || null,

  converterUrl: process.env.CONVERTER_URL || "http://converter:8000",
};

module.exports = config;
