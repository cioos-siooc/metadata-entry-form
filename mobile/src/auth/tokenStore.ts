import * as SecureStore from "expo-secure-store";

/**
 * Persistent session state.
 *
 * Two very different things live here:
 *
 *   - The refresh token, in the OS keychain. It is a real long-lived
 *     credential, so it goes nowhere else.
 *   - An identity *receipt* — who the user is, what roles they hold per region,
 *     and how long it may be trusted offline. Deliberately NOT a credential:
 *     nothing in it can be replayed against the server. It exists so a cold
 *     launch with no connectivity can still open the local cache instead of
 *     dumping the user at a login screen with a week of fieldwork behind it.
 *
 * The server never trusts the receipt. Every queued mutation is authorised at
 * flush time exactly as it is today, so this is a UX gate, not a security
 * boundary.
 */

const REFRESH_TOKEN_KEY = "cioos.refreshToken";
const RECEIPT_KEY = "cioos.identityReceipt";

export interface RegionRoles {
  isAdmin: boolean;
  isReviewer: boolean;
  isSuperadmin: boolean;
}

export interface IdentityReceipt {
  userID: string;
  email: string;
  displayName: string;
  /** Roles per region id — roles are per-region, there is no global role. */
  roles: Record<string, RegionRoles>;
  issuedAt: string;
  /** After this, the cache is purged and an online login is required. */
  offlineUntil: string;
}

export async function saveRefreshToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token, {
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
  });
}

export async function readRefreshToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  } catch {
    // A corrupt or inaccessible keychain entry must not crash startup.
    return null;
  }
}

export async function clearRefreshToken(): Promise<void> {
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY).catch(() => {});
}

export async function saveReceipt(receipt: IdentityReceipt): Promise<void> {
  await SecureStore.setItemAsync(RECEIPT_KEY, JSON.stringify(receipt));
}

export async function readReceipt(): Promise<IdentityReceipt | null> {
  try {
    const raw = await SecureStore.getItemAsync(RECEIPT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as IdentityReceipt;
    // Ignore anything malformed rather than trusting a partial object.
    if (!parsed?.userID || !parsed?.offlineUntil) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function clearReceipt(): Promise<void> {
  await SecureStore.deleteItemAsync(RECEIPT_KEY).catch(() => {});
}

/**
 * Whether a receipt may still unlock cached data.
 *
 * The window is bounded rather than indefinite so a lost phone stops being
 * readable eventually. `now` is injectable for tests.
 */
export function receiptIsValid(
  receipt: IdentityReceipt | null,
  now: number = Date.now(),
): boolean {
  if (!receipt) return false;
  const until = Date.parse(receipt.offlineUntil);
  if (Number.isNaN(until)) return false;
  return until > now;
}

/**
 * Build a receipt valid for `graceDays` from now.
 *
 * The app build can afford a long window because the refresh token lives in
 * the keychain, which is not subject to browser storage eviction. Keep it at or
 * under the server's native refresh TTL (90 days): if the token is dead there
 * is nothing to sync back to, so the cache should not outlive it.
 */
export function buildReceipt(
  identity: Omit<IdentityReceipt, "issuedAt" | "offlineUntil">,
  graceDays = 90,
  now: number = Date.now(),
): IdentityReceipt {
  return {
    ...identity,
    issuedAt: new Date(now).toISOString(),
    offlineUntil: new Date(now + graceDays * 24 * 60 * 60 * 1000).toISOString(),
  };
}
