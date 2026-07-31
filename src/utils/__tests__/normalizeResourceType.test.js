import { describe, expect, test } from "vitest";
import {
  normalizeResourceType,
  resourceTypeIncludes,
  isOnlyOther,
  hasResourceType,
} from "../normalizeResourceType";

describe("normalizeResourceType", () => {
  test("maps legacy values to ISO codes", () => {
    expect(normalizeResourceType(["oceanographic"])).toEqual(["oceans"]);
    expect(normalizeResourceType(["biological"])).toEqual(["biota"]);
    expect(normalizeResourceType(["oceanographic", "biological"])).toEqual([
      "oceans",
      "biota",
    ]);
  });

  test("keeps ISO codes unchanged", () => {
    expect(normalizeResourceType(["oceans"])).toEqual(["oceans"]);
    expect(normalizeResourceType(["biota", "society"])).toEqual([
      "biota",
      "society",
    ]);
  });

  test("keeps 'other' unchanged", () => {
    expect(normalizeResourceType(["other"])).toEqual(["other"]);
  });

  test("handles mixed legacy and ISO values", () => {
    expect(normalizeResourceType(["oceanographic", "society"])).toEqual([
      "oceans",
      "society",
    ]);
  });

  test("treats a bare string as a single-element list", () => {
    expect(normalizeResourceType("oceanographic")).toEqual(["oceans"]);
    expect(normalizeResourceType("biota")).toEqual(["biota"]);
  });

  test("returns an empty array for unset input", () => {
    expect(normalizeResourceType(undefined)).toEqual([]);
    expect(normalizeResourceType(null)).toEqual([]);
    expect(normalizeResourceType("")).toEqual([]);
  });

  test("handles empty array", () => {
    expect(normalizeResourceType([])).toEqual([]);
  });
});

describe("resourceTypeIncludes", () => {
  test("detects ISO code directly", () => {
    expect(resourceTypeIncludes(["oceans", "biota"], "biota")).toBe(true);
    expect(resourceTypeIncludes(["oceans"], "biota")).toBe(false);
  });

  test("detects legacy value mapped to ISO code", () => {
    expect(resourceTypeIncludes(["biological"], "biota")).toBe(true);
    expect(resourceTypeIncludes(["oceanographic"], "oceans")).toBe(true);
  });

  test("detects a category given as a bare string", () => {
    expect(resourceTypeIncludes("biological", "biota")).toBe(true);
    expect(resourceTypeIncludes("biota", "biota")).toBe(true);
    expect(resourceTypeIncludes("oceans", "biota")).toBe(false);
  });

  test("returns false for unset input", () => {
    expect(resourceTypeIncludes(undefined, "oceans")).toBe(false);
    expect(resourceTypeIncludes(null, "oceans")).toBe(false);
    expect(resourceTypeIncludes([], "oceans")).toBe(false);
  });
});

describe("hasResourceType", () => {
  test("returns true when a value is selected", () => {
    expect(hasResourceType(["oceans"])).toBe(true);
    expect(hasResourceType(["oceanographic", "biota"])).toBe(true);
    expect(hasResourceType("biological")).toBe(true);
  });

  test("returns false for an empty array", () => {
    expect(hasResourceType([])).toBe(false);
  });

  test("returns false for unset input", () => {
    expect(hasResourceType(undefined)).toBe(false);
    expect(hasResourceType(null)).toBe(false);
    expect(hasResourceType("")).toBe(false);
  });
});

describe("isOnlyOther", () => {
  test("returns true for exactly ['other']", () => {
    expect(isOnlyOther(["other"])).toBe(true);
  });

  test("returns false for other + additional values", () => {
    expect(isOnlyOther(["other", "oceans"])).toBe(false);
  });

  test("returns false for non-other values", () => {
    expect(isOnlyOther(["oceans"])).toBe(false);
    expect(isOnlyOther(["biota"])).toBe(false);
  });

  test("returns true for a bare 'other' string", () => {
    expect(isOnlyOther("other")).toBe(true);
  });

  test("returns false for empty or unset input", () => {
    expect(isOnlyOther([])).toBe(false);
    expect(isOnlyOther(undefined)).toBe(false);
    expect(isOnlyOther(null)).toBe(false);
  });
});
