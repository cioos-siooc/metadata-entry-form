const admin = require("firebase-admin");

const baseUrl = "https://api.datacite.org/dois/";
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const axios = require("axios");
const {error} = require("firebase-functions/logger");
const {setGlobalOptions} = require('firebase-functions/v2')
require("firebase-functions/logger/compat");



// locate all functions closest to users
setGlobalOptions({ region: "us-central1" })

// region is used as a database path segment, so it must not contain path separators
const regionPattern = /^[A-Za-z0-9_-]+$/;

// Callables are deployed with a public invoker and onCall only rejects a token that is
// present but invalid, never one that is missing. Without an explicit check every function
// in this file is reachable anonymously.
function requireAuth(request) {
  if (!request.auth || !request.auth.uid) {
    throw new HttpsError("unauthenticated", "Authentication required.");
  }
}

function requireRegion(request) {
  requireAuth(request);
  const { region } = request.data;
  if (!region) {
    throw new Error("Region not provided");
  }
  if (!regionPattern.test(region)) {
    throw new HttpsError("invalid-argument", "Invalid region.");
  }
  return region;
}

// For the calls that actually exercise the region's stored DataCite credentials, also
// require that the caller belongs to the region they named - otherwise any signed-in user
// can drive any region's credentials. Membership is evidenced by the userinfo node the app
// writes on login.
async function requireRegionMember(request) {
  const region = requireRegion(request);

  const userinfo = await admin
    .database()
    .ref(region)
    .child("users")
    .child(request.auth.uid)
    .child("userinfo")
    .once("value");

  if (!userinfo.exists()) {
    throw new HttpsError("permission-denied", "Not a member of this region.");
  }

  return region;
}

// Use the existing firebase record (data) to create a draft doi on datacite. Datacite credentails 
// are pulled from the admin section of the firebase db
exports.createDraftDoi = onCall(async (request) => {
  const region = await requireRegionMember(request);
  if (!request.data.record) {
    throw new Error("DOI Record not provided");
  }
  const { record } = request.data;

  let authHash

  try {
    authHash = (await admin.database().ref('admin').child(region).child("dataciteCredentials").child("dataciteHash").once("value")).val();
  } catch (error) {
      console.error(`Error fetching Datacite Auth Hash for region ${region}:`, error);
      return null;
  }

  try{
    const url = `${baseUrl}`;
    const response = await axios.post(url, record, {
    headers: {
      'Authorization': `Basic ${authHash}`,
      'Content-Type': 'application/json',
    },
  });

  return response.data;

  } catch (err) {
    // if the error is a 401, throw a HttpsError with the code 'unauthenticated'
    if (err.response && err.response.status === 401) {
      throw new HttpsError(
        'unauthenticated',
        'Error from DataCite API: Unauthorized. Please check your API credentials.'
      );
    }
    // if the error is a 404, throw a HttpsError with the code 'not-found'
    if (err.response && err.response.status === 404) {
      throw new HttpsError(
        'not-found',
        'from DataCite API: Not-found. The resource is not found e.g. it fetching a DOI/Repository/Member details.'
      );
    }
    // initialize a default error message
    let errMessage = 'An error occurred while creating the draft DOI.';

    // if there is an error response from DataCite, include the status and statusText from the API error
    // if the error doesn't have a response, include the error message
    if (err.response) {
      errMessage = `from DataCite API: ${err.response.status} - ${err.response.statusText}: ${JSON.stringify(err.response.data)}`;
    } else if (err.message) {
      errMessage = err.message;
    }

    // throw a default HttpsError with the code 'unknown' and the error message
    throw new HttpsError('unknown',errMessage);
  }
});

// Use the existing firebase record (dataObj) to update and existing draft doi on datacite. Datacite credentails 
// are pulled from the admin section of the firebase db
exports.updateDraftDoi = onCall(async (request) => {
  const region = await requireRegionMember(request);
  if (!request.data.doi) {
    throw new Error("DOI not provided");
  }
  if (!request.data.data) {
    throw new Error("Updated DOI data not provided");
  }
  const { doi, data } = request.data;

  let authHash
  try {
    authHash = (await admin.database().ref('admin').child(region).child("dataciteCredentials").child("dataciteHash").once("value")).val();
  } catch (error) {
    console.error(`Error fetching Datacite Auth Hash for region ${region}:`, error);
      return null;
  } 

  try {
    const url = `${baseUrl}${doi}/`;
    const response = await axios.put(url, data, {
      headers: {
        'Authorization': `Basic ${authHash}`,
        'Content-Type': "application/json",
      },
    });

    return {
      status: response.status,
      message: 'Draft DOI updated successfully',
    };

  } catch (err) {
    // if the error is a 401, throw a HttpsError with the code 'unauthenticated'
    if (err.response && err.response.status === 401) {
      throw new HttpsError(
        'unauthenticated',
        'Error from DataCite API: Unauthorized. Please check your API credentials.'
      );
    }
    // if the error is a 404, throw a HttpsError with the code 'not-found'
    if (err.response && err.response.status === 404) {
      throw new HttpsError(
        'not-found',
        'from DataCite API: Not-found. The resource is not found e.g. it fetching a DOI/Repository/Member details.'
      );
    }
    // initialize a default error message
    let errMessage = 'An error occurred while updating the draft DOI.';

    // if there is an error response from DataCite, include the status and statusText from the API error
    // if the error doesn't have a response, include the error message
    if (err.response) {
      errMessage = `from DataCite API: ${err.response.status} - ${err.response.statusText}: ${JSON.stringify(err.response.data)}`;
    } else if (err.message) {
      errMessage = err.message;
    }

    // throw a default HttpsError with the code 'unknown' and the error message
    throw new HttpsError('unknown',errMessage);
  }
});

// Delete an existing draft doi on datacite tha matches doi saved in the firebase record (data). Datacite credentails 
// are pulled from the admin section of the firebase db
exports.deleteDraftDoi = onCall(async (request) => {
  const region = await requireRegionMember(request);
  if (!request.data.doi) {
    throw new Error("DOI not provided");
  }
  const { doi } = request.data;
  let authHash

  try {
    authHash = (await admin.database().ref('admin').child(region).child("dataciteCredentials").child("dataciteHash").once("value")).val();
  } catch (error) {
      console.error(`Error fetching Datacite Auth Hash for region ${region}:`, error);
      return null;
  } 

  try {
    const url = `${baseUrl}${doi}/`;
    const response = await axios.delete(url, {
    headers: { 'Authorization': `Basic ${authHash}` },
  });
  return response.status;
  } catch (err) {
    // if the error is a 401, throw a HttpsError with the code 'unauthenticated'
    if (err.response && err.response.status === 401) {
      throw new HttpsError(
        'unauthenticated',
        'Error from DataCite API: Unauthorized. Please check your API credentials.'
      );
    }
    // if the error is a 404, throw a HttpsError with the code 'not-found'
    if (err.response && err.response.status === 404) {
      throw new HttpsError(
        'not-found',
        'from DataCite API: Not-found. The resource is not found e.g. it fetching a DOI/Repository/Member details.'
      );
    }
    // initialize a default error message
    let errMessage = 'An error occurred while deleting the draft DOI.';

    // if there is an error response from DataCite, include the status and statusText from the API error
    // if the error doesn't have a response, include the error message
    if (err.response) {
      errMessage = `from DataCite API: ${err.response.status} - ${err.response.statusText}: ${JSON.stringify(err.response.data)}`;
    } else if (err.message) {
      errMessage = err.message;
    }

    // throw a default HttpsError with the code 'unknown' and the error message
    throw new HttpsError('unknown',errMessage);
  }
});

// Get status of doi, this could be Draft, Registered, Findable, or Unknown. The status od Findable and Registered 
// doi's can be determined by anyone while the status od draft doi's can only determined if they are part of the account
// accessible using the saved datacite credentials in the admin section of the database. If the status can not be determined a
// value of Unknown is returned
exports.getDoiStatus = onCall(async (request) => {
  const region = await requireRegionMember(request);
  if(!request.data.doi) {
    throw new Error("DOI not provided");
  }
  const {doi} = request.data;

  let prefix;
  let authHash

  try {
    prefix = (await admin.database().ref('admin').child(region).child("dataciteCredentials").child("prefix").once("value")).val();
  } catch (error) {
      console.error(`Error fetching Datacite Prefix for region ${region}:`, error);
      return null;
  }

  try {
    authHash = (await admin.database().ref('admin').child(region).child("dataciteCredentials").child("dataciteHash").once("value")).val();
  } catch (error) {
      console.error(`Error fetching Datacite Auth Hash for region ${region}:`, error);
      return null;
  } 

  try {
    const url = `${baseUrl}${doi}/`;
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
      throw new HttpsError(
        'unauthenticated',
        'Error from DataCite API: Unauthorized. Please check your API credentials.'
      );
    }
    // if the error is a 404, throw a HttpsError with the code 'not-found'
    if (err.response && err.response.status === 404) {
      if (doi.startsWith(`${prefix}/`)) {
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
    throw new HttpsError('unknown', errMessage);
  }

});


exports.getDoi = onCall(async (request) => {
  // no region/credentials involved here, but it still proxies an outbound lookup
  if (!request.auth || !request.auth.uid) {
    throw new HttpsError("unauthenticated", "Authentication required.");
  }
  if(!request.data.doi) {
    throw new Error("DOI not provided");
  }
  try {
    const url = `${baseUrl}${request.data.doi}/`;
    const response = await axios.get(url);
    return response.data.data.attributes;
  } catch (err) {
    // if the error is a 401, throw a HttpsError with the code 'unauthenticated'
    if (err.response && err.response.status === 401) {
      throw new HttpsError(
        'unauthenticated',
        'Error from DataCite API: Unauthorized. Please check your API credentials.'
      );
    }
    // if the error is a 404, throw a HttpsError with the code 'not-found'
    if (err.response && err.response.status === 404) {
      return 'not found'
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
    throw new HttpsError('unknown', errMessage);
  }

});


// helper function to get the datacite credentials from the database so they are not sent to the client
// Returns only a boolean, and runs before userinfo is written on first login, so this
// requires a signed-in caller but not region membership.
exports.getCredentialsStored = onCall(async (request) => {
  const region = requireRegion(request);
  try {
    const credentialsRef = admin.database().ref('admin').child(region).child("dataciteCredentials");
    const authHashSnapshot = await credentialsRef.child("dataciteHash").once("value");
    const prefixSnapshot = await credentialsRef.child("prefix").once("value");

    const authHash = authHashSnapshot.val();
    const prefix = prefixSnapshot.val();

    // Check for non-null and non-empty
    return authHash && authHash !== "" && prefix && prefix !== "";
  } catch (error) {
    console.error("Error checking Datacite credentials:", error);
    return false;
  }
});

// helper function to get the datacite prefix from the database. this value is not special and can be sent to the client.
exports.getDatacitePrefix = onCall(async (request) => {
  const region = requireRegion(request);
  try {
    const prefix = (await admin.database().ref('admin').child(region).child("dataciteCredentials").child("prefix").once("value")).val();
    return prefix;
  } catch (error) {
    throw new Error(`Error fetching Datacite Prefix for region ${region}: ${error}`);
  }
});