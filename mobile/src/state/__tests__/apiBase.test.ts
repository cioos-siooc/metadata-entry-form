import { afterEach, describe, expect, it } from "vitest";

import {
  apiBaseOverride,
  apiBaseUrl,
  applyApiBaseOverride,
  DEFAULT_API_BASE_URL,
  normalizeBaseUrl,
} from "../apiBase";

afterEach(() => applyApiBaseOverride(null));

describe("normalizeBaseUrl", () => {
  it("assumes http for a bare host, which is how anyone types a LAN address", () => {
    expect(normalizeBaseUrl("192.168.1.20:3001/api")).toBe("http://192.168.1.20:3001/api");
  });

  it("keeps an explicit scheme", () => {
    expect(normalizeBaseUrl("https://api.cioos.ca/api")).toBe("https://api.cioos.ca/api");
  });

  it("strips trailing slashes, since paths are appended directly", () => {
    expect(normalizeBaseUrl("http://localhost:3001/api//")).toBe("http://localhost:3001/api");
  });

  it("treats blank input as no override", () => {
    expect(normalizeBaseUrl("   ")).toBeNull();
    expect(normalizeBaseUrl(undefined)).toBeNull();
  });

  it("rejects an unparseable address rather than storing junk", () => {
    expect(normalizeBaseUrl("http://")).toBeNull();
  });
});

describe("the override", () => {
  it("falls back to the build default", () => {
    expect(apiBaseUrl()).toBe(DEFAULT_API_BASE_URL);
    expect(apiBaseOverride()).toBeNull();
  });

  it("takes effect immediately, so no reload is needed after switching", () => {
    applyApiBaseOverride("10.0.0.5:3001/api");
    expect(apiBaseUrl()).toBe("http://10.0.0.5:3001/api");
  });

  it("clears back to the default", () => {
    applyApiBaseOverride("10.0.0.5:3001/api");
    applyApiBaseOverride(null);
    expect(apiBaseUrl()).toBe(DEFAULT_API_BASE_URL);
  });
});
