import { describe, expect, it, vi } from "vitest";

// doiUpdate exports performUpdateDraftDoi as its DEFAULT. Mocking it as a
// named export made this suite pass while the real build failed to resolve it.
vi.mock("../../utils/doiUpdate", () => ({ default: vi.fn() }));

const { default: performUpdateDraftDoi } = await import("../../utils/doiUpdate");
const { hooksFor, runHook } = await import("../hooks");

const submission = (record) => ({ id: "rec-1", data: record });

describe("hook registry", () => {
  it("has no hooks for a generic form", () => {
    expect(hooksFor("generic")).toEqual({});
    expect(hooksFor(undefined)).toEqual({});
  });

  it("never lets a failing hook fail the save", async () => {
    // The record is already written by the time afterSave runs. A catalogue
    // regeneration that 500s must not tell the user their work was lost.
    const result = await runHook("metadataRecord", "afterSave", {
      region: "pacific",
      userID: "u1",
      submission: submission({ status: "published" }),
      cloudFunctions: {
        regenerateXMLforRecord: () => {
          throw new Error("catalogue is down");
        },
      },
    });

    expect(result.ok).toBe(false);
    expect(result.error.message).toBe("catalogue is down");
  });

  it("reports success for a hook that does not exist", async () => {
    expect(await runHook("generic", "afterSave", {})).toEqual({ ok: true });
  });
});

describe("afterSave", () => {
  it("regenerates XML for a record that is visible outside the app", async () => {
    const regenerateXMLforRecord = vi.fn();
    await runHook("metadataRecord", "afterSave", {
      region: "pacific",
      userID: "u1",
      submission: submission({ status: "published", filename: "x.xml" }),
      cloudFunctions: { regenerateXMLforRecord },
    });

    expect(regenerateXMLforRecord).toHaveBeenCalledWith({
      path: "pacific/u1/rec-1",
      status: "published",
      filename: "x.xml",
      region: "pacific",
    });
  });

  it("does nothing for a draft", async () => {
    // Nothing is published, so there is nothing to regenerate.
    const regenerateXMLforRecord = vi.fn();
    await runHook("metadataRecord", "afterSave", {
      region: "pacific",
      userID: "u1",
      submission: submission({ status: "" }),
      cloudFunctions: { regenerateXMLforRecord },
    });

    expect(regenerateXMLforRecord).not.toHaveBeenCalled();
  });
});

describe("beforeStatusChange", () => {
  it("updates the draft DOI when there is a prefix and a DOI", async () => {
    performUpdateDraftDoi.mockResolvedValueOnce(200);

    const result = await runHook("metadataRecord", "beforeStatusChange", {
      region: "pacific",
      language: "en",
      datacitePrefix: "10.1234",
      submission: submission({ datasetIdentifier: "https://doi.org/10.1234/x" }),
    });

    expect(result.ok).toBe(true);
    expect(result.value).toEqual({ updated: true });
  });

  it("reports a non-200 as not updated rather than throwing", async () => {
    performUpdateDraftDoi.mockResolvedValueOnce(500);

    const result = await runHook("metadataRecord", "beforeStatusChange", {
      region: "pacific",
      language: "en",
      datacitePrefix: "10.1234",
      submission: submission({ datasetIdentifier: "https://doi.org/10.1234/x" }),
    });

    expect(result.value).toEqual({ updated: false });
  });

  it("skips a region with no DataCite credentials", async () => {
    performUpdateDraftDoi.mockClear();
    await runHook("metadataRecord", "beforeStatusChange", {
      region: "pacific",
      submission: submission({ datasetIdentifier: "https://doi.org/10.1234/x" }),
    });
    expect(performUpdateDraftDoi).not.toHaveBeenCalled();
  });

  it("skips a record with no DOI", async () => {
    performUpdateDraftDoi.mockClear();
    await runHook("metadataRecord", "beforeStatusChange", {
      region: "pacific",
      datacitePrefix: "10.1234",
      submission: submission({}),
    });
    expect(performUpdateDraftDoi).not.toHaveBeenCalled();
  });
});
