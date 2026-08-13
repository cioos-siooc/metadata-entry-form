import { describe, expect, it } from "vitest";

import {
  addStep,
  assignFieldToStep,
  assignedFields,
  getFieldWidget,
  moveFieldWithinStep,
  moveItem,
  moveStep,
  removeStep,
  setFieldI18n,
  setFieldOption,
  setFieldVisibleIf,
  setFieldWidget,
  setStepVisibleIf,
  setSummaryFields,
  updateStep,
} from "../uiSchemaOps";

const base = () => ({
  "ui:steps": [
    { id: "site", title: { en: "Site", fr: "Site" }, fields: ["siteName", "depth"] },
    { id: "lab", title: { en: "Lab", fr: "Labo" }, fields: ["labDate"] },
  ],
  "ui:summaryFields": ["siteName"],
  siteName: { "ui:options": { i18n: { title: { en: "Site name", fr: "Nom du site" } } } },
});

describe("moveItem", () => {
  it("moves an element and leaves the input alone", () => {
    const items = ["a", "b", "c"];
    expect(moveItem(items, 0, 2)).toEqual(["b", "c", "a"]);
    expect(items).toEqual(["a", "b", "c"]);
  });

  it("returns the same array for a no-op or out-of-range move", () => {
    const items = ["a", "b"];
    expect(moveItem(items, 1, 1)).toBe(items);
    expect(moveItem(items, 0, 5)).toBe(items);
    expect(moveItem(items, -1, 0)).toBe(items);
  });
});

describe("field i18n", () => {
  it("sets a bilingual title without disturbing the other language", () => {
    const next = setFieldI18n(base(), "siteName", "title", "fr", "Site");
    expect(next.siteName["ui:options"].i18n.title).toEqual({
      en: "Site name",
      fr: "Site",
    });
  });

  it("creates the nested containers for a field with no entry yet", () => {
    const next = setFieldI18n({}, "depth", "help", "en", "Metres below surface.");
    expect(next).toEqual({
      depth: { "ui:options": { i18n: { help: { en: "Metres below surface." } } } },
    });
  });

  it("prunes emptied containers when a value is cleared", () => {
    const next = setFieldI18n(
      { depth: { "ui:options": { i18n: { title: { en: "Depth" } } } } },
      "depth",
      "title",
      "en",
      ""
    );
    // Not `{depth: {"ui:options": {i18n: {title: {}}}}}` — that litter would
    // show up in every published version diff.
    expect(next).toEqual({});
  });

  it("keeps siblings when pruning", () => {
    const next = setFieldI18n(
      {
        depth: {
          "ui:widget": "textarea",
          "ui:options": { i18n: { title: { en: "Depth" } } },
        },
      },
      "depth",
      "title",
      "en",
      ""
    );
    expect(next).toEqual({ depth: { "ui:widget": "textarea" } });
  });

  it("does not mutate the input", () => {
    const input = base();
    const snapshot = JSON.stringify(input);
    setFieldI18n(input, "siteName", "title", "en", "changed");
    expect(JSON.stringify(input)).toBe(snapshot);
  });
});

describe("setFieldWidget", () => {
  it("puts a widget under ui:widget", () => {
    expect(setFieldWidget({}, "notes", "textarea")).toEqual({
      notes: { "ui:widget": "textarea" },
    });
  });

  it("puts a field under ui:field, not ui:widget", () => {
    // bilingualText is registered as a field; under ui:widget it does nothing.
    expect(setFieldWidget({}, "notes", "bilingualText")).toEqual({
      notes: { "ui:field": "bilingualText" },
    });
  });

  it("clears the other key when switching kinds", () => {
    const withField = setFieldWidget({}, "notes", "bilingualText");
    expect(setFieldWidget(withField, "notes", "textarea")).toEqual({
      notes: { "ui:widget": "textarea" },
    });
  });

  it("clears both keys when given a blank name", () => {
    const withWidget = setFieldWidget({}, "notes", "textarea");
    expect(setFieldWidget(withWidget, "notes", "")).toEqual({});
  });

  it("reads back whichever key holds the choice", () => {
    expect(getFieldWidget(setFieldWidget({}, "a", "textarea"), "a")).toBe("textarea");
    expect(getFieldWidget(setFieldWidget({}, "a", "bilingualText"), "a")).toBe(
      "bilingualText"
    );
    expect(getFieldWidget({}, "a")).toBe("");
  });
});

describe("setFieldOption and setFieldVisibleIf", () => {
  it("sets and clears an option", () => {
    const set = setFieldOption({}, "notes", "rows", 6);
    expect(set).toEqual({ notes: { "ui:options": { rows: 6 } } });
    expect(setFieldOption(set, "notes", "rows", undefined)).toEqual({});
  });

  it("stores a visibility rule under ui:options", () => {
    const rule = { field: "sampleType", notIn: ["control"] };
    expect(setFieldVisibleIf({}, "depth", rule)).toEqual({
      depth: { "ui:options": { visibleIf: rule } },
    });
  });

  it("removes the rule when given an empty one", () => {
    const set = setFieldVisibleIf({}, "depth", { field: "a", equals: 1 });
    expect(setFieldVisibleIf(set, "depth", {})).toEqual({});
    expect(setFieldVisibleIf(set, "depth", null)).toEqual({});
  });
});

describe("steps", () => {
  it("claims every existing property when the first step is added", () => {
    // Otherwise a form that rendered as one page would jump wholesale into the
    // catch-all "Other" tab the moment an author added a step.
    const next = addStep(
      { siteName: {} },
      { title: { en: "Site", fr: "Site" }, allFields: ["siteName", "depth"] }
    );
    expect(next["ui:steps"]).toEqual([
      { id: "site", title: { en: "Site", fr: "Site" }, fields: ["siteName", "depth"] },
    ]);
  });

  it("adds later steps empty", () => {
    const next = addStep(base(), {
      title: { en: "Notes", fr: "Notes" },
      allFields: ["siteName", "depth", "labDate"],
    });
    expect(next["ui:steps"][2]).toEqual({
      id: "notes",
      title: { en: "Notes", fr: "Notes" },
      fields: [],
    });
  });

  it("derives a unique id when the slug is taken", () => {
    const next = addStep(base(), { title: { en: "Site", fr: "Site" } });
    expect(next["ui:steps"][2].id).toBe("site-2");
  });

  it("falls back to a positional id for an untitled step", () => {
    expect(addStep({}, {})["ui:steps"][0].id).toBe("step-1");
  });

  it("merges a patch into one step", () => {
    const next = updateStep(base(), 1, { title: { en: "Laboratory", fr: "Labo" } });
    expect(next["ui:steps"][1].title.en).toBe("Laboratory");
    expect(next["ui:steps"][1].fields).toEqual(["labDate"]);
    expect(next["ui:steps"][0]).toEqual(base()["ui:steps"][0]);
  });

  it("removes a key when the patch value is undefined", () => {
    const withRule = setStepVisibleIf(base(), 0, { field: "a", truthy: true });
    expect(setStepVisibleIf(withRule, 0, null)["ui:steps"][0]).not.toHaveProperty(
      "visibleIf"
    );
  });

  it("leaves per-field configuration alone when a step is removed", () => {
    const next = removeStep(base(), 0);
    expect(next["ui:steps"]).toHaveLength(1);
    // siteName is now unassigned, but its title survives.
    expect(next.siteName["ui:options"].i18n.title.en).toBe("Site name");
    expect(assignedFields(next)).toEqual(["labDate"]);
  });

  it("drops ui:steps entirely when the last step is removed", () => {
    const single = { "ui:steps": [{ id: "a", fields: ["x"] }], x: {} };
    expect(removeStep(single, 0)).toEqual({ x: {} });
  });

  it("reorders steps", () => {
    const next = moveStep(base(), 1, 0);
    expect(next["ui:steps"].map((s) => s.id)).toEqual(["lab", "site"]);
  });

  it("reorders fields within a step", () => {
    const next = moveFieldWithinStep(base(), 0, 1, 0);
    expect(next["ui:steps"][0].fields).toEqual(["depth", "siteName"]);
  });
});

describe("assignFieldToStep", () => {
  it("moves a field between steps rather than copying it", () => {
    const next = assignFieldToStep(base(), "siteName", 1);
    expect(next["ui:steps"][0].fields).toEqual(["depth"]);
    expect(next["ui:steps"][1].fields).toEqual(["labDate", "siteName"]);
  });

  it("honours an insertion position", () => {
    const next = assignFieldToStep(base(), "siteName", 1, 0);
    expect(next["ui:steps"][1].fields).toEqual(["siteName", "labDate"]);
  });

  it("unassigns a field when given a null step", () => {
    const next = assignFieldToStep(base(), "siteName", null);
    expect(assignedFields(next)).toEqual(["depth", "labDate"]);
  });

  it("adds a field not previously in any step", () => {
    const next = assignFieldToStep(base(), "newField", 0);
    expect(next["ui:steps"][0].fields).toEqual(["siteName", "depth", "newField"]);
  });

  it("does nothing when the form has no steps", () => {
    const flat = { siteName: {} };
    expect(assignFieldToStep(flat, "siteName", 0)).toBe(flat);
  });
});

describe("setSummaryFields", () => {
  it("replaces the list", () => {
    expect(setSummaryFields(base(), ["depth", "siteName"])["ui:summaryFields"]).toEqual([
      "depth",
      "siteName",
    ]);
  });

  it("removes the key when the list is emptied", () => {
    expect(setSummaryFields(base(), [])).not.toHaveProperty("ui:summaryFields");
  });
});

describe("round-trip safety", () => {
  // The builder is a lens over the JSON, not a replacement format. Anything it
  // has no control for must survive being edited around.
  const withExtras = () => ({
    ...base(),
    "ui:someFutureKey": { keep: "me" },
    "ui:steps": [
      {
        id: "site",
        title: { en: "Site", fr: "Site" },
        fields: ["siteName", "depth"],
        customStepKey: 42,
      },
      { id: "lab", title: { en: "Lab", fr: "Labo" }, fields: ["labDate"] },
    ],
    siteName: {
      "ui:autofocus": true,
      "ui:options": {
        i18n: { title: { en: "Site name", fr: "Nom du site" } },
        unknownOption: "kept",
      },
    },
  });

  const operations = [
    ["setFieldI18n", (ui) => setFieldI18n(ui, "siteName", "help", "en", "Help.")],
    ["setFieldWidget", (ui) => setFieldWidget(ui, "siteName", "textarea")],
    ["setFieldOption", (ui) => setFieldOption(ui, "siteName", "rows", 4)],
    [
      "setFieldVisibleIf",
      (ui) => setFieldVisibleIf(ui, "siteName", { field: "depth", truthy: true }),
    ],
    ["addStep", (ui) => addStep(ui, { title: { en: "Notes", fr: "Notes" } })],
    ["updateStep", (ui) => updateStep(ui, 0, { title: { en: "S", fr: "S" } })],
    ["moveStep", (ui) => moveStep(ui, 0, 1)],
    ["removeStep", (ui) => removeStep(ui, 1)],
    ["assignFieldToStep", (ui) => assignFieldToStep(ui, "depth", 1)],
    ["moveFieldWithinStep", (ui) => moveFieldWithinStep(ui, 0, 0, 1)],
    ["setSummaryFields", (ui) => setSummaryFields(ui, ["depth"])],
  ];

  it.each(operations)("%s preserves unrecognized keys", (_name, operate) => {
    const next = operate(withExtras());
    expect(next["ui:someFutureKey"]).toEqual({ keep: "me" });
    expect(next.siteName["ui:autofocus"]).toBe(true);
    expect(next.siteName["ui:options"].unknownOption).toBe("kept");
  });

  it.each(operations)("%s does not mutate its input", (_name, operate) => {
    const input = withExtras();
    const snapshot = JSON.stringify(input);
    operate(input);
    expect(JSON.stringify(input)).toBe(snapshot);
  });

  it("preserves an unrecognized key on a step it did not touch", () => {
    const next = moveStep(withExtras(), 0, 1);
    expect(next["ui:steps"].find((s) => s.id === "site").customStepKey).toBe(42);
  });
});
