import { describe, expect, it } from "vitest";

import { validateStructural, validateSubmission } from "../validateWithSchema";
import { deprecatedEovValues } from "../enums";
import { getBlankRecord } from "../../utils/blankRecord";
import mockMetadataRecord from "../../__testData__/mockMetadataRecord";

/**
 * Tier 1 conformance: no credentials, no network, runs on every push.
 *
 * The negative fixtures matter as much as the positive ones. Without them a
 * conditional that never fires — because its `if` lacks a `required`, say —
 * looks exactly like a passing test.
 */

/** A record that satisfies every submission requirement. */
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

const keywordsIn = (result) => result.errors.map((e) => e.keyword);

/** Asserts the record fails submission, and that the named rule is why. */
function expectRejected(record, keyword) {
  const result = validateSubmission(record);
  expect(result.valid).toBe(false);
  expect(keywordsIn(result)).toContain(keyword);
  return result;
}

describe("structural schema", () => {
  it("accepts a blank record", () => {
    // Every field on a new record is "" / [] / null. If the structural schema
    // rejects those, it rejects the starting state of every record ever.
    const result = validateStructural(getBlankRecord());
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it("accepts the mock record fixture", () => {
    const result = validateStructural(mockMetadataRecord);
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it("accepts a complete record", () => {
    expect(validateStructural(completeRecord()).errors).toEqual([]);
  });

  it("accepts a legacy string resourceType", () => {
    // Older records serialize a single topic category as a bare string.
    const result = validateStructural(
      completeRecord({ resourceType: "oceanographic" })
    );
    expect(result.errors).toEqual([]);
  });

  it("accepts a reversed bounding box", () => {
    // Ordering is a validity rule, not a shape rule — a published legacy
    // record with a bad box must not hard-fail structurally.
    const result = validateStructural(
      completeRecord({
        map: { north: "60", south: "45", east: "-160", west: "-120" },
      })
    );
    expect(result.errors).toEqual([]);
  });

  it("rejects a resourceType outside the vocabulary", () => {
    const result = validateStructural(
      completeRecord({ resourceType: ["not-a-topic-category"] })
    );
    expect(result.valid).toBe(false);
  });
});

describe("submission schema", () => {
  it("accepts a complete record", () => {
    const result = validateSubmission(completeRecord());
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it("rejects a blank record", () => {
    // Proves the submission schema has teeth. A blank record satisfying it
    // would mean the requirements aren't wired up at all.
    expect(validateSubmission(getBlankRecord()).valid).toBe(false);
  });
});

describe("submission rules", () => {
  it("requires a title in both languages", () => {
    expectRejected(completeRecord({ title: { en: "Title", fr: "" } }), "minLength");
  });

  it("requires at least one topic category", () => {
    expectRejected(completeRecord({ resourceType: [] }), "minItems");
  });

  it("requires at least one keyword in some language", () => {
    expectRejected(
      completeRecord({ keywords: { en: [], fr: [] } }),
      "minItems"
    );
  });

  it("rejects deprecated EOVs", () => {
    expect(deprecatedEovValues.length).toBeGreaterThan(0);
    expectRejected(completeRecord({ eov: [deprecatedEovValues[0]] }), "not");
  });

  it("requires a vertical extent unless noVerticalExtent is set", () => {
    const result = expectRejected(
      completeRecord({ noVerticalExtent: false }),
      "required"
    );
    expect(
      result.errors.some((e) => e.params?.missingProperty === "verticalExtentMin")
    ).toBe(true);
  });

  it("accepts a vertical extent when it is actually provided", () => {
    const result = validateSubmission(
      completeRecord({
        noVerticalExtent: false,
        verticalExtentMin: "0",
        verticalExtentMax: "100",
        verticalExtentDirection: "depthPositive",
      })
    );
    expect(result.errors).toEqual([]);
  });

  it("requires taxa unless noTaxa is set", () => {
    const result = expectRejected(completeRecord({ noTaxa: false }), "required");
    expect(result.errors.some((e) => e.params?.missingProperty === "taxa")).toBe(
      true
    );
  });

  it("requires a platform type and id when a platform is listed", () => {
    expectRejected(
      completeRecord({ noPlatform: false, platforms: [{ type: "", id: "" }] }),
      "anyOf"
    );
  });

  it("exempts model-scoped records from the platform requirement", () => {
    const result = validateSubmission(
      completeRecord({
        noPlatform: false,
        metadataScopeIso: "model",
        platforms: [{ type: "", id: "" }],
      })
    );
    expect(result.errors).toEqual([]);
  });

  it("requires an instrument platform only once two platforms exist", () => {
    const onePlatform = validateSubmission(
      completeRecord({
        noPlatform: false,
        platforms: [{ type: "mooring", id: "A" }],
        instruments: [{ id: "i1" }],
      })
    );
    expect(onePlatform.errors).toEqual([]);

    expectRejected(
      completeRecord({
        noPlatform: false,
        platforms: [
          { type: "mooring", id: "A" },
          { type: "mooring", id: "B" },
        ],
        instruments: [{ id: "i1" }],
      }),
      "required"
    );
  });

  it("requires a custodian and an owner among the contacts", () => {
    expectRejected(
      completeRecord({
        contacts: [{ role: ["custodian"], orgName: "Org", inCitation: true }],
      }),
      "contains"
    );
  });

  it("requires at least one contact in the citation", () => {
    expectRejected(
      completeRecord({
        contacts: [
          { role: ["custodian", "owner"], orgName: "Org", inCitation: false },
        ],
      }),
      "contains"
    );
  });

  it("requires every contact to have a name", () => {
    expectRejected(
      completeRecord({
        contacts: [
          { role: ["custodian", "owner"], orgName: "Org", inCitation: true },
          { role: ["distributor"] },
        ],
      }),
      "anyOf"
    );
  });

  it("requires at least one named resource with a URL", () => {
    expectRejected(completeRecord({ distribution: [] }), "contains");
  });

  it("requires related works to be fully identified", () => {
    expectRejected(
      completeRecord({
        associated_resources: [
          {
            title: { en: "Work", fr: "Travail" },
            authority: "DOI",
            code: "10.1234/x",
          },
        ],
      }),
      "required"
    );
  });

  it("requires a title and description on every processing step", () => {
    expectRejected(
      completeRecord({
        history: [{ processingStep: [{ title: "Step", description: "" }] }],
      }),
      "minLength"
    );
  });

  it("requires a statement on a data-collection lineage step", () => {
    // Keyed off scopeIso, not scope — see schema/README.md §11 decision 3.
    expectRejected(
      completeRecord({
        history: [{ scope: "DataCollectionSampling", scopeIso: "collectionSession" }],
      }),
      "required"
    );
  });

  it("does not require a statement on other lineage scopes", () => {
    const result = validateSubmission(
      completeRecord({
        history: [{ scope: "Dataset", scopeIso: "dataset" }],
      })
    );
    expect(result.errors).toEqual([]);
  });
});

describe("spatial extent rules", () => {
  it("rejects a reversed bounding box", () => {
    expectRejected(
      completeRecord({
        map: { north: "60", south: "45", east: "-160", west: "-120" },
      }),
      "x-cioos-bbox-ordered"
    );
  });

  it("rejects an out-of-range latitude", () => {
    expectRejected(
      completeRecord({
        map: { north: "200", south: "45", east: "-120", west: "-160" },
      }),
      "x-cioos-coordinate-ranges"
    );
  });

  it("accepts a closed polygon with no bounding box", () => {
    const result = validateSubmission(
      completeRecord({
        map: {
          north: "",
          south: "",
          east: "",
          west: "",
          polygon: "48,-128 56,-133 56,-147 48,-128",
        },
      })
    );
    expect(result.errors).toEqual([]);
  });

  it("rejects an unclosed polygon", () => {
    expectRejected(
      completeRecord({
        map: {
          north: "",
          south: "",
          east: "",
          west: "",
          polygon: "48,-128 56,-133 56,-147",
        },
      }),
      "x-cioos-polygon-closed"
    );
  });

  it("accepts a description alone for biota records", () => {
    const result = validateSubmission(
      completeRecord({
        resourceType: ["biota"],
        map: { description: { en: "The Salish Sea", fr: "La mer des Salish" } },
      })
    );
    expect(result.errors).toEqual([]);
  });

  it("accepts a description alone for legacy 'biological' records", () => {
    const result = validateSubmission(
      completeRecord({
        resourceType: ["biological"],
        map: { description: { en: "The Salish Sea", fr: "" } },
      })
    );
    expect(result.errors).toEqual([]);
  });

  it("rejects a description alone for non-biota records", () => {
    expectRejected(
      completeRecord({
        resourceType: ["oceans"],
        map: { description: { en: "The Salish Sea", fr: "La mer des Salish" } },
      }),
      "anyOf"
    );
  });
});
