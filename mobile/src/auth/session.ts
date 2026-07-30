import { API_BASE_URL, postJson } from "@/api/transport";
import { ApiError, NetworkError } from "@/api/errors";

import {
  buildReceipt,
  clearReceipt,
  clearRefreshToken,
  readRefreshToken,
  readReceipt,
  receiptIsValid,
  saveReceipt,
  saveRefreshToken,
  type IdentityReceipt,
} from "./tokenStore";

/**
 * Session state and the native token exchange.
 *
 * One thing here that the web SPA gets wrong and this must not: its `doRefresh`
 * collapses a network failure and a real 401 into the same `return null`, so
 * the app cannot tell "you are offline" from "you are signed out". That is
 * precisely why offline start-up is impossible there. Here the two are
 * distinct, and only a genuine 401 clears the stored credential.
 */

export interface SessionUser {
  userID: string;
  email: string;
  displayName: string;
}

interface TokenResponse {
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  user: SessionUser;
}

export type SessionStatus =
  | { state: "signedOut" }
  | { state: "online"; user: SessionUser }
  /** Cold-started with no connectivity, running on a cached receipt. */
  | { state: "offline"; user: SessionUser; receipt: IdentityReceipt };

let accessToken: string | null = null;
let accessTokenExpiresAt = 0;
let currentUser: SessionUser | null = null;
let refreshPromise: Promise<string | null> | null = null;

/** Refresh this far before expiry so in-flight requests don't race the clock. */
const EXPIRY_SKEW_SECONDS = 60;

function applyTokens(payload: TokenResponse) {
  accessToken = payload.accessToken;
  accessTokenExpiresAt = Date.now() + payload.expiresIn * 1000;
  currentUser = payload.user;
}

function clearMemory() {
  accessToken = null;
  accessTokenExpiresAt = 0;
  currentUser = null;
}

async function persist(payload: TokenResponse, roles: IdentityReceipt["roles"] = {}) {
  await saveRefreshToken(payload.refreshToken);
  await saveReceipt(buildReceipt({ ...payload.user, roles }));
}

/** Email + password against the native token endpoint. */
export async function signInWithPassword(
  email: string,
  password: string,
  device: { deviceId?: string; deviceName?: string } = {},
): Promise<SessionUser> {
  const payload = await postJson<TokenResponse>("/auth/token", {
    email,
    password,
    ...device,
  });
  applyTokens(payload);
  await persist(payload);
  return payload.user;
}

/** Completes native OAuth by trading the single-use code for tokens. */
export async function exchangeOAuthCode(
  code: string,
  codeVerifier: string,
  device: { deviceId?: string; deviceName?: string } = {},
): Promise<SessionUser> {
  const payload = await postJson<TokenResponse>("/auth/token/exchange", {
    code,
    codeVerifier,
    ...device,
  });
  applyTokens(payload);
  await persist(payload);
  return payload.user;
}

async function doRefresh(): Promise<string | null> {
  const stored = await readRefreshToken();
  if (!stored) {
    clearMemory();
    return null;
  }

  try {
    const payload = await postJson<TokenResponse>("/auth/token/refresh", {
      refreshToken: stored,
    });
    applyTokens(payload);
    // Rotation means the old token is spent; persist the new one immediately,
    // before anything else can fail.
    await saveRefreshToken(payload.refreshToken);
    const receipt = await readReceipt();
    await saveReceipt(buildReceipt({ ...payload.user, roles: receipt?.roles ?? {} }));
    return payload.accessToken;
  } catch (err) {
    // The distinction the SPA loses. Offline is not signed out: keep the
    // credential so the session survives to the next connection.
    if (err instanceof NetworkError) throw err;
    if (err instanceof ApiError && err.isAuthFailure) {
      await signOut();
      return null;
    }
    throw err;
  }
}

/** Single-flight: parallel callers share one refresh round trip. */
export function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

/**
 * A usable access token, refreshing if needed.
 *
 * Throws NetworkError when offline rather than returning null, so callers
 * cannot mistake "unreachable" for "unauthenticated".
 */
export async function getAccessToken(): Promise<string | null> {
  if (accessToken && accessTokenExpiresAt - Date.now() > EXPIRY_SKEW_SECONDS * 1000) {
    return accessToken;
  }
  return refreshAccessToken();
}

/**
 * Restore a session at launch.
 *
 * Tries the network first. If that fails for connectivity reasons and a valid
 * receipt exists, comes up in `offline` state with read access to whatever is
 * cached — which is the whole point of the receipt.
 */
export async function restoreSession(): Promise<SessionStatus> {
  const receipt = await readReceipt();

  try {
    const token = await refreshAccessToken();
    if (token && currentUser) return { state: "online", user: currentUser };
    return { state: "signedOut" };
  } catch (err) {
    if (err instanceof NetworkError && receiptIsValid(receipt) && receipt) {
      return {
        state: "offline",
        user: {
          userID: receipt.userID,
          email: receipt.email,
          displayName: receipt.displayName,
        },
        receipt,
      };
    }
    // Offline with an expired receipt is signed out: the cache has outlived
    // its window and must not be opened.
    if (err instanceof NetworkError) {
      await purgeLocalSession();
      return { state: "signedOut" };
    }
    throw err;
  }
}

/** Records the per-region roles onto the receipt so they survive offline. */
export async function rememberRegionRoles(
  region: string,
  roles: IdentityReceipt["roles"][string],
): Promise<void> {
  const receipt = await readReceipt();
  if (!receipt) return;
  await saveReceipt({ ...receipt, roles: { ...receipt.roles, [region]: roles } });
}

export async function signOut(): Promise<void> {
  const stored = await readRefreshToken();
  if (stored) {
    // Best effort — signing out must work offline too.
    await postJson("/auth/token/revoke", { refreshToken: stored }).catch(() => {});
  }
  await purgeLocalSession();
}

/** Drops all local session state without contacting the server. */
export async function purgeLocalSession(): Promise<void> {
  clearMemory();
  await clearRefreshToken();
  await clearReceipt();
}

export function getCurrentUser(): SessionUser | null {
  return currentUser;
}

export { API_BASE_URL };
