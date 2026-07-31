// Helpers shared by the browser auth routes (routes/auth.js) and the native
// ones (routes/authNative.js). Extracted verbatim so the two route files can
// diverge in transport without duplicating policy.

const argon2 = require("@node-rs/argon2");
const config = require("../config");
const { query } = require("../db");
const { appendCookie } = require("./cookies");

const REFRESH_COOKIE = "refresh_token";
const REFRESH_PATH = "/api/v1/auth";
const MIN_PASSWORD = 8;

function refreshCookieOpts() {
  return {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    domain: config.cookie.domain,
    path: REFRESH_PATH,
  };
}

function setRefreshCookie(reply, raw) {
  appendCookie(reply, REFRESH_COOKIE, raw, {
    ...refreshCookieOpts(),
    maxAge: config.auth.refreshTokenTtlDays * 24 * 60 * 60,
  });
}

function clearRefreshCookie(reply) {
  appendCookie(reply, REFRESH_COOKIE, "", { ...refreshCookieOpts(), maxAge: 0 });
}

function publicUser(user) {
  return { userID: user.id, email: user.email, displayName: user.display_name };
}

/**
 * Where OAuth may send the browser — or the app — after sign-in.
 *
 * Compares origins rather than string prefixes. The previous
 * `returnTo.startsWith(config.spaBaseUrl)` accepted
 * `https://form.example.org.evil.com/…` whenever spaBaseUrl was
 * `https://form.example.org`, which is an open redirect.
 *
 * `allowNative` must be derived from the persisted `oauth_flows.client_type`,
 * never from a query parameter on the callback — otherwise an attacker can opt
 * a browser flow into accepting an app-scheme redirect.
 */
function safeReturnTo(returnTo, { allowNative = false } = {}) {
  if (typeof returnTo !== "string" || returnTo === "") return config.spaBaseUrl;

  let url;
  try {
    url = new URL(returnTo);
  } catch {
    return config.spaBaseUrl;
  }

  let spaOrigin;
  try {
    spaOrigin = new URL(config.spaBaseUrl).origin;
  } catch {
    return config.spaBaseUrl;
  }

  if (url.origin === spaOrigin) return url.href;

  // Custom schemes are "non-special", so URL gives them origin "null" and the
  // comparison above can never match. Check the scheme itself instead.
  if (allowNative) {
    const scheme = url.protocol.replace(/:$/, "");
    if (config.nativeRedirectSchemes.includes(scheme)) return url.href;
  }

  return config.spaBaseUrl;
}

// A real argon2id hash of a value nobody knows, verified against when the
// email is unknown so response time doesn't reveal whether an account exists.
const DUMMY_HASH =
  "$argon2id$v=19$m=19456,t=2,p=1$c29tZXNhbHRzb21lc2FsdA$0000000000000000000000000000000000000000000";

/**
 * Verify email + password. Shared by the browser and native login routes so
 * the constant-time behaviour and the email-verified gate cannot drift apart.
 *
 * @returns {Promise<{ user: object } | { status: number, error: string }>}
 */
async function verifyCredentials(email, password) {
  if (!email || !password) {
    return { status: 400, error: "Email and password are required" };
  }
  const normEmail = String(email).trim().toLowerCase();

  const row = await query("SELECT * FROM users WHERE email = $1", [normEmail]);
  const user = row.rows[0];
  const hash = user?.password_hash;

  const ok = await argon2.verify(hash || DUMMY_HASH, password).catch(() => false);
  if (!user || !hash || !ok) {
    return { status: 401, error: "Invalid email or password" };
  }
  if (!user.email_verified) {
    return { status: 403, error: "Please verify your email address before signing in" };
  }
  return { user };
}

/** Access-token lifetime in seconds, from the "15m"-style config string. */
function accessTokenTtlSeconds() {
  const raw = String(config.auth.accessTokenTtl).trim();
  const match = /^(\d+)\s*([smhd])?$/.exec(raw);
  if (!match) return 900;
  const value = parseInt(match[1], 10);
  const unit = match[2] || "s";
  return value * { s: 1, m: 60, h: 3600, d: 86400 }[unit];
}

module.exports = {
  REFRESH_COOKIE,
  REFRESH_PATH,
  MIN_PASSWORD,
  verifyCredentials,
  accessTokenTtlSeconds,
  refreshCookieOpts,
  setRefreshCookie,
  clearRefreshCookie,
  publicUser,
  safeReturnTo,
};
