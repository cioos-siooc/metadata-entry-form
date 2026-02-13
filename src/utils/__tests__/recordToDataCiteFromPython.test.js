import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import axios from "axios";
import { recordToDataCiteFromPython } from "../recordToDataCiteFromPython";

// Mock dependencies
vi.mock("axios");
vi.mock("../../firebase", () => ({
  default: {
    options: { projectId: "test-project" },
  },
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
        en: "https://cioosatlantic.ca/",
        fr: "https://cioosatlantic.ca/fr/",
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
    descriptions: [{ description: "A test dataset", descriptionType: "Abstract" }],
  };

  // Factory function to create fresh mock responses for each test
  // This prevents test pollution where modifications to the object persist across tests
  const createMockDataCiteResponse = () => ({
    titles: [{ title: "Test Dataset", lang: "en" }],
    creators: [{ name: "Test Author" }],
    publisher: "Test Publisher",
    publicationYear: 2024,
    subjects: [{ subject: "oceanography" }],
    descriptions: [{ description: "A test dataset", descriptionType: "Abstract" }],
    types: { resourceTypeGeneral: "Dataset" },
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("VITE_FUNCTION_REGION", "us-central1");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("CREATE operation (forUpdate: false)", () => {
    it("should convert record to DataCite API format with type and prefix", async () => {
      const mockResponse = {
        data: {
          data: createMockDataCiteResponse(),
        },
      };
      axios.post.mockResolvedValue(mockResponse);

      const result = await recordToDataCiteFromPython(
        mockRecord,
        "en",
        "pacific",
        "10.14284",
        { forUpdate: false }
      );

      // Verify API call
      expect(axios.post).toHaveBeenCalledWith(
        "https://us-central1-test-project.cloudfunctions.net/convert_metadata",
        {
          data: {
            record_data: mockRecord,
            output_format: "datacite_json",
          },
        }
      );

      // Verify structure includes type and prefix
      expect(result).toHaveProperty("data.type", "dois");
      expect(result).toHaveProperty("data.attributes.prefix", "10.14284");

      // Verify URL is added
      expect(result).toHaveProperty(
        "data.attributes.url",
        "https://catalogue.cioospacific.ca/dataset/ca-cioos_test-123"
      );

      // Verify all original fields are present
      expect(result.data.attributes).toHaveProperty("titles");
      expect(result.data.attributes).toHaveProperty("creators");
      expect(result.data.attributes).toHaveProperty("publisher");
    });

    it("should use correct catalogue URL for different regions and languages", async () => {
      const mockResponse = {
        data: {
          data: createMockDataCiteResponse(),
        },
      };
      axios.post.mockResolvedValue(mockResponse);

      const testCases = [
        { region: "pacific", language: "en", expectedUrl: "https://catalogue.cioospacific.ca/" },
        { region: "pacific", language: "fr", expectedUrl: "https://catalogue.cioospacific.ca/fr/" },
        { region: "atlantic", language: "en", expectedUrl: "https://cioosatlantic.ca/" },
        { region: "atlantic", language: "fr", expectedUrl: "https://cioosatlantic.ca/fr/" },
        { region: "stlaurent", language: "en", expectedUrl: "https://catalogue.ogsl.ca/en/" },
        { region: "stlaurent", language: "fr", expectedUrl: "https://catalogue.ogsl.ca/" },
      ];

      for (const testCase of testCases) {
        axios.post.mockResolvedValue({
          data: { data: createMockDataCiteResponse() },
        });

        const result = await recordToDataCiteFromPython(
          mockRecord,
          testCase.language,
          testCase.region,
          "10.14284",
          { forUpdate: false }
        );

        const expectedUrl = `${testCase.expectedUrl}dataset/ca-cioos_test-123`;
        expect(result.data.attributes.url).toBe(expectedUrl);
      }
    });
  });

  describe("UPDATE operation (forUpdate: true)", () => {
    it("should omit type and prefix fields for updates", async () => {
      const mockResponse = {
        data: {
          data: createMockDataCiteResponse(),
        },
      };
      axios.post.mockResolvedValue(mockResponse);

      const result = await recordToDataCiteFromPython(
        mockRecord,
        "en",
        "pacific",
        "10.14284",
        { forUpdate: true }
      );

      // Verify type and prefix are NOT included
      expect(result.data).not.toHaveProperty("type");
      expect(result.data.attributes).not.toHaveProperty("prefix");

      // Verify URL is still added
      expect(result).toHaveProperty(
        "data.attributes.url",
        "https://catalogue.cioospacific.ca/dataset/ca-cioos_test-123"
      );

      // Verify attributes still has the DataCite fields
      expect(result.data.attributes).toHaveProperty("titles");
    });
  });

  describe("Error handling", () => {
    it("should throw error if response structure is invalid", async () => {
      axios.post.mockResolvedValue({
        data: null,
      });

      await expect(
        recordToDataCiteFromPython(mockRecord, "en", "pacific", "10.14284")
      ).rejects.toThrow("Invalid response structure");
    });

    it("should throw error if response.data.data is missing", async () => {
      axios.post.mockResolvedValue({
        data: {
          // missing 'data' field
        },
      });

      await expect(
        recordToDataCiteFromPython(mockRecord, "en", "pacific", "10.14284")
      ).rejects.toThrow("Invalid response structure");
    });

    it("should throw error if DataCite response is not an object", async () => {
      axios.post.mockResolvedValue({
        data: {
          data: "invalid string", // Should be an object
        },
      });

      await expect(
        recordToDataCiteFromPython(mockRecord, "en", "pacific", "10.14284")
      ).rejects.toThrow("not a valid object");
    });

    it("should throw error if DataCite response is an array", async () => {
      axios.post.mockResolvedValue({
        data: {
          data: [], // Arrays are not valid DataCite objects
        },
      });

      await expect(
        recordToDataCiteFromPython(mockRecord, "en", "pacific", "10.14284")
      ).rejects.toThrow("not a valid object");
    });

    it("should throw error for invalid region/language combination", async () => {
      const mockResponse = {
        data: {
          data: createMockDataCiteResponse(),
        },
      };
      axios.post.mockResolvedValue(mockResponse);

      await expect(
        recordToDataCiteFromPython(mockRecord, "en", "invalid-region", "10.14284")
      ).rejects.toThrow("Invalid region/language combination");
    });

    it("should throw error with HTTP status from failed conversion", async () => {
      axios.post.mockRejectedValue({
        response: {
          status: 400,
          data: { error: "Invalid record data" },
        },
      });

      await expect(
        recordToDataCiteFromPython(mockRecord, "en", "pacific", "10.14284")
      ).rejects.toThrow("DataCite conversion failed (400)");
    });

    it("should throw error for network failures", async () => {
      axios.post.mockRejectedValue(new Error("Network timeout"));

      await expect(
        recordToDataCiteFromPython(mockRecord, "en", "pacific", "10.14284")
      ).rejects.toThrow("Failed to convert record to DataCite format");
    });
  });

  describe("Local development (emulator)", () => {
    it("should use local emulator URL when running locally", async () => {
      // Mock window.location
      const originalLocation = window.location;
      delete window.location;
      window.location = { hostname: "localhost" };
      vi.stubEnv("VITE_FIREBASE_LOCAL_FUNCTIONS", "true");

      const mockResponse = {
        data: {
          data: createMockDataCiteResponse(),
        },
      };
      axios.post.mockResolvedValue(mockResponse);

      await recordToDataCiteFromPython(mockRecord, "en", "pacific", "10.14284");

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining("http://localhost:5001"),
        expect.any(Object)
      );

      // Cleanup
      window.location = originalLocation;
      vi.unstubAllEnvs();
    });
  });

  describe("Default options", () => {
    it("should default to forUpdate: false when options not provided", async () => {
      const mockResponse = {
        data: {
          data: createMockDataCiteResponse(),
        },
      };
      axios.post.mockResolvedValue(mockResponse);

      const result = await recordToDataCiteFromPython(
        mockRecord,
        "en",
        "pacific",
        "10.14284"
        // No options parameter
      );

      // Should behave like CREATE with type and prefix
      expect(result.data).toHaveProperty("type", "dois");
      expect(result.data.attributes).toHaveProperty("prefix", "10.14284");
    });
  });
});
