// Replacement for the RTDB triggers in firebase-functions/functions/
// {notify,updates}.js. Called after commit from every code path that creates,
// deletes, or changes the status of a record. Fire-and-forget: failures are
// logged, never thrown into the request path (matches current Firebase
// trigger reliability).
//
// Event shape (see routes/records.js):
//   { region, record, before, after, kind }
//   - record: API-shaped record ('' = draft, title{en,fr}, userinfo when relevant)
//   - before/after: { status } in DB shape ('draft'|'submitted'|'published'), or null
//   - kind: 'create' | 'update' | 'delete'

const { getRecordFilename } = require("../lib/blankRecord");
const { notifySubmitted, notifyPublished } = require("./notify");
const { updateRecordXML, deleteRecordXML } = require("./xmlGenerator");

const XML_STATUSES = ["submitted", "published"];
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function onRecordChange(log, { region, record, before, after, kind }) {
  log.info(
    { region, recordID: record?.recordID, kind, before: before?.status, after: after?.status },
    "record change hook",
  );

  const beforeStatus = before?.status;
  const afterStatus = after?.status;

  // Mirrors updatesRecordDelete: remove the record's WAF files.
  if (kind === "delete") {
    try {
      const filename = record.filename || getRecordFilename(record);
      await deleteRecordXML({ region, filename });
    } catch (err) {
      log.error({ err }, "record delete hook: recordDelete call failed");
    }
    return;
  }

  // Mirrors updatesRecordCreate: a record born submitted/published (only
  // happens on transfer) gets its XML regenerated — after a 1s pause so a
  // delete for the old files lands on the server first.
  if (kind === "create") {
    if (XML_STATUSES.includes(afterStatus)) {
      await delay(1000);
      try {
        await updateRecordXML({ region, record });
      } catch (err) {
        log.error({ err }, "record create hook: XML update failed");
      }
    }
    return;
  }

  // kind === 'update': a status transition.

  // Mirrors notifyReviewer: entering 'submitted' from draft/none — not from
  // 'published' (a demoted published record isn't a new submission).
  if (afterStatus === "submitted" && (!beforeStatus || beforeStatus === "draft")) {
    try {
      await notifySubmitted({ region, record, log });
    } catch (err) {
      log.error({ err }, "record change hook: submit notification failed");
    }
  }

  // Mirrors notifyUser: entering 'published'.
  if (afterStatus === "published" && beforeStatus !== "published") {
    try {
      await notifyPublished({ region, record, log });
    } catch (err) {
      log.error({ err }, "record change hook: publish notification failed");
    }
  }

  // Mirrors updatesRecordUpdate: if the record was or is submitted/published,
  // tell the converter — with the record's NEW status, so leaving those
  // states (demotion to draft) removes the WAF files.
  if (XML_STATUSES.includes(beforeStatus) || XML_STATUSES.includes(afterStatus)) {
    try {
      await updateRecordXML({ region, record });
    } catch (err) {
      log.error({ err }, "record change hook: XML update failed");
    }
  }
}

function fireRecordChange(log, event) {
  onRecordChange(log, event).catch((err) => {
    log.error({ err }, "record change hook failed");
  });
}

module.exports = { onRecordChange, fireRecordChange };
