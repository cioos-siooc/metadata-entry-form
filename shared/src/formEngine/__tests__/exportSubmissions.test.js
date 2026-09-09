import { describe, expect, it } from "vitest";

import {
  deriveColumns,
  csvEscape,
  formatCell,
  buildExportTable,
  toCsv,
  toJson,
  exportFilename,
} from "../exportSubmissions";

const fieldSchema = {
  type: "object",
  properties: {
    siteName: { type: "string", title: "Site name" },
    latitude: { type: "number", title: "Latitude" },
    sampleType: { type: "string", title: "Sample type", enum: ["sample", "control"] },
    filtered: { type: "boolean", title: "Filtered" },
  },
};

const submission = (data, over = {}) => ({
  id: "s1",
  status: "submitted",
  formTypeVersion: 1,
  userID: "u1",
  createdAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-02T00:00:00.000Z",
  data,
  ...over,
});

describe("deriveColumns", () => {
  it("takes columns from the schema, in declaration order", () => {
    expect(deriveColumns(fieldSchema).map((c) => c.key)).toEqual([
      "siteName",
      "latitude",
      "sampleType",
      "filtered",
    ]);
  });

  it("uses titles as headers, falling back to the property name", () => {
    const columns = deriveColumns({
      type: "object",
      properties: { a: { type: "string", title: "Alpha" }, b: { type: "string" } },
    });
    expect(columns.map((c) => c.header)).toEqual(["Alpha", "b"]);
  });

  it("emits a column even when no submission filled it in", () => {
    // This is what makes the export usable as a blank template.
    const { headers } = buildExportTable({
      jsonSchema: fieldSchema,
      submissions: [submission({ siteName: "Site A" })],
      includeMetadata: false,
    });
    expect(headers).toContain("Latitude");
  });

  it("flattens nested objects with dotted paths", () => {
    const columns = deriveColumns({
      type: "object",
      properties: {
        site: {
          type: "object",
          title: "Site",
          properties: {
            name: { type: "string", title: "Name" },
            depth: { type: "number", title: "Depth" },
          },
        },
      },
    });
    expect(columns.map((c) => c.key)).toEqual(["site.name", "site.depth"]);
    expect(columns[0].header).toBe("Site / Name");
  });

  it("puts the requested language first for a bilingual field", () => {
    const bilingual = {
      type: "object",
      properties: {
        notes: {
          type: "object",
          title: "Notes",
          properties: { en: { type: "string" }, fr: { type: "string" } },
        },
      },
    };
    expect(deriveColumns(bilingual, [], { language: "fr" }).map((c) => c.key)).toEqual(
      ["notes.fr", "notes.en"]
    );
  });

  it("collapses an array of scalars into one column", () => {
    const columns = deriveColumns({
      type: "object",
      properties: {
        team: { type: "array", title: "Team", items: { type: "string" } },
      },
    });
    expect(columns).toHaveLength(1);
    expect(columns[0].key).toBe("team");
  });

  it("expands an array of objects to as many groups as the data needs", () => {
    const schema = {
      type: "object",
      properties: {
        samples: {
          type: "array",
          title: "Samples",
          items: {
            type: "object",
            properties: { id: { type: "string", title: "ID" } },
          },
        },
      },
    };
    const rows = [{ samples: [{ id: "a" }, { id: "b" }] }, { samples: [{ id: "c" }] }];
    const columns = deriveColumns(schema, rows);
    expect(columns.map((c) => c.key)).toEqual(["samples.0.id", "samples.1.id"]);
    expect(columns[0].header).toBe("Samples / 1 / ID");
  });
});

describe("csvEscape", () => {
  it("leaves plain values alone", () => {
    expect(csvEscape("Site A")).toBe("Site A");
  });

  it("quotes values containing the delimiter", () => {
    expect(csvEscape("A, B")).toBe('"A, B"');
  });

  it("doubles embedded quotes", () => {
    expect(csvEscape('say "hi"')).toBe('"say ""hi"""');
  });

  it("quotes values containing newlines", () => {
    expect(csvEscape("line1\nline2")).toBe('"line1\nline2"');
    expect(csvEscape("line1\r\nline2")).toBe('"line1\r\nline2"');
  });

  it("renders null and undefined as empty", () => {
    expect(csvEscape(null)).toBe("");
    expect(csvEscape(undefined)).toBe("");
  });

  it("respects a semicolon delimiter", () => {
    expect(csvEscape("A;B", ";")).toBe('"A;B"');
    expect(csvEscape("A,B", ";")).toBe("A,B");
  });
});

describe("formatCell", () => {
  it("renders booleans as true/false, including false", () => {
    // A plain falsy check here would turn `false` into an empty cell, which
    // reads as "not answered" rather than "answered no".
    expect(formatCell(false)).toBe("false");
    expect(formatCell(true)).toBe("true");
  });

  it("renders zero rather than blanking it", () => {
    expect(formatCell(0)).toBe("0");
  });

  it("joins arrays with a semicolon", () => {
    expect(formatCell(["a", "b"])).toBe("a; b");
  });

  it("renders empty for missing values", () => {
    expect(formatCell(undefined)).toBe("");
    expect(formatCell(null)).toBe("");
  });
});

describe("buildExportTable", () => {
  it("prepends submission bookkeeping columns by default", () => {
    const { headers } = buildExportTable({
      jsonSchema: fieldSchema,
      submissions: [submission({ siteName: "A" })],
    });
    expect(headers.slice(0, 3)).toEqual([
      "Submission ID",
      "Status",
      "Form version",
    ]);
  });

  it("can omit the bookkeeping columns", () => {
    const { headers } = buildExportTable({
      jsonSchema: fieldSchema,
      submissions: [],
      includeMetadata: false,
    });
    expect(headers).toEqual(["Site name", "Latitude", "Sample type", "Filtered"]);
  });

  it("gives every row the same width", () => {
    const { headers, rows } = buildExportTable({
      jsonSchema: fieldSchema,
      submissions: [
        submission({ siteName: "A", latitude: 48.4 }),
        submission({ sampleType: "control" }, { id: "s2" }),
      ],
    });
    rows.forEach((row) => expect(row).toHaveLength(headers.length));
  });

  it("prefers the editor's email for the submitted-by column", () => {
    const { headers, rows } = buildExportTable({
      jsonSchema: fieldSchema,
      submissions: [
        submission({}, { lastEditedBy: { email: "a@b.ca" } }),
      ],
    });
    expect(rows[0][headers.indexOf("Submitted by")]).toBe("a@b.ca");
  });
});

describe("toCsv", () => {
  it("produces a CRLF-terminated table", () => {
    const csv = toCsv({
      jsonSchema: fieldSchema,
      submissions: [submission({ siteName: "Site A", latitude: 48.4 })],
      includeMetadata: false,
    });
    const lines = csv.split("\r\n");
    expect(lines[0]).toBe("Site name,Latitude,Sample type,Filtered");
    expect(lines[1]).toBe("Site A,48.4,,");
  });

  it("quotes a value containing a comma", () => {
    const csv = toCsv({
      jsonSchema: fieldSchema,
      submissions: [submission({ siteName: "Bay, North" })],
      includeMetadata: false,
    });
    expect(csv.split("\r\n")[1]).toBe('"Bay, North",,,');
  });

  it("emits a header row even with no submissions", () => {
    const csv = toCsv({
      jsonSchema: fieldSchema,
      submissions: [],
      includeMetadata: false,
    });
    expect(csv).toBe("Site name,Latitude,Sample type,Filtered");
  });
});

describe("toJson", () => {
  it("keeps the nested shape and reports a count", () => {
    const parsed = JSON.parse(
      toJson({
        formType: { slug: "edna-field", title: { en: "F" }, version: 2 },
        submissions: [submission({ site: { name: "A" } })],
        region: "pacific",
      })
    );
    expect(parsed.exportedCount).toBe(1);
    expect(parsed.region).toBe("pacific");
    expect(parsed.submissions[0].data.site.name).toBe("A");
  });
});

describe("exportFilename", () => {
  it("joins slug, region, and stamp", () => {
    expect(
      exportFilename({
        slug: "edna-field",
        region: "pacific",
        stamp: "2026-08-04",
        extension: "csv",
      })
    ).toBe("edna-field_pacific_2026-08-04.csv");
  });

  it("strips unsafe characters from the slug", () => {
    expect(
      exportFilename({ slug: "a/b c", region: "r", stamp: "", extension: "csv" })
    ).toBe("a-b-c_r.csv");
  });
});
