const admin = require("firebase-admin");

const baseUrl = "https://api.datacite.org/dois/";
const functions = require("firebase-functions/v1");
const axios = require("axios");

const API_DOMAINS = {
  production: "https://api.datacite.org/dois/",
  test: "https://api.test.datacite.org/dois/",
};

// Shared error handler for DataCite API errors.
// statusMessages is an optional object to override default messages for specific status codes.
function handleDataCiteError(err, defaultMessage, statusMessages = {}) {
  let errorMessage = defaultMessage;
  let statusCode = 500;
  let details = null;

  if (err.response) {
    statusCode = err.response.status;

    if (err.response.data) {
      if (err.response.data.errors && Array.isArray(err.response.data.errors)) {
        const errorList = err.response.data.errors
          .map((e) => `${e.title || 'Error'}${e.detail ? ': ' + e.detail : ''}`)
          .join('; ');
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
    const hasApiError = errorMessage.startsWith('DataCite API error:');
    if (statusCode === 401) {
      errorMessage = statusMessages[401] || 'Unauthorized: Please check your API credentials.';
    } else if (statusCode === 404) {
      errorMessage = statusMessages[404] || 'Not found: The resource could not be found.';
    } else if (statusCode === 422 && !hasApiError) {
      errorMessage = statusMessages[422] || 'Validation error: The metadata does not meet DataCite requirements.';
    } else if (statusCode === 400 && !hasApiError) {
      errorMessage = statusMessages[400] || 'Bad request: Invalid metadata provided.';
    }
  } else if (err.message) {
    errorMessage = err.message;
  }

  const errorCode = statusCode === 401 ? 'unauthenticated'
                  : statusCode === 404 ? 'not-found'
                  : statusCode === 422 ? 'invalid-argument'
                  : statusCode === 400 ? 'invalid-argument'
                  : 'unknown';

  throw new functions.https.HttpsError(errorCode, errorMessage, { details, statusCode });
}

// Reads the configured API base URL for a region from the database.
// Falls back to production if not set.
async function getBaseUrl(region) {
  try {
    const apiDomain = (await admin.database().ref('admin').child(region).child("dataciteCredentials").child("apiDomain").once("value")).val();
    const resolvedUrl = API_DOMAINS[apiDomain] || API_DOMAINS.production;
    functions.logger.info("[getBaseUrl] region:", region, "| apiDomain value from DB:", apiDomain, "| resolved URL:", resolvedUrl);
    return resolvedUrl;
  } catch (error) {
    functions.logger.error(`Error fetching DataCite API domain for region ${region}:`, error);
    return API_DOMAINS.production;
  }
}

// Use the existing firebase record (data) to create a draft doi on datacite. Datacite credentails 
// are pulled from the admin section of the firebase db
exports.createDraftDoi = functions.https.onCall(async (data) => {

  const { record, region } = data;

  functions.logger.info("[createDraftDoi] Called", { region, recordKeys: record ? Object.keys(record) : null, type: record?.data?.type, prefix: record?.data?.attributes?.prefix });

  let authHash

  try {
    authHash = (await admin.database().ref('admin').child(region).child("dataciteCredentials").child("dataciteHash").once("value")).val();
  } catch (error) {
      functions.logger.error(`Error fetching Datacite Auth Hash for region ${region}:`, error);
      return null;
  }

  functions.logger.info("[createDraftDoi] authHash", { present: !!authHash, length: authHash?.length });

  try{
    const baseUrl = await getBaseUrl(region);
    functions.logger.info("[createDraftDoi] POSTing to:", baseUrl, "body:", JSON.stringify(record));
    const response = await axios.post(baseUrl, record, {
    headers: {
      'Authorization': `Basic ${authHash}`,
      'Content-Type': 'application/vnd.api+json',
    },
  });

  functions.logger.info("[createDraftDoi] Success! Response status:", response.status);
  return response.data;

  } catch (err) {
    functions.logger.error("[createDraftDoi] DataCite API error", { status: err.response?.status, data: err.response?.data });
    handleDataCiteError(err, 'An error occurred while creating the draft DOI.');
  }
});

// Use the existing firebase record (dataObj) to update and existing draft doi on datacite. Datacite credentails 
// are pulled from the admin section of the firebase db
exports.updateDraftDoi = functions.https.onCall(async (dataObj) => {
  const { doi, region, data } = dataObj;
  let authHash
  try {
    authHash = (await admin.database().ref('admin').child(region).child("dataciteCredentials").child("dataciteHash").once("value")).val();
  } catch (error) {
    functions.logger.error(`Error fetching Datacite Auth Hash for region ${region}:`, error);
      return null;
  } 

  try {
    const baseUrl = await getBaseUrl(region);
    const url = `${baseUrl}${doi}/`;
    const response = await axios.put(url, data, {
      headers: {
        'Authorization': `Basic ${authHash}`,
        'Content-Type': 'application/vnd.api+json',
      },
    });

    return {
      status: response.status,
      message: 'Draft DOI updated successfully',
    };

  } catch (err) {
    handleDataCiteError(err, 'An error occurred while updating the draft DOI.', {
      404: 'Not found: The DOI could not be found. It may have been deleted.',
      422: 'Validation error: The updated metadata does not meet DataCite requirements.',
    });
  }
});

// Delete an existing draft doi on datacite tha matches doi saved in the firebase record (data). Datacite credentails 
// are pulled from the admin section of the firebase db
exports.deleteDraftDoi = functions.https.onCall(async (data) => {

  const { doi, region } = data;
  let authHash

  try {
    authHash = (await admin.database().ref('admin').child(region).child("dataciteCredentials").child("dataciteHash").once("value")).val();
  } catch (error) {
      functions.logger.error(`Error fetching Datacite Auth Hash for region ${region}:`, error);
      return null;
  } 

  try {
    const baseUrl = await getBaseUrl(region);
    const url = `${baseUrl}${doi}/`;
    const response = await axios.delete(url, {
    headers: { 'Authorization': `Basic ${authHash}` },
  });
  return response.status;
  } catch (err) {
    handleDataCiteError(err, 'An error occurred while deleting the draft DOI.', {
      404: 'Not found: The DOI could not be found. It may have already been deleted.',
      422: 'Validation error: Cannot delete this DOI.',
    });
  }
});

// Get status of doi, this could be Draft, Registered, Findable, or Unknown. The status od Findable and Registered 
// doi's can be determined by anyone while the status od draft doi's can only determined if they are part of the account
// accessible using the saved datacite credentials in the admin section of the database. If the status can not be determined a
// value of Unknown is returned
exports.getDoiStatus = functions.https.onCall(async (data) => {

  let prefix;
  let authHash

  functions.logger.log(data);

  try {
    prefix = (await admin.database().ref('admin').child(data.region).child("dataciteCredentials").child("prefix").once("value")).val();
  } catch (error) {
      functions.logger.error(`Error fetching Datacite Prefix for region ${data.region}:`, error);
      return null;
  }

  try {
    authHash = (await admin.database().ref('admin').child(data.region).child("dataciteCredentials").child("dataciteHash").once("value")).val();
  } catch (error) {
      functions.logger.error(`Error fetching Datacite Auth Hash for region ${data.region}:`, error);
      return null;
  } 

  try {
    const baseUrl = await getBaseUrl(data.region);
    const url = `${baseUrl}${data.doi}/`;
    // TODO: limit response to just the state field. elasticsearch query syntax?
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Basic ${authHash}`
      },
    });
    return response.data.data.attributes.state;
  } catch (err) {
    // if the error is a 401, throw a HttpsError with the code 'unauthenticated'
    if (err.response && err.response.status === 401) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Error from DataCite API: Unauthorized. Please check your API credentials.'
      );
    }
    // if the error is a 404, throw a HttpsError with the code 'not-found'
    if (err.response && err.response.status === 404) {
      if (data.doi.startsWith(`${prefix}/`)) {
        return 'not found'
      }
      return 'unknown'
    }
    // initialize a default error message
    let errMessage = 'An error occurred while fetching the DOI.';

    // if there is an error response from DataCite, include the status and statusText from the API error
    // if the error doesn't have a response, include the error message
    if (err.response) {
      errMessage = `from DataCite API: ${err.response.status} - ${err.response.statusText}`;
    } else if (err.message) {
      errMessage = err.message;
    }

    // throw a default HttpsError with the code 'unknown' and the error message
    throw new functions.https.HttpsError('unknown', errMessage);
  }

});

// Test stored DataCite credentials by attempting to create and immediately delete a draft DOI.
// This validates that the credentials and prefix are correct and have write access.
// Returns { success: true } if the credentials are valid, or throws an HttpsError on failure.
exports.testDataciteCredentials = functions.https.onCall(async (region) => {
  let authHash;
  let prefix;

  try {
    const credentialsRef = admin.database().ref('admin').child(region).child("dataciteCredentials");
    authHash = (await credentialsRef.child("dataciteHash").once("value")).val();
    prefix = (await credentialsRef.child("prefix").once("value")).val();
  } catch (error) {
    functions.logger.error(`[testDataciteCredentials] Error fetching credentials for region ${region}:`, error);
    throw new functions.https.HttpsError('internal', 'Failed to read stored credentials from database.');
  }

  if (!authHash || !prefix) {
    throw new functions.https.HttpsError('failed-precondition', 'No DataCite credentials are stored. Please save credentials first.');
  }

  const baseUrl = await getBaseUrl(region);
  let testDoi;

  // Step 1: Create a minimal draft DOI to verify credentials and prefix
  try {
    const createPayload = {
      data: {
        type: "dois",
        attributes: {
          prefix,
        },
      },
    };

    const createResponse = await axios.post(baseUrl, createPayload, {
      headers: {
        'Authorization': `Basic ${authHash}`,
        'Content-Type': 'application/vnd.api+json',
      },
    });

    testDoi = createResponse.data?.data?.id;
    functions.logger.info(`[testDataciteCredentials] Draft DOI created: ${testDoi}`);
  } catch (err) {
    functions.logger.error("[testDataciteCredentials] Create failed:", { status: err.response?.status, data: err.response?.data });
    if (err.response && err.response.status === 401) {
      throw new functions.https.HttpsError('unauthenticated', 'Unauthorized: The stored credentials are invalid. Please update them.');
    }
    if (err.response && err.response.status === 403) {
      throw new functions.https.HttpsError('permission-denied', 'Forbidden: The account does not have permission to create DOIs. Please check your credentials and prefix.');
    }
    const errMessage = err.response
      ? `DataCite API returned ${err.response.status}: ${err.response.statusText}`
      : err.message || 'Unknown error connecting to DataCite API.';
    throw new functions.https.HttpsError('unknown', errMessage);
  }

  // Step 2: Clean up by deleting the test draft DOI
  if (testDoi) {
    try {
      await axios.delete(`${baseUrl}${testDoi}`, {
        headers: { 'Authorization': `Basic ${authHash}` },
      });
      functions.logger.info(`[testDataciteCredentials] Test DOI ${testDoi} deleted.`);
    } catch (deleteErr) {
      functions.logger.warn(`[testDataciteCredentials] Failed to delete test DOI ${testDoi}:`, deleteErr.message);
      // Don't fail the test — credentials are valid, cleanup is best-effort
    }
  }

  return { success: true, message: 'Credentials verified successfully. A test DOI was created and removed.' };
});

// helper function to get the datacite credentials from the database so they are not sent to the client
exports.getCredentialsStored = functions.https.onCall(async (data) => {
  try {
    const credentialsRef = admin.database().ref('admin').child(data).child("dataciteCredentials");
    const authHashSnapshot = await credentialsRef.child("dataciteHash").once("value");
    const prefixSnapshot = await credentialsRef.child("prefix").once("value");

    const authHash = authHashSnapshot.val();
    const prefix = prefixSnapshot.val();

    // Check for non-null and non-empty
    return authHash && authHash !== "" && prefix && prefix !== "";
  } catch (error) {
    functions.logger.error("Error checking Datacite credentials:", error);
    return false;
  }
});

// helper function to get the datacite prefix from the database. this value is not special and can be sent to the client.
exports.getDatacitePrefix = functions.https.onCall(async (region) => {
  try {
    const prefix = (await admin.database().ref('admin').child(region).child("dataciteCredentials").child("prefix").once("value")).val();
    return prefix;
  } catch (error) {
    throw new Error(`Error fetching Datacite Prefix for region ${region}: ${error}`);
  }
});