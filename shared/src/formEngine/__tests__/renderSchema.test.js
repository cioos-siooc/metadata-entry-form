import { describe, expect, it } from "vitest";

import { isConstraintOnly, renderSchema } from "../renderSchema";

/**
 * The whole value of this module is knowing where the line between "a choice" and
 * "a restriction" falls, so that is what these tests pin down. Getting it wrong
 * in one direction leaves a field rendered twice; in the other it silently turns
 * a dropdown into a free-text box, which is the more expensive mistake.
 */

describe("isConstraintOnly", () => {
  it("recognises a validation-only pattern alternative", () => {
    // The metadata record's DOI: "empty, or a valid doi.org URL".
    expect(
      isConstraintOnly([{ const: "" }, { pattern: "^https://doi\\.org/" }])
    ).toBe(true);
  });

  it("recognises bare numeric and length bounds", () => {
    expect(isConstraintOnly([{ maxLength: 0 }, { minLength: 8 }])).toBe(true);
    expect(isConstraintOnly([{ maximum: 0 }, { minimum: 10 }])).toBe(true);
  });

  it("leaves an enumeration alone", () => {
    // rjsf renders this as a select; stripping it would lose the options.
    expect(isConstraintOnly([{ const: "a" }, { const: "b" }])).toBe(false);
    expect(isConstraintOnly([{ enum: ["a"] }, { enum: ["b"] }])).toBe(false);
  });

  it("leaves a labelled option list alone", () => {
    expect(
      isConstraintOnly([
        { const: "a", title: "Option A" },
        { pattern: "b" },
      ])
    ).toBe(false);
  });

  it("leaves alternatives that describe distinct shapes alone", () => {
    expect(isConstraintOnly([{ type: "string" }, { type: "number" }])).toBe(false);
    expect(
      isConstraintOnly([{ $ref: "#/definitions/point" }, { $ref: "#/definitions/box" }])
    ).toBe(false);
    expect(
      isConstraintOnly([{ properties: { a: {} } }, { pattern: "x" }])
    ).toBe(false);
    expect(isConstraintOnly([{ items: {} }, { pattern: "x" }])).toBe(false);
    expect(isConstraintOnly([{ required: ["a"] }, { pattern: "x" }])).toBe(false);
  });

  it("says no to anything that is not a list of objects", () => {
    expect(isConstraintOnly(undefined)).toBe(false);
    expect(isConstraintOnly([])).toBe(false);
    expect(isConstraintOnly({ pattern: "x" })).toBe(false);
    expect(isConstraintOnly([null, { pattern: "x" }])).toBe(false);
  });
});

describe("renderSchema", () => {
  const doi = {
    type: "string",
    anyOf: [{ const: "" }, { pattern: "^https://doi\\.org/10\\." }],
  };

  it("removes a constraint-only anyOf from a typed property", () => {
    const schema = { type: "object", properties: { datasetIdentifier: doi } };
    const rendered = renderSchema(schema);

    expect(rendered.properties.datasetIdentifier).toEqual({ type: "string" });
  });

  it("removes a constraint-only oneOf too", () => {
    const rendered = renderSchema({
      type: "object",
      properties: {
        a: { type: "string", oneOf: [{ const: "" }, { pattern: "x" }] },
      },
    });
    expect(rendered.properties.a).toEqual({ type: "string" });
  });

  it("keeps the branches when the subschema has no type of its own", () => {
    // Removing them would leave rjsf nothing at all to render.
    const untyped = { anyOf: [{ const: "" }, { pattern: "x" }] };
    expect(renderSchema({ type: "object", properties: { a: untyped } }).properties.a)
      .toEqual(untyped);
  });

  it("keeps a real choice untouched", () => {
    const choice = {
      type: "object",
      properties: {
        extent: {
          type: "object",
          anyOf: [{ $ref: "#/definitions/point" }, { $ref: "#/definitions/box" }],
        },
      },
    };
    expect(renderSchema(choice)).toEqual(choice);
  });

  it("recurses into nested objects, array items, and definitions", () => {
    const rendered = renderSchema({
      type: "object",
      definitions: { link: { type: "string", anyOf: [{ const: "" }, { pattern: "x" }] } },
      properties: {
        nested: {
          type: "object",
          properties: { inner: { type: "string", anyOf: [{ const: "" }, { pattern: "y" }] } },
        },
        list: {
          type: "array",
          items: { type: "string", anyOf: [{ const: "" }, { pattern: "z" }] },
        },
      },
    });

    expect(rendered.definitions.link).toEqual({ type: "string" });
    expect(rendered.properties.nested.properties.inner).toEqual({ type: "string" });
    expect(rendered.properties.list.items).toEqual({ type: "string" });
  });

  it("leaves everything else about the schema alone", () => {
    const schema = {
      type: "object",
      required: ["a"],
      properties: { a: { type: "string", maxLength: 4, title: "A" } },
      allOf: [{ if: {}, then: {} }],
    };
    expect(renderSchema(schema)).toEqual(schema);
  });

  it("does not mutate its input", () => {
    const schema = { type: "object", properties: { datasetIdentifier: doi } };
    const snapshot = JSON.stringify(schema);
    renderSchema(schema);
    expect(JSON.stringify(schema)).toBe(snapshot);
  });

  it("passes through values that are not schemas", () => {
    expect(renderSchema(undefined)).toBe(undefined);
    expect(renderSchema(null)).toBe(null);
    expect(renderSchema(true)).toBe(true);
  });
});
