import { describe, expect, it } from "vitest";

import { byteLength, MAX_TRANSLATE_BYTES } from "../byteLength";

describe("byteLength", () => {
  it("counts ASCII as one byte each", () => {
    expect(byteLength("abc")).toBe(3);
  });

  it("counts French accents as two bytes", () => {
    // The cap is in bytes, so a French abstract hits it sooner than an English
    // one of the same length — which is exactly the case this app must get
    // right.
    expect(byteLength("é")).toBe(2);
    expect(byteLength("température")).toBe(12);
  });

  it("counts astral characters as four bytes", () => {
    expect(byteLength("🐟")).toBe(4);
  });

  it("agrees with the cap on a realistic abstract", () => {
    const abstract = "Température de surface. ".repeat(250);
    expect(byteLength(abstract)).toBeGreaterThan(MAX_TRANSLATE_BYTES);
  });
});
