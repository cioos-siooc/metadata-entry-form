// Port of firebase-functions/functions/datacite.test.js.
// Region credentials are real rows in region_credentials (encrypted at rest);
// the DataCite HTTP API is mocked via axios.

const { randomUUID } = require("crypto");
const { buildTestApp, signToken, authHeader } = require("./helpers");

jest.mock("axios");
const axios = require("axios");

const { query, pool } = require("../src/db");
const { encryptSecret } = require("../src/lib/crypto");
const datacite = require("../src/services/datacite");

// Region reserved for this file (records/admin tests use 'test'/'canwin').
const REGION = "amundsen";
const PREFIX = "10.1234";
const AUTH_HASH = "dGVzdDpwYXNz";

async function saveDataciteCredentials(config = { prefix: PREFIX, apiDomain: "api.test.datacite.org" }) {
  await query(
    `INSERT INTO region_credentials (region, kind, config, secret_enc)
     VALUES ($1, 'datacite', $2, $3)
     ON CONFLICT (region, kind) DO UPDATE SET config = $2, secret_enc = $3`,
    [REGION, JSON.stringify(config), encryptSecret(AUTH_HASH)],
  );
}

describe("datacite", () => {
  let app;
  let admin;
  let member;

  beforeAll(async () => {
    app = await buildTestApp();
    await query("DELETE FROM region_credentials WHERE region = $1 AND kind = 'datacite'", [
      REGION,
    ]);
    await saveDataciteCredentials();

    admin = { email: `admin-${randomUUID()}@datacite.test` };
    admin.token = await signToken({ email: admin.email });
    await query("INSERT INTO region_permissions (region, email, role) VALUES ($1, $2, 'admin')", [
      REGION,
      admin.email,
    ]);

    member = { email: `member-${randomUUID()}@datacite.test` };
    member.token = await signToken({ email: member.email });
  });

  afterAll(async () => {
    await query("DELETE FROM region_credentials WHERE region = $1 AND kind = 'datacite'", [
      REGION,
    ]);
    await query("DELETE FROM region_permissions WHERE region = $1 AND email LIKE '%@datacite.test'", [
      REGION,
    ]);
    await query("DELETE FROM users WHERE email LIKE '%@datacite.test'");
    await app.close();
    await pool.end();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getDataciteCredentials", () => {
    it("returns the decrypted auth hash with prefix and apiDomain", async () => {
      const credentials = await datacite.getDataciteCredentials(REGION);
      expect(credentials).toEqual({
        prefix: PREFIX,
        apiDomain: "api.test.datacite.org",
        authHash: AUTH_HASH,
      });
    });

    it("returns null for a region without stored credentials", async () => {
      expect(await datacite.getDataciteCredentials("no-such-region")).toBeNull();
    });
  });

  describe("GET /doi/config", () => {
    it("returns prefix and credential presence to region members", async () => {
      const res = await app.inject({
        method: "GET",
        url: `/api/v1/regions/${REGION}/doi/config`,
        headers: authHeader(member.token),
      });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({ prefix: PREFIX, hasCredentials: true });
      expect(res.body).not.toContain(AUTH_HASH);
    });

    it("requires authentication", async () => {
      const res = await app.inject({
        method: "GET",
        url: `/api/v1/regions/${REGION}/doi/config`,
      });
      expect(res.statusCode).toBe(401);
    });
  });

  describe("createDraftDoi (POST /doi)", () => {
    const record = { data: { type: "dois", attributes: { prefix: PREFIX } } };

    it("creates a draft DOI successfully", async () => {
      const mockResponse = {
        status: 201,
        data: { data: { attributes: { doi: `${PREFIX}/test-doi`, state: "draft" } } },
      };
      axios.post.mockResolvedValue(mockResponse);

      const res = await app.inject({
        method: "POST",
        url: `/api/v1/regions/${REGION}/doi`,
        headers: authHeader(member.token),
        payload: { record },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual(mockResponse.data);
      expect(axios.post).toHaveBeenCalledWith(
        "https://api.test.datacite.org/dois/",
        record,
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Basic ${AUTH_HASH}`,
            "Content-Type": "application/vnd.api+json",
          }),
        }),
      );
    });

    it("returns 401 on DataCite unauthorized", async () => {
      axios.post.mockRejectedValue({
        response: { status: 401, data: { error: "Unauthorized" } },
      });

      const res = await app.inject({
        method: "POST",
        url: `/api/v1/regions/${REGION}/doi`,
        headers: authHeader(member.token),
        payload: { record },
      });

      expect(res.statusCode).toBe(401);
      expect(res.json().error).toContain("check your API credentials");
    });

    it("returns 422 with DataCite error details on validation error", async () => {
      axios.post.mockRejectedValue({
        response: {
          status: 422,
          data: {
            errors: [
              { title: "Missing field", detail: "creators is required" },
              { title: "Invalid value", detail: "publicationYear must be a number" },
            ],
          },
        },
      });

      const res = await app.inject({
        method: "POST",
        url: `/api/v1/regions/${REGION}/doi`,
        headers: authHeader(member.token),
        payload: { record },
      });

      expect(res.statusCode).toBe(422);
      expect(res.json().error).toContain("creators is required");
      expect(res.json().error).toContain("publicationYear must be a number");
    });

    it("returns 400 with the API error message on bad request", async () => {
      axios.post.mockRejectedValue({
        response: { status: 400, data: { error: "Invalid JSON payload" } },
      });

      const res = await app.inject({
        method: "POST",
        url: `/api/v1/regions/${REGION}/doi`,
        headers: authHeader(member.token),
        payload: { record },
      });

      expect(res.statusCode).toBe(400);
      expect(res.json().error).toContain("Invalid JSON payload");
    });

    it("returns 500 with the message field for server errors", async () => {
      axios.post.mockRejectedValue({
        response: { status: 500, data: { message: "Internal server error occurred" } },
      });

      const res = await app.inject({
        method: "POST",
        url: `/api/v1/regions/${REGION}/doi`,
        headers: authHeader(member.token),
        payload: { record },
      });

      expect(res.statusCode).toBe(500);
      expect(res.json().error).toContain("Internal server error occurred");
    });

    it("returns 500 with error.message for non-response errors", async () => {
      axios.post.mockRejectedValue(new Error("ECONNREFUSED"));

      const res = await app.inject({
        method: "POST",
        url: `/api/v1/regions/${REGION}/doi`,
        headers: authHeader(member.token),
        payload: { record },
      });

      expect(res.statusCode).toBe(500);
      expect(res.json().error).toBe("ECONNREFUSED");
    });

    it("falls back to the production URL when apiDomain is not set", async () => {
      await saveDataciteCredentials({ prefix: PREFIX });
      axios.post.mockResolvedValue({
        status: 201,
        data: { data: { attributes: { doi: `${PREFIX}/test` } } },
      });

      await datacite.createDraftDoi(REGION, record);

      expect(axios.post).toHaveBeenCalledWith(
        "https://api.datacite.org/dois/",
        expect.any(Object),
        expect.any(Object),
      );
      await saveDataciteCredentials(); // restore
    });
  });

  describe("updateDraftDoi (PUT /doi)", () => {
    it("updates a draft DOI successfully", async () => {
      axios.put.mockResolvedValue({ status: 200, data: {} });

      const res = await app.inject({
        method: "PUT",
        url: `/api/v1/regions/${REGION}/doi`,
        headers: authHeader(member.token),
        payload: {
          doi: `${PREFIX}/test-doi`,
          data: { data: { attributes: { titles: [{ title: "Updated" }] } } },
        },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({ status: 200, message: "Draft DOI updated successfully" });
      expect(axios.put).toHaveBeenCalledWith(
        `https://api.test.datacite.org/dois/${PREFIX}/test-doi/`,
        expect.any(Object),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Basic ${AUTH_HASH}`,
            "Content-Type": "application/vnd.api+json",
          }),
        }),
      );
    });

    it("returns 404 with a custom message when the DOI is gone", async () => {
      axios.put.mockRejectedValue({ response: { status: 404, data: {} } });

      const res = await app.inject({
        method: "PUT",
        url: `/api/v1/regions/${REGION}/doi`,
        headers: authHeader(member.token),
        payload: { doi: `${PREFIX}/nonexistent`, data: {} },
      });

      expect(res.statusCode).toBe(404);
      expect(res.json().error).toContain("may have been deleted");
    });

    it("returns 422 with a custom message on validation error", async () => {
      axios.put.mockRejectedValue({ response: { status: 422, data: {} } });

      const res = await app.inject({
        method: "PUT",
        url: `/api/v1/regions/${REGION}/doi`,
        headers: authHeader(member.token),
        payload: { doi: `${PREFIX}/test`, data: {} },
      });

      expect(res.statusCode).toBe(422);
      expect(res.json().error).toContain("does not meet DataCite requirements");
    });
  });

  describe("deleteDraftDoi (DELETE /doi)", () => {
    it("deletes a draft DOI successfully", async () => {
      axios.delete.mockResolvedValue({ status: 204 });

      const res = await app.inject({
        method: "DELETE",
        url: `/api/v1/regions/${REGION}/doi`,
        headers: authHeader(member.token),
        payload: { doi: `${PREFIX}/test-doi` },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({ status: 204 });
      expect(axios.delete).toHaveBeenCalledWith(
        `https://api.test.datacite.org/dois/${PREFIX}/test-doi/`,
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: `Basic ${AUTH_HASH}` }),
        }),
      );
    });

    it("returns 404 with a custom message when already deleted", async () => {
      axios.delete.mockRejectedValue({ response: { status: 404, data: {} } });

      const res = await app.inject({
        method: "DELETE",
        url: `/api/v1/regions/${REGION}/doi`,
        headers: authHeader(member.token),
        payload: { doi: `${PREFIX}/already-deleted` },
      });

      expect(res.statusCode).toBe(404);
      expect(res.json().error).toContain("may have already been deleted");
    });

    it("returns 422 when the DOI cannot be deleted", async () => {
      axios.delete.mockRejectedValue({ response: { status: 422, data: {} } });

      const res = await app.inject({
        method: "DELETE",
        url: `/api/v1/regions/${REGION}/doi`,
        headers: authHeader(member.token),
        payload: { doi: `${PREFIX}/published` },
      });

      expect(res.statusCode).toBe(422);
      expect(res.json().error).toContain("Cannot delete");
    });
  });

  describe("getDoiStatus (GET /doi/status)", () => {
    function statusUrl(doi) {
      return `/api/v1/regions/${REGION}/doi/status?doi=${encodeURIComponent(doi)}`;
    }

    it("returns the DOI state for a found DOI", async () => {
      axios.get.mockResolvedValue({
        data: { data: { attributes: { state: "findable" } } },
      });

      const res = await app.inject({
        method: "GET",
        url: statusUrl(`${PREFIX}/test-doi`),
        headers: authHeader(member.token),
      });

      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({ status: "findable" });
    });

    it("returns 'not found' for 404 when the DOI matches the region prefix", async () => {
      axios.get.mockRejectedValue({ response: { status: 404 } });

      const res = await app.inject({
        method: "GET",
        url: statusUrl(`${PREFIX}/missing`),
        headers: authHeader(member.token),
      });

      expect(res.json()).toEqual({ status: "not found" });
    });

    it("returns 'unknown' for 404 when the DOI does not match the prefix", async () => {
      axios.get.mockRejectedValue({ response: { status: 404 } });

      const res = await app.inject({
        method: "GET",
        url: statusUrl("10.9999/other-doi"),
        headers: authHeader(member.token),
      });

      expect(res.json()).toEqual({ status: "unknown" });
    });

    it("returns 401 on DataCite unauthorized", async () => {
      axios.get.mockRejectedValue({ response: { status: 401 } });

      const res = await app.inject({
        method: "GET",
        url: statusUrl(`${PREFIX}/test`),
        headers: authHeader(member.token),
      });

      expect(res.statusCode).toBe(401);
      expect(res.json().error).toContain("Unauthorized");
    });

    it("returns 500 with API info on other errors", async () => {
      axios.get.mockRejectedValue({
        response: { status: 500, statusText: "Internal Server Error" },
      });

      const res = await app.inject({
        method: "GET",
        url: statusUrl(`${PREFIX}/test`),
        headers: authHeader(member.token),
      });

      expect(res.statusCode).toBe(500);
      expect(res.json().error).toContain("500");
    });

    it("returns 500 with the error message on network failure", async () => {
      axios.get.mockRejectedValue(new Error("Network timeout"));

      const res = await app.inject({
        method: "GET",
        url: statusUrl(`${PREFIX}/test`),
        headers: authHeader(member.token),
      });

      expect(res.statusCode).toBe(500);
      expect(res.json().error).toBe("Network timeout");
    });
  });

  describe("testDataciteCredentials (POST /doi/test-credentials)", () => {
    const url = `/api/v1/regions/${REGION}/doi/test-credentials`;

    it("is admin-only", async () => {
      const res = await app.inject({
        method: "POST",
        url,
        headers: authHeader(member.token),
        payload: {},
      });
      expect(res.statusCode).toBe(403);
    });

    it("creates and deletes a test DOI with the stored credentials", async () => {
      axios.post.mockResolvedValue({ data: { data: { id: `${PREFIX}/test-cred` } } });
      axios.delete.mockResolvedValue({ status: 204 });

      const res = await app.inject({
        method: "POST",
        url,
        headers: authHeader(admin.token),
        payload: {},
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().success).toBe(true);
      expect(axios.post).toHaveBeenCalledWith(
        "https://api.test.datacite.org/dois/",
        { data: { type: "dois", attributes: { prefix: PREFIX } } },
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: `Basic ${AUTH_HASH}` }),
        }),
      );
      expect(axios.delete).toHaveBeenCalledWith(
        `https://api.test.datacite.org/dois/${PREFIX}/test-cred`,
        expect.any(Object),
      );
    });

    it("tests credentials supplied in the body", async () => {
      axios.post.mockResolvedValue({ data: { data: { id: "10.5555/xyz" } } });
      axios.delete.mockResolvedValue({ status: 204 });

      const res = await app.inject({
        method: "POST",
        url,
        headers: authHeader(admin.token),
        payload: { prefix: "10.5555", authHash: "bmV3OmNyZWRz" },
      });

      expect(res.statusCode).toBe(200);
      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        { data: { type: "dois", attributes: { prefix: "10.5555" } } },
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: "Basic bmV3OmNyZWRz" }),
        }),
      );
    });

    it("returns 401 when the credentials are rejected", async () => {
      axios.post.mockRejectedValue({ response: { status: 401, statusText: "Unauthorized" } });

      const res = await app.inject({
        method: "POST",
        url,
        headers: authHeader(admin.token),
        payload: {},
      });

      expect(res.statusCode).toBe(401);
      expect(res.json().error).toContain("invalid");
    });

    it("returns 403 when the account lacks permission", async () => {
      axios.post.mockRejectedValue({ response: { status: 403, statusText: "Forbidden" } });

      const res = await app.inject({
        method: "POST",
        url,
        headers: authHeader(admin.token),
        payload: {},
      });

      expect(res.statusCode).toBe(403);
      expect(res.json().error).toContain("does not have permission");
    });

    it("still succeeds when test DOI cleanup fails", async () => {
      axios.post.mockResolvedValue({ data: { data: { id: `${PREFIX}/leftover` } } });
      axios.delete.mockRejectedValue(new Error("delete failed"));

      const res = await app.inject({
        method: "POST",
        url,
        headers: authHeader(admin.token),
        payload: {},
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().success).toBe(true);
    });
  });

  describe("without stored credentials", () => {
    beforeAll(async () => {
      await query("DELETE FROM region_credentials WHERE region = $1 AND kind = 'datacite'", [
        REGION,
      ]);
    });

    afterAll(async () => {
      await saveDataciteCredentials();
    });

    it("GET /doi/config reports missing credentials", async () => {
      const res = await app.inject({
        method: "GET",
        url: `/api/v1/regions/${REGION}/doi/config`,
        headers: authHeader(member.token),
      });
      expect(res.json()).toEqual({ prefix: "", hasCredentials: false });
    });

    it("POST /doi returns 400 without stored credentials", async () => {
      const res = await app.inject({
        method: "POST",
        url: `/api/v1/regions/${REGION}/doi`,
        headers: authHeader(member.token),
        payload: { record: {} },
      });
      expect(res.statusCode).toBe(400);
      expect(res.json().error).toContain("No DataCite credentials");
      expect(axios.post).not.toHaveBeenCalled();
    });

    it("POST /doi/test-credentials returns 400 without credentials", async () => {
      const res = await app.inject({
        method: "POST",
        url: `/api/v1/regions/${REGION}/doi/test-credentials`,
        headers: authHeader(admin.token),
        payload: {},
      });
      expect(res.statusCode).toBe(400);
      expect(res.json().error).toContain("No DataCite credentials");
    });
  });
});
