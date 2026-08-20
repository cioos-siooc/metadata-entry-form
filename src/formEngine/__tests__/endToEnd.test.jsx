import React, { useState } from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import FormShell from "../FormShell";
import ednaField from "../catalog/edna-field.formtype.json";
import ednaLab from "../catalog/edna-lab.formtype.json";
import {
  resolveCatalogForRegion,
  buildExportTable,
  toCsv,
} from "@shared/formEngine";

/**
 * The whole deliverable, end to end, without a database:
 *
 *   a form type is defined as data → a region enables it → a member fills it in
 *   → the submission exports as study metadata
 *
 * The point is that nothing here is eDNA-specific in the engine. The eDNA forms
 * are just the JSON files under catalog/.
 */

/** Mimics what the Firebase adapter would return for a published form type. */
function asCatalogEntry(definition, id, version = 1) {
  return {
    id,
    slug: definition.slug,
    kind: definition.kind,
    status: "published",
    title: definition.title,
    description: definition.description,
    jsonSchema: definition.jsonSchema,
    uiSchema: definition.uiSchema,
    version,
  };
}

const catalog = [
  asCatalogEntry(ednaField, "ft-field"),
  asCatalogEntry(ednaLab, "ft-lab"),
];

function Harness({ formType, initial = {}, onData }) {
  const [data, setData] = useState(initial);
  return (
    <MemoryRouter>
      <FormShell
        jsonSchema={formType.jsonSchema}
        uiSchema={formType.uiSchema}
        formData={data}
        onChange={(next) => {
          setData(next);
          onData?.(next);
        }}
        language="en"
        context={{ canEdit: true }}
      />
    </MemoryRouter>
  );
}

describe("per-region activation", () => {
  it("offers nothing to a region that has enabled nothing", () => {
    expect(resolveCatalogForRegion(catalog, {})).toEqual([]);
  });

  it("offers exactly what a region switched on", () => {
    const resolved = resolveCatalogForRegion(catalog, {
      "ft-field": { enabled: true },
    });
    expect(resolved.map((r) => r.slug)).toEqual(["edna-field"]);
  });

  it("keeps regions independent of each other", () => {
    const pacific = resolveCatalogForRegion(catalog, {
      "ft-field": { enabled: true },
      "ft-lab": { enabled: true },
    });
    const atlantic = resolveCatalogForRegion(catalog, {
      "ft-lab": { enabled: true },
    });

    expect(pacific).toHaveLength(2);
    expect(atlantic.map((r) => r.slug)).toEqual(["edna-lab"]);
  });

  it("lets a region rename a form without touching the definition", () => {
    const [resolved] = resolveCatalogForRegion(catalog, {
      "ft-field": {
        enabled: true,
        overrides: { title: { en: "CoastConnect Field Sheet" } },
      },
    });
    expect(resolved.title.en).toBe("CoastConnect Field Sheet");
    // The shared definition is untouched, so other regions are unaffected.
    expect(ednaField.title.en).toBe("eDNA Field Metadata");
  });
});

describe("filling in the eDNA field form", () => {
  it("renders the declared steps as tabs", () => {
    render(<Harness formType={ednaField} />);
    expect(screen.getAllByRole("tab").map((t) => t.textContent)).toEqual([
      "Site",
      "Conditions",
      "Sample",
      "Filtration",
      "Notes",
    ]);
  });

  it("hides the filtration step for a field control", () => {
    render(
      <Harness formType={ednaField} initial={{ sampleType: "field control" }} />
    );
    expect(screen.getAllByRole("tab").map((t) => t.textContent)).not.toContain(
      "Filtration"
    );
  });

  it("collects data across steps into one object", async () => {
    const captured = [];
    render(
      <Harness formType={ednaField} onData={(d) => captured.push(d)} />
    );

    await userEvent.type(screen.getByLabelText(/Site name or ID/i), "BI-04");
    await userEvent.click(screen.getByRole("tab", { name: "Sample" }));
    await userEvent.type(
      await screen.findByLabelText(/Unique sample ID/i),
      "BI-04-S1"
    );

    const latest = captured.at(-1);
    expect(latest.siteName).toBe("BI-04");
    expect(latest.sampleId).toBe("BI-04-S1");
  });

  it("shows bilingual help authored in the form definition", () => {
    render(<Harness formType={ednaField} />);
    expect(
      screen.getByText(/Decimal degrees, north positive/i)
    ).toBeInTheDocument();
  });
});

describe("filling in the eDNA lab form", () => {
  it("reveals sequencing fields only for metabarcoding", async () => {
    render(
      <Harness formType={ednaLab} initial={{ assayType: "metabarcoding" }} />
    );
    const labels = screen.getAllByRole("tab").map((t) => t.textContent);
    expect(labels).toContain("Sequencing");
    expect(labels).not.toContain("Quantitative result");
  });

  it("reveals quantitative fields only for qPCR", () => {
    render(<Harness formType={ednaLab} initial={{ assayType: "qPCR" }} />);
    const labels = screen.getAllByRole("tab").map((t) => t.textContent);
    expect(labels).toContain("Quantitative result");
    expect(labels).not.toContain("Sequencing");
  });
});

describe("exporting study metadata", () => {
  const samples = [
    {
      id: "s1",
      status: "submitted",
      formTypeVersion: 1,
      userID: "u1",
      lastEditedBy: { email: "field@cioos.ca" },
      createdAt: "2026-06-16T00:00:00.000Z",
      updatedAt: "2026-06-16T00:00:00.000Z",
      data: {
        surveyName: "Burrard Inlet 2026",
        siteName: "BI-04",
        latitude: 49.3,
        longitude: -123.1,
        sampleId: "BI-04-S1",
        sampleType: "sample",
        sampleDepthMetres: 5,
        fieldTeam: ["A. Analyst", "B. Biologist"],
        volumeFilteredMillilitres: 1000,
        fieldNotes: { en: "Calm, overcast", fr: "Calme, couvert" },
      },
    },
    {
      id: "s2",
      status: "submitted",
      formTypeVersion: 1,
      userID: "u1",
      lastEditedBy: { email: "field@cioos.ca" },
      createdAt: "2026-06-16T00:00:00.000Z",
      updatedAt: "2026-06-16T00:00:00.000Z",
      data: {
        surveyName: "Burrard Inlet 2026",
        siteName: "BI-04",
        sampleId: "BI-04-BLANK",
        sampleType: "field blank",
      },
    },
  ];

  it("produces a table with one row per sample", () => {
    const { rows } = buildExportTable({
      jsonSchema: ednaField.jsonSchema,
      submissions: samples,
    });
    expect(rows).toHaveLength(2);
  });

  it("includes the sample ID that joins field to lab metadata", () => {
    const { headers, rows } = buildExportTable({
      jsonSchema: ednaField.jsonSchema,
      submissions: samples,
    });
    const index = headers.indexOf("Unique sample ID");
    expect(rows.map((row) => row[index])).toEqual(["BI-04-S1", "BI-04-BLANK"]);
  });

  it("carries blanks and controls through as their own rows", () => {
    const { headers, rows } = buildExportTable({
      jsonSchema: ednaField.jsonSchema,
      submissions: samples,
    });
    const index = headers.indexOf("Sample type");
    expect(rows.map((row) => row[index])).toEqual(["sample", "field blank"]);
  });

  it("records who submitted each row", () => {
    const { headers, rows } = buildExportTable({
      jsonSchema: ednaField.jsonSchema,
      submissions: samples,
    });
    const index = headers.indexOf("Submitted by");
    expect(rows[0][index]).toBe("field@cioos.ca");
  });

  it("splits a bilingual note into two columns", () => {
    const { headers } = buildExportTable({
      jsonSchema: ednaField.jsonSchema,
      submissions: samples,
    });
    expect(headers).toContain("Field notes (en)");
    expect(headers).toContain("Field notes (fr)");
  });

  it("emits a CSV a spreadsheet can open", () => {
    const csv = toCsv({
      jsonSchema: ednaField.jsonSchema,
      submissions: samples,
    });
    const lines = csv.split("\r\n");
    expect(lines).toHaveLength(3);
    expect(lines[0]).toContain("Unique sample ID");
    // The team joins with "; ", which needs no quoting under a comma
    // delimiter. The bilingual note DOES contain a comma, so it is quoted.
    expect(lines[1]).toContain("A. Analyst; B. Biologist");
    expect(lines[1]).toContain('"Calm, overcast"');
  });

  it("exports the lab form with no engine changes", () => {
    // The same export path, a completely different schema — which is the claim
    // the whole engine rests on.
    const csv = toCsv({
      jsonSchema: ednaLab.jsonSchema,
      submissions: [
        {
          id: "l1",
          status: "submitted",
          formTypeVersion: 1,
          userID: "u1",
          createdAt: "2026-06-21T00:00:00.000Z",
          updatedAt: "2026-06-21T00:00:00.000Z",
          data: {
            sampleId: "BI-04-S1",
            extractionDate: "2026-06-20",
            assayType: "qPCR",
            dnaConcentrationNgPerMicrolitre: 12.4,
            detectionResult: "detected",
          },
        },
      ],
      includeMetadata: false,
    });
    const [header, row] = csv.split("\r\n");
    expect(header).toContain("DNA concentration (ng/µL)");
    expect(row).toContain("12.4");
    expect(row).toContain("detected");
  });
});

describe("viewing a completed submission", () => {
  /**
   * A submitted form must be readable as a FORM — the same steps and labels the
   * author saw — not only as a row in an export table.
   */
  const completed = {
    id: "s1",
    status: "submitted",
    formTypeVersion: 1,
    userID: "u1",
    lastEditedBy: { email: "field@cioos.ca" },
    createdAt: "2026-06-16T00:00:00.000Z",
    updatedAt: "2026-06-16T00:00:00.000Z",
    data: {
      siteName: "BI-04",
      sampleId: "BI-04-S1",
      sampleType: "sample",
      latitude: 49.3,
      volumeFilteredMillilitres: 1000,
      fieldNotes: { en: "Calm, overcast", fr: "Calme, couvert" },
    },
  };

  function renderReadOnly(formType, submission) {
    return render(
      <MemoryRouter>
        <FormShell
          jsonSchema={formType.jsonSchema}
          uiSchema={formType.uiSchema}
          formData={submission.data}
          disabled
          readonly
          language="en"
          context={{ canEdit: false }}
        />
      </MemoryRouter>
    );
  }

  it("renders the author's answers under the same steps", () => {
    renderReadOnly(ednaField, completed);
    expect(screen.getAllByRole("tab").map((t) => t.textContent)).toEqual([
      "Site",
      "Conditions",
      "Sample",
      "Filtration",
      "Notes",
    ]);
  });

  it("shows the submitted values, not empty inputs", () => {
    renderReadOnly(ednaField, completed);
    expect(screen.getByLabelText(/Site name or ID/i)).toHaveValue("BI-04");
  });

  it("renders every input as read-only", () => {
    // A reviewer must not be able to alter someone else's submission.
    renderReadOnly(ednaField, completed);
    screen.getAllByRole("textbox").forEach((input) => {
      expect(input).toBeDisabled();
    });
  });

  it("keeps a bilingual answer intact in both languages", async () => {
    renderReadOnly(ednaField, completed);
    // The notes live on their own step, so navigate there first.
    await userEvent.click(screen.getByRole("tab", { name: "Notes" }));

    // BilingualTextInput names its two inputs after the language codes.
    expect(await screen.findByDisplayValue("Calm, overcast")).toHaveAttribute(
      "name",
      "en"
    );
    expect(screen.getByDisplayValue("Calme, couvert")).toHaveAttribute(
      "name",
      "fr"
    );
  });

  it("exports one submission on its own", () => {
    const csv = toCsv({
      jsonSchema: ednaField.jsonSchema,
      submissions: [completed],
      includeMetadata: false,
    });
    const lines = csv.split("\r\n");
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain("BI-04-S1");
  });
});
