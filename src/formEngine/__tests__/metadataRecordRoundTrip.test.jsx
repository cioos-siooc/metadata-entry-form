import React, { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import FormShell from "../FormShell";
import { buildMetadataRecordForm } from "../metadataRecordForm";
import { standardizeRecord } from "../../utils/firebaseRecordFunctions";
import mockRecord from "../../__testData__/mockMetadataRecord";

/**
 * The test that matters.
 *
 * Rendering an existing record must not LOSE anything. rjsf has several habits
 * that quietly rewrite formData on mount — stubbing unknown keys as additional
 * properties, blanking enum values it does not recognise, replacing an anyOf
 * field with an option picker — and every one of them would corrupt a decade of
 * real records the first time somebody opened one and pressed Save.
 *
 * So: mount each step, touch nothing, and assert the data survived.
 *
 * Two mounts DO legitimately write, and both predate this work:
 *
 *   BilingualTextInput stamps a `translations` provenance block on any bilingual
 *   value that has both languages and no block yet (its useEffect says so).
 *   DOIInput stamps `doiCreationStatus`.
 *
 * Both are ADDITIVE. `stripProvenance` removes them from both sides so the
 * comparison still catches anything destructive: a dropped key, a blanked enum,
 * a coerced number, a stubbed additional property.
 */

/** Removes the additive provenance stamps described above, at any depth. */
function stripProvenance(value) {
  if (Array.isArray(value)) return value.map(stripProvenance);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => key !== "translations")
        .map(([key, sub]) => [key, stripProvenance(sub)])
    );
  }
  return value;
}

const PENDING = new Set([]);

/**
 * Several of these components read the active language and region straight off
 * the route with useParams (BilingualTextInput, KeywordsInput, DOIInput...), so
 * the harness supplies a real route rather than mocking the hook.
 */
function withRoute(element) {
  return (
    <MemoryRouter initialEntries={["/en/pacific"]}>
      <Routes>
        <Route path="/:language/:region" element={element} />
      </Routes>
    </MemoryRouter>
  );
}

function renderStep(record, stepId) {
  const { jsonSchema, uiSchema } = buildMetadataRecordForm({ language: "en" });
  const wrote = vi.fn();

  // Only the step under test, so a failure names one tab rather than "the form".
  const single = {
    ...uiSchema,
    "ui:steps": uiSchema["ui:steps"].filter((s) => s.id === stepId),
  };

  // A field can write through rjsf's onChange OR through the page's
  // updateRecord/handleUpdateRecord in context (the sibling-writing ones do).
  // Both funnel into the same spy so "nothing was written" means nothing at all.
  // Whatever the form ends up holding after mount settles.
  let latest = record;

  const context = {
    isFieldValid: () => true,
    region: "pacific",
    canShare: false,
    updateRecord: (key) => (value) => wrote({ key, value }),
    handleUpdateRecord: (key) => (event) =>
      wrote({ key, value: event?.target?.value }),
  };

  function Harness() {
    const [data, setData] = useState(record);
    latest = data;
    return (
      <FormShell
        jsonSchema={jsonSchema}
        uiSchema={single}
        formData={data}
        onChange={setData}
        language="en"
        context={context}
      />
    );
  }

  const { container } = render(withRoute(<Harness />));

  return { sideWrites: wrote, container, result: () => latest };
}

const record = standardizeRecord(mockRecord);

const nativeSteps = buildMetadataRecordForm({ language: "en" })
  .uiSchema["ui:steps"].map((s) => s.id)
  .filter((id) => !PENDING.has(id));

describe("metadata record round trip", () => {
  it("has native steps to test", () => {
    expect(nativeSteps.length).toBeGreaterThan(0);
  });

  nativeSteps.forEach((stepId) => {
    it(`renders the ${stepId} step without losing anything`, () => {
      const { result, sideWrites } = renderStep(record, stepId);

      expect(stripProvenance(result())).toEqual(stripProvenance(record));

      // A field reaching for formContext.updateRecord during render is how a
      // "harmless" normalization turns into an edit nobody asked for. Only
      // DOIInput's documented doiCreationStatus stamp is allowed.
      const written = [
        ...new Set(sideWrites.mock.calls.map(([write]) => write.key)),
      ];
      expect(written.filter((key) => key !== "doiCreationStatus")).toEqual([]);
    });
  });

  it("does not render other steps' fields as editable additional properties", () => {
    // The failure mode this guards: an open schema (additionalProperties: true)
    // carried into a per-step subschema makes rjsf stub every key of formData it
    // was not shown, each with a key-rename textbox. ~40 of them, per tab.
    renderStep(record, "contacts");
    expect(screen.queryByDisplayValue("abstract")).toBeNull();
    expect(screen.queryByDisplayValue("recordID")).toBeNull();
    expect(screen.queryByDisplayValue("schemaVersion")).toBeNull();
  });

  it("gives a required array field its question and marker", () => {
    // rjsf sets displayLabel=false for arrays and objects, which used to strip
    // the Paper, the question text and the required mark from every composite.
    const { container } = renderStep(record, "contacts");
    // The question and its marker are adjacent inside QuestionText, so the
    // pair appearing together is what proves the template drew them.
    expect(container.textContent).toMatch(/Contacts\s*✓/);
    // ...and rjsf's own array heading is suppressed, so it is drawn only once.
    expect(container.querySelector("#step_contacts_contacts__title")).toBeNull();
  });

  it("drives the required marker from isFieldValid, not from rawErrors", () => {
    // With liveValidate false, rawErrors is empty until submit — so a marker
    // keyed off rawErrors would be permanently green and tell nobody anything.
    const { jsonSchema, uiSchema } = buildMetadataRecordForm({ language: "en" });
    const single = {
      ...uiSchema,
      "ui:steps": uiSchema["ui:steps"].filter((s) => s.id === "contacts"),
    };
    const { container } = render(
      withRoute(
        <FormShell
          jsonSchema={jsonSchema}
          uiSchema={single}
          formData={record}
          language="en"
          context={{ isFieldValid: () => false, canShare: false }}
        />
      )
    );
    expect(container.textContent).toMatch(/Contacts\s*✵/);
  });

  it("survives a legacy-shaped record", () => {
    const legacy = standardizeRecord({
      ...mockRecord,
      resourceType: "biological", // a bare string, not an array
      noTaxa: "false", // the string, not the boolean
      platformID: "legacy-platform",
      platforms: undefined,
    });

    // standardizeRecord is what makes this safe; prove it did its job first.
    expect(legacy.noTaxa).toBe(false);
    expect(legacy.platforms[0].id).toBe("legacy-platform");

    nativeSteps.forEach((stepId) => {
      const { result } = renderStep(legacy, stepId);
      expect(
        stripProvenance(result()),
        `${stepId} lost data from a legacy record`
      ).toEqual(stripProvenance(legacy));
      // Unmount before the next step: DOIInput polls on a debounce, and a late
      // callback would otherwise land during whichever step renders next.
      cleanup();
    });
  });
});
