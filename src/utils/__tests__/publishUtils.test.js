import { vi, describe, it, expect, beforeEach } from "vitest";
import { convertMetadata } from "../../api/actions";
import { preparePublishPayload, convertRecord } from "../publishUtils";
import { getRecordFilename } from "../misc";

// Mock dependencies
vi.mock("../../api/actions", () => ({
  convertMetadata: vi.fn(),
}));
vi.mock("../misc");

describe("publishUtils", () => {
  const mockRecord = {
    id: "test-uuid",
    identifier: "test-uuid",
    title: { en: "Test Record" },
  };

  const mockConfig = {
    fileTemplate: "metadata/{filename}",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("convertRecord", () => {
    it("should call the conversion API and return data on success", async () => {
      convertMetadata.mockResolvedValue({ data: "<xml>content</xml>" });

      const result = await convertRecord(mockRecord, "iso19115-3_xml", "hakai");

      expect(convertMetadata).toHaveBeenCalledWith({
        region: "hakai",
        record: mockRecord,
        outputFormat: "iso19115-3_xml",
      });
      expect(result).toBe("<xml>content</xml>");
    });

    it("should throw an error if the response is invalid", async () => {
      convertMetadata.mockResolvedValue({ data: null });

      await expect(convertRecord(mockRecord, "yaml", "hakai")).rejects.toThrow(
        "Invalid response from conversion service",
      );
    });

    it("should throw an error if the request fails", async () => {
      convertMetadata.mockRejectedValue(new Error("Network error"));

      await expect(convertRecord(mockRecord, "yaml", "hakai")).rejects.toThrow(
        "Failed to convert record to yaml: Network error",
      );
    });
  });

  describe("preparePublishPayload", () => {
    it("should generate the correct payload with converted files", async () => {
      // Mock helper functions
      getRecordFilename.mockReturnValue("test-record-filename");

      // Mock convertRecord responses (since it calls convertMetadata)
      convertMetadata
        .mockResolvedValueOnce({ data: "<xml>content</xml>" }) // First call (xml)
        .mockResolvedValueOnce({ data: "yaml: content" }); // Second call (yaml)

      const environments = ["prod", "dev"];
      const commitMessage = "feat: update record";
      const region = "test";

      const payload = await preparePublishPayload(
        mockRecord,
        environments,
        commitMessage,
        mockConfig,
        region,
      );

      // Verify filename generation logic
      // template: metadata/{filename} -> metadata/test-record-filename
      const expectedFilenameBase = "metadata/test-record-filename";

      expect(getRecordFilename).toHaveBeenCalledWith(mockRecord);

      // The conversion API is called with the region so the request can be
      // routed correctly
      expect(convertMetadata).toHaveBeenCalledWith({
        region,
        record: mockRecord,
        outputFormat: "iso19115-3_xml",
      });
      expect(convertMetadata).toHaveBeenCalledWith({
        region,
        record: mockRecord,
        outputFormat: "yaml",
      });

      expect(payload.commitMessage).toBe(commitMessage);
      expect(payload.files).toHaveLength(7); // (xml,yaml,json)*2 envs + 1 top-level records json

      // Check specific file entries
      expect(payload.files).toContainEqual({
        path: `forms/${region}/prod/${expectedFilenameBase}.xml`,
        content: "<xml>content</xml>",
      });
      expect(payload.files).toContainEqual({
        path: `forms/${region}/prod/${expectedFilenameBase}.yaml`,
        content: "yaml: content",
      });
      expect(payload.files).toContainEqual({
        path: `forms/${region}/dev/${expectedFilenameBase}.xml`,
        content: "<xml>content</xml>",
      });
      // JSON per env
      expect(payload.files).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: `forms/${region}/prod/${expectedFilenameBase}.json`,
          }),
          expect.objectContaining({
            path: `forms/${region}/dev/${expectedFilenameBase}.json`,
          }),
        ]),
      );
      // Top-level records JSON
      expect(payload.files).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: `records/${expectedFilenameBase}.json`,
          }),
        ]),
      );
    });

    it("should handle default commit message", async () => {
      getRecordFilename.mockReturnValue("test");
      convertMetadata.mockResolvedValue({ data: "content" });

      const payload = await preparePublishPayload(
        mockRecord,
        ["prod"],
        null, // No commit message
        mockConfig,
        "hakai",
      );

      expect(payload.commitMessage).toBe(
        "Publish metadata record: Test Record",
      );
    });

    it("should handle filename generation replacements", async () => {
      getRecordFilename.mockReturnValue("should-be-ignored");

      // Config with specific placeholders
      const customConfig = {
        fileTemplate: "records/{uuid}/{title}",
      };

      convertMetadata.mockResolvedValue({ data: "content" });

      const payload = await preparePublishPayload(
        mockRecord,
        ["prod"],
        "msg",
        customConfig,
        "hakai",
      );

      // Expected path: forms/hakai/prod/records/test-uuid/Test-Record.xml
      expect(payload.files[0].path).toBe(
        "forms/hakai/prod/records/test-uuid/Test-Record.xml",
      );
    });
  });
});
