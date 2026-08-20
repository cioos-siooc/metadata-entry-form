import performUpdateDraftDoi from "../../utils/doiUpdate";

/**
 * The side effects the hand-written metadata form performed around a save.
 *
 * Both were inline in MetadataForm (handleSaveClick and handleUpdateDraftDOI).
 * Neither may fail a save — see the note in ./index.js — so both are written to
 * return a result rather than to succeed.
 *
 * `cloudFunctions` comes from UserProvider, which is where the callables live;
 * this module deliberately does not reach for the context itself, so it stays
 * testable without React.
 */

/**
 * Regenerates the catalogue XML for a record that is visible outside the app.
 *
 * A draft has nothing published to regenerate, so this is a no-op for one —
 * exactly the status check MetadataForm made before calling it.
 */
async function afterSave({ region, userID, submission, cloudFunctions }) {
  const record = submission?.data || {};
  if (!["submitted", "published"].includes(record.status)) return null;

  const regenerate = cloudFunctions?.regenerateXMLforRecord;
  if (!regenerate) return null;

  return regenerate({
    path: `${region}/${userID}/${submission.id}`,
    status: record.status,
    filename: record.filename,
    region,
  });
}

/**
 * Keeps the DataCite draft DOI in step with the record.
 *
 * Only runs when the region has DataCite credentials configured AND the record
 * actually has a DOI — otherwise there is no draft to update.
 *
 * @returns {{updated: boolean}|null} so the page can surface the outcome; the
 *   hand-written form set doiUpdated/doiError flags for the same purpose.
 */
async function beforeStatusChange({
  region,
  language,
  submission,
  datacitePrefix,
}) {
  const record = submission?.data || {};
  if (!datacitePrefix || !record.datasetIdentifier) return null;

  const statusCode = await performUpdateDraftDoi(
    record,
    region,
    language,
    datacitePrefix
  );

  return { updated: statusCode === 200 };
}

export const metadataRecordHooks = { afterSave, beforeStatusChange };

export default metadataRecordHooks;
