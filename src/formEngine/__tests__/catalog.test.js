import { describe, expect, it } from "vitest";
import Ajv from "ajv";
import addFormats from "ajv-formats";

import ednaField from "../catalog/edna-field.formtype.json";
import ednaLab from "../catalog/edna-lab.formtype.json";
import {
  validateFormTypeInput,
  resolveSteps,
  pickSchemaProperties,
  buildExportTable,
  toCsv,
  evaluate,
  validateUiSchema,
} from "@shared/formEngine";

/**
 * The seeded form types are DATA, not code — that is the point of the whole
 * engine. These tests treat them as data: they must satisfy the store's own
 * validation, compile as JSON Schema, be fully covered by their declared steps,
 * and produce a usable study metadata table.
 *
 * If a form type can be added without touching any of this, the engine works.
 */

const CATALOG = [
  ["eDNA Field", ednaField],
  ["eDNA Lab", ednaLab],
];

const ajv = addFormats(new Ajv({ allErrors: true, strict: false }));

describe.each(CATALOG)("%s form type definition", (_name, formType) => {
  it("passes the store's validation", () => {
    expect(validateFormTypeInput(formType)).toEqual([]);
  });

  it("compiles as JSON Schema", () => {
    expect(() => ajv.compile(formType.jsonSchema)).not.toThrow();
  });

  it("is bilingual at the top level", () => {
    expect(formType.title.en).toBeTruthy();
    expect(formType.title.fr).toBeTruthy();
    expect(formType.description.en).toBeTruthy();
    expect(formType.description.fr).toBeTruthy();
  });

  it("has a uiSchema the engine fully understands", () => {
    // The shipped catalog doubles as the validator's regression fixture: if a
    // rule here starts firing, either the catalog drifted or the rule is wrong.
    const problems = validateUiSchema(
      formType.jsonSchema,
      formType.uiSchema
    ).filter((problem) => problem.severity !== "info");

    expect(
      problems.map((problem) => `${problem.path}: ${problem.message.en}`)
    ).toEqual([]);
  });

  it("gives every field a bilingual label or a title", () => {
    const missing = Object.entries(formType.jsonSchema.properties)
      .filter(([name, sub]) => {
        const uiTitle =
          formType.uiSchema[name]?.["ui:options"]?.i18n?.title;
        const bilingual = uiTitle?.en && uiTitle?.fr;
        return !bilingual && !sub.title;
      })
      .map(([name]) => name);
    expect(missing).toEqual([]);
  });

  it("declares steps that cover every field", () => {
    // resolveSteps sweeps unclaimed fields into a catch-all; its presence means
    // a field was forgotten when the steps were written.
    const steps = resolveSteps(formType.jsonSchema, formType.uiSchema);
    const catchAll = steps.find((s) => s.unclaimed);
    expect(catchAll?.fields ?? []).toEqual([]);
  });

  it("only names fields that exist in the schema", () => {
    const known = new Set(Object.keys(formType.jsonSchema.properties));
    const unknown = (formType.uiSchema["ui:steps"] || [])
      .flatMap((step) => step.fields || [])
      .filter((field) => !known.has(field));
    expect(unknown).toEqual([]);
  });

  it("only references real fields in visibleIf predicates", () => {
    const known = new Set(Object.keys(formType.jsonSchema.properties));
    const unknown = (formType.uiSchema["ui:steps"] || [])
      .map((step) => step.visibleIf?.field)
      .filter(Boolean)
      .filter((field) => !known.has(field));
    expect(unknown).toEqual([]);
  });

  it("marks every required field as belonging to a step", () => {
    const steps = resolveSteps(formType.jsonSchema, formType.uiSchema);
    const claimed = new Set(steps.flatMap((s) => s.fields));
    (formType.jsonSchema.required || []).forEach((field) => {
      expect(claimed.has(field)).toBe(true);
    });
  });

  it("keeps required fields out of conditionally-hidden steps", () => {
    // A required field inside a step that can disappear would make the form
    // impossible to submit with no visible explanation.
    const required = new Set(formType.jsonSchema.required || []);
    const trapped = (formType.uiSchema["ui:steps"] || [])
      .filter((step) => step.visibleIf)
      .flatMap((step) => step.fields || [])
      .filter((field) => required.has(field));
    expect(trapped).toEqual([]);
  });

  it("produces a step subschema that still compiles", () => {
    const steps = resolveSteps(formType.jsonSchema, formType.uiSchema);
    steps.forEach((step) => {
      const sub = pickSchemaProperties(formType.jsonSchema, step.fields);
      expect(() => ajv.compile(sub)).not.toThrow();
    });
  });
});

describe("eDNA field form behaviour", () => {
  const validate = ajv.compile(ednaField.jsonSchema);

  const sample = {
    surveyName: "Burrard Inlet 2026",
    siteName: "BI-04",
    latitude: 49.3,
    longitude: -123.1,
    collectionDateTime: "2026-06-15T17:30:00.000Z",
    fieldTeam: ["A. Analyst", "B. Biologist"],
    weather: "overcast",
    seaState: "2 - light breeze",
    tideState: "ebb",
    sampleId: "BI-04-S1",
    sampleType: "sample",
    sampleDepthMetres: 5,
    replicateNumber: 1,
    filtrationStart: "2026-06-15T17:45:00.000Z",
    filtrationEnd: "2026-06-15T18:05:00.000Z",
    volumeFilteredMillilitres: 1000,
  };

  it("accepts a fully filled sample", () => {
    expect(validate(sample)).toBe(true);
  });

  it("rejects a sample missing its ID", () => {
    const { sampleId, ...rest } = sample;
    expect(validate(rest)).toBe(false);
  });

  it("rejects an out-of-range latitude", () => {
    expect(validate({ ...sample, latitude: 200 })).toBe(false);
  });

  it("hides the filtration step for a field control", () => {
    const step = ednaField.uiSchema["ui:steps"].find((s) => s.id === "filtration");
    expect(evaluate(step.visibleIf, { sampleType: "sample" })).toBe(true);
    expect(evaluate(step.visibleIf, { sampleType: "field blank" })).toBe(true);
    expect(evaluate(step.visibleIf, { sampleType: "field control" })).toBe(false);
  });
});

describe("eDNA lab form behaviour", () => {
  it("shows sequencing fields only for metabarcoding", () => {
    const steps = ednaLab.uiSchema["ui:steps"];
    const sequencing = steps.find((s) => s.id === "sequencing");
    const quantitative = steps.find((s) => s.id === "quantitative");

    expect(evaluate(sequencing.visibleIf, { assayType: "metabarcoding" })).toBe(true);
    expect(evaluate(sequencing.visibleIf, { assayType: "qPCR" })).toBe(false);

    expect(evaluate(quantitative.visibleIf, { assayType: "qPCR" })).toBe(true);
    expect(evaluate(quantitative.visibleIf, { assayType: "ddPCR" })).toBe(true);
    expect(evaluate(quantitative.visibleIf, { assayType: "metabarcoding" })).toBe(false);
  });

  it("accepts a qPCR record", () => {
    const validate = ajv.compile(ednaLab.jsonSchema);
    expect(
      validate({
        sampleId: "BI-04-S1",
        extractionDate: "2026-06-20",
        assayType: "qPCR",
        targetSpecies: "Oncorhynchus nerka",
        quantificationCycle: 32.4,
        detectionResult: "detected",
      })
    ).toBe(true);
  });
});

describe("study metadata export", () => {
  const submissions = [
    {
      id: "s1",
      status: "submitted",
      formTypeVersion: 1,
      userID: "u1",
      createdAt: "2026-06-16T00:00:00.000Z",
      updatedAt: "2026-06-16T00:00:00.000Z",
      data: {
        siteName: "BI-04",
        latitude: 49.3,
        longitude: -123.1,
        sampleId: "BI-04-S1",
        sampleType: "sample",
        fieldTeam: ["A. Analyst", "B. Biologist"],
        volumeFilteredMillilitres: 1000,
      },
    },
    {
      id: "s2",
      status: "submitted",
      formTypeVersion: 1,
      userID: "u1",
      createdAt: "2026-06-16T00:00:00.000Z",
      updatedAt: "2026-06-16T00:00:00.000Z",
      data: {
        siteName: "BI-04",
        sampleId: "BI-04-BLANK",
        sampleType: "field blank",
      },
    },
  ];

  it("emits one row per submission", () => {
    const { rows } = buildExportTable({
      jsonSchema: ednaField.jsonSchema,
      submissions,
    });
    expect(rows).toHaveLength(2);
  });

  it("includes a column for every schema field, filled in or not", () => {
    const { headers } = buildExportTable({
      jsonSchema: ednaField.jsonSchema,
      submissions,
      includeMetadata: false,
    });
    const fieldCount = Object.keys(ednaField.jsonSchema.properties).length;
    // fieldNotes is bilingual, so it contributes two columns rather than one.
    expect(headers.length).toBe(fieldCount + 1);
    expect(headers).toContain("Tide");
  });

  it("joins the field team into a single cell", () => {
    const { headers, rows } = buildExportTable({
      jsonSchema: ednaField.jsonSchema,
      submissions,
      includeMetadata: false,
    });
    const index = headers.indexOf("Members of the field team");
    expect(rows[0][index]).toBe("A. Analyst; B. Biologist");
  });

  it("gives blanks and samples the same columns", () => {
    const { rows } = buildExportTable({
      jsonSchema: ednaField.jsonSchema,
      submissions,
    });
    expect(rows[0]).toHaveLength(rows[1].length);
  });

  it("produces a CSV whose header and rows line up", () => {
    const csv = toCsv({
      jsonSchema: ednaField.jsonSchema,
      submissions,
      includeMetadata: false,
    });
    const lines = csv.split("\r\n");
    const columnCount = lines[0].split(",").length;
    expect(lines).toHaveLength(3);
    // The team cell is quoted because it contains a delimiter, so a naive split
    // would over-count; parse rather than split for that row.
    expect(parseCsvLine(lines[1])).toHaveLength(columnCount);
    expect(parseCsvLine(lines[2])).toHaveLength(columnCount);
  });

  it("uses French headers when exporting in French", () => {
    // Headers come from schema `title`, so a French export needs the bilingual
    // labels the docs use. Currently titles are English-only; this pins the
    // known limitation rather than pretending otherwise.
    const { headers } = buildExportTable({
      jsonSchema: ednaField.jsonSchema,
      submissions,
      language: "fr",
      includeMetadata: false,
    });
    expect(headers).toContain("Site name or ID");
  });
});

/** Minimal RFC 4180 splitter, so the CSV test does not rely on naive splitting. */
function parseCsvLine(line) {
  const cells = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells;
}

describe.each(CATALOG)("%s summary fields", (_name, formType) => {
  it("declares summary fields for the submissions list", () => {
    // Without these the list falls back to a heuristic; the eDNA forms should
    // name the columns that actually identify a sample.
    expect(Array.isArray(formType.uiSchema["ui:summaryFields"])).toBe(true);
    expect(formType.uiSchema["ui:summaryFields"].length).toBeGreaterThan(1);
  });

  it("only names fields that exist and are scalar", () => {
    const properties = formType.jsonSchema.properties;
    formType.uiSchema["ui:summaryFields"].forEach((field) => {
      expect(properties[field]).toBeDefined();
      // An array or object would render as JSON in a table cell.
      expect(["object", "array"]).not.toContain(properties[field].type);
    });
  });

  it("includes the sample ID that joins field to lab metadata", () => {
    expect(formType.uiSchema["ui:summaryFields"]).toContain("sampleId");
  });
});
