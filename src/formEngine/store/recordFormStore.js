import { getDatabase, ref, child, get, push, update } from "firebase/database";

import firebase from "../../firebase";
import { getBlankRecord } from "../../utils/blankRecord";
import {
  standardizeRecord,
  deleteRecord,
} from "../../utils/firebaseRecordFunctions";
import {
  firebaseToJSObject,
  getRecordFilename,
  trimStringsInObject,
} from "../../utils/misc";
import { METADATA_RECORD_SLUG } from "../metadataRecordForm";

/**
 * The FormStore submission surface, over the metadata record tree.
 *
 * Records stay exactly where they have always been —
 * `/{region}/users/{userID}/records/{recordID}` — because a great deal outside
 * this app reads them there: the RTDB triggers in firebase-functions
 * (updates.js, notify.js), firebase_to_xml, and cioos-records-update. This
 * adapter translates between that tree and the engine's FormSubmission shape.
 * There is no data migration, and there must not be one.
 *
 * Four differences from a generic submission, all of them load-bearing:
 *
 *   status      records use "" for a draft; the engine uses "draft". The two
 *               extra record states, "submitted" and "published", pass through.
 *               "published" is not in SUBMISSION_STATUSES — only a reviewer can
 *               set it, and it is reached through the reviewer tools, not here.
 *
 *   data        the record object IS the row. Generic submissions store `data`
 *               as a JSON string under a `data` key; a record does not, because
 *               every other consumer expects the record's fields at the top.
 *
 *   created     is in fact LAST-UPDATED — it is stamped on every save. Mapped to
 *               updatedAt, and createdAt has no true equivalent.
 *
 *   version     always null. The record's schema is generated from src/schema/
 *               at render time, so there is no published version to pin to and
 *               a record always renders against today's schema.
 */

const RECORD_DRAFT = "";

export function toSubmissionStatus(recordStatus) {
  return recordStatus === RECORD_DRAFT || recordStatus == null
    ? "draft"
    : recordStatus;
}

export function toRecordStatus(submissionStatus) {
  return submissionStatus === "draft" || submissionStatus == null
    ? RECORD_DRAFT
    : submissionStatus;
}

const recordsPath = (region, userID) => `${region}/users/${userID}/records`;

/** record row → FormSubmission */
export function toSubmission(record, { id, region, userID }) {
  return {
    id,
    region: record.region || region,
    formTypeId: METADATA_RECORD_SLUG,
    formTypeVersion: null,
    userID: record.userID || userID,
    status: toSubmissionStatus(record.status),
    data: record,
    createdAt: record.created || null,
    updatedAt: record.created || null,
    lastEditedBy: record.lastEditedBy || null,
  };
}

async function readRecord(region, userID, id) {
  const database = getDatabase(firebase);
  const snapshot = await get(child(ref(database, recordsPath(region, userID)), id));
  if (!snapshot.exists()) return null;
  return firebaseToJSObject(snapshot.val());
}

export async function getSubmission({ region, id, ownerId }) {
  const raw = await readRecord(region, ownerId, id);
  if (!raw) return null;
  const record = standardizeRecord(raw, null, ownerId, id);
  return toSubmission(record, { id, region, userID: ownerId });
}

export async function listSubmissions({ region, ownerId, status } = {}) {
  if (!ownerId) {
    throw new Error(
      "recordFormStore.listSubmissions needs an owner. Region-wide record " +
        "listing goes through loadRegionRecords, which reads every user's " +
        "subtree — see src/components/RecordList."
    );
  }

  const database = getDatabase(firebase);
  const snapshot = await get(ref(database, recordsPath(region, ownerId)));
  if (!snapshot.exists()) return [];

  return Object.entries(snapshot.val())
    .map(([id, raw]) => {
      const record = standardizeRecord(firebaseToJSObject(raw), null, ownerId, id);
      return toSubmission(record, { id, region, userID: ownerId });
    })
    .filter((submission) => !status || submission.status === status);
}

/**
 * Stamps the fields the app owns on every write. Mirrors what handleSaveClick
 * did in the hand-written form, so nothing downstream sees a different shape.
 */
function withSaveStamps(data, { region, ownerID, editorID, user }) {
  const record = trimStringsInObject({ ...data });
  record.created = new Date().toISOString();
  record.region = region;
  // The record belongs to its owner even when a reviewer is the one saving.
  record.userID = ownerID;
  if (user) {
    record.lastEditedBy = {
      displayName: user.displayName || "",
      email: user.email || "",
      uid: editorID,
    };
  }
  return record;
}

export async function createSubmission({ region, userID, data = {}, user }) {
  const database = getDatabase(firebase);
  const recordsRef = ref(database, recordsPath(region, userID));

  const record = withSaveStamps(
    { ...getBlankRecord(), ...data },
    { region, ownerID: userID, editorID: userID, user }
  );

  // push() then update(): push alone does not persist the date fields
  // reliably — the same two-step the hand-written form used.
  const pushed = await push(recordsRef);
  await update(child(recordsRef, pushed.key), {
    ...record,
    recordID: pushed.key,
  });

  return toSubmission({ ...record, recordID: pushed.key }, {
    id: pushed.key,
    region,
    userID,
  });
}

export async function saveSubmission({
  region,
  id,
  userID,
  ownerId,
  data,
  status,
  user,
}) {
  // A reviewer, or somebody the record was shared with, edits it in place in
  // the OWNER's subtree — moving it would break every trigger and every URL.
  const owner = ownerId || userID;
  const database = getDatabase(firebase);
  const recordsRef = ref(database, recordsPath(region, owner));

  const record = withSaveStamps(data, {
    region,
    ownerID: owner,
    editorID: userID,
    user,
  });
  record.recordID = id;
  if (status !== undefined) record.status = toRecordStatus(status);
  if (record.status === "published" && !record.timeFirstPublished) {
    record.timeFirstPublished = new Date().toISOString();
  }
  // getRecordFilename reads record.title[record.language] with no guard, so it
  // throws on a half-filled draft — which is the normal state of a record being
  // written over several days. The filename is only needed once the record is
  // published, and submitRecord derives it then too.
  if (!record.filename && record.language && record.title?.[record.language]) {
    record.filename = getRecordFilename(record);
  }

  // Spread over a blank record so a field added since this record was written
  // is present rather than missing — same as the hand-written form did.
  await update(child(recordsRef, id), { ...getBlankRecord(), ...record });

  return toSubmission(record, { id, region, userID: owner });
}

export async function deleteSubmission({ region, id, userID, ownerId }) {
  return deleteRecord(region, ownerId || userID, id);
}

export const recordFormStore = {
  listSubmissions,
  getSubmission,
  createSubmission,
  saveSubmission,
  deleteSubmission,
};

export default recordFormStore;
