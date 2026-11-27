import { apiBaseUrl } from "@/state/apiBase";

import { ApiError, NetworkError, TimeoutError } from "./errors";

/**
 * Raw HTTP, with no knowledge of auth.
 *
 * Split from client.ts so the auth routes can use it without a circular
 * import — session.ts needs to POST to /auth/token, but client.ts needs
 * session.ts for the bearer token.
 */

/**
 * The API root, read per request rather than captured once: a dev override can
 * repoint the app at another server without a reload, and a value frozen at
 * module load would leave half the app talking to the old one.
 */
export const apiRoot = apiBaseUrl;

/**
 * Deliberately shorter than nginx's 60s default. On a marginal link the useful
 * behaviour is to give up and let the mutation queue retry with backoff, not to
 * hold a request open for a minute while the user waits.
 */
export const REQUEST_TIMEOUT_MS = 20_000;

export interface RequestOptions {
  method?: string;
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined | null>;
  headers?: Record<string, string>;
  timeoutMs?: number;
}

function buildUrl(path: string, params?: RequestOptions["params"]): string {
  const url = new URL(`${apiBaseUrl()}/v1${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

/**
 * Performs one request. Never throws anything untyped: a fetch rejection
 * becomes a NetworkError, a deadline becomes a TimeoutError, and an HTTP error
 * becomes an ApiError carrying the parsed body.
 */
export async function rawRequest<T>(
  path: string,
  { method = "GET", body, params, headers, timeoutMs = REQUEST_TIMEOUT_MS }: RequestOptions = {},
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(buildUrl(path, params), {
      method,
      signal: controller.signal,
      headers: {
        ...(body !== undefined && { "Content-Type": "application/json" }),
        ...headers,
      },
      ...(body !== undefined && { body: JSON.stringify(body) }),
    });
  } catch (err) {
    if (controller.signal.aborted) throw new TimeoutError(timeoutMs);
    throw new NetworkError(
      err instanceof Error ? err.message : "Network request failed",
      err,
    );
  } finally {
    clearTimeout(timer);
  }

  const text = await response.text().catch(() => "");
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      // The server has no error handler for some failure modes, so a 4xx/5xx
      // body is not guaranteed to be JSON. Keep the text rather than masking
      // the real status with a parse error.
      parsed = { error: text.slice(0, 500) };
    }
  }

  if (!response.ok) {
    const message =
      (parsed as { error?: string } | null)?.error || response.statusText || "Request failed";
    throw new ApiError(response.status, message, parsed);
  }

  return parsed as T;
}

/** Unauthenticated POST, used by the auth routes themselves. */
export function postJson<T>(path: string, body: unknown): Promise<T> {
  return rawRequest<T>(path, { method: "POST", body });
}
