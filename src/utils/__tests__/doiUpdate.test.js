import { vi, describe, it, expect, beforeEach } from "vitest";

// Mock firebase/functions
const mockUpdateDraftDoi = vi.fn();
vi.mock("firebase/functions", () => ({
  getFunctions: vi.fn(() => ({})),
  httpsCallable: vi.fn(() => mockUpdateDraftDoi),
}));

// Mock recordToDataCiteFromPython
const mockRecordToDataCite = vi.fn();
vi.mock("../recordToDataCiteFromPython", () => ({
  recordToDataCiteFromPython: (...args) => mockRecordToDataCite(...args),
}));

// Mock firebase
vi.mock("../../firebase", () => ({
  default: {
    options: { projectId: "test-project" },
  },
}));

// Import after mocks
const { default: performUpdateDraftDoi } = await import("../doiUpdate");

describe("performUpdateDraftDoi", () => {
  const mockRecord = {
    identifier: "test-123",
    datasetIdentifier: "https://doi.org/10.1234/test-doi",
    title: { en: "Test Dataset" },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call recordToDataCiteFromPython with forUpdate: true", async () => {
    const mockMappedObject = {
      data: { attributes: { titles: [{ title: "Test" }] } },
    };
    mockRecordToDataCite.mockResolvedValue(mockMappedObject);
    mockUpdateDraftDoi.mockResolvedValue({ data: { status: 200 } });

    await performUpdateDraftDoi(mockRecord, "pacific", "en", "10.1234");

    expect(mockRecordToDataCite).toHaveBeenCalledWith(
      mockRecord,
      "en",
      "pacific",
      "10.1234",
      { forUpdate: true },
    );
  });

  it("should extract DOI from https://doi.org/ URL", async () => {
    mockRecordToDataCite.mockResolvedValue({ data: { attributes: {} } });
    mockUpdateDraftDoi.mockResolvedValue({ data: { status: 200 } });

    await performUpdateDraftDoi(mockRecord, "pacific", "en", "10.1234");

    expect(mockUpdateDraftDoi).toHaveBeenCalledWith(
      expect.objectContaining({
        doi: "10.1234/test-doi",
      }),
    );
  });

  it("should extract DOI from http://doi.org/ URL", async () => {
    const record = {
      ...mockRecord,
      datasetIdentifier: "http://doi.org/10.1234/test-doi",
    };
    mockRecordToDataCite.mockResolvedValue({ data: { attributes: {} } });
    mockUpdateDraftDoi.mockResolvedValue({ data: { status: 200 } });

    await performUpdateDraftDoi(record, "pacific", "en", "10.1234");

    expect(mockUpdateDraftDoi).toHaveBeenCalledWith(
      expect.objectContaining({
        doi: "10.1234/test-doi",
      }),
    );
  });

  it("should extract DOI from https://dx.doi.org/ URL", async () => {
    const record = {
      ...mockRecord,
      datasetIdentifier: "https://dx.doi.org/10.1234/test-doi",
    };
    mockRecordToDataCite.mockResolvedValue({ data: { attributes: {} } });
    mockUpdateDraftDoi.mockResolvedValue({ data: { status: 200 } });

    await performUpdateDraftDoi(record, "pacific", "en", "10.1234");

    expect(mockUpdateDraftDoi).toHaveBeenCalledWith(
      expect.objectContaining({
        doi: "10.1234/test-doi",
      }),
    );
  });

  it("should extract DOI from http://dx.doi.org/ URL", async () => {
    const record = {
      ...mockRecord,
      datasetIdentifier: "http://dx.doi.org/10.1234/test-doi",
    };
    mockRecordToDataCite.mockResolvedValue({ data: { attributes: {} } });
    mockUpdateDraftDoi.mockResolvedValue({ data: { status: 200 } });

    await performUpdateDraftDoi(record, "pacific", "en", "10.1234");

    expect(mockUpdateDraftDoi).toHaveBeenCalledWith(
      expect.objectContaining({
        doi: "10.1234/test-doi",
      }),
    );
  });

  it("should pass region and mapped data to updateDraftDoi", async () => {
    const mockMappedObject = {
      data: { attributes: { titles: [{ title: "Test" }] } },
    };
    mockRecordToDataCite.mockResolvedValue(mockMappedObject);
    mockUpdateDraftDoi.mockResolvedValue({ data: { status: 200 } });

    await performUpdateDraftDoi(mockRecord, "atlantic", "fr", "10.5678");

    expect(mockUpdateDraftDoi).toHaveBeenCalledWith({
      doi: "10.1234/test-doi",
      region: "atlantic",
      data: mockMappedObject,
    });
  });

  it("should return status code from response", async () => {
    mockRecordToDataCite.mockResolvedValue({ data: { attributes: {} } });
    mockUpdateDraftDoi.mockResolvedValue({ data: { status: 200 } });

    const result = await performUpdateDraftDoi(
      mockRecord,
      "pacific",
      "en",
      "10.1234",
    );

    expect(result).toBe(200);
  });

  it("should propagate errors from recordToDataCiteFromPython", async () => {
    mockRecordToDataCite.mockRejectedValue(new Error("Conversion failed"));

    await expect(
      performUpdateDraftDoi(mockRecord, "pacific", "en", "10.1234"),
    ).rejects.toThrow("Conversion failed");
  });

  it("should propagate errors from updateDraftDoi", async () => {
    mockRecordToDataCite.mockResolvedValue({ data: { attributes: {} } });
    mockUpdateDraftDoi.mockRejectedValue(new Error("DOI not found"));

    await expect(
      performUpdateDraftDoi(mockRecord, "pacific", "en", "10.1234"),
    ).rejects.toThrow("DOI not found");
  });
});

const { isManagedDoi, canPushFormToDoi } = await import("../doiUpdate");

describe("DOI update guards", () => {
  const prefix = "10.1234";
  const doi = "https://doi.org/10.1234/abc";
  const rec = (doiCreationStatus, datasetIdentifier = doi) => ({
    datasetIdentifier,
    doiCreationStatus,
  });

  it.each(["draft", "registered", "findable"])(
    "treats a %s DOI on our prefix as managed",
    (status) => {
      expect(isManagedDoi(rec(status), prefix)).toBe(true);
    },
  );

  it.each(["", "not found", "unknown"])(
    "does not treat status '%s' as managed",
    (status) => {
      expect(isManagedDoi(rec(status), prefix)).toBe(false);
    },
  );

  it("ignores DOIs from another prefix or without a prefix configured", () => {
    expect(
      isManagedDoi(rec("draft", "https://doi.org/10.9999/x"), prefix),
    ).toBe(false);
    expect(isManagedDoi(rec("draft"), "")).toBe(false);
    expect(isManagedDoi({ doiCreationStatus: "draft" }, prefix)).toBe(false);
  });

  it("allows pushing form edits to draft DOIs only", () => {
    expect(canPushFormToDoi(rec("draft"), prefix)).toBe(true);
    expect(canPushFormToDoi(rec("registered"), prefix)).toBe(false);
    expect(canPushFormToDoi(rec("findable"), prefix)).toBe(false);
    expect(canPushFormToDoi(rec(""), prefix)).toBe(false);
  });
});
