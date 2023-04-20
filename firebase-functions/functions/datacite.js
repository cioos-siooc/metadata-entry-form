const baseUrl = "https://api.datacite.org/dois/";
const { DATACITE_AUTH_HASH } = process.env;
const functions = require("firebase-functions");
const axios = require("axios");

exports.createDraftDoi = functions.https.onCall(async (record) => {
  const url = `${baseUrl}`;

  const response = await axios.post(url, record, {
    headers: {
      authorization: `Basic ${DATACITE_AUTH_HASH}`,
      content_type: "application/json",
    },
  });

  return response.data;
});

exports.updateDraftDoi = functions.https.onCall(async (data) => {


  const url = `${baseUrl}${data.doi}/`;
  const response = await axios.put(url, data.data, {
    headers: {
      authorization: `Basic ${DATACITE_AUTH_HASH}`,
      content_type: "application/json",
    },
  });
  return response.status;
});

exports.deleteDraftDoi = functions.https.onCall(async (draftDoi) => {
  const url = `${baseUrl}${draftDoi}/`;
  const response = await axios.delete(url, {
    headers: { authorization: `Basic ${DATACITE_AUTH_HASH}` },
  });
  return response.status;
});
