import { v4 as uuidv4 } from "uuid";
import { getDatabase, ref, child, set, get, remove, push } from "firebase/database";

import firebase from "../firebase";

import { getBlankRecord, getBlankContact } from "./blankRecord";
import { firebaseToJSObject, getRecordFilename, deepCopy } from "./misc";

export async function cloneRecord(
  recordID,
  sourceUserID,
  destinationUserID,
  region
) {
  const database = getDatabase(firebase);
  const sourceUserRecordsRef = ref(database, `${region}/users/${sourceUserID}/records`);

  const record = (
    await get(child(sourceUserRecordsRef, recordID), "value")
  ).val();

  // reset record details
  record.recordID = "";
  record.status = "";
  record.lastEditedBy = {};
  record.created = new Date().toISOString();
  record.filename = "";
  record.timeFirstPublished = "";
  // A copy starts private: don't carry the original's editors and invitations over.
  record.sharedWith = {};
  record.pendingShares = {};

  if (record.title.en) record.title.en = `${record.title.en} (Copy)`;
  if (record.title.fr) record.title.fr = `${record.title.fr} (Copte)`;
  record.identifier = uuidv4();
  record.created = new Date().toISOString();

  const destinationUserRecordsRef = ref(database, `${region}/users/${destinationUserID}/records`);

  push(destinationUserRecordsRef, record);
}
export function standardizeContact(contact) {
  return {
    ...getBlankContact(),
    ...contact,
  };
}

// fills in missing fields on older records
export function standardizeRecord(record, user, userID, recordID) {
  const updatedRecord = {
    ...getBlankRecord(),
    ...record,
  };
  if (recordID) updatedRecord.recordID = recordID;
  if (user && userID) {
    updatedRecord.userinfo = { ...user?.userinfo, userID };
  }

  updatedRecord.contacts = updatedRecord.contacts.map(standardizeContact);
  return updatedRecord;
}

export function loadRegionRecords(regionRecords, statusFilter) {
  const regionUsers = regionRecords.toJSON();
  const records = [];

  Object.entries(regionUsers).forEach(([userID, user]) => {
    if (user.records) {
      Object.entries(user.records).forEach(([key, record]) => {
        if (statusFilter.includes(record.status))
          records.push(
            standardizeRecord(firebaseToJSObject(record), user, userID, key)
          );
      });
    }
  });

  return records;
}

export async function submitRecord(region, userID, key, status, record) {
  const database = getDatabase(firebase);
  const recordRef = ref(database, `${region}/users/${userID}/records/${key}`)

  await set(child(recordRef,"status"), status);
  if (status === "published")
    await set(child(recordRef, "timeFirstPublished"), new Date().toISOString());

  if (record && !record.filename) {
    const filename = getRecordFilename(record);
    await set(child(recordRef, "filename"), filename);
  }

}

export function deleteRecord(region, userID, key) {
  const database = getDatabase(firebase);
  return remove(ref(database, `${region}/users/${userID}/records/${key}`));
}

export function returnRecordToDraft(region, userID, key) {
  const database = getDatabase(firebase);
  return set(ref(database, `${region}/users/${userID}/records/${key}/status`), "");
}

export async function getRegionProjects(region) {
  const database = getDatabase(firebase);

  const projects = Object.values(
    (
      await get(ref(database, `admin/${region}/projects`), "value")
    ).toJSON() || {}
  );
  return projects;
}

// runs firebaseToJSObject on each child object
export const multipleFirebaseToJSObject = (multiple) => {
  return Object.entries(multiple || {}).reduce((acc, [key, record]) => {
    acc[key] = standardizeRecord(firebaseToJSObject(deepCopy(record)));
    return acc;
  }, {});
};

// Sharing and unsharing are handled by the shareRecord/unshareRecord cloud
// functions, so that resolving an email address to a user no longer requires
// downloading the region's entire user list.
