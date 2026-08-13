import React, { useState } from "react";
import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import FormShell from "../FormShell";

/**
 * What a rendered form looks like, asserted where a screenshot cannot help.
 *
 * Two of these guard defects that are invisible to the eye:
 *
 *   the accessible name — the question heading sits in a sibling Paper, so it is
 *     not a label as far as assistive technology is concerned. Suppressing the
 *     widget's own label to stop the visible duplication is what makes an
 *     `aria-label` mandatory, and nothing on screen shows whether it is there.
 *
 *   the doubled field — a property with both a `type` and a validation-only
 *     `anyOf` was rendered by rjsf as two separate inputs for one value, either
 *     of which could be typed into.
 */

const schema = {
  type: "object",
  required: ["siteName"],
  properties: {
    siteName: { type: "string", title: "Site name" },
    depth: { type: "number", title: "Depth" },
    weather: { type: "string", title: "Weather", enum: ["fog", "clear"] },
    collectedAt: { type: "string", format: "date-time", title: "Collected at" },
    notes: { type: "string", title: "Notes" },
    doi: {
      type: "string",
      title: "DOI",
      // Not a choice — a constraint. "Empty, or a doi.org URL."
      anyOf: [{ const: "" }, { pattern: "^https://doi\\.org/10\\." }],
    },
  },
};

const uiSchema = {
  siteName: { "ui:options": { i18n: { title: { en: "Site name or ID", fr: "Nom du site" } } } },
  weather: { "ui:options": { i18n: { title: { en: "Weather", fr: "Météo" } } } },
  collectedAt: { "ui:widget": "isoDateTime" },
  notes: { "ui:widget": "textarea" },
};

function Harness({ initial = {}, language = "en", ...rest }) {
  const [data, setData] = useState(initial);
  return (
    <MemoryRouter>
      <FormShell
        jsonSchema={schema}
        uiSchema={uiSchema}
        formData={data}
        onChange={setData}
        language={language}
        {...rest}
      />
    </MemoryRouter>
  );
}

/** Every control a person can type into or choose from. */
const controls = () => [
  ...screen.getAllByRole("textbox"),
  ...screen.getAllByRole("spinbutton"),
  ...screen.getAllByRole("combobox"),
];

/** The accessible name of an element, by the two routes used here. */
const accessibleName = (element) =>
  element.getAttribute("aria-label") ||
  (element.labels?.[0]?.textContent ?? "") ||
  (element.getAttribute("aria-labelledby")
    ? document.getElementById(element.getAttribute("aria-labelledby"))?.textContent
    : "");

describe("every input keeps an accessible name", () => {
  it("names each control, even though its visible label is suppressed", () => {
    render(<Harness />);

    const unnamed = controls()
      .map((element) => ({
        tag: element.tagName,
        type: element.getAttribute("type"),
        name: accessibleName(element),
      }))
      .filter((entry) => !entry.name);

    expect(unnamed).toEqual([]);
  });

  it("names a select on the element that carries the combobox role", () => {
    // An aria-label on the Select lands on a hidden input that is not read here.
    render(<Harness />);
    expect(screen.getByRole("combobox", { name: "Weather" })).toBeInTheDocument();
  });

  it("prefers the bilingual title over the schema title", () => {
    render(<Harness />);
    expect(screen.getByLabelText("Site name or ID")).toBeInTheDocument();
  });

  it("uses the active language for the name", () => {
    render(<Harness language="fr" />);
    expect(screen.getByLabelText("Nom du site")).toBeInTheDocument();
  });
});

describe("the question is asked once", () => {
  it("does not repeat the heading as an inner input label", () => {
    render(<Harness />);
    // Once as the heading. Were the widget still drawing its own label there
    // would be a second copy inside the box.
    expect(screen.getAllByText("Site name or ID")).toHaveLength(1);
  });

  it("renders one input for a property with a validation-only anyOf", () => {
    render(<Harness />);
    expect(screen.getAllByLabelText("DOI")).toHaveLength(1);
  });
});

describe("selects", () => {
  it("shows a placeholder rather than an empty box while unset", () => {
    render(<Harness />);
    expect(screen.getByRole("combobox", { name: "Weather" })).toHaveTextContent(
      "Choose…"
    );
  });

  it("says it in French too", () => {
    render(<Harness language="fr" />);
    expect(screen.getByRole("combobox", { name: "Météo" })).toHaveTextContent(
      "Choisir…"
    );
  });

  it("offers the schema's options and reports the choice", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("combobox", { name: "Weather" }));
    await user.click(within(screen.getByRole("listbox")).getByText("fog"));

    expect(screen.getByRole("combobox", { name: "Weather" })).toHaveTextContent("fog");
  });
});

describe("the required marker", () => {
  const marker = () => screen.getByText("Site name or ID").parentElement.textContent;

  it("does not claim a required field is done before anything is typed", () => {
    // Validation is deferred to submit, so rawErrors alone would say "done".
    render(<Harness />);
    expect(marker()).toContain("✵");
  });

  it("marks it satisfied once there is a value", () => {
    render(<Harness initial={{ siteName: "Station 4" }} />);
    expect(marker()).toContain("✓");
  });
});

describe("repeatable lists", () => {
  const listSchema = {
    type: "object",
    properties: {
      team: { type: "array", title: "Field team", items: { type: "string" } },
    },
  };
  const listUi = {
    team: {
      "ui:options": {
        i18n: {
          title: { en: "Members of the field team", fr: "Équipe" },
          help: { en: "Add one entry per person.", fr: "Une entrée par personne." },
        },
      },
    },
  };

  const renderList = (initial = {}) =>
    render(
      <MemoryRouter>
        <FormShell
          jsonSchema={listSchema}
          uiSchema={listUi}
          formData={initial}
          onChange={() => {}}
          language="en"
        />
      </MemoryRouter>
    );

  it("keeps the question and its help, which rjsf's own template drops", () => {
    renderList();
    expect(screen.getByText("Members of the field team")).toBeInTheDocument();
    expect(screen.getByText("Add one entry per person.")).toBeInTheDocument();
  });

  it("says an empty list is empty, and labels the add control", () => {
    renderList();
    expect(screen.getByText("No entries yet.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add" })).toBeInTheDocument();
  });

  it("gives each entry a remove control", () => {
    renderList({ team: ["Ada", "Grace"] });
    expect(screen.getAllByRole("button", { name: /^Remove/ })).toHaveLength(2);
  });

  it("lets entries be reordered", () => {
    renderList({ team: ["Ada", "Grace"] });
    // First entry cannot move up, last cannot move down.
    expect(screen.getAllByRole("button", { name: /^Move up/ })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: /^Move down/ })).toHaveLength(1);
  });
});
