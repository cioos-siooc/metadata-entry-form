import axios from "axios";
import { preparePublishPayload, convertRecord } from "../publishUtils";
import { getRecordFilename } from "../misc";
import firebase from "../../firebase";

// Mock dependencies
jest.mock("axios");
jest.mock("../misc");
jest.mock("../../firebase", () => ({
  options: { projectId: "test-project" },
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
    jest.clearAllMocks();
    process.env.REACT_APP_FUNCTION_REGION = "us-central1";
    // Reset window location mock if needed (jest-dom handles this usually, but safe to assume defaults)
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
      process.env.REACT_APP_FIREBASE_LOCAL_FUNCTIONS = "true";

      const mockResponse = { data: { data: "yaml content" } };
      axios.post.mockResolvedValue(mockResponse);

      await convertRecord(mockRecord, "yaml");

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining("http://localhost:5001"),
        expect.any(Object)
      );

      // Cleanup
      window.location = originalLocation;
      delete process.env.REACT_APP_FIREBASE_LOCAL_FUNCTIONS;
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

      const payload = await preparePublishPayload(
        mockRecord,
        environments,
        commitMessage,
        mockConfig
      );

      // Verify filename generation logic
      // template: metadata/{filename} -> metadata/test-record-filename
      const expectedFilenameBase = "metadata/test-record-filename";

      expect(getRecordFilename).toHaveBeenCalledWith(mockRecord);

      expect(payload.commitMessage).toBe(commitMessage);
      expect(payload.files).toHaveLength(4); // 2 formats * 2 environments

      // Check specific file entries
      expect(payload.files).toContainEqual({
        path: `forms/prod/${expectedFilenameBase}.xml`,
        content: "<xml>content</xml>",
      });
      expect(payload.files).toContainEqual({
        path: `forms/prod/${expectedFilenameBase}.yaml`,
        content: "yaml: content",
      });
      expect(payload.files).toContainEqual({
        path: `forms/dev/${expectedFilenameBase}.xml`,
        content: "<xml>content</xml>",
      });
    });

    it("should handle default commit message", async () => {
        getRecordFilename.mockReturnValue("test");
        axios.post.mockResolvedValue({ data: { data: "content" } });
  
        const payload = await preparePublishPayload(
          mockRecord,
          ["prod"],
          null, // No commit message
          mockConfig
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
            customConfig
        );

        // Expected path: forms/prod/records/test-uuid/Test-Record.xml
        expect(payload.files[0].path).toBe("forms/prod/records/test-uuid/Test-Record.xml");
    });
  });
});
