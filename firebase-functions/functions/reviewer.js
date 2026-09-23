const functions = require("firebase-functions");
const { defineString } = require("firebase-functions/params");
const axios = require("axios");

// cioos-metadata-reviewer's on-demand API (src/cioos_metadata_reviewer/api.py).
// The token is a shared secret with that service, so the browser never talks to it directly.
const reviewerApiUrl = defineString("REVIEWER_API_URL");
const reviewerApiToken = defineString("REVIEWER_API_TOKEN");

// URL checks plus one Cohere call can take tens of seconds.
const TIMEOUT_SECONDS = 300;

exports.reviewRecord = functions
  .runWith({ timeoutSeconds: TIMEOUT_SECONDS })
  .https.onCall(async (data, context) => {
    if (!context.auth || !context.auth.token)
      throw new functions.https.HttpsError("unauthenticated");

    const { record, region, userID, recordID } = data || {};
    if (!record || typeof record !== "object" || !region)
      throw new functions.https.HttpsError(
        "invalid-argument",
        "record and region are required"
      );

    const url = process.env.REVIEWER_API_URL || reviewerApiUrl.value();
    const token = process.env.REVIEWER_API_TOKEN || reviewerApiToken.value();
    if (!url || !token)
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Automated review is not configured"
      );

    try {
      const res = await axios.post(
        `${url.replace(/\/$/, "")}/review`,
        { record, region, userID, recordID },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: (TIMEOUT_SECONDS - 10) * 1000,
        }
      );
      return { findings: res.data.findings || [] };
    } catch (err) {
      functions.logger.error("reviewRecord failed:", err.message);
      throw new functions.https.HttpsError(
        "unavailable",
        "The automated reviewer could not be reached"
      );
    }
  });
