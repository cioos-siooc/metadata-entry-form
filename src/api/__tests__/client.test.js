// Tests the real fetch wrapper (setupTests.js globally mocks ./api/client for
// component tests, so unmock it here).
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.unmock("../client");

vi.mock("../../auth/session", () => ({
  getAccessToken: vi.fn().mockResolvedValue("test-token"),
  refreshAccessToken: vi.fn().mockResolvedValue("test-token"),
}));

import { apiFetch, ApiError } from "../client";

function mockFetch(response) {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function jsonResponse(body, { ok = true, status = 200, statusText = "OK" } = {}) {
  return {
    ok,
    status,
    statusText,
    text: () => Promise.resolve(body === undefined ? "" : JSON.stringify(body)),
  };
}

describe("apiFetch", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("prefixes /api/v1, sends the bearer token, and parses JSON", async () => {
    const fetchMock = mockFetch(jsonResponse({ hello: "world" }));

    const result = await apiFetch("/regions/test/records");

    expect(result).toEqual({ hello: "world" });
    const [url, options] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/api/v1/regions/test/records");
    expect(options.headers.Authorization).toBe("Bearer test-token");
  });

  it("serializes the body and sets Content-Type on writes", async () => {
    const fetchMock = mockFetch(jsonResponse({ id: 1 }));

    await apiFetch("/records", { method: "POST", body: { title: "t" } });

    const [, options] = fetchMock.mock.calls[0];
    expect(options.method).toBe("POST");
    expect(options.headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(options.body)).toEqual({ title: "t" });
  });

  it("appends non-null query params", async () => {
    const fetchMock = mockFetch(jsonResponse([]));

    await apiFetch("/records", { params: { status: "published", skip: null } });

    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).toContain("status=published");
    expect(url).not.toContain("skip");
  });

  it("returns null for empty response bodies", async () => {
    mockFetch(jsonResponse(undefined, { status: 204 }));

    expect(await apiFetch("/records/1", { method: "DELETE" })).toBeNull();
  });

  it("refreshes once and retries on a 401", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ error: "expired" }, { ok: false, status: 401 }))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await apiFetch("/me");

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("throws ApiError with the server's error message on failure", async () => {
    mockFetch(
      jsonResponse(
        { error: "Record not found" },
        { ok: false, status: 404, statusText: "Not Found" },
      ),
    );

    const err = await apiFetch("/records/missing").catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(404);
    expect(err.message).toBe("Record not found");
  });
});
