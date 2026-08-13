import React, { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import UiSchemaBuilder, { UiSchemaProblems } from "../UiSchemaBuilder";
import ednaField from "../../../../formEngine/catalog/edna-field.formtype.json";
import { validateUiSchema } from "@shared/formEngine";

/**
 * These are the heaviest tests in the suite: the builder is a controlled
 * component over a 22-property form, so every simulated keystroke re-renders
 * the whole panel. In isolation they take well under a second, but under the
 * full suite's parallel load they have crossed vitest's 5s default and failed
 * as timeouts rather than for any reason to do with the builder.
 *
 * Raised rather than papered over with retries, so a REAL hang still fails.
 */
vi.setConfig({ testTimeout: 20000 });

/**
 * The builder's contract is narrow and worth pinning down: it edits the parts of
 * the vocabulary it knows, it never invents a field name, and it never drops
 * anything it does not understand.
 *
 * The bundled eDNA field form is the fixture — it is the most complex uiSchema
 * that actually ships, so "a round trip through the builder changes nothing"
 * means something here.
 */

/** Controlled wrapper, matching how FormTypeEditor drives the builder. */
function Harness({ jsonSchema, initial, onValue, language = "en" }) {
  const [value, setValue] = useState(initial);
  return (
    <UiSchemaBuilder
      jsonSchema={jsonSchema}
      value={value}
      language={language}
      onChange={(next) => {
        setValue(next);
        if (onValue) onValue(next);
      }}
    />
  );
}

const simpleSchema = {
  type: "object",
  required: ["siteName"],
  properties: {
    siteName: { type: "string" },
    depth: { type: "number" },
    sampleType: { type: "string", enum: ["water", "control"] },
    notes: { type: "object", properties: { en: {}, fr: {} } },
  },
};

const simpleUi = {
  "ui:steps": [
    { id: "site", title: { en: "Site", fr: "Site" }, fields: ["siteName", "depth"] },
    { id: "sample", title: { en: "Sample", fr: "Échantillon" }, fields: ["sampleType"] },
  ],
};

/**
 * Step titles as shown on the accordion headers.
 *
 * Queried by heading rather than by text because each field row also names its
 * step in a dropdown, so a bare getByText("Site") is ambiguous.
 */
const stepHeadings = () =>
  screen
    // Level 3 is the accordion header MUI renders per step; the panel's own
    // subheadings are Typography, which render at level 6.
    .getAllByRole("heading", { level: 3 })
    .map((heading) => heading.textContent);

/** The condition editor for the selected field, not the one for a step. */
const fieldConditions = () =>
  within(screen.getByRole("group", { name: "Visible when" }));

/** Latest value the builder emitted, or the initial one if it never emitted. */
function renderBuilder({ jsonSchema = simpleSchema, initial = simpleUi, language } = {}) {
  const emitted = { current: initial };
  render(
    <Harness
      jsonSchema={jsonSchema}
      initial={initial}
      language={language}
      onValue={(next) => {
        emitted.current = next;
      }}
    />
  );
  return emitted;
}

describe("UiSchemaBuilder", () => {
  it("lists the schema's steps with their field counts", () => {
    renderBuilder();
    expect(stepHeadings()).toEqual(["Site2 fields", "Sample1 fields"]);
  });

  it("shows fields not claimed by any step", () => {
    renderBuilder();
    expect(screen.getByText("Not in any tab")).toBeInTheDocument();
    // `notes` is in no step, so it would land in the trailing "Other" tab.
    expect(screen.getByText("notes")).toBeInTheDocument();
  });

  it("edits a bilingual label into ui:options.i18n, not ui:title", async () => {
    const user = userEvent.setup();
    const emitted = renderBuilder();

    await user.type(screen.getByLabelText("Label (en)"), "Site name");

    // ui:title is a reserved rjsf string key; an {en, fr} object there throws.
    expect(emitted.current.siteName).not.toHaveProperty("ui:title");
    expect(emitted.current.siteName["ui:options"].i18n.title.en).toBe("Site name");
  });

  it("moves a field between steps rather than copying it", async () => {
    const user = userEvent.setup();
    const emitted = renderBuilder();

    await user.click(screen.getByLabelText("Step for depth"));
    await user.click(within(screen.getByRole("listbox")).getByText("Sample"));

    const steps = emitted.current["ui:steps"];
    expect(steps[0].fields).toEqual(["siteName"]);
    expect(steps[1].fields).toEqual(["sampleType", "depth"]);
  });

  it("unassigns a field", async () => {
    const user = userEvent.setup();
    const emitted = renderBuilder();

    await user.click(screen.getByLabelText("Step for depth"));
    await user.click(within(screen.getByRole("listbox")).getByText("Unassigned"));

    expect(emitted.current["ui:steps"][0].fields).toEqual(["siteName"]);
    expect(emitted.current["ui:steps"][1].fields).toEqual(["sampleType"]);
  });

  it("reorders fields within a step", async () => {
    const user = userEvent.setup();
    const emitted = renderBuilder();

    await user.click(screen.getByLabelText("Move depth up"));

    expect(emitted.current["ui:steps"][0].fields).toEqual(["depth", "siteName"]);
  });

  it("adds a step and claims every field when it is the first one", async () => {
    const user = userEvent.setup();
    const emitted = renderBuilder({ initial: {} });

    await user.click(screen.getByRole("button", { name: "Add step" }));

    expect(emitted.current["ui:steps"]).toHaveLength(1);
    expect(emitted.current["ui:steps"][0].fields).toEqual(
      Object.keys(simpleSchema.properties)
    );
  });

  it("offers only widgets that can render the selected property", async () => {
    const user = userEvent.setup();
    renderBuilder();

    // siteName is a string: no checkbox list, no bilingual text.
    await user.click(screen.getByLabelText("Input type"));
    const options = within(screen.getByRole("listbox"))
      .getAllByRole("option")
      .map((option) => option.textContent);

    expect(options).toContain("Multi-line text");
    expect(options).toContain("Date and time");
    expect(options).not.toContain("Checkbox list");
    expect(options).not.toContain("Bilingual text");
  });

  it("writes bilingualText under ui:field, not ui:widget", async () => {
    const user = userEvent.setup();
    const emitted = renderBuilder();

    await user.click(screen.getByText("notes"));
    await user.click(screen.getByLabelText("Input type"));
    await user.click(within(screen.getByRole("listbox")).getByText("Bilingual text"));

    expect(emitted.current.notes).toEqual({ "ui:field": "bilingualText" });
  });

  it("builds a visibility rule from dropdowns", async () => {
    const user = userEvent.setup();
    const emitted = renderBuilder();

    await user.click(
      fieldConditions().getByRole("button", { name: "Only show conditionally" })
    );

    const rule = emitted.current.siteName["ui:options"].visibleIf;
    expect(rule).toEqual({ field: "depth", equals: 0 });
  });

  it("offers the schema's enum values when comparing against an enum field", async () => {
    const user = userEvent.setup();
    renderBuilder();

    await user.click(
      fieldConditions().getByRole("button", { name: "Only show conditionally" })
    );
    await user.click(fieldConditions().getByLabelText("Field"));
    await user.click(within(screen.getByRole("listbox")).getByText("sampleType"));

    await user.click(fieldConditions().getByLabelText("Value"));
    const values = within(screen.getByRole("listbox"))
      .getAllByRole("option")
      .map((option) => option.textContent);
    expect(values).toEqual(["water", "control"]);
  });

  it("leaves a rule it cannot represent exactly as written", async () => {
    const user = userEvent.setup();
    const complex = { not: { field: "depth", truthy: true } };
    const emitted = renderBuilder({
      initial: { ...simpleUi, siteName: { "ui:options": { visibleIf: complex } } },
    });

    expect(
      screen.getByText(/more complex than the builder can edit/i)
    ).toBeInTheDocument();

    // Editing something else must not rewrite it.
    await user.type(screen.getByLabelText("Label (fr)"), "Site");
    expect(emitted.current.siteName["ui:options"].visibleIf).toEqual(complex);
  });

  it("sets summary columns in the order they are picked", async () => {
    const user = userEvent.setup();
    const emitted = renderBuilder();

    const columns = screen.getByLabelText("Columns");
    await user.click(columns);
    await user.click(within(screen.getByRole("listbox")).getByText("depth"));
    await user.click(columns);
    await user.click(within(screen.getByRole("listbox")).getByText("siteName"));

    expect(emitted.current["ui:summaryFields"]).toEqual(["depth", "siteName"]);
  });

  it("does not offer object or array properties as summary columns", async () => {
    const user = userEvent.setup();
    renderBuilder();

    await user.click(screen.getByLabelText("Columns"));
    const options = within(screen.getByRole("listbox"))
      .getAllByRole("option")
      .map((option) => option.textContent);

    // `notes` is an object; it would render as raw JSON in a table cell.
    expect(options.join(" ")).not.toContain("notes");
  });

  it("renders in French", () => {
    renderBuilder({ language: "fr" });
    expect(screen.getByText("Étapes")).toBeInTheDocument();
    expect(screen.getByLabelText("Étiquette (fr)")).toBeInTheDocument();
  });

  describe("with the shipped eDNA field form", () => {
    const jsonSchema = ednaField.jsonSchema;
    const uiSchema = ednaField.uiSchema;

    it("renders every declared step", () => {
      render(<Harness jsonSchema={jsonSchema} initial={uiSchema} />);
      expect(stepHeadings()).toEqual([
        "Site6 fields",
        "Conditions5 fields",
        "Sample4 fields",
        "Filtrationconditional6 fields",
        "Notes1 fields",
      ]);
    });

    it("preserves the whole document when one label is edited", async () => {
      const user = userEvent.setup();
      const emitted = { current: uiSchema };
      render(
        <Harness
          jsonSchema={jsonSchema}
          initial={uiSchema}
          onValue={(next) => {
            emitted.current = next;
          }}
        />
      );

      await user.type(screen.getByLabelText("Label (fr)"), "!");

      const before = JSON.parse(JSON.stringify(uiSchema));
      const after = emitted.current;

      // Only the one key an author touched may differ.
      expect(Object.keys(after).sort()).toEqual(Object.keys(before).sort());
      expect(after["ui:steps"]).toEqual(before["ui:steps"]);
      expect(after["ui:summaryFields"]).toEqual(before["ui:summaryFields"]);

      const firstField = Object.keys(jsonSchema.properties)[0];
      Object.keys(before)
        .filter((key) => key !== firstField)
        .forEach((key) => expect(after[key]).toEqual(before[key]));
    });

    it("keeps the form valid after a round trip through the builder", async () => {
      const user = userEvent.setup();
      const emitted = { current: uiSchema };
      render(
        <Harness
          jsonSchema={jsonSchema}
          initial={uiSchema}
          onValue={(next) => {
            emitted.current = next;
          }}
        />
      );

      await user.click(screen.getByLabelText("Move siteName up"));

      const problems = validateUiSchema(jsonSchema, emitted.current).filter(
        (problem) => problem.severity !== "info"
      );
      expect(problems).toEqual([]);
    });
  });
});

describe("UiSchemaProblems", () => {
  const problems = [
    { severity: "error", path: "ui:steps[0].fields[1]", message: { en: "bad field", fr: "champ" } },
    { severity: "warning", path: "x.ui:widget", message: { en: "odd widget", fr: "widget" } },
    { severity: "info", path: "y", message: { en: "no title", fr: "sans titre" } },
  ];

  it("shows errors and warnings, and hides suggestions behind a count", () => {
    render(<UiSchemaProblems problems={problems} language="en" />);
    expect(screen.getByText("bad field", { exact: false })).toBeVisible();
    expect(screen.getByText("odd widget", { exact: false })).toBeVisible();
    expect(screen.getByRole("button", { name: "1 suggestions" })).toBeInTheDocument();
  });

  it("says plainly that problems do not block saving", () => {
    render(<UiSchemaProblems problems={problems} language="en" />);
    expect(screen.getByText(/do not block saving/i)).toBeInTheDocument();
  });

  it("renders in French", () => {
    render(<UiSchemaProblems problems={problems} language="fr" />);
    expect(screen.getByText("champ", { exact: false })).toBeVisible();
  });

  it("renders nothing when there are no problems", () => {
    const { container } = render(<UiSchemaProblems problems={[]} language="en" />);
    expect(container).toBeEmptyDOMElement();
  });
});
