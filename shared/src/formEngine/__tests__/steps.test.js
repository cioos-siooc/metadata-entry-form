import { describe, expect, it } from "vitest";

import { pickSchemaProperties, resolveSteps, stepLabel } from "../steps";

const schema = {
  type: "object",
  required: ["siteName", "depth"],
  definitions: { thing: { type: "string" } },
  properties: {
    siteName: { type: "string" },
    depth: { type: "number" },
    labDate: { type: "string" },
  },
  allOf: [{ if: {}, then: {} }],
};

describe("pickSchemaProperties", () => {
  it("keeps only the named properties, in order", () => {
    const picked = pickSchemaProperties(schema, ["depth", "siteName"]);
    // Declaration order is preserved, not the order of the `fields` list.
    expect(Object.keys(picked.properties)).toEqual(["siteName", "depth"]);
  });

  it("drops required entries for properties it removed", () => {
    const picked = pickSchemaProperties(schema, ["siteName"]);
    expect(picked.required).toEqual(["siteName"]);
  });

  it("removes required entirely when nothing required survives", () => {
    const picked = pickSchemaProperties(schema, ["labDate"]);
    expect(picked).not.toHaveProperty("required");
  });

  it("keeps definitions so $refs still resolve", () => {
    expect(pickSchemaProperties(schema, ["siteName"]).definitions).toEqual(
      schema.definitions
    );
  });

  it("strips root conditionals that reference fields this step lacks", () => {
    // Left in place, a root allOf would evaluate against a partial object and
    // report errors for fields the step doesn't render.
    const picked = pickSchemaProperties(schema, ["siteName"]);
    expect(picked).not.toHaveProperty("allOf");
  });

  it("returns the schema untouched when fields is not an array", () => {
    expect(pickSchemaProperties(schema, undefined)).toBe(schema);
  });
});

describe("resolveSteps", () => {
  it("returns one implicit step when ui:steps is absent", () => {
    const steps = resolveSteps(schema, {});
    expect(steps).toHaveLength(1);
    expect(steps[0].implicit).toBe(true);
    expect(steps[0].fields).toEqual(["siteName", "depth", "labDate"]);
  });

  it("uses declared steps", () => {
    const steps = resolveSteps(schema, {
      "ui:steps": [
        { id: "field", title: { en: "Field" }, fields: ["siteName", "depth"] },
        { id: "lab", title: { en: "Lab" }, fields: ["labDate"] },
      ],
    });
    expect(steps.map((s) => s.id)).toEqual(["field", "lab"]);
  });

  it("sweeps unclaimed properties into a catch-all step", () => {
    // Adding a property to the schema without updating ui:steps must not make
    // it invisible.
    const steps = resolveSteps(schema, {
      "ui:steps": [{ id: "field", fields: ["siteName"] }],
    });
    expect(steps).toHaveLength(2);
    expect(steps[1].unclaimed).toBe(true);
    expect(steps[1].fields).toEqual(["depth", "labDate"]);
  });

  it("ignores declared fields that are not in the schema", () => {
    const steps = resolveSteps(schema, {
      "ui:steps": [{ id: "a", fields: ["siteName", "ghostField"] }],
    });
    expect(steps[0].fields).toEqual(["siteName"]);
  });

  it("drops a step that ends up with no fields", () => {
    const steps = resolveSteps(schema, {
      "ui:steps": [
        { id: "a", fields: ["siteName", "depth", "labDate"] },
        { id: "empty", fields: ["nothingReal"] },
      ],
    });
    expect(steps.map((s) => s.id)).toEqual(["a"]);
  });

  it("carries visibleIf through", () => {
    const steps = resolveSteps(schema, {
      "ui:steps": [
        { id: "a", fields: ["siteName", "depth", "labDate"], visibleIf: { field: "x", truthy: true } },
      ],
    });
    expect(steps[0].visibleIf).toEqual({ field: "x", truthy: true });
  });

  it("handles a schema with no properties", () => {
    expect(resolveSteps({}, {})).toEqual([]);
  });
});

describe("stepLabel", () => {
  it("resolves the active language with fallbacks", () => {
    const step = { title: { en: "Field", fr: "Terrain" } };
    expect(stepLabel(step, "fr")).toBe("Terrain");
    expect(stepLabel({ title: { en: "Only EN" } }, "fr")).toBe("Only EN");
    expect(stepLabel({ title: null }, "en", "Fallback")).toBe("Fallback");
  });

  it("accepts a plain string title", () => {
    expect(stepLabel({ title: "Plain" }, "en")).toBe("Plain");
  });
});
