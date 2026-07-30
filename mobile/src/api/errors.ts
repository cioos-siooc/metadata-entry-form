/**
 * Typed API failures.
 *
 * The web SPA's client lets a fetch rejection escape as a bare
 * `TypeError: Failed to fetch`, which is indistinguishable from a bug and
 * carries no status. That is the single biggest obstacle to offline support:
 * a mutation queue has to decide whether a failure is retryable, and it cannot
 * do that from a TypeError. So network failures get their own class here, and
 * every caller can branch on `isOffline`.
 */

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }

  /** The request never reached the server. */
  get isOffline(): boolean {
    return this.status === 0;
  }

  /**
   * Worth trying again later. Timeouts, throttling and server faults are
   * transient; a 4xx will fail identically forever and must not be retried.
   */
  get isRetryable(): boolean {
    return this.status === 0 || this.status === 429 || this.status >= 500;
  }

  /** The caller's session is gone — pause, don't retry.  */
  get isAuthFailure(): boolean {
    return this.status === 401;
  }
}

/** The request never left the device, or no response came back. */
export class NetworkError extends ApiError {
  constructor(message = "Network request failed", cause?: unknown) {
    super(0, message, cause);
    this.name = "NetworkError";
  }
}

/** Exceeded our own client-side deadline. Retryable, and offline-ish. */
export class TimeoutError extends NetworkError {
  constructor(ms: number) {
    super(`Request timed out after ${ms}ms`);
    this.name = "TimeoutError";
  }
}
