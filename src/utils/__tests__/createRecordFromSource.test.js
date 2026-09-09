import { vi, describe, it, expect, beforeEach } from "vitest";
import axios from "axios";
import {
  createRecordFromSource,
  detectSourceType,
  normalizePrefilledRecord,
} from "../createRecordFromSource";

vi.mock("axios");
vi.mock("../../firebase", () => ({
  default: {
    options: { projectId: "test-project" },
  },
}));

describe("detectSourceType", () => {
  it.each([
    ["10.21963/13172", "doi"],
    ["doi:10.21963/13172", "doi"],
    ["https://doi.org/10.21963/13172", "doi"],
    ["http://dx.doi.org/10.21963/13172", "doi"],
  ])("detects %s as a DOI", (input, expected) => {
    expect(detectSourceType(input)).toBe(expected);
  });

  it.each([
    ["13172", "pdc"],
    ["https://www.polardata.ca/pdcsearch/xml/iso/13172_iso.xml", "pdc"],
  ])("detects %s as PDC", (input, expected) => {
    expect(detectSourceType(input)).toBe(expected);
  });

  it.each([
    ["https://obis.org/dataset/8c39a3f7-4b78-4d5a-9d4c-1f5e2a3b6c7d", "obis"],
    ["8c39a3f7-4b78-4d5a-9d4c-1f5e2a3b6c7d", "obis"],
  ])("detects %s as OBIS", (input, expected) => {
    expect(detectSourceType(input)).toBe(expected);
  });

  // A DOI URL ends in digits, so a naive CCIN check would claim it.
  it("prefers DOI over PDC for a doi.org URL ending in digits", () => {
    expect(detectSourceType("https://doi.org/10.21963/13172")).toBe("doi");
  });

  it.each([["", null], ["   ", null], ["not an identifier", null]])(
    "returns null for %o",
    (input, expected) => {
      expect(detectSourceType(input)).toBe(expected);
    }
  );

  it("ignores surrounding whitespace", () => {
    expect(detectSourceType("  13172  ")).toBe("pdc");
  });
});

describe("createRecordFromSource", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("posts the source type and identifier and unwraps the record", async () => {
    axios.post.mockResolvedValue({ data: { data: { title: { en: "A record" } } } });

    const record = await createRecordFromSource("pdc", "13172");

    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining("create_record_from_source"),
      { data: { source_type: "pdc", identifier: "13172" } }
    );
    expect(record).toEqual({ title: { en: "A record" } });
  });

  it("surfaces the server's error message", async () => {
    axios.post.mockRejectedValue({
      response: { data: { error: "Could not retrieve pdc record '999'" } },
    });

    await expect(createRecordFromSource("pdc", "999")).rejects.toThrow(
      "Could not retrieve pdc record '999'"
    );
  });
});

describe("normalizePrefilledRecord", () => {
  // Mirrors the real output of retrieve_pdc_as_firebase_record("13172").
  const pdcRecord = {
    title: { en: "CCGS Amundsen underway gas measurements, 2018-2019" },
    recordID: "ccin-13172",
    filename: "ccin-13172",
    identifier: "ccin-ca7e4c88-8cc5-4194-a0e3-a33c22adb0af",
    status: "",
    userID: "",
    region: "",
    datasetIdentifier: "",
    doiCreationStatus: "findable",
    verticalExtentMax: null,
    verticalExtentMin: null,
    comments: { en: "## Purpose: ..." },
    resourceType: [],
    noTaxa: true,
    metadataScope: "Dataset",
    eov: ["other"],
    timeFirstPublished: "2020-01-01T00:00:00Z",
    lastEditedBy: { displayName: "", email: "" },
    sharedWith: {},
    contacts: [{ givenNames: "Jane", lastName: "Doe", role: ["author"] }],
  };

  it("clears the fields that describe this form's copy of the record", () => {
    const record = normalizePrefilledRecord(pdcRecord);

    expect(record.recordID).toBe("");
    expect(record.filename).toBe("");
    expect(record.status).toBe("");
    expect(record.userID).toBe("");
    expect(record.region).toBe("");
    expect(record.timeFirstPublished).toBe("");
    expect(record.lastEditedBy).toEqual({});
  });

  it("mints its own identifier rather than keeping the loader's", () => {
    const record = normalizePrefilledRecord(pdcRecord);

    expect(record.identifier).not.toBe(pdcRecord.identifier);
    expect(record.identifier).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
  });

  it("drops nulls so they can't clobber the blank record's defaults", () => {
    const record = normalizePrefilledRecord(pdcRecord);

    expect(record.verticalExtentMax).toBe("");
    expect(record.verticalExtentMin).toBe("");
  });

  it("renames PDC's `comments` to the form's `comment`", () => {
    const record = normalizePrefilledRecord(pdcRecord);

    expect(record.comment).toEqual({ en: "## Purpose: ..." });
    expect(record.comments).toBeUndefined();
  });

  it("clears a DOI status that has no DOI attached to it", () => {
    const record = normalizePrefilledRecord(pdcRecord);

    expect(record.doiCreationStatus).toBe("");
  });

  it("keeps a DOI status when the record does carry a DOI", () => {
    const record = normalizePrefilledRecord({
      ...pdcRecord,
      datasetIdentifier: "https://doi.org/10.21963/13172",
    });

    expect(record.doiCreationStatus).toBe("findable");
  });

  it("keeps form fields that the blank record doesn't declare", () => {
    const record = normalizePrefilledRecord(pdcRecord);

    expect(record.noTaxa).toBe(true);
    expect(record.metadataScope).toBe("Dataset");
  });

  it("drops keys the form doesn't know about", () => {
    const record = normalizePrefilledRecord(pdcRecord);

    expect(record.sharedWith).toBeUndefined();
  });

  it("wraps OBIS's bare-string resourceType in a list", () => {
    const record = normalizePrefilledRecord({ resourceType: "Dataset" });

    expect(record.resourceType).toEqual(["Dataset"]);
  });

  it("gives contacts the full contact shape", () => {
    const record = normalizePrefilledRecord(pdcRecord);

    expect(record.contacts[0]).toMatchObject({
      givenNames: "Jane",
      lastName: "Doe",
      role: ["author"],
      orgName: "",
      indEmail: "",
    });
  });

  it("fills in every field the form expects, even from an empty source", () => {
    const record = normalizePrefilledRecord({});

    expect(record.title).toEqual({ en: "", fr: "" });
    expect(record.contacts).toEqual([]);
    expect(record.eov).toEqual([]);
  });
});
