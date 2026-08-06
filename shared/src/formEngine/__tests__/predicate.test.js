import { describe, expect, it } from "vitest";

import { evaluate, referencedFields } from "../predicate";

describe("evaluate", () => {
  it("treats an absent rule as visible", () => {
    expect(evaluate(undefined, {})).toBe(true);
    expect(evaluate(null, {})).toBe(true);
  });

  it("handles equals", () => {
    expect(evaluate({ field: "kind", equals: "control" }, { kind: "control" })).toBe(true);
    expect(evaluate({ field: "kind", equals: "control" }, { kind: "sample" })).toBe(false);
  });

  it("handles in and notIn", () => {
    expect(evaluate({ field: "s", in: ["a", "b"] }, { s: "a" })).toBe(true);
    expect(evaluate({ field: "s", in: ["a", "b"] }, { s: "c" })).toBe(false);
    expect(evaluate({ field: "s", notIn: ["model"] }, { s: "dataset" })).toBe(true);
    expect(evaluate({ field: "s", notIn: ["model"] }, { s: "model" })).toBe(false);
  });

  it("treats in as intersects for an array-valued field", () => {
    expect(evaluate({ field: "eov", in: ["oxygen"] }, { eov: ["salinity", "oxygen"] })).toBe(true);
    expect(evaluate({ field: "eov", in: ["oxygen"] }, { eov: ["salinity"] })).toBe(false);
  });

  it("handles truthy, distinguishing false from absent correctly", () => {
    expect(evaluate({ field: "noTaxa", truthy: true }, { noTaxa: true })).toBe(true);
    expect(evaluate({ field: "noTaxa", truthy: false }, { noTaxa: false })).toBe(true);
    expect(evaluate({ field: "noTaxa", truthy: false }, {})).toBe(true);
  });

  it("handles exists, treating empty string and empty array as absent", () => {
    expect(evaluate({ field: "a", exists: true }, { a: "x" })).toBe(true);
    expect(evaluate({ field: "a", exists: true }, { a: "" })).toBe(false);
    expect(evaluate({ field: "a", exists: true }, { a: [] })).toBe(false);
    expect(evaluate({ field: "a", exists: false }, {})).toBe(true);
  });

  it("reads dotted paths", () => {
    expect(evaluate({ field: "site.type", equals: "reef" }, { site: { type: "reef" } })).toBe(true);
  });

  it("does not throw on a missing intermediate path segment", () => {
    expect(evaluate({ field: "a.b.c", equals: "x" }, {})).toBe(false);
  });

  it("combines with allOf, anyOf, and not", () => {
    const data = { a: 1, b: 2 };
    expect(
      evaluate({ allOf: [{ field: "a", equals: 1 }, { field: "b", equals: 2 }] }, data)
    ).toBe(true);
    expect(
      evaluate({ allOf: [{ field: "a", equals: 1 }, { field: "b", equals: 9 }] }, data)
    ).toBe(false);
    expect(
      evaluate({ anyOf: [{ field: "a", equals: 9 }, { field: "b", equals: 2 }] }, data)
    ).toBe(true);
    expect(evaluate({ not: { field: "a", equals: 1 } }, data)).toBe(false);
  });

  it("reads ambient context flags", () => {
    expect(evaluate({ context: "canEdit" }, {}, { canEdit: true })).toBe(true);
    expect(evaluate({ context: "canEdit" }, {}, { canEdit: false })).toBe(false);
  });

  it("stays visible for an unrecognized rule", () => {
    // Failing open matters: a typo in a form definition should not make a
    // field silently unreachable.
    expect(evaluate({ somethingElse: true }, {})).toBe(true);
  });
});

describe("referencedFields", () => {
  it("collects field paths from nested combinators", () => {
    const fields = referencedFields({
      allOf: [
        { field: "a", equals: 1 },
        { anyOf: [{ field: "b", in: [1] }, { not: { field: "c", truthy: true } }] },
      ],
    });
    expect([...fields].sort()).toEqual(["a", "b", "c"]);
  });
});
