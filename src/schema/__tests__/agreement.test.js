import { describe, expect, it } from "vitest";

import { recordProperties, KNOWN_EXTRA_KEYS } from "../index";
import { SCHEMA_VERSION } from "../version";
import { validateStructural, validateSubmission } from "../validateWithSchema";
import { tabValues } from "../enums";
import { getBlankRecord } from "../../utils/blankRecord";
import { EXTRA_ALLOWED_KEYS } from "../../utils/createRecordFromSource";
import { validators, recordIsValid } from "../../utils/validate";
import mockMetadataRecord from "../../__testData__/mockMetadataRecord";

/**
 * The record shape has three parallel definitions that have historically
 * drifted: blankRecord.js (defaults), validate.js (rules), and now the schema.
 *
 * These tests do not merge them — that is a later, riskier refactor. They just
 * make drift fail loudly, which is the cheap 90% of the benefit.
 */

/**
 * Where each hand-written validator's rule lives in the schema. A validator
 * with no entry fails the test, so adding one to validate.js forces a
 * conscious decision about the schema.
 */
const VALIDATOR_TO_SCHEMA = {
  title: "properties.title + submission requiredBilingualText",
  resourceType: "properties.resourceType + submission hasResourceType",
  abstract: "properties.abstract + submission requiredBilingualText",
  keywords: "properties.keywords + submission requiredKeywords",
  eov: "properties.eov + submission requiredEov",
  eovDeprecated: "submission requiredEov (items.not.enum deprecatedEovValues)",
  datasetIdentifier: "properties.datasetIdentifier (pattern)",
  metadataScope: "properties.metadataScope + submission requiredNonEmptyStrings",
  progress: "properties.progress + submission requiredNonEmptyStrings",
  language: "properties.language + submission requiredNonEmptyStrings",
  license: "properties.license + submission requiredNonEmptyStrings",
  map: "properties.map + submission spatialExtent",
  verticalExtentMin: "submission verticalExtent",
  verticalExtentMax: "submission verticalExtent",
  verticalExtentDirection: "submission verticalExtent",
  contacts: "properties.contacts + submission requiredContacts",
  distribution: "properties.distribution + submission requiredDistribution",
  associated_resources:
    "properties.associated_resources + submission validRelatedWorks",
  history: "properties.history + submission validLineage",
  platforms: "properties.platforms + submission platformRequirements",
  instruments: "properties.instruments + submission instrumentRequirements",
  taxa: "properties.taxa + submission taxonomicCoverage",
};

function completeRecord(overrides = {}) {
  return {
    title: { en: "Title", fr: "Titre" },
    abstract: { en: "Abstract", fr: "Résumé" },
    keywords: { en: ["keyword"], fr: [] },
    eov: ["oxygen"],
    resourceType: ["oceans"],
    metadataScope: "Dataset",
    metadataScopeIso: "dataset",
    progress: "onGoing",
    language: "en",
    license: "CC-BY-4.0",
    map: { north: "60", south: "45", east: "-120", west: "-160", polygon: "" },
    noVerticalExtent: true,
    noTaxa: true,
    noPlatform: true,
    contacts: [
      { role: ["custodian", "owner"], orgName: "Org", inCitation: true },
    ],
    distribution: [{ name: "Data", url: "https://example.org/data" }],
    associated_resources: [],
    history: [],
    instruments: [],
    platforms: [],
    ...overrides,
  };
}

describe("schema agrees with blankRecord", () => {
  const blankKeys = Object.keys(getBlankRecord());
  const schemaKeys = Object.keys(recordProperties);

  it("describes every key a new record starts with", () => {
    const undescribed = blankKeys.filter((key) => !schemaKeys.includes(key));
    expect(undescribed).toEqual([]);
  });

  it("describes no key that is neither seeded nor a known runtime extra", () => {
    const unexplained = schemaKeys.filter(
      (key) => !blankKeys.includes(key) && !KNOWN_EXTRA_KEYS.includes(key)
    );
    expect(unexplained).toEqual([]);
  });

  it("stamps the current schema version on new records", () => {
    expect(getBlankRecord().schemaVersion).toBe(SCHEMA_VERSION);
  });

  /**
   * createRecordFromSource keeps its own, deliberately NARROWER allowlist of
   * what a remote source (DataCite/OBIS/PDC) may set. It must not be replaced
   * by KNOWN_EXTRA_KEYS: that would let a remote record set userID, region,
   * sharedWith, and schemaVersion. Assert containment instead, so a typo or a
   * removed schema field still fails.
   */
  it("keeps the prefill allowlist inside the schema", () => {
    const undescribed = EXTRA_ALLOWED_KEYS.filter(
      (key) => !schemaKeys.includes(key)
    );
    expect(undescribed).toEqual([]);
  });

  it("keeps form-owned fields out of the prefill allowlist", () => {
    const formOwned = ["userID", "region", "sharedWith", "schemaVersion", "identifier"];
    const leaked = EXTRA_ALLOWED_KEYS.filter((key) => formOwned.includes(key));
    expect(leaked).toEqual([]);
  });
});

describe("schema agrees with validate.js", () => {
  it("maps every hand-written validator to a schema constraint", () => {
    const unmapped = Object.keys(validators).filter(
      (key) => !VALIDATOR_TO_SCHEMA[key]
    );
    expect(
      unmapped,
      "new validator(s) in validate.js with no schema counterpart"
    ).toEqual([]);
  });

  it("does not map validators that no longer exist", () => {
    const stale = Object.keys(VALIDATOR_TO_SCHEMA).filter(
      (key) => !validators[key]
    );
    expect(stale).toEqual([]);
  });

  it("tags every field with a real tab key", () => {
    const badTabs = Object.entries(recordProperties)
      .map(([name, sub]) => [name, sub["x-cioos-tab"]])
      .filter(([, tab]) => tab !== undefined && !tabValues.includes(tab));
    expect(badTabs).toEqual([]);
  });

  it("carries a bilingual error message wherever validate.js has one", () => {
    // eovDeprecated is skipped by the first filter: it has no property of its
    // own, because its rule rides on `eov`.
    const missing = Object.entries(validators)
      .filter(([name]) => recordProperties[name])
      .filter(([name]) => {
        const error = recordProperties[name]["x-cioos-error"];
        return !error || !error.en || !error.fr;
      })
      .map(([name]) => name);
    expect(missing).toEqual([]);
  });
});

/**
 * Divergences between recordIsValid() and the submission schema, each with the
 * reason it exists. This list shrinking to zero is the gate for replacing the
 * hand-written validators with the schema.
 */
const KNOWN_DIVERGENCES = [
  {
    what: "lineage statement on a data-collection step",
    why:
      "validate.js compares lineageStep.scope to 'collectionSession', but scope holds a " +
      "metadataScopeCodes KEY ('DataCollectionSampling') and 'collectionSession' is its " +
      "isoValue — so the rule never fires. The schema encodes the intent via scopeIso. " +
      "See schema/README.md §11 decision 3.",
    record: () =>
      completeRecord({
        history: [
          { scope: "DataCollectionSampling", scopeIso: "collectionSession" },
        ],
      }),
    handWritten: true,
    schema: false,
  },
];

describe("behavioural equivalence with recordIsValid", () => {
  const cases = [
    ["blank record", getBlankRecord()],
    ["mock record fixture", mockMetadataRecord],
    ["complete record", completeRecord()],
    ["missing french title", completeRecord({ title: { en: "T", fr: "" } })],
    ["no topic category", completeRecord({ resourceType: [] })],
    ["no keywords", completeRecord({ keywords: { en: [], fr: [] } })],
    ["reversed bbox", completeRecord({ map: { north: "60", south: "45", east: "-160", west: "-120" } })],
    [
      "polygon only",
      completeRecord({
        map: { north: "", south: "", east: "", west: "", polygon: "48,-128 56,-133 56,-147 48,-128" },
      }),
    ],
    [
      "biota with description only",
      completeRecord({
        resourceType: ["biota"],
        map: { description: { en: "Salish Sea", fr: "Mer des Salish" } },
      }),
    ],
    ["vertical extent required", completeRecord({ noVerticalExtent: false })],
    ["taxa required", completeRecord({ noTaxa: false })],
    ["contacts missing owner", completeRecord({ contacts: [{ role: ["custodian"], orgName: "Org", inCitation: true }] })],
    ["no resources", completeRecord({ distribution: [] })],
  ];

  it.each(cases)("agrees on %s", (_name, record) => {
    expect(validateSubmission(record).valid).toBe(recordIsValid(record));
  });

  it.each(KNOWN_DIVERGENCES.map((d) => [d.what, d]))(
    "diverges on %s, for a documented reason",
    (_what, divergence) => {
      const record = divergence.record();
      // Pinned so the divergence cannot silently change shape. When validate.js
      // is fixed, this test fails and the entry gets deleted.
      expect(recordIsValid(record)).toBe(divergence.handWritten);
      expect(validateSubmission(record).valid).toBe(divergence.schema);
    }
  );
});

describe("structural schema tolerates real-world records", () => {
  it.each([
    ["blank record", getBlankRecord()],
    ["mock record fixture", mockMetadataRecord],
    ["legacy string resourceType", completeRecord({ resourceType: "biological" })],
    ["legacy oceanographic theme", completeRecord({ resourceType: ["oceanographic"] })],
    ["record with no schemaVersion", completeRecord()],
  ])("accepts %s", (_name, record) => {
    expect(validateStructural(record).errors).toEqual([]);
  });
});
