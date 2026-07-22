import { ApiError } from "../api/client";

// Client-side auth against our own API (replaces Keycloak). The API issues a
// short-lived access token (held in memory, sent as a Bearer token by the API
// client) plus an httpOnly refresh cookie scoped to /api/v1/auth. Social login
// is a full-page redirect to the API's OAuth endpoints; local login/register
// post credentials directly.

const API = import.meta.env.VITE_API_BASE_URL || "/api";
const authUrl = (path) => new URL(`${API}/v1/auth${path}`, window.location.origin);

let accessToken = null;
let claims = null;
let accessTokenExp = 0; // epoch seconds
let refreshPromise = null;
let initPromise = null;

function decodeJwt(token) {
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

function setAccess(token) {
  accessToken = token || null;
  claims = token ? decodeJwt(token) : null;
  accessTokenExp = claims?.exp || 0;
}

async function doRefresh() {
  try {
    const res = await fetch(authUrl("/refresh"), { method: "POST", credentials: "include" });
    if (!res.ok) {
      setAccess(null);
      return null;
    }
    const data = await res.json();
    setAccess(data.accessToken);
    return accessToken;
  } catch {
    setAccess(null);
    return null;
  }
}

// Single-flight: parallel callers share one network refresh.
export function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

// Idempotent: UserProvider calls this on mount. Attempts a silent refresh from
// the httpOnly cookie and resolves whether a session was established.
export function initAuth() {
  if (!initPromise) initPromise = refreshAccessToken().then((t) => Boolean(t));
  return initPromise;
}

export async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  if (accessToken && accessTokenExp - now > 30) return accessToken;
  return refreshAccessToken();
}

export function currentUser() {
  if (!accessToken || !claims) return null;
  return {
    uid: claims.sub,
    email: claims.email,
    displayName: claims.name || claims.email,
  };
}

async function postAuth(path, body) {
  const res = await fetch(authUrl(path), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", "X-Requested-With": "fetch" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  if (!res.ok) throw new ApiError(res.status, json?.error || res.statusText, json);
  return json;
}

const oauthStart = (provider) => {
  const url = authUrl(`/oauth/${provider}/start`);
  url.searchParams.set("returnTo", window.location.href);
  window.location.assign(url.toString());
};

export const signInWithGoogle = () => oauthStart("google");
export const signInWithMicrosoft = () => oauthStart("microsoft");
export const signInWithOrcid = () => oauthStart("orcid");

// Local email + password. Returns the signed-in user on success; throws
// ApiError (401/403) otherwise so the UI can surface the message.
export async function signInWithPassword({ email, password }) {
  const data = await postAuth("/login", { email, password });
  setAccess(data.accessToken);
  initPromise = Promise.resolve(true);
  return currentUser();
}

// Creates a local account. The server sends a verification email and returns a
// generic acknowledgement (no account enumeration).
export async function register({ email, password, name }) {
  return postAuth("/register", { email, password, name });
}

export async function verifyEmail(token) {
  return postAuth("/verify-email", { token });
}

export async function requestPasswordReset(email) {
  return postAuth("/password/reset/request", { email });
}

export async function resetPassword({ token, newPassword }) {
  return postAuth("/password/reset", { token, newPassword });
}

export async function signOut() {
  try {
    await fetch(authUrl("/logout"), {
      method: "POST",
      credentials: "include",
      headers: { "X-Requested-With": "fetch" },
    });
  } catch {
    // best-effort; clear local state regardless
  }
  setAccess(null);
  initPromise = null;
}
