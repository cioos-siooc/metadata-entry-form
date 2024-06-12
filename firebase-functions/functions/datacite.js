const admin = require("firebase-admin");

const baseUrl = "https://api.datacite.org/dois/";
const functions = require("firebase-functions");
const axios = require("axios");

// Use the existing firebase record (data) to create a draft doi on datacite. Datacite credentails 
// are pulled from the admin section of the firebase db
exports.createDraftDoi = functions.https.onCall(async (data) => {

  const { record, region } = data;

  let authHash

  try {
    authHash = (await admin.database().ref('admin').child(region).child("dataciteCredentials").child("dataciteHash").once("value")).val();
  } catch (error) {
      console.error(`Error fetching Datacite Auth Hash for region ${region}:`, error);
      return null;
  } 

  functions.logger.log(authHash);

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
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Error from DataCite API: Unauthorized. Please check your API credentials.'
      );
    }
    // if the error is a 404, throw a HttpsError with the code 'not-found'
    if (err.response && err.response.status === 404) {
      throw new functions.https.HttpsError(
        'not-found',
        'from DataCite API: Not-found. The resource is not found e.g. it fetching a DOI/Repository/Member details.'
      );
    }
    // initialize a default error message
    let errMessage = 'An error occurred while creating the draft DOI.';

    // if there is an error response from DataCite, include the status and statusText from the API error
    // if the error doesn't have a response, include the error message
    if (err.response) {
      errMessage = `from DataCite API: ${err.response.status} - ${err.response.statusText}`;
    } else if (err.message) {
      errMessage = err.message;
    }

    // throw a default HttpsError with the code 'unknown' and the error message
    throw new functions.https.HttpsError('unknown',errMessage);
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
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Error from DataCite API: Unauthorized. Please check your API credentials.'
      );
    }
    // if the error is a 404, throw a HttpsError with the code 'not-found'
    if (err.response && err.response.status === 404) {
      throw new functions.https.HttpsError(
        'not-found',
        'from DataCite API: Not-found. The resource is not found e.g. it fetching a DOI/Repository/Member details.'
      );
    }
    // initialize a default error message
    let errMessage = 'An error occurred while updating the draft DOI.';

    // if there is an error response from DataCite, include the status and statusText from the API error
    // if the error doesn't have a response, include the error message
    if (err.response) {
      errMessage = `from DataCite API: ${err.response.status} - ${err.response.statusText}`;
    } else if (err.message) {
      errMessage = err.message;
    }

    // throw a default HttpsError with the code 'unknown' and the error message
    throw new functions.https.HttpsError('unknown',errMessage);
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
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Error from DataCite API: Unauthorized. Please check your API credentials.'
      );
    }
    // if the error is a 404, throw a HttpsError with the code 'not-found'
    if (err.response && err.response.status === 404) {
      throw new functions.https.HttpsError(
        'not-found',
        'from DataCite API: Not-found. The resource is not found e.g. it fetching a DOI/Repository/Member details.'
      );
    }
    // initialize a default error message
    let errMessage = 'An error occurred while deleting the draft DOI.';

    // if there is an error response from DataCite, include the status and statusText from the API error
    // if the error doesn't have a response, include the error message
    if (err.response) {
      errMessage = `from DataCite API: ${err.response.status} - ${err.response.statusText}`;
    } else if (err.message) {
      errMessage = err.message;
    }

    // throw a default HttpsError with the code 'unknown' and the error message
    throw new functions.https.HttpsError('unknown',errMessage);
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
      console.error(`Error fetching Datacite Prefix for region ${data.region}:`, error);
      return null;
  }

  try {
    authHash = (await admin.database().ref('admin').child(data.region).child("dataciteCredentials").child("dataciteHash").once("value")).val();
  } catch (error) {
      console.error(`Error fetching Datacite Auth Hash for region ${data.region}:`, error);
      return null;
  } 

  try {
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
    console.error("Error checking Datacite credentials:", error);
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