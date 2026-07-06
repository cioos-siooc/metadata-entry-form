// Port of firebase-functions/functions/datacite.js.
// Credentials come from the region_credentials table (kind='datacite') instead
// of the Firebase RTDB admin subtree. Errors carry {statusCode, message,
// details} instead of firebase HttpsError codes; routes translate them to
// reply.code(statusCode).send({error: message}).

const axios = require("axios");
const { query } = require("../db");
const { decryptSecret } = require("../lib/crypto");

const DEFAULT_API_DOMAIN = "api.datacite.org";

function serviceError(statusCode, message, details = null) {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.details = details;
  return err;
}

// Reads the region's DataCite credentials.
// Returns {prefix, apiDomain, authHash} or null when nothing is stored.
async function getDataciteCredentials(region) {
  const result = await query(
    "SELECT config, secret_enc FROM region_credentials WHERE region = $1 AND kind = 'datacite'",
    [region],
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    prefix: row.config?.prefix ?? null,
    apiDomain: row.config?.apiDomain ?? DEFAULT_API_DOMAIN,
    authHash: row.secret_enc ? decryptSecret(row.secret_enc) : null,
  };
}

// DataCite DOIs REST endpoint for a region's configured API domain
// (e.g. api.datacite.org or api.test.datacite.org). Falls back to production.
function baseUrlFor(apiDomain) {
  return `https://${apiDomain || DEFAULT_API_DOMAIN}/dois/`;
}

async function requireCredentials(region) {
  const credentials = await getDataciteCredentials(region);
  if (!credentials || !credentials.authHash || !credentials.prefix) {
    throw serviceError(
      400,
      "No DataCite credentials are stored. Please save credentials first.",
    );
  }
  return credentials;
}

// Shared error handler for DataCite API errors (same message extraction as
// the original firebase function). statusMessages optionally overrides the
// default message for specific status codes.
function handleDataCiteError(err, defaultMessage, statusMessages = {}) {
  let errorMessage = defaultMessage;
  let statusCode = 500;
  let details = null;

  if (err.response) {
    statusCode = err.response.status;

    if (err.response.data) {
      if (err.response.data.errors && Array.isArray(err.response.data.errors)) {
        const errorList = err.response.data.errors
          .map((e) => `${e.title || "Error"}${e.detail ? ": " + e.detail : ""}`)
          .join("; ");
        errorMessage = `DataCite API error: ${errorList}`;
        details = err.response.data.errors;
      } else if (err.response.data.error) {
        errorMessage = `DataCite API error: ${err.response.data.error}`;
        details = err.response.data;
      } else if (err.response.data.message) {
        errorMessage = `DataCite API error: ${err.response.data.message}`;
        details = err.response.data;
      }
    }

    // Apply status-specific overrides (only if no detailed API error was extracted)
    const hasApiError = errorMessage.startsWith("DataCite API error:");
    if (statusCode === 401) {
      errorMessage = statusMessages[401] || "Unauthorized: Please check your API credentials.";
    } else if (statusCode === 404) {
      errorMessage = statusMessages[404] || "Not found: The resource could not be found.";
    } else if (statusCode === 422 && !hasApiError) {
      errorMessage =
        statusMessages[422] ||
        "Validation error: The metadata does not meet DataCite requirements.";
    } else if (statusCode === 400 && !hasApiError) {
      errorMessage = statusMessages[400] || "Bad request: Invalid metadata provided.";
    }
  } else if (err.message) {
    errorMessage = err.message;
  }

  // Statuses other than the ones the original mapped explicitly surface as 500
  // (the original threw HttpsError('unknown') for those).
  const mappedStatus = [400, 401, 404, 422].includes(statusCode) ? statusCode : 500;
  throw serviceError(mappedStatus, errorMessage, { details, statusCode });
}

// Create a draft DOI on DataCite from the record payload.
async function createDraftDoi(region, record) {
  const { authHash, apiDomain } = await requireCredentials(region);
  try {
    const response = await axios.post(baseUrlFor(apiDomain), record, {
      headers: {
        Authorization: `Basic ${authHash}`,
        "Content-Type": "application/vnd.api+json",
      },
    });
    return response.data;
  } catch (err) {
    return handleDataCiteError(err, "An error occurred while creating the draft DOI.");
  }
}

// Update an existing draft DOI on DataCite.
async function updateDraftDoi(region, doi, data) {
  const { authHash, apiDomain } = await requireCredentials(region);
  try {
    const url = `${baseUrlFor(apiDomain)}${doi}/`;
    const response = await axios.put(url, data, {
      headers: {
        Authorization: `Basic ${authHash}`,
        "Content-Type": "application/vnd.api+json",
      },
    });
    return { status: response.status, message: "Draft DOI updated successfully" };
  } catch (err) {
    return handleDataCiteError(err, "An error occurred while updating the draft DOI.", {
      404: "Not found: The DOI could not be found. It may have been deleted.",
      422: "Validation error: The updated metadata does not meet DataCite requirements.",
    });
  }
}

// Delete an existing draft DOI on DataCite. Resolves to the HTTP status code.
async function deleteDraftDoi(region, doi) {
  const { authHash, apiDomain } = await requireCredentials(region);
  try {
    const url = `${baseUrlFor(apiDomain)}${doi}/`;
    const response = await axios.delete(url, {
      headers: { Authorization: `Basic ${authHash}` },
    });
    return response.status;
  } catch (err) {
    return handleDataCiteError(err, "An error occurred while deleting the draft DOI.", {
      404: "Not found: The DOI could not be found. It may have already been deleted.",
      422: "Validation error: Cannot delete this DOI.",
    });
  }
}

// Get the state of a DOI: 'draft' | 'registered' | 'findable' | 'not found' |
// 'unknown'. Draft DOI state is only visible with the region's credentials;
// a 404 on the region's own prefix means 'not found', otherwise 'unknown'.
async function getDoiStatus(region, doi) {
  const { authHash, apiDomain, prefix } = await requireCredentials(region);
  try {
    const url = `${baseUrlFor(apiDomain)}${doi}/`;
    const response = await axios.get(url, {
      headers: { Authorization: `Basic ${authHash}` },
    });
    return response.data.data.attributes.state;
  } catch (err) {
    if (err.response && err.response.status === 401) {
      throw serviceError(
        401,
        "Error from DataCite API: Unauthorized. Please check your API credentials.",
      );
    }
    if (err.response && err.response.status === 404) {
      if (doi.startsWith(`${prefix}/`)) return "not found";
      return "unknown";
    }

    let errMessage = "An error occurred while fetching the DOI.";
    if (err.response) {
      errMessage = `from DataCite API: ${err.response.status} - ${err.response.statusText}`;
    } else if (err.message) {
      errMessage = err.message;
    }
    throw serviceError(500, errMessage);
  }
}

// Test DataCite credentials by creating and immediately deleting a draft DOI.
// Pass {prefix, authHash, apiDomain} to test unsaved values; omitted fields
// fall back to the stored region credentials (the original always used the
// stored ones). Returns {success, message} or throws {statusCode, message}.
async function testDataciteCredentials(region, { prefix, authHash, apiDomain } = {}) {
  if (!prefix || !authHash) {
    const stored = await getDataciteCredentials(region);
    prefix = prefix || stored?.prefix;
    authHash = authHash || stored?.authHash;
    apiDomain = apiDomain || stored?.apiDomain;
  }
  if (!apiDomain) {
    apiDomain = (await getDataciteCredentials(region))?.apiDomain;
  }

  if (!authHash || !prefix) {
    throw serviceError(
      400,
      "No DataCite credentials are stored. Please save credentials first.",
    );
  }

  const baseUrl = baseUrlFor(apiDomain);
  let testDoi;

  // Step 1: Create a minimal draft DOI to verify credentials and prefix
  try {
    const createPayload = { data: { type: "dois", attributes: { prefix } } };
    const createResponse = await axios.post(baseUrl, createPayload, {
      headers: {
        Authorization: `Basic ${authHash}`,
        "Content-Type": "application/vnd.api+json",
      },
    });
    testDoi = createResponse.data?.data?.id;
  } catch (err) {
    if (err.response && err.response.status === 401) {
      throw serviceError(
        401,
        "Unauthorized: The stored credentials are invalid. Please update them.",
      );
    }
    if (err.response && err.response.status === 403) {
      throw serviceError(
        403,
        "Forbidden: The account does not have permission to create DOIs. Please check your credentials and prefix.",
      );
    }
    const errMessage = err.response
      ? `DataCite API returned ${err.response.status}: ${err.response.statusText}`
      : err.message || "Unknown error connecting to DataCite API.";
    throw serviceError(500, errMessage);
  }

  // Step 2: Clean up by deleting the test draft DOI (best-effort)
  if (testDoi) {
    try {
      await axios.delete(`${baseUrl}${testDoi}`, {
        headers: { Authorization: `Basic ${authHash}` },
      });
    } catch {
      // Don't fail the test — credentials are valid, cleanup is best-effort
    }
  }

  return {
    success: true,
    message: "Credentials verified successfully. A test DOI was created and removed.",
  };
}

module.exports = {
  getDataciteCredentials,
  createDraftDoi,
  updateDraftDoi,
  deleteDraftDoi,
  getDoiStatus,
  testDataciteCredentials,
};
