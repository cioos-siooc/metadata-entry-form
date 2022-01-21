const functions = require("firebase-functions");
const https = require("https");
const axios = require("axios");

const urlBase = "https://pac-dev1.cioos.org/cioos-xml/";

function getRecordFilename(record) {
  return `${record.title[record.language].slice(
    0,
    30
  )}_${record.identifier.slice(0, 5)}`
    .trim()
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]/g, "_");
}

// creates xml for a completed record. returns a URL to the generated XML
exports.downloadRecord = functions.https.onCall(
  async ({ record, fileType }, context) => {
    const url = `${urlBase}recordTo${fileType.toUpperCase()}`;
    const response = await axios.post(url, record);
    return response.data;
  }
);

async function updateXML(path, status = "", filename = "") {
  const url = `${urlBase}record`;
  const urlParams = new URLSearchParams({
    path,
    status,
    filename,
  }).toString();
  const urlFull = `${url}?${urlParams}`;

  return https.get(urlFull);
}

// when user clicks "Save", if the record is submitted or published, update the XML
exports.regenerateXMLforRecord = functions.https.onCall(
  async (data, context) => {
    if (!context.auth || !context.auth.token)
      throw new functions.https.HttpsError("unauthenticated");

    const { path, status } = data;
    if (["submitted", "published"].includes(status)) updateXML(path);
    // No need to create new XML if the record is a draft.
    // If the record is complete, the user can still generate XML for a draft record
  }
);

// if the record changes status we should trigger an update
exports.updatesRecordUpdate = functions.database
  .ref("/{region}/users/{userID}/records/{recordID}/status")
  .onUpdate(({ before, after }, context) => {
    const { region, userID, recordID } = context.params;
    const path = `${region}/${userID}/${recordID}`;

    // record deleted event

    const afterStatus = after.val();
    const beforeStatus = before.val();

    // status changed to draft
    if (
      // if this record was or is published or submitted
      [afterStatus, beforeStatus].some(
        (status) => status === "published" || status === "submitted"
      )
    ) {
      return updateXML(path, afterStatus);
    }
    console.log("no change");
  });

// also trigger update when record is deleted
exports.updatesRecordDelete = functions.database
  .ref("/{region}/users/{userID}/records/{recordID}")
  .onDelete((snpashot, context) => {
    const record = snpashot.val();
    const filename = getRecordFilename(record);
    const url = `${urlBase}recordDelete`;
    const urlParams = new URLSearchParams({
      filename,
    }).toString();
    const urlFull = `${url}?${urlParams}`;

    return https.get(urlFull);
  });
