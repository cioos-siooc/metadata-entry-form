import { vi, describe, it, expect, afterEach } from "vitest";
import {
  getCurrentPosition,
  isGeolocationAvailable,
} from "../geolocation";

function mockGeolocation(impl) {
  Object.defineProperty(global.navigator, "geolocation", {
    value: impl,
    configurable: true,
  });
}

const originalIsSecureContext = window.isSecureContext;

afterEach(() => {
  Object.defineProperty(window, "isSecureContext", {
    value: originalIsSecureContext,
    configurable: true,
  });
});

describe("geolocation utils", () => {
  it("resolves coordinates on success", async () => {
    Object.defineProperty(window, "isSecureContext", { value: true, configurable: true });
    mockGeolocation({
      getCurrentPosition: (success) =>
        success({ coords: { latitude: 48.42, longitude: -123.36 } }),
    });
    await expect(getCurrentPosition()).resolves.toEqual({
      latitude: 48.42,
      longitude: -123.36,
    });
  });

  it("rejects with code 'denied' on PERMISSION_DENIED", async () => {
    Object.defineProperty(window, "isSecureContext", { value: true, configurable: true });
    mockGeolocation({
      getCurrentPosition: (success, error) =>
        error({ code: 1, message: "User denied Geolocation" }),
    });
    await expect(getCurrentPosition()).rejects.toMatchObject({ code: "denied" });
  });

  it("rejects with code 'unavailable' on timeout/unavailable", async () => {
    Object.defineProperty(window, "isSecureContext", { value: true, configurable: true });
    mockGeolocation({
      getCurrentPosition: (success, error) => error({ code: 3, message: "Timeout" }),
    });
    await expect(getCurrentPosition()).rejects.toMatchObject({ code: "unavailable" });
  });

  it("is unavailable in insecure contexts", () => {
    mockGeolocation({ getCurrentPosition: vi.fn() });
    Object.defineProperty(window, "isSecureContext", { value: false, configurable: true });
    expect(isGeolocationAvailable()).toBe(false);
  });
});
