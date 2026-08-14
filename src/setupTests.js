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
global.MessagePort = class MessagePort { };

// Mock ResizeObserver for MUI components
global.ResizeObserver = class ResizeObserver {
  observe() { }
  unobserve() { }
  disconnect() { }
};

/**
 * Mock window.matchMedia for responsive hooks.
 *
 * `min-width` queries are answered against `window.innerWidth` rather than
 * always returning false. jsdom's default innerWidth is 1024, so
 * `breakpoints.up("md")` (900) is true and `up("lg")` (1200) is false — which
 * means a component that renders a docked panel on desktop and a drawer on
 * mobile gets its DESKTOP branch by default, instead of silently rendering the
 * mobile one and hiding the panel from every query.
 *
 * Everything else still answers false, so the two existing consumers
 * (NavDrawer.jsx and RecordTable.jsx, both `breakpoints.down(...)`, i.e.
 * `max-width`) behave exactly as before. A test wanting the mobile branch opts
 * in by setting `window.innerWidth` and re-rendering.
 */
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => {
    const min = /min-width:\s*([\d.]+)px/.exec(query);
    return {
      matches: min ? window.innerWidth >= parseFloat(min[1]) : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };
  }),
});

// Global Mock for Firebase to prevent errors in component tests
vi.mock("firebase/functions", () => ({
  getFunctions: vi.fn(),
  httpsCallable: vi.fn(() => vi.fn()),
}));

vi.mock("firebase/database", () => ({
  getDatabase: vi.fn(),
  ref: vi.fn(),
  set: vi.fn(),
  get: vi.fn(),
  child: vi.fn(),
  remove: vi.fn(),
  onValue: vi.fn(),
  update: vi.fn(),
  push: vi.fn(),
}));

vi.mock("firebase/app", () => ({
  initializeApp: vi.fn(),
}));

vi.mock("./firebase", () => ({ default: {} }));
vi.mock("./auth", () => ({
  getAuth: vi.fn(),
  onAuthStateChanged: vi.fn(),
  auth: { currentUser: { uid: "test-user" } },
}));
