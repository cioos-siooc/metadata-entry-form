import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import axios from "axios";
import { preparePublishPayload, convertRecord } from "../publishUtils";
import { getRecordFilename } from "../misc";

// Mock dependencies
vi.mock("axios");
vi.mock("../misc");
vi.mock("../../firebase", () => ({
  default: {
    options: { projectId: "test-project" },
  },
}));

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
    vi.stubEnv("VITE_FUNCTION_REGION", "us-central1");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("convertRecord", () => {
    it("should call the conversion endpoint and return data on success", async () => {
      const mockResponse = {
        data: {
          data: "<xml>content</xml>",
        },
      };
      axios.post.mockResolvedValue(mockResponse);

      const result = await convertRecord(mockRecord, "iso19115-3_xml");

      expect(axios.post).toHaveBeenCalledWith(
        "https://us-central1-test-project.cloudfunctions.net/convert_metadata",
        {
          data: {
            record_data: mockRecord,
            output_format: "iso19115-3_xml",
          },
        }
      );
      expect(result).toBe("<xml>content</xml>");
    });

    it("should use local emulator URL when running locally", async () => {
      // Mock window.location
      const originalLocation = window.location;
      delete window.location;
      window.location = { hostname: "localhost" };
      vi.stubEnv("VITE_FIREBASE_LOCAL_FUNCTIONS", "true");

      const mockResponse = { data: { data: "yaml content" } };
      axios.post.mockResolvedValue(mockResponse);

      await convertRecord(mockRecord, "yaml");

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining("http://localhost:5001"),
        expect.any(Object)
      );

      // Cleanup
      window.location = originalLocation;
    });

    it("should throw an error if the response is invalid", async () => {
      axios.post.mockResolvedValue({ data: {} });

      await expect(convertRecord(mockRecord, "yaml")).rejects.toThrow(
        "Invalid response from conversion service"
      );
    });

    it("should throw an error if the request fails", async () => {
      axios.post.mockRejectedValue(new Error("Network error"));

      await expect(convertRecord(mockRecord, "yaml")).rejects.toThrow(
        "Failed to convert record to yaml: Network error"
      );
    });
  });

  describe("preparePublishPayload", () => {
    it("should generate the correct payload with converted files", async () => {
      // Mock helper functions
      getRecordFilename.mockReturnValue("test-record-filename");

      // Mock convertRecord responses (since it calls axios)
      axios.post
        .mockResolvedValueOnce({ data: { data: "<xml>content</xml>" } }) // First call (xml)
        .mockResolvedValueOnce({ data: { data: "yaml: content" } });     // Second call (yaml)

      const environments = ["prod", "dev"];
      const commitMessage = "feat: update record";
      const region = "test";

      const payload = await preparePublishPayload(
        mockRecord,
        environments,
        commitMessage,
        mockConfig,
        region
      );

      // Verify filename generation logic
      // template: metadata/{filename} -> metadata/test-record-filename
      const expectedFilenameBase = "metadata/test-record-filename";

      expect(getRecordFilename).toHaveBeenCalledWith(mockRecord);

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
      expect(payload.files).toEqual(expect.arrayContaining([
        expect.objectContaining({ path: `forms/${region}/prod/${expectedFilenameBase}.json` }),
        expect.objectContaining({ path: `forms/${region}/dev/${expectedFilenameBase}.json` }),
      ]));
      // Top-level records JSON
      expect(payload.files).toEqual(expect.arrayContaining([
        expect.objectContaining({ path: `records/${expectedFilenameBase}.json` }),
      ]));
    });

    it("should handle default commit message", async () => {
      getRecordFilename.mockReturnValue("test");
      axios.post.mockResolvedValue({ data: { data: "content" } });

      const payload = await preparePublishPayload(
        mockRecord,
        ["prod"],
        null, // No commit message
        mockConfig,
        "hakai"
      );

      expect(payload.commitMessage).toBe("Publish metadata record: Test Record");
    });

    it("should handle filename generation replacements", async () => {
      getRecordFilename.mockReturnValue("should-be-ignored");

      // Config with specific placeholders
      const customConfig = {
        fileTemplate: "records/{uuid}/{title}"
      };

      axios.post.mockResolvedValue({ data: { data: "content" } });

      const payload = await preparePublishPayload(
        mockRecord,
        ["prod"],
        "msg",
        customConfig,
        "hakai"
      );

      // Expected path: forms/hakai/prod/records/test-uuid/Test-Record.xml
      expect(payload.files[0].path).toBe("forms/hakai/prod/records/test-uuid/Test-Record.xml");
    });
  });
});
