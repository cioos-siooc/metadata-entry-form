import { v4 as uuidv4 } from "uuid";
import { getDatabase, ref, child, set, get, remove, push } from "firebase/database";

import firebase from "../firebase";

import { getBlankRecord, getBlankContact } from "./blankRecord";
import { firebaseToJSObject, getRecordFilename, deepCopy } from "./misc";
import { metadataScopeCodes } from "../isoCodeLists";

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

/**
 * Realtime Database stores booleans written by old form versions as the STRINGS
 * "true"/"false". `Boolean("false")` is true, so a raw legacy value flips every
 * check that reads it — including the form engine's `visibleIf` predicate, which
 * would hide the taxa, platform and vertical-extent sections of a record that
 * has them.
 *
 * The hand-written tabs each guarded this inline (`record.noX && record.noX !==
 * "false"`). Coercing once on load means nothing downstream has to remember.
 */
function coerceBoolean(value) {
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}

// fills in missing fields on older records
export function standardizeRecord(record, user, userID, recordID, language) {
  const updatedRecord = {
    ...getBlankRecord(),
    ...record,
  };
  if (recordID) updatedRecord.recordID = recordID;
  if (user && userID) {
    updatedRecord.userinfo = { ...user?.userinfo, userID };
  }

  // RTDB stores an array as an object keyed "0","1",… and firebaseToJSObject
  // only converts it back when the first key is "0". A record whose contacts
  // arrived in any other shape used to crash here on .map; coerce instead.
  updatedRecord.contacts = (
    Array.isArray(updatedRecord.contacts)
      ? updatedRecord.contacts
      : Object.values(updatedRecord.contacts || {})
  ).map(standardizeContact);

  ["noPlatform", "noTaxa", "noVerticalExtent"].forEach((key) => {
    updatedRecord[key] = coerceBoolean(updatedRecord[key]);
  });

  // Records written before platforms became a list carry a single platform in
  // three top-level keys. Fold it into platforms[] and clear the originals.
  // This ran in a PlatformTab useEffect, so it only fired if you opened that
  // one tab; on load it always does.
  if (updatedRecord.platformID) {
    updatedRecord.platforms = [
      {
        id: updatedRecord.platformID,
        description: updatedRecord.platformDescription,
        type: updatedRecord.platform,
      },
      ...(updatedRecord.platforms || []),
    ];
    updatedRecord.platformID = null;
    updatedRecord.platformDescription = null;
    updatedRecord.platform = null;
  }

  if (!updatedRecord.language && language) updatedRecord.language = language;

  // metadataScopeIso is derived from metadataScope and is never asked as a
  // question, so it has to be kept correct here rather than by the form.
  if (!updatedRecord.metadataScope) {
    updatedRecord.metadataScope = "Dataset";
  }
  if (
    !updatedRecord.metadataScopeIso &&
    metadataScopeCodes[updatedRecord.metadataScope]
  ) {
    updatedRecord.metadataScopeIso =
      metadataScopeCodes[updatedRecord.metadataScope].isoValue;
  }

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

export async function transferRecord(
  transferEmail,
  recordID,
  sourceUserID,
  region
) {
  const database = getDatabase(firebase);
  const regionUsersRef = ref(database, `${region}/users`);
  const regionUsers = (await get(regionUsersRef, "value")).val();

  // get mapping like [["sdfssf32fwwfe","sdf@sdef.ca"]]
  const userIDToEmailMapping = Object.entries(
    regionUsers
  ).map(([userID, userData]) => [userID, userData?.userinfo?.email]);

  const userMatch = userIDToEmailMapping.find(
    ([, email]) =>
      email.toLowerCase().trim() === transferEmail.toLowerCase().trim()
  );
  if (userMatch) {
    const [matchingUserID] = userMatch;

    const recordRef = child(regionUsersRef, `${sourceUserID}/records/${recordID}`);

    const record = (await get(recordRef, "value")).val();

    const destinationRecordsRef = ref(database, `${region}/users/${matchingUserID}/records`);
    const newRecordRef = push(destinationRecordsRef, record);
    const newRecordID = newRecordRef.key;

    record.recordID = newRecordID;
    await set(newRecordRef, record);
    if (newRecordID) {
      await remove(recordRef);
      return true;
    }
  }
  return false;
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

// fetches a region's users
export async function loadRegionUsers(region) {
  const database = getDatabase(firebase);
  try {
    const regionUsersRef = ref(database, `${region}/users`);
    const regionUsers = (await get(regionUsersRef, "value")).val();

    return regionUsers
    
  } catch (error) {
    throw new Error(`Error fetching user emails for region ${region}: ${error}`);
  }
}

/**
 * Asynchronously shares or unshares a record with a single user by updating the 'shares' node in Firebase.
 * This function directly uses the userID to share or unshare the record.
 * 
 * @param {string} userID 
 * @param {string} recordID
 * @param {string} authorID - The ID of the author of the record, included when the record is shared.
 * @param {string} region
 * @param {boolean} share
 */
export async function updateSharedRecord(userID, recordID, authorID, region, share) {
  const database = getDatabase(firebase);
  const sharesRef = ref(database, `${region}/shares/${userID}/${authorID}/${recordID}`);

  if (share) {
    // Share the record with the user by setting it directly under the authorID node
    await set(sharesRef, { shared: true })
      .catch(error => {throw new Error(`Error sharing record by author ${authorID} with user ${userID}: ${error}`)});
  } else {
    // Unshare the record from the user
    await remove(sharesRef)
      .catch(error => { throw new Error(`Error unsharing record by author ${authorID} with user ${userID}: ${error}`) });
  }
}
