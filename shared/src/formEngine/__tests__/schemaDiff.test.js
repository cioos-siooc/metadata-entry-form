import { describe, expect, it } from "vitest";

import { schemaDiff, schemaHash, ADDITIVE, BREAKING } from "../schemaDiff";

const base = {
  type: "object",
  required: ["siteName"],
  properties: {
    siteName: { type: "string" },
    depth: { type: "number" },
    sampleType: { type: "string", enum: ["sample", "control"] },
  },
};

const classify = (next) => schemaDiff(base, next).changeClass;

describe("schemaDiff — additive changes", () => {
  it("treats an identical schema as additive with no changes", () => {
    const result = schemaDiff(base, base);
    expect(result.changeClass).toBe(ADDITIVE);
    expect(result.changes).toEqual([]);
  });

  it("adding an optional property is additive", () => {
    expect(
      classify({
        ...base,
        properties: { ...base.properties, notes: { type: "string" } },
      })
    ).toBe(ADDITIVE);
  });

  it("widening an enum is additive", () => {
    expect(
      classify({
        ...base,
        properties: {
          ...base.properties,
          sampleType: { type: "string", enum: ["sample", "control", "blank"] },
        },
      })
    ).toBe(ADDITIVE);
  });

  it("dropping a requirement is additive", () => {
    expect(classify({ ...base, required: [] })).toBe(ADDITIVE);
  });

  it("widening a type is additive", () => {
    expect(
      classify({
        ...base,
        properties: {
          ...base.properties,
          depth: { type: ["number", "string"] },
        },
      })
    ).toBe(ADDITIVE);
  });

  it("relaxing a bound is additive", () => {
    const withMin = {
      ...base,
      properties: { ...base.properties, depth: { type: "number", minimum: 5 } },
    };
    const relaxed = {
      ...base,
      properties: { ...base.properties, depth: { type: "number", minimum: 1 } },
    };
    expect(schemaDiff(withMin, relaxed).changeClass).toBe(ADDITIVE);
  });
});

describe("schemaDiff — breaking changes", () => {
  it("adding a required property is breaking", () => {
    // Every existing submission instantly lacks it.
    expect(
      classify({
        ...base,
        required: ["siteName", "collectedBy"],
        properties: { ...base.properties, collectedBy: { type: "string" } },
      })
    ).toBe(BREAKING);
  });

  it("removing a property is breaking", () => {
    const rest = { ...base.properties };
    delete rest.depth;
    expect(classify({ ...base, properties: rest })).toBe(BREAKING);
  });

  it("removing an enum member is breaking", () => {
    expect(
      classify({
        ...base,
        properties: {
          ...base.properties,
          sampleType: { type: "string", enum: ["sample"] },
        },
      })
    ).toBe(BREAKING);
  });

  it("narrowing a type is breaking", () => {
    const loose = {
      ...base,
      properties: { ...base.properties, depth: { type: ["number", "string"] } },
    };
    expect(schemaDiff(loose, base).changeClass).toBe(BREAKING);
  });

  it("making an existing field required is breaking", () => {
    expect(classify({ ...base, required: ["siteName", "depth"] })).toBe(BREAKING);
  });

  it("introducing an enum where anything was allowed is breaking", () => {
    expect(
      classify({
        ...base,
        properties: {
          ...base.properties,
          siteName: { type: "string", enum: ["A", "B"] },
        },
      })
    ).toBe(BREAKING);
  });

  it("tightening a bound is breaking", () => {
    expect(
      classify({
        ...base,
        properties: {
          ...base.properties,
          siteName: { type: "string", minLength: 3 },
        },
      })
    ).toBe(BREAKING);
  });

  it("changing a nested property inside an array item is breaking", () => {
    const withArray = {
      type: "object",
      properties: {
        samples: {
          type: "array",
          items: { type: "object", properties: { id: { type: "string" } } },
        },
      },
    };
    const narrowed = {
      type: "object",
      properties: {
        samples: {
          type: "array",
          items: { type: "object", properties: { id: { type: "number" } } },
        },
      },
    };
    expect(schemaDiff(withArray, narrowed).changeClass).toBe(BREAKING);
  });
});

describe("schemaDiff — reporting", () => {
  it("reports the path of each change", () => {
    const { changes } = schemaDiff(base, {
      ...base,
      properties: { ...base.properties, notes: { type: "string" } },
    });
    expect(changes).toHaveLength(1);
    expect(changes[0].path).toBe("/properties/notes");
    expect(changes[0].kind).toBe(ADDITIVE);
  });

  it("collects several changes at once", () => {
    const { changes, changeClass } = schemaDiff(base, {
      type: "object",
      required: ["siteName", "depth"],
      properties: { siteName: { type: "string" }, depth: { type: "number" } },
    });
    expect(changeClass).toBe(BREAKING);
    expect(changes.length).toBeGreaterThan(1);
  });
});

describe("schemaHash", () => {
  it("is stable across key ordering and formatting", () => {
    expect(schemaHash({ a: 1, b: 2 })).toBe(schemaHash({ b: 2, a: 1 }));
  });

  it("changes when content changes", () => {
    expect(schemaHash(base)).not.toBe(
      schemaHash({ ...base, properties: { siteName: { type: "string" } } })
    );
  });

  it("handles an empty or missing schema", () => {
    expect(schemaHash()).toBe(schemaHash({}));
    expect(schemaHash()).toMatch(/^[0-9a-f]{8}$/);
  });
});
