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

    const recordRef = child(regionUsersRef, `${sourceUserID})/records/${recordID}`);

    const record = (await get(recordRef, "value")).val();

    const newRecordRef = await child(regionUsersRef, `${matchingUserID}/records/${record}`);
    const newRecordID = newRecordRef.key;

    record.recordID = newRecordID;
    newRecordRef.update(record);
    if (newRecordID) {
      await recordRef.remove();
      return true;
    }
  }
  return false;
}

export function returnRecordToDraft(region, userID, key) {
  const database = getDatabase(firebase);
  return set(ref(database, `${region})/users/${userID}/records/${key}/status`), "");
}

export async function getRegionProjects(region,language) {
  const database = getDatabase(firebase);

  const path = `admin/${region}/projects/${language}`;

  const exists = await pathExists(path);
  if (exists) {
      const projects = Object.values( 
      (
        await get(ref(database, path), "value")
      ).toJSON() || {}
    );
    return projects;
  } else {
    const path = `admin/${region}/projects`;
    const projects = Object.values( 
      (
        await get(ref(database, path), "value")
      ).toJSON() || {}
    );
    return projects;
  }
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


export async function pathExists(path) {
  const database = getDatabase();
  const snapshot = await get(ref(database, path));
  return snapshot.exists();
}