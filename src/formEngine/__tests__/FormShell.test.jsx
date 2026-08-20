import React, { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import FormShell from "../FormShell";

/**
 * Behavioural tests for the schema-driven renderer. These are the tests that
 * would catch rjsf silently mutating form data — the highest-severity failure
 * mode in this whole feature.
 */

const schema = {
  type: "object",
  required: ["siteName"],
  properties: {
    siteName: { type: "string", title: "Site name" },
    depth: { type: "number", title: "Depth" },
    labDate: { type: "string", format: "date", title: "Lab date" },
    notes: {
      type: "object",
      title: "Notes",
      properties: { en: { type: "string" }, fr: { type: "string" } },
    },
  },
};

const steps = {
  "ui:steps": [
    { id: "field", title: { en: "Field", fr: "Terrain" }, fields: ["siteName", "depth"] },
    {
      id: "lab",
      title: { en: "Lab", fr: "Laboratoire" },
      fields: ["labDate", "notes"],
    },
  ],
  notes: { "ui:field": "bilingualText" },
};

/** Renders the shell as a controlled component, like the real pages do. */
function Harness({ initial = {}, uiSchema = {}, onData, ...rest }) {
  const [data, setData] = useState(initial);
  return (
    // BilingualTextInput reads the active language off the route, so the
    // harness supplies one rather than mocking useParams.
    <MemoryRouter initialEntries={["/en/test"]}>
      <Routes>
        <Route
          path="/:language/:region"
          element={
            <FormShell
              jsonSchema={schema}
              uiSchema={uiSchema}
              formData={data}
              onChange={(next) => {
                setData(next);
                onData?.(next);
              }}
              {...rest}
            />
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe("FormShell rendering", () => {
  it("renders a single-page form when ui:steps is absent", () => {
    render(<Harness />);
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Site name/i)).toBeInTheDocument();
  });

  it("renders a tab per declared step", () => {
    render(<Harness uiSchema={steps} />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((t) => t.textContent)).toEqual(["Field", "Lab"]);
  });

  it("uses the active language for tab labels", () => {
    render(<Harness uiSchema={steps} language="fr" />);
    expect(screen.getAllByRole("tab").map((t) => t.textContent)).toEqual([
      "Terrain",
      "Laboratoire",
    ]);
  });

  it("shows only the current step's fields", () => {
    render(<Harness uiSchema={steps} />);
    expect(screen.getByLabelText(/Site name/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Lab date/i)).not.toBeInTheDocument();
  });

  it("switches fields when a tab is clicked", async () => {
    render(<Harness uiSchema={steps} />);
    await userEvent.click(screen.getByRole("tab", { name: "Lab" }));
    expect(await screen.findByLabelText(/Lab date/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Site name/i)).not.toBeInTheDocument();
  });

  it("reports when a form has no fields", () => {
    render(
      <MemoryRouter>
        <FormShell jsonSchema={{ type: "object", properties: {} }} uiSchema={{}} />
      </MemoryRouter>
    );
    expect(screen.getByText(/no fields yet/i)).toBeInTheDocument();
  });

  it("hides a step whose visibleIf is not satisfied", () => {
    render(
      <Harness
        initial={{ siteName: "A" }}
        uiSchema={{
          "ui:steps": [
            { id: "one", title: { en: "One" }, fields: ["siteName"] },
            {
              id: "two",
              title: { en: "Two" },
              fields: ["depth", "labDate", "notes"],
              visibleIf: { field: "siteName", equals: "show-me" },
            },
          ],
        }}
      />
    );
    expect(screen.getAllByRole("tab").map((t) => t.textContent)).toEqual(["One"]);
  });
});

describe("FormShell data integrity", () => {
  it("does not fire a change on mount", async () => {
    // A synthetic change on mount would mark a pristine form dirty and enable
    // the save button with no user action.
    const onData = vi.fn();
    render(<Harness initial={{ siteName: "A", depth: 3 }} onData={onData} />);
    await waitFor(() => expect(screen.getByLabelText(/Site name/i)).toBeInTheDocument());
    expect(onData).not.toHaveBeenCalled();
  });

  it("preserves data belonging to other steps when editing one", async () => {
    // The crux of the multi-step design: each step renders a filtered subschema,
    // so a naive implementation would drop the other steps' keys on change.
    const onData = vi.fn();
    render(
      <Harness
        initial={{ siteName: "A", depth: 3, labDate: "2026-01-01" }}
        uiSchema={steps}
        onData={onData}
      />
    );

    await userEvent.type(screen.getByLabelText(/Site name/i), "B");

    const latest = onData.mock.calls.at(-1)[0];
    expect(latest.siteName).toBe("AB");
    expect(latest.labDate).toBe("2026-01-01");
    expect(latest.depth).toBe(3);
  });

  it("keeps keys the schema does not declare", async () => {
    // omitExtraData would strip these. On the metadata record that means losing
    // the `translations` provenance sibling and every *ID key.
    const onData = vi.fn();
    render(
      <Harness
        initial={{ siteName: "A", legacyKey: "keep me", contactID: "c1" }}
        onData={onData}
      />
    );

    await userEvent.type(screen.getByLabelText(/Site name/i), "!");

    const latest = onData.mock.calls.at(-1)[0];
    expect(latest.legacyKey).toBe("keep me");
    expect(latest.contactID).toBe("c1");
  });

  it("preserves a bilingual field's translations sibling", async () => {
    const onData = vi.fn();
    render(
      <Harness
        initial={{
          notes: {
            en: "Hello",
            fr: "Bonjour",
            translations: { fr: { verified: false, message: "machine" } },
          },
        }}
        uiSchema={{ notes: { "ui:field": "bilingualText" } }}
        onData={onData}
      />
    );

    // BilingualTextInput names its two inputs "en" and "fr" and marks them with
    // an EN/FR adornment rather than a visible label.
    await userEvent.type(document.querySelector('input[name="en"]'), "!");

    const latest = onData.mock.calls.at(-1)[0];
    expect(latest.notes.en).toBe("Hello!");
    expect(latest.notes.fr).toBe("Bonjour");
    // The sibling survives the edit — that is what rjsf would otherwise drop.
    // Its message is rewritten by BilingualTextInput itself, deliberately:
    // editing one language invalidates a previously verified translation of it.
    expect(latest.notes.translations.fr.verified).toBe(false);
    expect(latest.notes.translations.fr.message).toBeTruthy();
  });

  it("does not truncate a full-precision ISO timestamp it never touched", async () => {
    // The prototype's DateWidget did onChange(iso.slice(0, 10)), which silently
    // rewrote every stored timestamp on first save.
    const onData = vi.fn();
    const stamp = "2023-10-01T19:00:00.000Z";
    render(
      <Harness
        initial={{ siteName: "A", labDate: stamp }}
        uiSchema={steps}
        onData={onData}
      />
    );

    await userEvent.type(screen.getByLabelText(/Site name/i), "!");

    expect(onData.mock.calls.at(-1)[0].labDate).toBe(stamp);
  });
});

describe("FormShell extra steps", () => {
  const submitStep = {
    id: "submit",
    title: { en: "Submit", fr: "Soumettre" },
    render: () => <p>submit panel</p>,
  };

  it("appends a step that renders its own content", () => {
    // resolveSteps drops any step with no fields, so a summary panel cannot be
    // expressed as schema properties.
    render(<Harness uiSchema={steps} extraSteps={[submitStep]} />);
    expect(screen.getAllByRole("tab").map((t) => t.textContent)).toEqual([
      "Field",
      "Lab",
      "Submit",
    ]);
  });

  it("renders the panel instead of a form when it is selected", async () => {
    render(<Harness uiSchema={steps} extraSteps={[submitStep]} />);
    expect(screen.queryByText("submit panel")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("tab", { name: "Submit" }));

    expect(await screen.findByText("submit panel")).toBeInTheDocument();
    expect(screen.queryByLabelText(/Site name/i)).not.toBeInTheDocument();
  });

  it("changes nothing when no extra steps are given", () => {
    render(<Harness uiSchema={steps} />);
    expect(screen.getAllByRole("tab")).toHaveLength(2);
  });
});
