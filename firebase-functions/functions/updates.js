const admin = require("firebase-admin");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onValueCreated, onValueUpdated, onValueDeleted } = require("firebase-functions/v2/database");
const { logger } = require("firebase-functions/v2");
const axios = require("axios");

const urlBaseDefault = "https://pac-dev1.cioos.org/cioos-xml/" // overwritten by setting in the firebase database

// Firebase .child() accepts a multi-segment relative path, so an unvalidated region can
// redirect the recordGeneratorURL lookup into a different subtree - including
// admin/<region>/projects, which reviewers can write. Keep region to a single segment.
const regionPattern = /^[A-Za-z0-9_-]+$/;

// Map rather than a plain object so inherited keys like "constructor" cannot resolve.
const fileTypes = new Map([
  ["xml", "XML"],
  ["yaml", "YAML"],
  ["cff", "CFF"],
  ["erddap", "ERDDAP"],
]);

async function getRecordGeneratorURL(region) {
  if (!regionPattern.test(String(region ?? ""))) {
    logger.error(`Invalid region ${region}, using the default record generator URL`);
    return urlBaseDefault;
  }
  try {
    return (
      (
        await admin
          .database()
          .ref("admin")
          .child(region)
          .child("recordGeneratorURL")
          .once("value")
      ).val() ?? urlBaseDefault
    );
  } catch (error) {
    logger.error(`Error fetching recordGeneratorURL for region ${region}, using the default value:`, error);
    return urlBaseDefault;
  }
}

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
exports.downloadRecord = onCall(
  async (request) => {
    if (!request.auth || !request.auth.token)
      throw new HttpsError("unauthenticated");

    const { record, fileType, region } = request.data
    // allowlist rather than interpolating the caller's string into the URL path
    const resolvedType = fileTypes.get(String(fileType ?? "").toLowerCase());
    if (!resolvedType) {
      throw new HttpsError("invalid-argument", "Unsupported fileType.");
    }

    const urlBase = await getRecordGeneratorURL(region);

    const url = `${urlBase}recordTo${resolvedType}`;
    const response = await axios.post(url, record);
    return response.data;
  }
);

// https.get() hands back a ClientRequest, not a promise, so the old callers returned
// before the generator had even been contacted and every failure it reported was
// discarded. Use axios so the response - including a 4xx/5xx - is actually observed.
async function callRecordGenerator(endpoint, region, params) {
  const urlBase = await getRecordGeneratorURL(region);

  const url = `${urlBase}${endpoint}`;
  const urlParams = new URLSearchParams({
    ...params,
    token: process.env.RECORD_API_TOKEN,
  }).toString();
  const urlFull = `${url}?${urlParams}`;

  try {
    const response = await axios.get(urlFull);
    return response.data;
  } catch (error) {
    // Log the generator's own error rather than the bare axios message, which only
    // says "Request failed with status code 500".
    logger.error(
      `${endpoint} failed for region ${region}:`,
      error.response?.status,
      error.response?.data ?? error.message
    );
    throw error;
  }
}

async function updateXML(path, region, status = "", filename = "") {
  return callRecordGenerator("record", region, { path, status, filename });
}

// The reviewer/admin lists are stored as one comma-joined string. Match whole entries
// only - a bare substring test would let smith@example.org match jsmith@example.org.
function isListed(list, email) {
  if (typeof list !== "string" || !list || !email) return false;
  return `,${list},`.includes(`,${email},`);
}

// Regenerating a record deletes its existing files before rewriting them, so the caller
// has to be entitled to the record named by `path`. Authentication alone is not enough:
// any signed-in user could otherwise pass someone else's path and destroy their published
// files. Allowed for the record's owner and for reviewers of the record's own region.
async function assertCanRegenerate(auth, path) {
  if (typeof path !== "string") {
    throw new HttpsError("invalid-argument", "path is required");
  }
  const segments = path.split("/");
  if (segments.length !== 3 || segments.some((segment) => !segment)) {
    throw new HttpsError("invalid-argument", "path must be region/userID/recordID");
  }
  const [pathRegion, userID] = segments;

  if (auth.uid === userID) return;

  const reviewers = (
    await admin
      .database()
      .ref("admin")
      .child(pathRegion)
      .child("permissions")
      .child("reviewers")
      .once("value")
  ).val();

  if (!isListed(reviewers, auth.token.email)) {
    throw new HttpsError(
      "permission-denied",
      "Not allowed to regenerate this record."
    );
  }
}

// when user clicks "Save", if the record is submitted or published, update the XML
exports.regenerateXMLforRecord = onCall(
  async (request) => {
    if (!request.auth || !request.auth.token)
      throw new HttpsError("unauthenticated");

    const { path, status, region } = request.data;
    await assertCanRegenerate(request.auth, path);

    if (["submitted", "published"].includes(status)) {
      try {
        await updateXML(path, region);
      } catch {
        // The call used to be fired and forgotten, so a generator that was failing on
        // every record still looked like a successful save to the user.
        // callRecordGenerator has already logged the generator's own error.
        throw new HttpsError("internal", "Could not regenerate the record files.");
      }
    }
    // No need to create new XML if the record is a draft.
    // If the record is complete, the user can still generate XML for a draft record
  }
);

// if a record with status=submitted/published is created
// this ONLY should happen when a submitted/published record is transferred to another user
// when a new record is created/cloned, it would have status="" so this wouldnt run
exports.updatesRecordCreate = onValueCreated(
  "/{region}/users/{userID}/records/{recordID}",
  async (event) => {
    const record = event.data.val();
    const { region, userID, recordID } = event.params;
    const path = `${region}/${userID}/${recordID}`;
    const { status } = record;
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    if (["submitted", "published"].includes(status)) {
      // wait a second so the file has a chance to be deleted on the server before it is created
      // otherwise the server might delete the new files
      await delay(1000);
      return updateXML(path, region);
    }
    return null;
  });

// if the record changes status we should trigger an update
exports.updatesRecordUpdate = onValueUpdated(
  "/{region}/users/{userID}/records/{recordID}/status",
  (event) => {
    const { region, userID, recordID } = event.params;
    const path = `${region}/${userID}/${recordID}`;

    // record deleted event

    const afterStatus = event.data.after.val();
    const beforeStatus = event.data.before.val();

    // status changed to draft
    if (
      // if this record was or is published or submitted
      [afterStatus, beforeStatus].some(
        (status) => status === "published" || status === "submitted"
      )
    ) {
      return updateXML(path, region, afterStatus);
    }
    logger.log("no change");
    return null;
  });


async function deleteXML(filename, region) {
  return callRecordGenerator("recordDelete", region, { filename, region });
}

// also trigger update when record is deleted
exports.updatesRecordDelete = onValueDeleted(
  "/{region}/users/{userID}/records/{recordID}",
  (event) => {
    const record = event.data.val();
    const filename = getRecordFilename(record);
    const { region } = event.params;
    
    return deleteXML(filename, region);
  });
