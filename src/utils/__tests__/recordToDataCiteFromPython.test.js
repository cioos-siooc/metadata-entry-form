import { vi, describe, it, expect, beforeEach } from "vitest";
import { convertMetadata } from "../../api/actions";
import { ApiError } from "../../api/client";
import { recordToDataCiteFromPython } from "../recordToDataCiteFromPython";

// Mock dependencies
vi.mock("../../api/actions", () => ({
  convertMetadata: vi.fn(),
}));
vi.mock("../../regions", () => ({
  default: {
    pacific: {
      catalogueURL: {
        en: "https://catalogue.cioospacific.ca/",
        fr: "https://catalogue.cioospacific.ca/fr/",
      },
    },
    atlantic: {
      catalogueURL: {
        en: "https://cioosatlantic.ca/ckan/",
        fr: "https://cioosatlantic.ca/ckan/fr/",
      },
    },
    stlaurent: {
      catalogueURL: {
        en: "https://catalogue.ogsl.ca/en/",
        fr: "https://catalogue.ogsl.ca/",
      },
    },
  },
}));

describe("recordToDataCiteFromPython", () => {
  const mockRecord = {
    identifier: "test-123",
    title: { en: "Test Dataset", fr: "Ensemble de données de test" },
    creators: [{ name: "Test Author" }],
    publisher: "Test Publisher",
    publicationYear: 2024,
    subjects: [{ subject: "oceanography" }],
    descriptions: [
      { description: "A test dataset", descriptionType: "Abstract" },
    ],
  };

  // Factory function to create fresh mock responses for each test
  // This prevents test pollution where modifications to the object persist across tests
  const createMockDataCiteResponse = () => ({
    titles: [{ title: "Test Dataset", lang: "en" }],
    creators: [{ name: "Test Author" }],
    publisher: "Test Publisher",
    publicationYear: 2024,
    subjects: [{ subject: "oceanography" }],
    descriptions: [
      { description: "A test dataset", descriptionType: "Abstract" },
    ],
    types: { resourceTypeGeneral: "Dataset" },
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("CREATE operation (forUpdate: false)", () => {
    it("should convert record to DataCite API format with type and prefix", async () => {
      convertMetadata.mockResolvedValue({
        data: createMockDataCiteResponse(),
      });

      const result = await recordToDataCiteFromPython(
        mockRecord,
        "en",
        "pacific",
        "10.14284",
        { forUpdate: false },
      );

      // Verify API call
      expect(convertMetadata).toHaveBeenCalledWith({
        region: "pacific",
        record: mockRecord,
        outputFormat: "datacite_json",
      });

      // Verify structure includes type and prefix
      expect(result).toHaveProperty("data.type", "dois");
      expect(result).toHaveProperty("data.attributes.prefix", "10.14284");

      // Verify URL is added
      expect(result).toHaveProperty(
        "data.attributes.url",
        "https://catalogue.cioospacific.ca/dataset/ca-cioos_test-123",
      );

      // Verify all original fields are present
      expect(result.data.attributes).toHaveProperty("titles");
      expect(result.data.attributes).toHaveProperty("creators");
      expect(result.data.attributes).toHaveProperty("publisher");
    });

    it("should use correct catalogue URL for different regions and languages", async () => {
      const testCases = [
        {
          region: "pacific",
          language: "en",
          expectedUrl: "https://catalogue.cioospacific.ca/",
        },
        {
          region: "pacific",
          language: "fr",
          expectedUrl: "https://catalogue.cioospacific.ca/fr/",
        },
        {
          region: "atlantic",
          language: "en",
          expectedUrl: "https://cioosatlantic.ca/ckan/",
        },
        {
          region: "atlantic",
          language: "fr",
          expectedUrl: "https://cioosatlantic.ca/ckan/fr/",
        },
        {
          region: "stlaurent",
          language: "en",
          expectedUrl: "https://catalogue.ogsl.ca/en/",
        },
        {
          region: "stlaurent",
          language: "fr",
          expectedUrl: "https://catalogue.ogsl.ca/",
        },
      ];

      for (const testCase of testCases) {
        convertMetadata.mockResolvedValue({
          data: createMockDataCiteResponse(),
        });

        const result = await recordToDataCiteFromPython(
          mockRecord,
          testCase.language,
          testCase.region,
          "10.14284",
          { forUpdate: false },
        );

        const expectedUrl = `${testCase.expectedUrl}dataset/ca-cioos_test-123`;
        expect(result.data.attributes.url).toBe(expectedUrl);
      }
    });
  });

  describe("UPDATE operation (forUpdate: true)", () => {
    it("should omit type and prefix fields for updates", async () => {
      convertMetadata.mockResolvedValue({
        data: createMockDataCiteResponse(),
      });

      const result = await recordToDataCiteFromPython(
        mockRecord,
        "en",
        "pacific",
        "10.14284",
        { forUpdate: true },
      );

      // Verify type and prefix are NOT included
      expect(result.data).not.toHaveProperty("type");
      expect(result.data.attributes).not.toHaveProperty("prefix");

      // Verify URL is still added
      expect(result).toHaveProperty(
        "data.attributes.url",
        "https://catalogue.cioospacific.ca/dataset/ca-cioos_test-123",
      );

      // Verify attributes still has the DataCite fields
      expect(result.data.attributes).toHaveProperty("titles");
    });
  });

  describe("Error handling", () => {
    it("should throw error if response structure is invalid", async () => {
      convertMetadata.mockResolvedValue(null);

      await expect(
        recordToDataCiteFromPython(mockRecord, "en", "pacific", "10.14284"),
      ).rejects.toThrow("Invalid response structure");
    });

    it("should throw error if response.data is missing", async () => {
      convertMetadata.mockResolvedValue({
        // missing 'data' field
      });

      await expect(
        recordToDataCiteFromPython(mockRecord, "en", "pacific", "10.14284"),
      ).rejects.toThrow("Invalid response structure");
    });

    it("should throw error if DataCite response is not an object", async () => {
      convertMetadata.mockResolvedValue({
        data: JSON.stringify("invalid string"), // Valid JSON but represents a string, not an object
      });

      await expect(
        recordToDataCiteFromPython(mockRecord, "en", "pacific", "10.14284"),
      ).rejects.toThrow("not a valid object");
    });

    it("should throw error if DataCite response is an array", async () => {
      convertMetadata.mockResolvedValue({
        data: [], // Arrays are not valid DataCite objects
      });

      await expect(
        recordToDataCiteFromPython(mockRecord, "en", "pacific", "10.14284"),
      ).rejects.toThrow("not a valid object");
    });

    it("should throw error for invalid region/language combination", async () => {
      convertMetadata.mockResolvedValue({
        data: createMockDataCiteResponse(),
      });

      await expect(
        recordToDataCiteFromPython(
          mockRecord,
          "en",
          "invalid-region",
          "10.14284",
        ),
      ).rejects.toThrow("Invalid region/language combination");
    });

    it("should throw error with HTTP status from failed conversion", async () => {
      convertMetadata.mockRejectedValue(
        new ApiError(400, "Invalid record data", {
          error: "Invalid record data",
        }),
      );

      await expect(
        recordToDataCiteFromPython(mockRecord, "en", "pacific", "10.14284"),
      ).rejects.toThrow("DataCite conversion failed (400)");
    });

    it("should throw error for network failures", async () => {
      convertMetadata.mockRejectedValue(new Error("Network timeout"));

      await expect(
        recordToDataCiteFromPython(mockRecord, "en", "pacific", "10.14284"),
      ).rejects.toThrow("Failed to convert record to DataCite format");
    });
  });

  describe("Default options", () => {
    it("should default to forUpdate: false when options not provided", async () => {
      convertMetadata.mockResolvedValue({
        data: createMockDataCiteResponse(),
      });

      const result = await recordToDataCiteFromPython(
        mockRecord,
        "en",
        "pacific",
        "10.14284",
        // No options parameter
      );

      // Should behave like CREATE with type and prefix
      expect(result.data).toHaveProperty("type", "dois");
      expect(result.data.attributes).toHaveProperty("prefix", "10.14284");
    });
  });

  describe("JSON string response handling", () => {
    it("should parse DataCite response if it's a JSON string", async () => {
      const dataciteObj = createMockDataCiteResponse();
      convertMetadata.mockResolvedValue({
        data: JSON.stringify(dataciteObj), // Return as JSON string instead of object
      });

      const result = await recordToDataCiteFromPython(
        mockRecord,
        "en",
        "pacific",
        "10.14284",
        { forUpdate: false },
      );

      // Verify structure is correctly formatted despite receiving a string
      expect(result).toHaveProperty("data.type", "dois");
      expect(result).toHaveProperty("data.attributes.prefix", "10.14284");
      expect(result).toHaveProperty("data.attributes.url");
      expect(result.data.attributes).toHaveProperty("titles");
    });

    it("should throw error for invalid JSON string", async () => {
      convertMetadata.mockResolvedValue({
        data: "not valid json{", // Invalid JSON
      });

      await expect(
        recordToDataCiteFromPython(mockRecord, "en", "pacific", "10.14284"),
      ).rejects.toThrow("Failed to parse DataCite response as JSON");
    });
  });
});
