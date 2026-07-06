// Vitest setup file
// adds custom matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom

import { vi } from "vitest";

// TextEncoder/TextDecoder must be set up using vi.hoisted() so they exist
// before vi.mock() hoisting causes react-router v7 to be imported
vi.hoisted(() => {
  global.TextEncoder ??= TextEncoder;
  global.TextDecoder ??= TextDecoder;
});

import "regenerator-runtime/runtime";
import "whatwg-fetch";
import "@testing-library/jest-dom";
global.MessagePort = class MessagePort {};

// Mock ResizeObserver for MUI components
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock window.matchMedia for responsive hooks
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Global mocks so component tests never touch Keycloak or the network
vi.mock("keycloak-js", () => ({
  default: class KeycloakMock {
    constructor() {
      this.authenticated = true;
      this.subject = "test-user";
      this.token = "test-token";
      this.tokenParsed = {
        email: "test@example.org",
        name: "Test User",
        email_verified: true,
      };
      this.init = vi.fn().mockResolvedValue(true);
      this.login = vi.fn();
      this.logout = vi.fn();
      this.updateToken = vi.fn().mockResolvedValue(true);
    }
  },
}));

vi.mock("./api/client", async () => {
  const actual = await vi.importActual("./api/client");
  return {
    ...actual,
    apiFetch: vi.fn().mockResolvedValue(null),
    get: vi.fn().mockResolvedValue(null),
    post: vi.fn().mockResolvedValue(null),
    put: vi.fn().mockResolvedValue(null),
    del: vi.fn().mockResolvedValue(null),
  };
});
