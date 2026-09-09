import { describe, expect, it } from "vitest";

import {
  summaryColumns,
  summaryHeader,
  summaryValue,
} from "../exportSubmissions";

/**
 * Listing submissions must not use the full export table: a 25-field form makes
 * a 30-column table nobody can read. These cover the "few identifying columns"
 * path and its fallback.
 */

const schema = {
  type: "object",
  required: ["sampleId", "siteName"],
  properties: {
    surveyName: { type: "string", title: "Survey" },
    siteName: { type: "string", title: "Site name" },
    sampleId: { type: "string", title: "Sample ID" },
    depth: { type: "number", title: "Depth" },
    team: { type: "array", title: "Team", items: { type: "string" } },
    notes: {
      type: "object",
      title: "Notes",
      properties: { en: { type: "string" }, fr: { type: "string" } },
    },
  },
};

describe("summaryColumns", () => {
  it("uses ui:summaryFields when declared", () => {
    const columns = summaryColumns(schema, {
      "ui:summaryFields": ["sampleId", "depth"],
    });
    expect(columns.map((c) => c.key)).toEqual(["sampleId", "depth"]);
  });

  it("ignores declared fields that are not in the schema", () => {
    const columns = summaryColumns(schema, {
      "ui:summaryFields": ["sampleId", "ghost"],
    });
    expect(columns.map((c) => c.key)).toEqual(["sampleId"]);
  });

  it("falls back to required fields first, then declaration order", () => {
    const columns = summaryColumns(schema, {});
    // Required fields lead, because an author marks a field required precisely
    // because it identifies the record.
    expect(columns.slice(0, 2).map((c) => c.key)).toEqual([
      "sampleId",
      "siteName",
    ]);
  });

  it("skips arrays and objects in the fallback", () => {
    // A container renders as JSON in a cell, which tells a reader nothing.
    const keys = summaryColumns(schema, {}, { limit: 99 }).map((c) => c.key);
    expect(keys).not.toContain("team");
    expect(keys).not.toContain("notes");
  });

  it("caps how many columns it returns", () => {
    expect(summaryColumns(schema, {}, { limit: 3 })).toHaveLength(3);
  });

  it("prefers a bilingual label over the schema title", () => {
    const columns = summaryColumns(schema, {
      "ui:summaryFields": ["sampleId"],
      sampleId: {
        "ui:options": { i18n: { title: { en: "Sample", fr: "Échantillon" } } },
      },
    });
    expect(summaryHeader(columns[0], "fr")).toBe("Échantillon");
    expect(summaryHeader(columns[0], "en")).toBe("Sample");
  });

  it("falls back to the schema title, then the property name", () => {
    const columns = summaryColumns(
      { type: "object", properties: { a: { type: "string", title: "Alpha" }, b: {} } },
      { "ui:summaryFields": ["a", "b"] }
    );
    expect(summaryHeader(columns[0], "fr")).toBe("Alpha");
    expect(summaryHeader(columns[1], "fr")).toBe("b");
  });

  it("handles an empty schema", () => {
    expect(summaryColumns({}, {})).toEqual([]);
    expect(summaryColumns(undefined, undefined)).toEqual([]);
  });
});

describe("summaryValue", () => {
  const columns = summaryColumns(schema, {
    "ui:summaryFields": ["sampleId", "depth"],
  });

  it("reads the value out of the submission data", () => {
    expect(
      summaryValue({ data: { sampleId: "S1", depth: 5 } }, columns[0])
    ).toBe("S1");
  });

  it("renders zero rather than blanking it", () => {
    expect(summaryValue({ data: { depth: 0 } }, columns[1])).toBe("0");
  });

  it("renders empty for a missing value", () => {
    expect(summaryValue({ data: {} }, columns[0])).toBe("");
    expect(summaryValue({}, columns[0])).toBe("");
  });
});
