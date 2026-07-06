require("dotenv").config();

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable ${name}`);
  return value;
}

const config = {
  port: parseInt(process.env.PORT || "3001", 10),
  host: process.env.HOST || "0.0.0.0",
  logLevel: process.env.LOG_LEVEL || "info",

  databaseUrl: required("DATABASE_URL"),

  keycloak: {
    // e.g. http://localhost:8080/auth/realms/cioos (public issuer as it appears in tokens)
    issuer: required("KEYCLOAK_ISSUER"),
    // Where the API can actually reach Keycloak for JWKS (inside docker this
    // differs from the public issuer URL). Defaults to the issuer.
    internalIssuer: process.env.KEYCLOAK_INTERNAL_ISSUER || null,
    audience: process.env.KEYCLOAK_AUDIENCE || "metadata-form",
  },

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
