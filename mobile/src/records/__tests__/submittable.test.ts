import { getBlankRecord } from "@cioos/shared/blankRecord.js";
import { getErrorsByTab, validators } from "@cioos/shared/validate.js";
import { describe, expect, test } from "vitest";

import { buildLedger } from "../ledger";

/**
 * A record the app can actually submit.
 *
 * Every value below is one the mobile editor can produce — each corresponds to
 * a real control in a section screen. If a required validator ever depends on a
 * field with no input, this fails, and that is the point: the gap is otherwise
 * invisible until a field user has filled in eight sections and finds the
 * submit button still disabled. It caught exactly that for `language`, which
 * had no control anywhere in the app.
 */
const filledFromTheApp = () => ({
  ...(getBlankRecord() as Record<string, unknown>),

  // Identification
  title: { en: "Sea surface temperature", fr: "Température de surface" },
  resourceType: ["oceanographic"],
  metadataScope: "Dataset",
  metadataScopeIso: "dataset",

  // About the data
  abstract: { en: "Hourly SST from a moored buoy.", fr: "TSM horaire d'une bouée." },
  keywords: { en: ["Temperature"], fr: ["Température"] },
  eov: ["seaSurfaceTemperature"],
  progress: "onGoing",
  language: "en",
  license: "CC-BY-4.0",

  // Where
  map: { north: "49.3", south: "49.1", east: "-123.0", west: "-123.3", polygon: "" },
  noVerticalExtent: true,

  // Who
  contacts: [
    {
      role: ["owner", "custodian"],
      orgName: "Fisheries and Oceans Canada",
      inCitation: true,
    },
  ],

  // Platform and species
  noPlatform: true,
  noTaxa: true,

  // Resources — at least one named, resolvable resource is required.
  distribution: [
    { name: "ERDDAP dataset", url: "https://data.cioos.ca/erddap/tabledap/sst" },
  ],
});

describe("the submit gate", () => {
  test("a record filled entirely through the app's own controls is submittable", () => {
    const ledger = buildLedger(filledFromTheApp());

    // Named so a failure says which validator, not just "false".
    const outstanding = Object.entries(
      getErrorsByTab(filledFromTheApp()) as Record<string, unknown[]>,
    )
      .filter(([, errors]) => errors.length > 0)
      .map(([tab]) => tab);

    expect(outstanding).toEqual([]);
    expect(ledger.submittable).toBe(true);
    expect(ledger.requiredSatisfied).toBe(ledger.requiredTotal);
  });

  test("and the gate really closes without one of them", () => {
    // Guards the test above: if `filledFromTheApp` drifted into satisfying
    // everything vacuously, removing a required value would not change it.
    const withoutLanguage = { ...filledFromTheApp(), language: "" };
    expect(buildLedger(withoutLanguage).submittable).toBe(false);
  });

  test("no required validator is orphaned from the section grouping", () => {
    // Every non-optional validator must fall inside some section's tabs, or it
    // would gate submission while being unreachable and uncounted.
    const required = Object.values(
      validators as Record<string, { tab: string; optional?: boolean }>,
    ).filter((v) => !v.optional).length;

    const counted = buildLedger(filledFromTheApp()).sections.reduce(
      (sum, section) => sum + section.required,
      0,
    );

    expect(counted).toBe(required);
  });

  test("a half-filled related work closes the gate", () => {
    // The trap these editors have to make visible: related works are optional
    // as a whole, but one incomplete entry blocks submission from a screen the
    // user has already left.
    const missingFrench = {
      ...filledFromTheApp(),
      associated_resources: [
        {
          title: { en: "A companion paper", fr: "" },
          authority: "DOI",
          code: "https://doi.org/10.0000/x",
          association_type: "Cites",
        },
      ],
    };
    expect(buildLedger(missingFrench).submittable).toBe(false);

    const complete = {
      ...filledFromTheApp(),
      associated_resources: [
        {
          title: { en: "A companion paper", fr: "Un article complémentaire" },
          authority: "DOI",
          code: "https://doi.org/10.0000/x",
          association_type: "Cites",
        },
      ],
    };
    expect(buildLedger(complete).submittable).toBe(true);
  });

  test("a processing step with no description closes the gate", () => {
    const step = (processingStep: unknown[]) => ({
      ...filledFromTheApp(),
      history: [{ statement: { en: "Collected", fr: "Collecté" }, processingStep }],
    });

    expect(buildLedger(step([{ title: { en: "Despiked", fr: "Dépointé" } }])).submittable).toBe(
      false,
    );
    expect(
      buildLedger(
        step([
          {
            title: { en: "Despiked", fr: "Dépointé" },
            description: { en: "Removed spikes", fr: "Pointes retirées" },
          },
        ]),
      ).submittable,
    ).toBe(true);
  });

  test("an empty lineage step is harmless", () => {
    // Adding a step and leaving its lists empty must not block anything.
    const withEmptyStep = {
      ...filledFromTheApp(),
      history: [
        { statement: { en: "", fr: "" }, source: [], processingStep: [], additionalDocumentation: [] },
      ],
    };
    expect(buildLedger(withEmptyStep).submittable).toBe(true);
  });
});
