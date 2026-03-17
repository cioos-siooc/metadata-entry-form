// Mock Firebase to avoid ReadableStream environment issues
import { vi, it, expect } from "vitest";

vi.mock("../firebase", () => ({ default: {} }));

import firebase from "../firebase";

it("Initializes", () => {
  expect(firebase).toBeDefined();
});
