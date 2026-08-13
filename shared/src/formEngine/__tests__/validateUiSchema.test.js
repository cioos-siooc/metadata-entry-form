import { describe, expect, it } from "vitest";

import { validateUiSchema, ERROR, WARNING, INFO } from "../validateUiSchema";

const schema = {
  type: "object",
  properties: {
    siteName: { type: "string" },
    depth: { type: "number" },
    sampleType: { type: "string", enum: ["water", "control"] },
    eov: { type: "array", uniqueItems: true, items: { enum: ["oxygen", "salinity"] } },
    team: { type: "array", items: { type: "string" } },
    notes: { type: "object", properties: { en: {}, fr: {} } },
  },
};

/** Only the hard failures, so a case's expectations stay readable. */
const errors = (uiSchema) =>
  validateUiSchema(schema, uiSchema).filter((p) => p.severity === ERROR);
const warnings = (uiSchema) =>
  validateUiSchema(schema, uiSchema).filter((p) => p.severity === WARNING);
const paths = (problems) => problems.map((p) => p.path);

/** Every problem must be reportable in both languages. */
function expectBilingual(problems) {
  problems.forEach((problem) => {
    expect(typeof problem.message.en).toBe("string");
    expect(problem.message.en.length).toBeGreaterThan(0);
    expect(typeof problem.message.fr).toBe("string");
    expect(problem.message.fr.length).toBeGreaterThan(0);
  });
}

describe("validateUiSchema", () => {
  it("passes a well-formed uiSchema with no errors or warnings", () => {
    const uiSchema = {
      "ui:steps": [
        { id: "site", title: { en: "Site", fr: "Site" }, fields: ["siteName", "depth"] },
        {
          id: "sample",
          title: { en: "Sample", fr: "Échantillon" },
          fields: ["sampleType", "eov", "team", "notes"],
          visibleIf: { field: "depth", exists: true },
        },
      ],
      "ui:summaryFields": ["siteName", "sampleType"],
      siteName: { "ui:options": { i18n: { title: { en: "Site", fr: "Site" } } } },
      depth: { "ui:options": { i18n: { title: { en: "Depth", fr: "Profondeur" } } } },
      sampleType: { "ui:options": { i18n: { title: { en: "Type", fr: "Type" } } } },
      eov: {
        "ui:widget": "checkboxList",
        "ui:options": { i18n: { title: { en: "EOV", fr: "EOV" } }, inline: true },
      },
      team: { "ui:options": { i18n: { title: { en: "Team", fr: "Équipe" } } } },
      notes: {
        "ui:field": "bilingualText",
        "ui:options": { i18n: { title: { en: "Notes", fr: "Notes" } } },
      },
    };

    const problems = validateUiSchema(schema, uiSchema);
    expect(problems.filter((p) => p.severity !== INFO)).toEqual([]);
  });

  it("returns nothing for an absent uiSchema", () => {
    expect(validateUiSchema(schema, undefined)).toEqual([]);
    expect(validateUiSchema(schema, null)).toEqual([]);
  });

  it("reports a uiSchema that is not an object", () => {
    expect(errors([])).toHaveLength(1);
  });

  it("reports every problem in both languages", () => {
    expectBilingual(
      validateUiSchema(schema, {
        "ui:steps": [{ id: "a", fields: ["nope"] }],
        ghost: { "ui:help": { en: "x" }, "ui:widget": "nope" },
      })
    );
  });

  describe("ui:steps", () => {
    it("flags a field that is not in the JSON Schema", () => {
      // This is the silent drop in steps.js:88-90 that motivated the validator.
      const problems = errors({ "ui:steps": [{ id: "a", fields: ["siteName", "typo"] }] });
      expect(paths(problems)).toEqual(["ui:steps[0].fields[1]"]);
      expect(problems[0].message.en).toContain("typo");
    });

    it("flags a duplicate step id", () => {
      const problems = warnings({
        "ui:steps": [
          { id: "a", fields: ["siteName"] },
          { id: "a", fields: ["depth"] },
        ],
      });
      expect(paths(problems)).toContain("ui:steps[1].id");
    });

    it("flags a field claimed by two steps", () => {
      const problems = warnings({
        "ui:steps": [
          { id: "a", fields: ["siteName"] },
          { id: "b", fields: ["siteName"] },
        ],
      });
      expect(paths(problems)).toContain("ui:steps[1].fields[0]");
      expect(problems.find((p) => p.path === "ui:steps[1].fields[0]").message.en).toContain(
        '"a"'
      );
    });

    it("flags a missing step id", () => {
      const problems = warnings({ "ui:steps": [{ fields: ["siteName"] }] });
      expect(paths(problems)).toContain("ui:steps[0]");
    });

    it("flags ui:steps that is not an array", () => {
      expect(paths(errors({ "ui:steps": { id: "a" } }))).toEqual(["ui:steps"]);
    });

    it("flags fields that is not an array", () => {
      expect(paths(errors({ "ui:steps": [{ id: "a", fields: "siteName" }] }))).toEqual([
        "ui:steps[0].fields",
      ]);
    });

    it("notes a step with no title", () => {
      const problems = validateUiSchema(schema, {
        "ui:steps": [{ id: "a", fields: ["siteName"] }],
      });
      expect(paths(problems)).toContain("ui:steps[0].title");
    });
  });

  describe("ui:summaryFields", () => {
    it("flags a field that is not in the JSON Schema", () => {
      expect(paths(errors({ "ui:summaryFields": ["siteName", "gone"] }))).toEqual([
        "ui:summaryFields[1]",
      ]);
    });

    it("flags an object or array field", () => {
      const problems = warnings({ "ui:summaryFields": ["team", "notes"] });
      expect(paths(problems)).toEqual([
        "ui:summaryFields[0]",
        "ui:summaryFields[1]",
      ]);
    });

    it("flags ui:summaryFields that is not an array", () => {
      expect(paths(errors({ "ui:summaryFields": "siteName" }))).toEqual([
        "ui:summaryFields",
      ]);
    });
  });

  describe("widgets", () => {
    it("warns about an unknown widget name", () => {
      // A near-miss on case is the realistic version of this mistake.
      const problems = warnings({ siteName: { "ui:widget": "isoDatetime" } });
      expect(paths(problems)).toContain("siteName.ui:widget");
    });

    it("errors when a known widget cannot render the property type", () => {
      expect(paths(errors({ siteName: { "ui:widget": "checkboxList" } }))).toContain(
        "siteName.ui:widget"
      );
      expect(paths(errors({ depth: { "ui:widget": "isoDateTime" } }))).toContain(
        "depth.ui:widget"
      );
    });

    it("errors when checkboxList is used on an array with no enum", () => {
      expect(paths(errors({ team: { "ui:widget": "checkboxList" } }))).toContain(
        "team.ui:widget"
      );
    });

    it("warns when a ui:field name is given to ui:widget", () => {
      expect(paths(warnings({ notes: { "ui:widget": "bilingualText" } }))).toContain(
        "notes.ui:widget"
      );
    });
  });

  describe("reserved rjsf keys", () => {
    it("errors on a bilingual object in ui:help and points at the right key", () => {
      const problems = errors({ siteName: { "ui:help": { en: "a", fr: "b" } } });
      expect(paths(problems)).toContain("siteName.ui:help");
      expect(problems[0].message.en).toContain("ui:options.i18n.help");
    });

    it("errors on a bilingual object in ui:title", () => {
      expect(paths(errors({ siteName: { "ui:title": { en: "a" } } }))).toContain(
        "siteName.ui:title"
      );
    });

    it("accepts a plain string in a reserved key", () => {
      expect(errors({ siteName: { "ui:help": "plain string" } })).toEqual([]);
    });
  });

  describe("visibleIf", () => {
    it("errors on a rule referring to an unknown field", () => {
      const problems = errors({
        siteName: { "ui:options": { visibleIf: { field: "missing", equals: "x" } } },
      });
      expect(paths(problems)).toContain("siteName.ui:options.visibleIf.field");
    });

    it("accepts a dot path rooted at a real property", () => {
      expect(
        errors({
          siteName: { "ui:options": { visibleIf: { field: "notes.en", truthy: true } } },
        })
      ).toEqual([]);
    });

    it("errors when no comparison is given", () => {
      // predicate.js returns true for these, so the field is always shown.
      const problems = errors({
        siteName: { "ui:options": { visibleIf: { field: "depth" } } },
      });
      expect(paths(problems)).toContain("siteName.ui:options.visibleIf");
    });

    it("warns when more than one comparison is given", () => {
      const problems = warnings({
        siteName: {
          "ui:options": { visibleIf: { field: "depth", equals: 1, truthy: true } },
        },
      });
      expect(paths(problems)).toContain("siteName.ui:options.visibleIf");
    });

    it("warns about an unknown rule key", () => {
      const problems = warnings({
        siteName: {
          "ui:options": { visibleIf: { field: "depth", greaterThan: 3 } },
        },
      });
      expect(paths(problems)).toContain("siteName.ui:options.visibleIf.greaterThan");
    });

    it("warns about an unknown context flag", () => {
      const problems = warnings({
        siteName: { "ui:options": { visibleIf: { context: "isAdmin" } } },
      });
      expect(paths(problems)).toContain("siteName.ui:options.visibleIf.context");
    });

    it("accepts the canEdit context flag", () => {
      expect(
        validateUiSchema(schema, {
          siteName: { "ui:options": { visibleIf: { context: "canEdit" } } },
        }).filter((p) => p.severity !== INFO)
      ).toEqual([]);
    });

    it("reports the position of a bad rule inside a combinator", () => {
      const problems = errors({
        siteName: {
          "ui:options": {
            visibleIf: {
              anyOf: [
                { field: "depth", equals: 1 },
                { field: "typo", equals: 2 },
              ],
            },
          },
        },
      });
      expect(paths(problems)).toEqual([
        "siteName.ui:options.visibleIf.anyOf[1].field",
      ]);
    });

    it("validates a step's visibleIf too", () => {
      const problems = errors({
        "ui:steps": [
          { id: "a", fields: ["siteName"], visibleIf: { field: "typo", equals: 1 } },
        ],
      });
      expect(paths(problems)).toContain("ui:steps[0].visibleIf.field");
    });

    it("warns when in or notIn is not an array", () => {
      const problems = warnings({
        siteName: { "ui:options": { visibleIf: { field: "depth", in: "one" } } },
      });
      expect(paths(problems)).toContain("siteName.ui:options.visibleIf.in");
    });
  });

  describe("field entries", () => {
    it("warns about configuration for a property that does not exist", () => {
      const problems = warnings({ ghost: { "ui:widget": "textarea" } });
      expect(paths(problems)).toContain("ghost");
    });

    it("errors when ui:options is not an object", () => {
      expect(paths(errors({ siteName: { "ui:options": "wide" } }))).toContain(
        "siteName.ui:options"
      );
    });

    it("notes a property with no bilingual title, configured or not", () => {
      const problems = validateUiSchema(schema, {
        siteName: { "ui:widget": "textarea" },
      });
      const noted = problems.filter((p) => p.severity === INFO).map((p) => p.path);
      expect(noted).toContain("siteName.ui:options.i18n.title");
      // A property with no entry at all is covered by the same nudge.
      expect(noted).toContain("depth.ui:options.i18n.title");
    });
  });
});
