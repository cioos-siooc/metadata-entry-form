/**
 * Where the API lives, at runtime.
 *
 * Storage-free on purpose: transport.ts reads this on every request, and
 * pulling the key-value store in here would drag a native module into the
 * request path — and into every test that touches HTTP.
 *
 * Persistence lives in devSettings.ts, which sets the value at launch.
 */

/** The build-time default, used whenever no override is set. */
export const DEFAULT_API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api";

let override: string | null = null;

/** The address every request should use right now. */
export function apiBaseUrl(): string {
  return override || DEFAULT_API_BASE_URL;
}

export function apiBaseOverride(): string | null {
  return override;
}

/** Sets the in-memory value. Callers that want it to survive relaunch use
 *  devSettings.setApiBaseOverride instead. */
export function applyApiBaseOverride(url: string | null): void {
  override = normalizeBaseUrl(url);
}

/**
 * Tidies a hand-typed address.
 *
 * Trailing slashes are stripped because paths are appended directly, and a
 * bare host gets http:// so `192.168.1.20:3001/api` works as typed — which is
 * how anyone actually enters it.
 */
export function normalizeBaseUrl(value: string | null | undefined): string | null {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return null;

  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
  try {
    // Validates, and rejects anything unusable rather than storing junk.
    new URL(withScheme);
  } catch {
    return null;
  }
  return withScheme.replace(/\/+$/, "");
}
