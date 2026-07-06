const admin = require("firebase-admin");
const axios = require("axios");

// Mock firebase-admin
jest.mock("firebase-admin", () => {
  const mockOnce = jest.fn();
  const mockChild = jest.fn(() => ({ child: mockChild, once: mockOnce }));
  const mockRef = jest.fn(() => ({ child: mockChild }));
  return {
    database: jest.fn(() => ({ ref: mockRef })),
    initializeApp: jest.fn(),
    // Expose helpers for test manipulation
    _mockRef: mockRef,
    _mockChild: mockChild,
    _mockOnce: mockOnce,
  };
});

// Mock firebase-functions
jest.mock("firebase-functions", () => ({
  https: {
    onCall: (fn) => fn,
    HttpsError: class HttpsError extends Error {
      constructor(code, message, details) {
        super(message);
        this.code = code;
        this.details = details;
      }
    },
  },
  logger: {
    info: jest.fn(),
    log: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock axios
jest.mock("axios");

// Import after mocks are set up
const {
  createDraftDoi,
  updateDraftDoi,
  deleteDraftDoi,
  getDoiStatus,
  getCredentialsStored,
  getDatacitePrefix,
} = require("./datacite");

// Helper to set up the firebase admin mock chain for credential reads
function mockFirebaseDbReads(values) {
  // values is a map of field names to values, e.g. { dataciteHash: 'abc', prefix: '10.1234', apiDomain: 'test' }
  const mockChild = admin._mockChild;
  const mockOnce = admin._mockOnce;

  // Reset so we can set up fresh expectations
  mockChild.mockClear();
  mockOnce.mockClear();

  // The chain is: ref('admin').child(region).child('dataciteCredentials').child(fieldName).once('value')
  // We need mockChild to return objects with child/once methods, and once to return { val: () => value }
  const createChainableChild = () => {
    const obj = {
      child: jest.fn(),
      once: jest.fn(),
    };
    // child returns another chainable or terminal with once()
    obj.child.mockImplementation((fieldName) => {
      if (Object.prototype.hasOwnProperty.call(values, fieldName)) {
        return {
          once: jest.fn().mockResolvedValue({ val: () => values[fieldName] }),
          child: obj.child,
        };
      }
      return createChainableChild();
    });
    return obj;
  };

  const chainable = createChainableChild();
  admin.database().ref.mockReturnValue(chainable);
}

describe("datacite.js - Firebase Cloud Functions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createDraftDoi", () => {
    it("should create a draft DOI successfully", async () => {
      mockFirebaseDbReads({
        dataciteHash: "dGVzdDpwYXNz",
        apiDomain: "test",
      });

      const mockResponse = {
        status: 201,
        data: {
          data: {
            attributes: {
              doi: "10.1234/test-doi",
              state: "draft",
            },
          },
        },
      };
      axios.post.mockResolvedValue(mockResponse);

      const result = await createDraftDoi({
        record: { data: { type: "dois", attributes: { prefix: "10.1234" } } },
        region: "pacific",
      });

      expect(result).toEqual(mockResponse.data);
      expect(axios.post).toHaveBeenCalledWith(
        "https://api.test.datacite.org/dois/",
        expect.any(Object),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Basic dGVzdDpwYXNz",
            "Content-Type": "application/vnd.api+json",
          }),
        }),
      );
    });

    it("should return null if auth hash fetch fails", async () => {
      // Make the credential read throw
      admin.database().ref.mockReturnValue({
        child: jest.fn().mockReturnValue({
          child: jest.fn().mockReturnValue({
            child: jest.fn().mockReturnValue({
              once: jest.fn().mockRejectedValue(new Error("DB error")),
            }),
          }),
        }),
      });

      const result = await createDraftDoi({
        record: {},
        region: "pacific",
      });

      expect(result).toBeNull();
      expect(axios.post).not.toHaveBeenCalled();
    });

    it("should throw HttpsError on 401 unauthorized", async () => {
      mockFirebaseDbReads({
        dataciteHash: "bad-hash",
        apiDomain: "test",
      });

      axios.post.mockRejectedValue({
        response: {
          status: 401,
          data: { error: "Unauthorized" },
        },
      });

      await expect(
        createDraftDoi({
          record: { data: { type: "dois", attributes: {} } },
          region: "pacific",
        }),
      ).rejects.toMatchObject({
        code: "unauthenticated",
      });
    });

    it("should throw HttpsError on 422 validation error", async () => {
      mockFirebaseDbReads({
        dataciteHash: "dGVzdDpwYXNz",
        apiDomain: "test",
      });

      axios.post.mockRejectedValue({
        response: {
          status: 422,
          data: {
            errors: [
              { title: "Validation Error", detail: "Title is required" },
            ],
          },
        },
      });

      await expect(
        createDraftDoi({
          record: { data: { type: "dois", attributes: {} } },
          region: "pacific",
        }),
      ).rejects.toMatchObject({
        code: "invalid-argument",
      });
    });

    it("should throw HttpsError on 400 bad request", async () => {
      mockFirebaseDbReads({
        dataciteHash: "dGVzdDpwYXNz",
        apiDomain: "test",
      });

      axios.post.mockRejectedValue({
        response: {
          status: 400,
          data: { error: "Bad request" },
        },
      });

      await expect(
        createDraftDoi({
          record: {},
          region: "pacific",
        }),
      ).rejects.toMatchObject({
        code: "invalid-argument",
      });
    });

    it("should fall back to production URL if apiDomain not set", async () => {
      mockFirebaseDbReads({
        dataciteHash: "dGVzdDpwYXNz",
        apiDomain: null,
      });

      axios.post.mockResolvedValue({
        status: 201,
        data: { data: { attributes: { doi: "10.1234/test" } } },
      });

      await createDraftDoi({
        record: { data: { type: "dois", attributes: {} } },
        region: "pacific",
      });

      expect(axios.post).toHaveBeenCalledWith(
        "https://api.datacite.org/dois/",
        expect.any(Object),
        expect.any(Object),
      );
    });
  });

  describe("updateDraftDoi", () => {
    it("should update a draft DOI successfully", async () => {
      mockFirebaseDbReads({
        dataciteHash: "dGVzdDpwYXNz",
        apiDomain: "test",
      });

      axios.put.mockResolvedValue({
        status: 200,
        data: {},
      });

      const result = await updateDraftDoi({
        doi: "10.1234/test-doi",
        region: "pacific",
        data: { data: { attributes: { titles: [{ title: "Updated" }] } } },
      });

      expect(result).toEqual({
        status: 200,
        message: "Draft DOI updated successfully",
      });
      expect(axios.put).toHaveBeenCalledWith(
        "https://api.test.datacite.org/dois/10.1234/test-doi/",
        expect.any(Object),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Basic dGVzdDpwYXNz",
            "Content-Type": "application/vnd.api+json",
          }),
        }),
      );
    });

    it("should return null if auth hash fetch fails", async () => {
      admin.database().ref.mockReturnValue({
        child: jest.fn().mockReturnValue({
          child: jest.fn().mockReturnValue({
            child: jest.fn().mockReturnValue({
              once: jest.fn().mockRejectedValue(new Error("DB error")),
            }),
          }),
        }),
      });

      const result = await updateDraftDoi({
        doi: "10.1234/test-doi",
        region: "pacific",
        data: {},
      });

      expect(result).toBeNull();
    });

    it("should throw HttpsError with custom message on 404", async () => {
      mockFirebaseDbReads({
        dataciteHash: "dGVzdDpwYXNz",
        apiDomain: "test",
      });

      axios.put.mockRejectedValue({
        response: {
          status: 404,
          data: {},
        },
      });

      await expect(
        updateDraftDoi({
          doi: "10.1234/nonexistent",
          region: "pacific",
          data: {},
        }),
      ).rejects.toMatchObject({
        code: "not-found",
        message: expect.stringContaining("may have been deleted"),
      });
    });

    it("should throw HttpsError with custom message on 422", async () => {
      mockFirebaseDbReads({
        dataciteHash: "dGVzdDpwYXNz",
        apiDomain: "test",
      });

      axios.put.mockRejectedValue({
        response: {
          status: 422,
          data: {},
        },
      });

      await expect(
        updateDraftDoi({
          doi: "10.1234/test",
          region: "pacific",
          data: {},
        }),
      ).rejects.toMatchObject({
        code: "invalid-argument",
        message: expect.stringContaining("does not meet DataCite requirements"),
      });
    });
  });

  describe("deleteDraftDoi", () => {
    it("should delete a draft DOI successfully", async () => {
      mockFirebaseDbReads({
        dataciteHash: "dGVzdDpwYXNz",
        apiDomain: "test",
      });

      axios.delete.mockResolvedValue({
        status: 204,
      });

      const result = await deleteDraftDoi({
        doi: "10.1234/test-doi",
        region: "pacific",
      });

      expect(result).toBe(204);
      expect(axios.delete).toHaveBeenCalledWith(
        "https://api.test.datacite.org/dois/10.1234/test-doi/",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Basic dGVzdDpwYXNz",
          }),
        }),
      );
    });

    it("should return null if auth hash fetch fails", async () => {
      admin.database().ref.mockReturnValue({
        child: jest.fn().mockReturnValue({
          child: jest.fn().mockReturnValue({
            child: jest.fn().mockReturnValue({
              once: jest.fn().mockRejectedValue(new Error("DB error")),
            }),
          }),
        }),
      });

      const result = await deleteDraftDoi({
        doi: "10.1234/test-doi",
        region: "pacific",
      });

      expect(result).toBeNull();
    });

    it("should throw HttpsError with custom message on 404", async () => {
      mockFirebaseDbReads({
        dataciteHash: "dGVzdDpwYXNz",
        apiDomain: "test",
      });

      axios.delete.mockRejectedValue({
        response: {
          status: 404,
          data: {},
        },
      });

      await expect(
        deleteDraftDoi({
          doi: "10.1234/already-deleted",
          region: "pacific",
        }),
      ).rejects.toMatchObject({
        code: "not-found",
        message: expect.stringContaining("may have already been deleted"),
      });
    });

    it("should throw HttpsError on 422 cannot delete", async () => {
      mockFirebaseDbReads({
        dataciteHash: "dGVzdDpwYXNz",
        apiDomain: "test",
      });

      axios.delete.mockRejectedValue({
        response: {
          status: 422,
          data: {},
        },
      });

      await expect(
        deleteDraftDoi({
          doi: "10.1234/published",
          region: "pacific",
        }),
      ).rejects.toMatchObject({
        code: "invalid-argument",
        message: expect.stringContaining("Cannot delete"),
      });
    });
  });

  describe("getDoiStatus", () => {
    it("should return DOI state for a found DOI", async () => {
      mockFirebaseDbReads({
        prefix: "10.1234",
        dataciteHash: "dGVzdDpwYXNz",
        apiDomain: "test",
      });

      axios.get.mockResolvedValue({
        data: {
          data: {
            attributes: {
              state: "findable",
            },
          },
        },
      });

      const result = await getDoiStatus({
        doi: "10.1234/test-doi",
        region: "pacific",
      });

      expect(result).toBe("findable");
    });

    it("should return 'not found' for 404 when DOI matches prefix", async () => {
      mockFirebaseDbReads({
        prefix: "10.1234",
        dataciteHash: "dGVzdDpwYXNz",
        apiDomain: "test",
      });

      axios.get.mockRejectedValue({
        response: {
          status: 404,
        },
      });

      const result = await getDoiStatus({
        doi: "10.1234/missing",
        region: "pacific",
      });

      expect(result).toBe("not found");
    });

    it("should return 'unknown' for 404 when DOI does not match prefix", async () => {
      mockFirebaseDbReads({
        prefix: "10.1234",
        dataciteHash: "dGVzdDpwYXNz",
        apiDomain: "test",
      });

      axios.get.mockRejectedValue({
        response: {
          status: 404,
        },
      });

      const result = await getDoiStatus({
        doi: "10.9999/other-doi",
        region: "pacific",
      });

      expect(result).toBe("unknown");
    });

    it("should throw HttpsError on 401 unauthorized", async () => {
      mockFirebaseDbReads({
        prefix: "10.1234",
        dataciteHash: "bad-hash",
        apiDomain: "test",
      });

      axios.get.mockRejectedValue({
        response: {
          status: 401,
        },
      });

      await expect(
        getDoiStatus({
          doi: "10.1234/test",
          region: "pacific",
        }),
      ).rejects.toMatchObject({
        code: "unauthenticated",
      });
    });

    it("should throw HttpsError with API info on other errors", async () => {
      mockFirebaseDbReads({
        prefix: "10.1234",
        dataciteHash: "dGVzdDpwYXNz",
        apiDomain: "test",
      });

      axios.get.mockRejectedValue({
        response: {
          status: 500,
          statusText: "Internal Server Error",
        },
      });

      await expect(
        getDoiStatus({
          doi: "10.1234/test",
          region: "pacific",
        }),
      ).rejects.toMatchObject({
        code: "unknown",
        message: expect.stringContaining("500"),
      });
    });

    it("should throw HttpsError with error message on network failure", async () => {
      mockFirebaseDbReads({
        prefix: "10.1234",
        dataciteHash: "dGVzdDpwYXNz",
        apiDomain: "test",
      });

      axios.get.mockRejectedValue(new Error("Network timeout"));

      await expect(
        getDoiStatus({
          doi: "10.1234/test",
          region: "pacific",
        }),
      ).rejects.toMatchObject({
        code: "unknown",
        message: "Network timeout",
      });
    });

    it("should return null if prefix fetch fails", async () => {
      // Make the first credential read (prefix) throw
      admin.database().ref.mockReturnValue({
        child: jest.fn().mockReturnValue({
          child: jest.fn().mockReturnValue({
            child: jest.fn().mockReturnValue({
              once: jest.fn().mockRejectedValue(new Error("DB error")),
            }),
          }),
        }),
      });

      const result = await getDoiStatus({
        doi: "10.1234/test",
        region: "pacific",
      });

      expect(result).toBeNull();
    });
  });

  describe("getCredentialsStored", () => {
    it("should return true when both hash and prefix exist", async () => {
      const mockCredentialsRef = {
        child: jest.fn().mockImplementation((field) => ({
          once: jest.fn().mockResolvedValue({
            val: () => (field === "dataciteHash" ? "abc123" : "10.1234"),
          }),
        })),
      };

      admin.database().ref.mockReturnValue({
        child: jest.fn().mockReturnValue({
          child: jest.fn().mockReturnValue(mockCredentialsRef),
        }),
      });

      const result = await getCredentialsStored("pacific");
      expect(result).toBe(true);
    });

    it("should return false when hash is empty", async () => {
      const mockCredentialsRef = {
        child: jest.fn().mockImplementation((field) => ({
          once: jest.fn().mockResolvedValue({
            val: () => (field === "dataciteHash" ? "" : "10.1234"),
          }),
        })),
      };

      admin.database().ref.mockReturnValue({
        child: jest.fn().mockReturnValue({
          child: jest.fn().mockReturnValue(mockCredentialsRef),
        }),
      });

      const result = await getCredentialsStored("pacific");
      expect(result).toBeFalsy();
    });

    it("should return false when prefix is null", async () => {
      const mockCredentialsRef = {
        child: jest.fn().mockImplementation((field) => ({
          once: jest.fn().mockResolvedValue({
            val: () => (field === "dataciteHash" ? "abc123" : null),
          }),
        })),
      };

      admin.database().ref.mockReturnValue({
        child: jest.fn().mockReturnValue({
          child: jest.fn().mockReturnValue(mockCredentialsRef),
        }),
      });

      const result = await getCredentialsStored("pacific");
      expect(result).toBeFalsy();
    });

    it("should return false on database error", async () => {
      admin.database().ref.mockReturnValue({
        child: jest.fn().mockReturnValue({
          child: jest.fn().mockReturnValue({
            child: jest.fn().mockReturnValue({
              once: jest.fn().mockRejectedValue(new Error("DB error")),
            }),
          }),
        }),
      });

      const result = await getCredentialsStored("pacific");
      expect(result).toBe(false);
    });
  });

  describe("getDatacitePrefix", () => {
    it("should return the prefix for a region", async () => {
      mockFirebaseDbReads({ prefix: "10.1234" });

      const result = await getDatacitePrefix("pacific");
      expect(result).toBe("10.1234");
    });

    it("should throw on database error", async () => {
      admin.database().ref.mockReturnValue({
        child: jest.fn().mockReturnValue({
          child: jest.fn().mockReturnValue({
            child: jest.fn().mockReturnValue({
              once: jest.fn().mockRejectedValue(new Error("DB error")),
            }),
          }),
        }),
      });

      await expect(getDatacitePrefix("pacific")).rejects.toThrow(
        "Error fetching Datacite Prefix",
      );
    });
  });

  describe("handleDataCiteError (tested via functions)", () => {
    it("should extract error list from DataCite API errors array", async () => {
      mockFirebaseDbReads({
        dataciteHash: "dGVzdDpwYXNz",
        apiDomain: "test",
      });

      axios.post.mockRejectedValue({
        response: {
          status: 422,
          data: {
            errors: [
              { title: "Missing field", detail: "creators is required" },
              {
                title: "Invalid value",
                detail: "publicationYear must be a number",
              },
            ],
          },
        },
      });

      await expect(
        createDraftDoi({ record: {}, region: "pacific" }),
      ).rejects.toMatchObject({
        code: "invalid-argument",
        message: expect.stringContaining("creators is required"),
      });
    });

    it("should extract single error message from DataCite API", async () => {
      mockFirebaseDbReads({
        dataciteHash: "dGVzdDpwYXNz",
        apiDomain: "test",
      });

      axios.post.mockRejectedValue({
        response: {
          status: 400,
          data: {
            error: "Invalid JSON payload",
          },
        },
      });

      await expect(
        createDraftDoi({ record: {}, region: "pacific" }),
      ).rejects.toMatchObject({
        code: "invalid-argument",
        message: expect.stringContaining("Invalid JSON payload"),
      });
    });

    it("should extract message field from DataCite API", async () => {
      mockFirebaseDbReads({
        dataciteHash: "dGVzdDpwYXNz",
        apiDomain: "test",
      });

      axios.post.mockRejectedValue({
        response: {
          status: 500,
          data: {
            message: "Internal server error occurred",
          },
        },
      });

      await expect(
        createDraftDoi({ record: {}, region: "pacific" }),
      ).rejects.toMatchObject({
        code: "unknown",
        message: expect.stringContaining("Internal server error occurred"),
      });
    });

    it("should use error.message for non-response errors", async () => {
      mockFirebaseDbReads({
        dataciteHash: "dGVzdDpwYXNz",
        apiDomain: "test",
      });

      axios.post.mockRejectedValue(new Error("ECONNREFUSED"));

      await expect(
        createDraftDoi({ record: {}, region: "pacific" }),
      ).rejects.toMatchObject({
        code: "unknown",
        message: "ECONNREFUSED",
      });
    });
  });
});
