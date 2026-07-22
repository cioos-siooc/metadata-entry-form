require("dotenv").config();
const { generateKeyPairSync } = require("crypto");

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable ${name}`);
  return value;
}

// Accepts a signing key as either a PEM (real or \n-escaped newlines) or, more
// robustly for env/UI fields, base64-encoded PEM (a single line that cannot be
// mangled by newline handling). Returns PEM text.
function readPem(name) {
  const raw = process.env[name];
  if (!raw) return null;
  const trimmed = raw.trim();
  if (trimmed.includes("BEGIN")) return trimmed.replace(/\\n/g, "\n");
  // No PEM header -> assume base64-encoded PEM.
  return Buffer.from(trimmed, "base64").toString("utf8");
}

// The API signs its own access tokens (RS256). Keys come from JWT_PRIVATE_KEY /
// JWT_PUBLIC_KEY (PEM). Outside production we fall back to an ephemeral keypair
// so `npm run dev` works with no setup — tokens just don't survive a restart.
function loadSigningKeys() {
  let privateKey = readPem("JWT_PRIVATE_KEY");
  let publicKey = readPem("JWT_PUBLIC_KEY");
  if (!privateKey || !publicKey) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_PRIVATE_KEY and JWT_PUBLIC_KEY are required in production");
    }
    const pair = generateKeyPairSync("rsa", { modulusLength: 2048 });
    privateKey = pair.privateKey.export({ type: "pkcs8", format: "pem" });
    publicKey = pair.publicKey.export({ type: "spki", format: "pem" });
    console.warn("[config] JWT_PRIVATE_KEY/JWT_PUBLIC_KEY not set; using an ephemeral dev keypair");
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
    // Verify/reset email links valid for this many hours.
    emailTokenTtlHours: parseInt(process.env.EMAIL_TOKEN_TTL_HOURS || "24", 10),
  },

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
