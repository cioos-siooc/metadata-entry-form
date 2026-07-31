import { afterEach, describe, expect, test, vi } from "vitest";

import { ApiError, NetworkError, TimeoutError } from "../errors";
import { rawRequest } from "../transport";

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

/** Asserts the call rejects, and returns the error typed. */
async function rejection(fn: () => Promise<unknown>): Promise<ApiError> {
  try {
    await fn();
  } catch (err) {
    return err as ApiError;
  }
  throw new Error("expected the request to reject, but it resolved");
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("error classification", () => {
  test("offline is distinguishable from every HTTP status", () => {
    expect(new NetworkError().isOffline).toBe(true);
    expect(new ApiError(401, "nope").isOffline).toBe(false);
    expect(new ApiError(500, "boom").isOffline).toBe(false);
  });

  test("retryable covers transient failures only", () => {
    // What the mutation queue branches on. A 4xx will fail identically
    // forever; retrying it burns battery and never converges.
    for (const status of [0, 429, 500, 502, 503, 504]) {
      expect(new ApiError(status, "x").isRetryable, String(status)).toBe(true);
    }
    for (const status of [400, 401, 403, 404, 409, 422]) {
      expect(new ApiError(status, "x").isRetryable, String(status)).toBe(false);
    }
  });

  test("401 is called out separately so the queue can pause rather than retry", () => {
    expect(new ApiError(401, "x").isAuthFailure).toBe(true);
    expect(new ApiError(403, "x").isAuthFailure).toBe(false);
  });

  test("a timeout is a network failure, not a server response", () => {
    const err = new TimeoutError(20_000);
    expect(err).toBeInstanceOf(NetworkError);
    expect(err.isOffline).toBe(true);
    expect(err.isRetryable).toBe(true);
  });
});

describe("rawRequest", () => {
  test("returns the parsed body on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(200, { recordID: "abc" })),
    );
    await expect(rawRequest("/records/abc")).resolves.toEqual({ recordID: "abc" });
  });

  test("a fetch rejection becomes a NetworkError, never a bare TypeError", async () => {
    // The SPA lets `TypeError: Failed to fetch` escape, which carries no status
    // and is indistinguishable from a bug. That is the thing this fixes.
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    const err = await rejection(() => rawRequest("/records"));
    expect(err).toBeInstanceOf(NetworkError);
    expect(err.isOffline).toBe(true);
    expect(err.status).toBe(0);
  });

  test("an HTTP error becomes an ApiError carrying the server's message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(409, { error: "Record was changed by someone else" })),
    );

    const err = await rejection(() => rawRequest("/records/abc", { method: "PUT" }));
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(409);
    expect(err.message).toBe("Record was changed by someone else");
  });

  test("a non-JSON error body still yields the real status", async () => {
    // The server has no setErrorHandler, so some failures return HTML or a
    // raw Fastify envelope. Masking a 413 with a parse error would send the
    // queue down the wrong path entirely.
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("<html>Request Entity Too Large</html>", { status: 413 }),
      ),
    );

    const err = await rejection(() => rawRequest("/records", { method: "POST", body: {} }));
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(413);
    expect(err.isRetryable).toBe(false);
  });

  test("an empty 200 body resolves rather than throwing", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 200 })));
    await expect(rawRequest("/auth/token/revoke", { method: "POST" })).resolves.toBeNull();
  });

  test("times out and reports it as a timeout", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((_url: string, init: RequestInit) => {
        return new Promise((_resolve, reject) => {
          init.signal?.addEventListener("abort", () => {
            const err = new Error("Aborted");
            err.name = "AbortError";
            reject(err);
          });
        });
      }),
    );

    const err = await rejection(() => rawRequest("/records", { timeoutMs: 10 }));
    expect(err).toBeInstanceOf(TimeoutError);
    expect(err.isRetryable).toBe(true);
  });

  test("serialises query params and skips empty ones", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, []));
    vi.stubGlobal("fetch", fetchMock);

    await rawRequest("/regions/pacific/records", {
      params: { ownerId: "me", status: "submitted", cursor: undefined, limit: null },
    });

    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.searchParams.get("ownerId")).toBe("me");
    expect(url.searchParams.get("status")).toBe("submitted");
    expect(url.searchParams.has("cursor")).toBe(false);
    expect(url.searchParams.has("limit")).toBe(false);
  });

  test("sends Content-Type only when there is a body", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, {}));
    vi.stubGlobal("fetch", fetchMock);

    await rawRequest("/records");
    expect(fetchMock.mock.calls[0][1].headers["Content-Type"]).toBeUndefined();

    await rawRequest("/records", { method: "POST", body: { title: "x" } });
    expect(fetchMock.mock.calls[1][1].headers["Content-Type"]).toBe("application/json");
  });
});
