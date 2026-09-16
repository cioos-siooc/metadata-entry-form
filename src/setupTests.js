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

// Global mocks so component tests never touch the auth API or the network
vi.mock("./auth/session", () => ({
  initAuth: vi.fn().mockResolvedValue(true),
  getAccessToken: vi.fn().mockResolvedValue("test-token"),
  refreshAccessToken: vi.fn().mockResolvedValue("test-token"),
  currentUser: vi.fn(() => ({
    uid: "test-user",
    email: "test@example.org",
    displayName: "Test User",
  })),
  signInWithGoogle: vi.fn(),
  signInWithMicrosoft: vi.fn(),
  signInWithOrcid: vi.fn(),
  signInWithPassword: vi.fn().mockResolvedValue({}),
  register: vi.fn().mockResolvedValue({ ok: true }),
  signOut: vi.fn().mockResolvedValue(undefined),
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
