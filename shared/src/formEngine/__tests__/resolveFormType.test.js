import { describe, expect, it } from "vitest";

import {
  deepMerge,
  resolveVersion,
  resolveFormType,
  resolveCatalogForRegion,
  formTypeLabel,
} from "../resolveFormType";

const catalogEntry = (over = {}) => ({
  id: "ft1",
  slug: "edna-field",
  kind: "generic",
  status: "published",
  title: { en: "eDNA Field", fr: "Terrain ADNe" },
  description: { en: "Field sheet", fr: "Fiche de terrain" },
  jsonSchema: { type: "object", properties: { siteName: { type: "string" } } },
  uiSchema: { siteName: { "ui:help": { en: "Site", fr: "Site" } } },
  version: 3,
  ...over,
});

describe("deepMerge", () => {
  it("merges nested objects", () => {
    expect(deepMerge({ a: { b: 1, c: 2 } }, { a: { c: 3 } })).toEqual({
      a: { b: 1, c: 3 },
    });
  });

  it("replaces arrays wholesale rather than merging by index", () => {
    // Index-merging a step list would produce nonsense.
    expect(deepMerge({ steps: [1, 2, 3] }, { steps: [9] })).toEqual({
      steps: [9],
    });
  });

  it("leaves the base alone when the override is undefined", () => {
    expect(deepMerge({ a: 1 }, undefined)).toEqual({ a: 1 });
  });
});

describe("resolveVersion", () => {
  it("tracks the latest published version by default", () => {
    expect(resolveVersion(catalogEntry(), undefined)).toBe(3);
    expect(resolveVersion(catalogEntry(), { pinnedVersion: null })).toBe(3);
  });

  it("honours a pin", () => {
    expect(resolveVersion(catalogEntry(), { pinnedVersion: 2 })).toBe(2);
  });
});

describe("resolveFormType", () => {
  it("applies a region's title override without touching the catalog", () => {
    const entry = catalogEntry();
    const resolved = resolveFormType(entry, {
      enabled: true,
      overrides: { title: { en: "Pacific eDNA Field" } },
    });

    expect(resolved.title).toEqual({
      en: "Pacific eDNA Field",
      fr: "Terrain ADNe",
    });
    // The catalog entry itself must be unmodified.
    expect(entry.title.en).toBe("eDNA Field");
  });

  it("lets a region adjust the uiSchema", () => {
    const resolved = resolveFormType(catalogEntry(), {
      enabled: true,
      overrides: { uiSchema: { siteName: { "ui:help": { en: "Station" } } } },
    });
    expect(resolved.uiSchema.siteName["ui:help"]).toEqual({
      en: "Station",
      fr: "Site",
    });
  });

  it("never lets a region override the jsonSchema", () => {
    // The schema is the data contract — submissions across regions must stay
    // comparable, so an override here must be ignored.
    const resolved = resolveFormType(catalogEntry(), {
      enabled: true,
      overrides: { jsonSchema: { type: "object", properties: {} } },
    });
    expect(resolved.jsonSchema.properties).toHaveProperty("siteName");
  });

  it("prefers a frozen version's schema over the working copy", () => {
    const resolved = resolveFormType(
      catalogEntry(),
      { enabled: true, pinnedVersion: 2 },
      {
        jsonSchema: { type: "object", properties: { old: { type: "string" } } },
        uiSchema: {},
        schemaHash: "abc",
      }
    );
    expect(Object.keys(resolved.jsonSchema.properties)).toEqual(["old"]);
    expect(resolved.resolvedVersion).toBe(2);
    expect(resolved.schemaHash).toBe("abc");
  });

  it("defaults enabled to false when a region has no activation", () => {
    // Activation is opt-in: publishing a form type must not switch it on
    // everywhere.
    expect(resolveFormType(catalogEntry(), undefined).enabled).toBe(false);
  });
});

describe("resolveCatalogForRegion", () => {
  const catalog = [
    catalogEntry(),
    catalogEntry({ id: "ft2", slug: "edna-lab", version: 1 }),
    catalogEntry({ id: "ft3", slug: "never-published", version: 0 }),
  ];

  it("returns only what the region has enabled", () => {
    const resolved = resolveCatalogForRegion(catalog, {
      ft1: { enabled: true },
      ft2: { enabled: false },
    });
    expect(resolved.map((r) => r.slug)).toEqual(["edna-field"]);
  });

  it("hides unpublished form types even when enabled", () => {
    const resolved = resolveCatalogForRegion(catalog, {
      ft3: { enabled: true },
    });
    expect(resolved).toEqual([]);
  });

  it("orders by sortOrder then slug", () => {
    const resolved = resolveCatalogForRegion(catalog, {
      ft1: { enabled: true, sortOrder: 2 },
      ft2: { enabled: true, sortOrder: 1 },
    });
    expect(resolved.map((r) => r.slug)).toEqual(["edna-lab", "edna-field"]);
  });

  it("can list everything for an admin choosing what to enable", () => {
    const resolved = resolveCatalogForRegion(catalog, {}, {}, {
      includeDisabled: true,
    });
    expect(resolved).toHaveLength(3);
    expect(resolved.every((r) => r.enabled === false)).toBe(true);
  });

  it("excludes deprecated form types from the member-facing list", () => {
    const resolved = resolveCatalogForRegion(
      [catalogEntry({ status: "deprecated" })],
      { ft1: { enabled: true } }
    );
    expect(resolved).toEqual([]);
  });
});

describe("formTypeLabel", () => {
  it("falls back through language, then English, then slug", () => {
    expect(formTypeLabel(catalogEntry(), "fr")).toBe("Terrain ADNe");
    expect(formTypeLabel({ title: { en: "Only EN" }, slug: "s" }, "fr")).toBe(
      "Only EN"
    );
    expect(formTypeLabel({ title: {}, slug: "fallback" }, "fr")).toBe("fallback");
  });
});
