import { describe, expect, it } from "vitest";

import {
  renderedOpenKeys,
  resolveSelection,
  stepIndexOfField,
  stepKey,
  stepKeys,
} from "../UiSchemaBuilder/selection";
import { matchesQuery } from "../UiSchemaBuilder/useFieldFilter";

/**
 * The index arithmetic behind the inspector's selection and the open step cards.
 *
 * Worth testing here rather than through the panel: every one of these cases is
 * a state the panel can be put into by an edit made in ANOTHER tab, which is
 * expensive to stage through the UI and cheap to state directly.
 */

const steps = [
  { id: "site", title: { en: "Site" }, fields: ["siteName", "depth"] },
  { id: "sample", title: { en: "Sample" }, fields: ["sampleType"] },
];

const jsonSchema = {
  type: "object",
  properties: {
    siteName: { type: "string" },
    depth: { type: "number" },
    sampleType: { type: "string" },
    notes: { type: "object" },
  },
};

describe("stepKey", () => {
  it("prefers the author's step id", () => {
    expect(stepKey({ id: "site" }, 0)).toBe("id:site");
  });

  it("falls back to a positional key when a step has no id", () => {
    // resolveSteps generates `step-N` in this case, and validateUiSchema warns.
    // The builder still has to key its UI state off something.
    expect(stepKey({}, 2)).toBe("#2");
    expect(stepKey({ id: "" }, 1)).toBe("#1");
  });

  it("cannot collide a positional key with a real id", () => {
    // uniqueStepId strips everything outside [a-z0-9-], so no id starts with #.
    expect(stepKeys([{ id: "site" }, {}])).toEqual(["id:site", "#1"]);
  });

  it("gives two steps sharing an id the same key", () => {
    // An author can type a duplicate id; validateUiSchema warns rather than
    // rejecting. Both cards then open together, which is odd but harmless —
    // and far better than a key that silently points at the wrong step.
    expect(stepKeys([{ id: "dup" }, { id: "dup" }])).toEqual(["id:dup", "id:dup"]);
  });
});

describe("resolveSelection", () => {
  it("defaults to the first property so the panel opens on something", () => {
    expect(resolveSelection(null, jsonSchema, steps)).toEqual({
      kind: "field",
      name: "siteName",
    });
  });

  it("keeps a field that still exists", () => {
    expect(
      resolveSelection({ kind: "field", name: "notes" }, jsonSchema, steps)
    ).toEqual({ kind: "field", name: "notes" });
  });

  it("falls back when the JSON Schema tab deletes the selected property", () => {
    expect(
      resolveSelection({ kind: "field", name: "gone" }, jsonSchema, steps)
    ).toEqual({ kind: "field", name: "siteName" });
  });

  it("resolves a step key to its current index", () => {
    expect(
      resolveSelection({ kind: "step", key: "id:sample" }, jsonSchema, steps)
    ).toEqual({ kind: "step", index: 1 });
  });

  it("follows a step through a reorder rather than holding its old index", () => {
    const reordered = [steps[1], steps[0]];
    expect(
      resolveSelection({ kind: "step", key: "id:sample" }, jsonSchema, reordered)
    ).toEqual({ kind: "step", index: 0 });
  });

  it("falls back to a field when the selected step is deleted", () => {
    expect(
      resolveSelection({ kind: "step", key: "id:sample" }, jsonSchema, [steps[0]])
    ).toEqual({ kind: "field", name: "siteName" });
  });

  it("returns null when the schema has no properties at all", () => {
    expect(resolveSelection(null, { properties: {} }, [])).toBeNull();
    expect(
      resolveSelection({ kind: "field", name: "x" }, { properties: {} }, [])
    ).toBeNull();
  });

  it("tolerates a missing schema", () => {
    expect(resolveSelection(null, undefined, undefined)).toBeNull();
  });
});

describe("stepIndexOfField", () => {
  it("finds the step claiming a field", () => {
    expect(stepIndexOfField(steps, "depth")).toBe(0);
    expect(stepIndexOfField(steps, "sampleType")).toBe(1);
  });

  it("returns null for a field in no step", () => {
    expect(stepIndexOfField(steps, "notes")).toBeNull();
  });

  it("tolerates a step with no fields array", () => {
    expect(stepIndexOfField([{ id: "a" }], "x")).toBeNull();
  });
});

describe("renderedOpenKeys", () => {
  it("keeps what the author explicitly opened", () => {
    const keys = renderedOpenKeys({ steps, open: new Set(["id:sample"]) });
    expect([...keys]).toEqual(["id:sample"]);
  });

  it("forces open the step holding the selected field", () => {
    const keys = renderedOpenKeys({
      steps,
      selection: { kind: "field", name: "sampleType" },
    });
    expect(keys.has("id:sample")).toBe(true);
    expect(keys.has("id:site")).toBe(false);
  });

  it("forces open the selected step", () => {
    const keys = renderedOpenKeys({ steps, selection: { kind: "step", index: 0 } });
    expect(keys.has("id:site")).toBe(true);
  });

  it("does not force a card open for an unassigned field", () => {
    const keys = renderedOpenKeys({
      steps,
      selection: { kind: "field", name: "notes" },
    });
    expect([...keys]).toEqual([]);
  });

  it("forces open every step containing a search hit", () => {
    const keys = renderedOpenKeys({
      steps,
      matchedFields: new Set(["depth", "sampleType"]),
    });
    expect(keys.has("id:site")).toBe(true);
    expect(keys.has("id:sample")).toBe(true);
  });

  it("unions the explicit, selected and matched sets", () => {
    const keys = renderedOpenKeys({
      steps,
      open: new Set(["#9"]),
      selection: { kind: "field", name: "siteName" },
      matchedFields: new Set(["sampleType"]),
    });
    expect([...keys].sort()).toEqual(["#9", "id:sample", "id:site"]);
  });

  it("ignores a selected step index the steps no longer have", () => {
    const keys = renderedOpenKeys({ steps, selection: { kind: "step", index: 7 } });
    expect([...keys]).toEqual([]);
  });
});

describe("matchesQuery", () => {
  const ui = {
    siteName: {
      "ui:options": {
        i18n: { title: { en: "Site name or ID", fr: "Nom ou ID du site" } },
      },
    },
    depth: { "ui:options": { i18n: { title: { en: "Sample depth" } } } },
  };
  const schema = {
    properties: {
      siteName: { type: "string" },
      depth: { type: "number" },
      tide: { type: "string", title: "Tide state" },
    },
  };

  const match = (name, query) => matchesQuery(name, ui, schema, query);

  it("matches everything when the query is blank", () => {
    expect(match("siteName", "")).toBe(true);
    expect(match("siteName", "   ")).toBe(true);
    expect(match("siteName", undefined)).toBe(true);
  });

  it("matches on the property name, case-insensitively", () => {
    expect(match("siteName", "sitename")).toBe(true);
    expect(match("siteName", "SITE")).toBe(true);
    expect(match("siteName", "Name")).toBe(true);
    expect(match("depth", "site")).toBe(false);
  });

  it("matches on a substring, not just a prefix", () => {
    expect(match("siteName", "eNam")).toBe(true);
  });

  it("matches the English label", () => {
    expect(match("siteName", "or ID")).toBe(true);
  });

  it("matches the French label even when the UI is in English", () => {
    // An author working in either language still knows fields by both labels,
    // and a bilingual pair is often half-filled — matching only the active
    // language would hide fields that plainly match.
    expect(match("siteName", "Nom ou")).toBe(true);
  });

  it("matches a label that only exists in one language", () => {
    expect(match("depth", "Sample depth")).toBe(true);
  });

  it("matches the schema's own title, which is the renderer's fallback label", () => {
    expect(match("tide", "Tide state")).toBe(true);
  });

  it("does not match a field with no label on label text", () => {
    expect(match("tide", "Nom")).toBe(false);
  });

  it("tolerates a missing uiSchema entry and a missing schema", () => {
    expect(matchesQuery("tide", undefined, undefined, "tide")).toBe(true);
    expect(matchesQuery("tide", undefined, undefined, "zzz")).toBe(false);
  });
});
