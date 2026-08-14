import React, { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
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
 * Step titles as shown on the step cards.
 *
 * Queried by heading rather than by text because each field row's "Move to" menu
 * also names every step, so a bare getByText("Site") would be ambiguous once a
 * menu is open.
 *
 * Level 3 used to come from MUI's Accordion, whose heading slot wrapped the
 * WHOLE summary — hence the old expectations of "Site2 fields". StepCard renders
 * its own `h3` around the title alone, which is what a heading should be, so the
 * counts and the conditional marker are asserted separately by accessible name.
 */
const stepTitles = () =>
  screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent);

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
    expect(stepTitles()).toEqual(["Site", "Sample"]);
    // The count names its step, because two steps can hold the same number of
    // fields — the eDNA form has two with one each.
    expect(screen.getByLabelText("2 fields in Site")).toBeInTheDocument();
    expect(screen.getByLabelText("1 field in Sample")).toBeInTheDocument();
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

  /**
   * The per-row step picker.
   *
   * Was a 130px `Select` on every row — six fields in a step meant six dropdowns
   * drawn at full strength, taller than the rows they sat in. Now a `Menu`, so
   * the roles are menu/menuitem rather than listbox/option. What it CALLS is
   * unchanged: assignFieldToStep with no position, i.e. append at the end.
   */
  const moveFieldTo = async (user, field, target) => {
    await user.click(screen.getByRole("button", { name: `Move ${field} to` }));
    await user.click(
      within(screen.getByRole("menu")).getByRole("menuitem", { name: target })
    );
  };

  /**
   * Selects a step by its card title.
   *
   * Scoped to the heading for two reasons: the title is a button INSIDE the `h3`,
   * so the heading itself is not the click target (a click there bubbles up to the
   * card, never down to the button), and the inspector's breadcrumb carries a
   * button with the same name whenever that step is the current one.
   */
  const selectStep = (user, title) =>
    user.click(
      within(screen.getByRole("heading", { name: title })).getByRole("button")
    );

  /** The inspector's breadcrumb, which is a `nav` landmark. */
  const crumbs = () =>
    within(screen.getByRole("navigation", { name: "Selection" }));

  it("moves a field between steps rather than copying it", async () => {
    const user = userEvent.setup();
    const emitted = renderBuilder();

    await moveFieldTo(user, "depth", "Sample");

    const steps = emitted.current["ui:steps"];
    expect(steps[0].fields).toEqual(["siteName"]);
    expect(steps[1].fields).toEqual(["sampleType", "depth"]);
  });

  it("unassigns a field", async () => {
    const user = userEvent.setup();
    const emitted = renderBuilder();

    await moveFieldTo(user, "depth", "Unassigned");

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

  /**
   * Which step cards are open.
   *
   * The rendered set is DERIVED — what the author opened, plus the card holding
   * the selection, plus (later) any card with a search hit. So "the selected
   * field is always reachable" holds by construction rather than by an effect
   * that re-opens cards after the fact.
   *
   * `Move <name> to` is the probe for "this row is rendered": bodies are
   * `unmountOnExit`, so a collapsed card genuinely has no rows.
   */
  describe("open step cards", () => {
    it("opens only the step holding the selected field on first render", () => {
      renderBuilder();
      // The default selection is the first property, siteName, which is in Site.
      expect(screen.getByRole("button", { name: "Move depth to" })).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Move sampleType to" })
      ).not.toBeInTheDocument();
    });

    it("keeps more than one step open at a time", async () => {
      const user = userEvent.setup();
      renderBuilder();

      await user.click(screen.getByRole("button", { name: "Expand Sample" }));

      // Site stays open because it holds the selection; Sample was just opened.
      expect(screen.getByRole("button", { name: "Move depth to" })).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Move sampleType to" })
      ).toBeInTheDocument();
    });

    it("keeps a step selected while its own id is being retyped", async () => {
      const user = userEvent.setup();
      const emitted = renderBuilder();

      await selectStep(user, "Sample");
      expect(screen.getByLabelText("Tab name (en)")).toHaveValue("Sample");

      // The step id field lives in this very panel, and the id is the key the
      // selection is held by. Without the index fallback and the re-key, the
      // panel would swap itself out for a field panel on the first keystroke.
      await user.type(screen.getByLabelText("Step id"), "-2");

      expect(screen.getByLabelText("Tab name (en)")).toHaveValue("Sample");
      expect(emitted.current["ui:steps"][1].id).toBe("sample-2");
    });
  });

  /**
   * The field filter.
   *
   * `Move <name> to` is again the probe for "this row is rendered", since a row
   * that is filtered out is genuinely absent rather than merely hidden.
   */
  describe("filtering fields", () => {
    const filterFor = async (user, text) =>
      user.type(screen.getByLabelText("Filter fields"), text);

    it("narrows rows across every step and the unassigned tray", async () => {
      const user = userEvent.setup();
      renderBuilder();

      await filterFor(user, "dep");

      expect(screen.getByRole("button", { name: "Move depth to" })).toBeInTheDocument();
      // Probed by the row's own control rather than by text: the inspector's
      // breadcrumb also prints the selected field's name.
      expect(
        screen.queryByRole("button", { name: "Move siteName to" })
      ).not.toBeInTheDocument();
      // `notes` lives in the tray, which the filter reaches too.
      expect(
        screen.queryByRole("button", { name: "Move notes to" })
      ).not.toBeInTheDocument();
    });

    it("reports how much it narrowed", async () => {
      const user = userEvent.setup();
      renderBuilder();

      await filterFor(user, "dep");

      expect(screen.getByText("1 of 4 fields")).toBeInTheDocument();
    });

    it("opens a collapsed step that contains a match", async () => {
      const user = userEvent.setup();
      renderBuilder();

      // Sample starts collapsed: the default selection is siteName, in Site.
      expect(
        screen.queryByRole("button", { name: "Move sampleType to" })
      ).not.toBeInTheDocument();

      await filterFor(user, "sampleT");

      expect(
        screen.getByRole("button", { name: "Move sampleType to" })
      ).toBeInTheDocument();
    });

    it("keeps the step's own field count, not the filtered one", async () => {
      const user = userEvent.setup();
      renderBuilder();

      await filterFor(user, "dep");

      // A count that changed with the filter would misreport the form itself.
      expect(screen.getByLabelText("2 fields in Site")).toBeInTheDocument();
    });

    it("offers a way out when nothing matches, and restores every row", async () => {
      const user = userEvent.setup();
      renderBuilder();

      await filterFor(user, "zzz");
      expect(screen.getByText("No field matches")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Show all fields" }));

      expect(
        screen.getByRole("button", { name: "Move siteName to" })
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Move notes to" })).toBeInTheDocument();
      expect(screen.queryByText("No field matches")).not.toBeInTheDocument();
    });

    it("disables reordering while a filter hides siblings", async () => {
      const user = userEvent.setup();
      renderBuilder();

      // Unfiltered, depth can move up past siteName.
      expect(screen.getByLabelText("Move depth up")).toBeEnabled();

      await filterFor(user, "dep");

      // Filtered, siteName is not on screen — a nudge past it would look like
      // nothing happened.
      expect(screen.getByLabelText("Move depth up")).toBeDisabled();
    });

    it("leaves reordering alone when the filter hides nothing in that step", async () => {
      const user = userEvent.setup();
      renderBuilder();

      // Matches both of Site's fields, so its list is complete and safe to nudge.
      await filterFor(user, "e");

      expect(screen.getByLabelText("Move depth up")).toBeEnabled();
    });
  });

  describe("expand and collapse all", () => {
    it("opens every step at once", async () => {
      const user = userEvent.setup();
      renderBuilder();

      await user.click(screen.getByRole("button", { name: "Expand all" }));

      expect(screen.getByRole("button", { name: "Move depth to" })).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Move sampleType to" })
      ).toBeInTheDocument();
    });

    it("cannot collapse the step holding the selection", async () => {
      const user = userEvent.setup();
      renderBuilder();

      await user.click(screen.getByRole("button", { name: "Expand all" }));
      await user.click(screen.getByRole("button", { name: "Collapse all" }));

      // Collapse is a 300ms transition and only unmounts when it ends, so the
      // row outlives the click that closed it.
      await waitFor(() =>
        expect(
          screen.queryByRole("button", { name: "Move sampleType to" })
        ).not.toBeInTheDocument()
      );
      // Site holds siteName, the default selection, so it stays open — the
      // inspector must never point at something the canvas has hidden.
      expect(screen.getByRole("button", { name: "Move depth to" })).toBeInTheDocument();
    });
  });

  describe("the inspector's step settings", () => {
    it("selects a step when its title is clicked", async () => {
      const user = userEvent.setup();
      renderBuilder();

      await selectStep(user, "Site");

      expect(screen.getByLabelText("Tab name (en)")).toHaveValue("Site");
      expect(screen.getByLabelText("Step id")).toHaveValue("site");
      expect(
        screen.getByRole("group", { name: "Show this tab when" })
      ).toBeInTheDocument();
      // A step and a field are alternatives, not both at once — which is also
      // what makes the "Visible when" group unambiguous by construction.
      expect(screen.queryByLabelText("Label (en)")).not.toBeInTheDocument();
      expect(screen.queryByRole("group", { name: "Visible when" })).not.toBeInTheDocument();
    });

    it("edits a step title from the inspector", async () => {
      const user = userEvent.setup();
      const emitted = renderBuilder();

      await selectStep(user, "Site");
      await user.type(screen.getByLabelText("Tab name (en)"), " A");

      expect(emitted.current["ui:steps"][0].title.en).toBe("Site A");
    });

    it("edits a step description, which the canvas never exposed", async () => {
      const user = userEvent.setup();
      const emitted = renderBuilder();

      await selectStep(user, "Site");
      await user.type(screen.getByLabelText("Description (en)"), "Where and when.");

      // resolveSteps has always rendered this above a tab's first question;
      // there was simply no control for it.
      expect(emitted.current["ui:steps"][0].description.en).toBe("Where and when.");
    });

    it("builds a step visibility rule from the inspector", async () => {
      const user = userEvent.setup();
      const emitted = renderBuilder();

      await selectStep(user, "Sample");
      await user.click(
        within(screen.getByRole("group", { name: "Show this tab when" })).getByRole(
          "button",
          { name: "Only show conditionally" }
        )
      );

      expect(emitted.current["ui:steps"][1].visibleIf).toEqual({
        field: "siteName",
        equals: "",
      });
    });

    it("assigns an unclaimed field to the selected step", async () => {
      const user = userEvent.setup();
      const emitted = renderBuilder();

      await selectStep(user, "Sample");
      await user.click(screen.getByRole("button", { name: "Add a field" }));
      await user.click(within(screen.getByRole("menu")).getByRole("menuitem", { name: "notes" }));

      expect(emitted.current["ui:steps"][1].fields).toEqual(["sampleType", "notes"]);
    });

    it("confirms before deleting a step, and keeps the fields", async () => {
      const user = userEvent.setup();
      const emitted = renderBuilder();

      await selectStep(user, "Site");
      await user.click(screen.getByRole("button", { name: "Delete step" }));

      // A card vanishing from a list of cards is easy to miss, so it is confirmed.
      const dialog = within(screen.getByRole("dialog"));
      await user.click(dialog.getByRole("button", { name: "Delete step" }));

      expect(emitted.current["ui:steps"]).toHaveLength(1);
      expect(emitted.current["ui:steps"][0].id).toBe("sample");
      // siteName and depth are untouched: they fall into the "Other" tab.
      expect(emitted.current.siteName).toEqual(simpleUi.siteName);
      // And the inspector falls back to a field rather than a dead step.
      expect(screen.getByLabelText("Label (en)")).toBeInTheDocument();
    });

    it("walks back from a step to the last field in one click", async () => {
      const user = userEvent.setup();
      renderBuilder();

      await user.click(screen.getByText("depth"));
      await selectStep(user, "Site");
      expect(screen.getByLabelText("Tab name (en)")).toBeInTheDocument();

      // The field crumb remembers where we came from.
      await user.click(crumbs().getByRole("button", { name: "depth" }));
      expect(screen.getByLabelText("Label (en)")).toBeInTheDocument();
    });
  });

  /**
   * The drag layer's rendered surface.
   *
   * A real drag cannot be simulated in jsdom — no PointerEvent, no
   * setPointerCapture, and getBoundingClientRect returns zeros so collision
   * detection over degenerate rects would pass while the real layout was broken.
   * See uiSchemaBuilderDnd.test.js for the decisions; what is checked here is that
   * the handles exist, are named bilingually, and never REPLACE the keyboard path.
   */
  describe("drag handles", () => {
    it("gives every field row and every step card a named grip", () => {
      renderBuilder();

      expect(screen.getByRole("button", { name: "Drag depth" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Reorder Site" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Reorder Sample" })).toBeInTheDocument();
    });

    it("names the grips in French", () => {
      renderBuilder({ language: "fr" });

      expect(screen.getByRole("button", { name: "Glisser depth" })).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Réordonner Site" })
      ).toBeInTheDocument();
    });

    it("keeps the arrow buttons and the move menu alongside the grip", () => {
      renderBuilder();

      // Drag is an addition, not a replacement: these are the guaranteed
      // keyboard path and the only one a test can exercise.
      expect(screen.getByLabelText("Move depth up")).toBeInTheDocument();
      expect(screen.getByLabelText("Move depth down")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Move depth to" })).toBeInTheDocument();
    });

    it("does not offer a grip while a filter hides a row's neighbours", async () => {
      const user = userEvent.setup();
      renderBuilder();

      await user.type(screen.getByLabelText("Filter fields"), "dep");

      // A drop landing between rows that are not on screen is a move the author
      // cannot see, so the row stops being draggable — same reason the arrow
      // buttons are disabled.
      expect(
        screen.queryByRole("button", { name: "Drag depth" })
      ).not.toBeInTheDocument();
    });

    it("does not offer field grips when there are no steps to drag between", () => {
      // assignFieldToStep returns its input unchanged when there are no steps, so
      // a drag here could express nothing that could be persisted.
      renderBuilder({ initial: {} });

      expect(
        screen.queryByRole("button", { name: "Drag siteName" })
      ).not.toBeInTheDocument();
    });
  });

  describe("the unassigned tray", () => {
    it("stays on screen when empty, so a field can be dropped out of every tab", () => {
      renderBuilder({
        initial: {
          "ui:steps": [
            {
              id: "all",
              title: { en: "All" },
              fields: ["siteName", "depth", "sampleType", "notes"],
            },
          ],
        },
      });

      // Previously this appeared only when it already had something in it, which
      // left nowhere to drop a field in order to unassign it.
      expect(screen.getByText("Not in any tab")).toBeInTheDocument();
      expect(screen.getByText(/Drop one here/i)).toBeInTheDocument();
    });

    it("still says 'Fields' when the form has no steps at all", () => {
      renderBuilder({ initial: {} });

      // Asserted on the heading rather than by text: with no steps the
      // inspector's breadcrumb correctly reads "Not in any tab" too, since the
      // selected field genuinely has no parent step.
      expect(
        screen.getByRole("heading", { level: 4, name: "Fields" })
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("heading", { level: 4, name: "Not in any tab" })
      ).not.toBeInTheDocument();
    });
  });

  describe("the inspector's preview", () => {
    /**
     * The inspector's own mode switch.
     *
     * Scoped by its group name because the help text editor has a Settings-like
     * switch of its own and both offer a button called "Preview".
     */
    const panelMode = () =>
      within(screen.getByRole("group", { name: "Panel mode" }));

    const showPreview = (user) =>
      user.click(panelMode().getByRole("button", { name: "Preview" }));

    /**
     * The rendered preview itself.
     *
     * Scoped, because a previewed label is BY DESIGN the same string the canvas
     * row and the panel heading already show — that is the whole point of the
     * preview — so a bare getByText would always be ambiguous.
     */
    const preview = () =>
      within(screen.getByRole("region", { name: "Field preview" }));

    it("does not mount the renderer until Preview is chosen", () => {
      renderBuilder();
      // rjsf is a heavy tree and this panel re-renders on every keystroke, so
      // Settings is the default and Preview is mounted only on demand.
      expect(document.querySelector("form")).toBeNull();
    });

    it("renders the selected field alone, through the real renderer", async () => {
      const user = userEvent.setup();
      renderBuilder();

      await user.type(screen.getByLabelText("Label (en)"), "Site name");
      await showPreview(user);

      // The label just typed is what the renderer draws...
      expect(preview().getByText("Site name")).toBeInTheDocument();
      // ...and only the selected property is in the subschema.
      expect(preview().queryByText("depth")).not.toBeInTheDocument();
      expect(screen.getByText(/Nothing typed here is saved/i)).toBeInTheDocument();
    });

    it("hides the settings while previewing rather than appending to them", async () => {
      const user = userEvent.setup();
      renderBuilder();

      await showPreview(user);

      expect(screen.queryByLabelText("Label (en)")).not.toBeInTheDocument();

      await user.click(panelMode().getByRole("button", { name: "Settings" }));
      expect(screen.getByLabelText("Label (en)")).toBeInTheDocument();
    });

    it("shows a conditional field despite a rule that is false", async () => {
      const user = userEvent.setup();
      renderBuilder({
        initial: {
          ...simpleUi,
          siteName: {
            "ui:options": {
              i18n: { title: { en: "Site name" } },
              // Against empty sample data this is false, so the renderer would
              // draw nothing at all and the panel would look broken.
              visibleIf: { field: "depth", equals: 42 },
            },
          },
        },
      });

      await showPreview(user);

      expect(preview().getByText("Site name")).toBeInTheDocument();
      expect(
        screen.getByText(/shown here regardless of its rule/i)
      ).toBeInTheDocument();
    });

    it("previews a whole step when a step is selected", async () => {
      const user = userEvent.setup();
      renderBuilder({
        initial: {
          ...simpleUi,
          siteName: { "ui:options": { i18n: { title: { en: "Site name" } } } },
          depth: { "ui:options": { i18n: { title: { en: "Sample depth" } } } },
        },
      });

      await selectStep(user, "Site");
      await showPreview(user);

      expect(preview().getByText("Site name")).toBeInTheDocument();
      expect(preview().getByText("Sample depth")).toBeInTheDocument();
      // sampleType belongs to the other step.
      expect(preview().queryByText("sampleType")).not.toBeInTheDocument();
    });
  });

  describe("help text", () => {
    it("swaps between writing and previewing without losing the source", async () => {
      const user = userEvent.setup();
      renderBuilder();

      await user.type(screen.getByLabelText("Help (en)"), "**bold** guidance");

      // Scoped to the help section's own switch: the inspector carries a
      // Settings|Preview switch too, so "Preview" alone is ambiguous here.
      const helpMode = () =>
        within(screen.getByRole("group", { name: "Help text mode" }));

      await helpMode().getByRole("button", { name: "Preview" }).click();

      // Markdown is rendered by the same react-markdown/remark-gfm pair the
      // renderer uses, so what an author checks here is what a respondent gets.
      expect(screen.getByText("bold").tagName).toBe("STRONG");

      await user.click(helpMode().getByRole("button", { name: "Write" }));
      expect(screen.getByLabelText("Help (en)")).toHaveValue("**bold** guidance");
    });
  });

  describe("widget options", () => {
    it("groups a widget's options under a labelled fieldset", async () => {
      const user = userEvent.setup();
      renderBuilder();

      await user.click(screen.getByLabelText("Input type"));
      await user.click(
        within(screen.getByRole("listbox")).getByText("Multi-line text")
      );

      // The group is what makes these addressable at all: UI_OPTIONS.labelEn is
      // literally labelled "Label (en)", colliding with the Label section above.
      const options = within(screen.getByRole("group", { name: "Input options" }));
      expect(options.getByLabelText("Rows")).toBeInTheDocument();
    });

    it("writes an option value through setFieldOption", async () => {
      const user = userEvent.setup();
      const emitted = renderBuilder();

      await user.click(screen.getByLabelText("Input type"));
      await user.click(
        within(screen.getByRole("listbox")).getByText("Multi-line text")
      );
      const options = within(screen.getByRole("group", { name: "Input options" }));
      await user.type(options.getByLabelText("Rows"), "4");

      expect(emitted.current.siteName["ui:options"].rows).toBe(4);
    });
  });

  /**
   * Below `md` the two columns stack, which put the inspector a long scroll from
   * whatever was selected. There it becomes a Drawer instead.
   *
   * jsdom's default innerWidth is 1024, so every other test in this file gets the
   * DOCKED branch — which is what makes them able to query the panel at all. See
   * the matchMedia note in src/setupTests.js.
   */
  describe("on a narrow viewport", () => {
    const narrow = () => {
      window.innerWidth = 600;
    };
    const restore = () => {
      window.innerWidth = 1024;
    };

    it("docks the inspector at md and above", () => {
      renderBuilder();
      // No dialog: the panel is a column beside the canvas.
      expect(screen.queryByRole("presentation")).not.toBeInTheDocument();
      expect(screen.getByLabelText("Label (en)")).toBeInTheDocument();
    });

    it("opens the inspector as a drawer when a field is selected", async () => {
      narrow();
      try {
        const user = userEvent.setup();
        renderBuilder();

        // Undocked, the panel is not on screen until something is selected.
        expect(screen.queryByLabelText("Label (en)")).not.toBeInTheDocument();

        await user.click(screen.getByText("depth"));

        // A Drawer, not a Dialog: the same panel undocked, with a focus trap and
        // Escape for free, and one scrollbar rather than two.
        const drawer = within(screen.getByRole("presentation"));
        expect(drawer.getByLabelText("Label (en)")).toBeInTheDocument();
      } finally {
        restore();
      }
    });

    it("can reopen the drawer from the toolbar after it is dismissed", async () => {
      narrow();
      try {
        const user = userEvent.setup();
        renderBuilder();

        await user.click(screen.getByText("depth"));
        await user.keyboard("{Escape}");
        await waitFor(() =>
          expect(screen.queryByLabelText("Label (en)")).not.toBeInTheDocument()
        );

        // Without this the panel would be unreachable until something else was
        // selected.
        await user.click(screen.getByRole("button", { name: "Edit the selection" }));
        expect(screen.getByLabelText("Label (en)")).toBeInTheDocument();
      } finally {
        restore();
      }
    });
  });

  describe("with the shipped eDNA field form", () => {
    const jsonSchema = ednaField.jsonSchema;
    const uiSchema = ednaField.uiSchema;

    it("renders every declared step", () => {
      render(<Harness jsonSchema={jsonSchema} initial={uiSchema} />);
      expect(stepTitles()).toEqual([
        "Site",
        "Conditions",
        "Sample",
        "Filtration",
        "Notes",
      ]);
      expect(screen.getByLabelText("6 fields in Site")).toBeInTheDocument();
      expect(screen.getByLabelText("5 fields in Conditions")).toBeInTheDocument();
      expect(screen.getByLabelText("4 fields in Sample")).toBeInTheDocument();
      expect(screen.getByLabelText("6 fields in Filtration")).toBeInTheDocument();
      expect(screen.getByLabelText("1 field in Notes")).toBeInTheDocument();
      // Filtration is the only step carrying a visibleIf rule.
      expect(screen.getByLabelText("Filtration is conditional")).toBeInTheDocument();
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
