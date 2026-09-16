import { getAccessToken, refreshAccessToken } from "@/auth/session";

import { ApiError } from "./errors";
import { rawRequest, type RequestOptions } from "./transport";

/**
 * Authenticated API access.
 *
 * The single place that attaches a bearer token and handles a mid-flight
 * expiry. Deliberately does NOT contain the offline queue: at this layer a
 * queueable `PUT /records/:id` is indistinguishable from an unqueueable
 * `POST /translate`, and a URL cannot be deferred. The queue sits above this,
 * in the record-specific modules.
 */

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = await getAccessToken();

  const withAuth = (bearer: string | null): RequestOptions => ({
    ...options,
    headers: {
      ...options.headers,
      ...(bearer && { Authorization: `Bearer ${bearer}` }),
    },
  });

  try {
    return await rawRequest<T>(path, withAuth(token));
  } catch (err) {
    // The token can expire between the proactive check and the request landing.
    // Refresh once and retry; anything else propagates untouched, including
    // NetworkError, which the caller must be able to distinguish.
    if (err instanceof ApiError && err.isAuthFailure) {
      const refreshed = await refreshAccessToken();
      if (refreshed) return rawRequest<T>(path, withAuth(refreshed));
    }
    throw err;
  }
}

export const get = <T>(path: string, params?: RequestOptions["params"]) =>
  apiFetch<T>(path, { params });

export const post = <T>(path: string, body?: unknown) =>
  apiFetch<T>(path, { method: "POST", body });

export const put = <T>(path: string, body?: unknown, headers?: Record<string, string>) =>
  apiFetch<T>(path, { method: "PUT", body, headers });

export const del = <T>(path: string, body?: unknown) =>
  apiFetch<T>(path, { method: "DELETE", body });
