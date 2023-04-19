const baseUrl = "https://api.datacite.org/dois/";
const { DATACITE_AUTH_HASH } = process.env;
const functions = require("firebase-functions");
const axios = require("axios");
const recordToDataCite = require("./utils/recordToDataCite");

exports.createDraftDoi = functions.https.onCall(async (record) => {
  const url = `${baseUrl}`;

  const body = recordToDataCite(record);

  const response = await axios.post(url, body, {
    headers: {
      authorization: `Basic ${DATACITE_AUTH_HASH}`,
      content_type: "application/vnd.api+json",
    },
  });

  return response.data;
});

exports.updateDraftDoi = functions.https.onCall(async (updatedMetadata) => {
      const url = `${baseUrl}${updatedMetadata.datasetIdentifier}`;
      // Map the updated metadata to DataCite format
      const mappedUpdatedMetadata = recordToDataCite(updatedMetadata);

      delete mappedUpdatedMetadata.data.type;
      delete mappedUpdatedMetadata.data.attributes.prefix;

      // Send a PUT request to DataCite API with the DOI and the mapped updated metadata
      const updateResponse = await axios.put(url, mappedUpdatedMetadata, {
        headers: {
          authorization: `Basic ${DATACITE_AUTH_HASH}`,
          content_type: "application/json",
        },
      });

      return updateResponse.status;   
  });

exports.deleteDraftDoi = functions.https.onCall(async (draftDoi) => {
  const url = `${baseUrl}${draftDoi}/`;
  const response = await axios.delete(url, {
    headers: { authorization: `Basic ${DATACITE_AUTH_HASH}` },
  });
  return response.status;
});
