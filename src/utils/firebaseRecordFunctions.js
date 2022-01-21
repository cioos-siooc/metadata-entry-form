import { v4 as uuidv4 } from "uuid";
import firebase from "../firebase";

import getBlankRecord from "./blankRecord";
import { firebaseToJSObject, getRecordFilename } from "./misc";

export async function cloneRecord(
  recordID,
  sourceUserID,
  destinationUserID,
  region
) {
  const sourceUserRecordsRef = firebase
    .database()
    .ref(region)
    .child("users")
    .child(sourceUserID)
    .child("records");

  const record = (
    await sourceUserRecordsRef.child(recordID).once("value")
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

  const destinationUserRecordsRef = firebase
    .database()
    .ref(region)
    .child("users")
    .child(destinationUserID)
    .child("records");

  destinationUserRecordsRef.push(record);
}

export function loadRegionRecords(regionRecords, statusFilter) {
  const regionUsers = regionRecords.toJSON();
  const records = [];

  Object.entries(regionUsers).forEach(([userID, user]) => {
    if (user.records) {
      Object.entries(user.records).forEach(([key, record]) => {
        if (statusFilter.includes(record.status))
          records.push({
            ...{ ...getBlankRecord(), ...firebaseToJSObject(record) },
            userinfo: { ...user.userinfo, userID },
            key,
          });
      });
    }
  });

  return records;
}

export async function submitRecord(region, userID, key, status, record) {
  const recordRef = firebase
    .database()
    .ref(region)
    .child("users")
    .child(userID)
    .child("records")
    .child(key);

  await recordRef.child("status").set(status);
  if (status === "published")
    await recordRef.child("timeFirstPublished").set(new Date().toISOString());

  if (record && !record.filename) {
    const filename = getRecordFilename(record);
    recordRef.child("filename").set(filename);
  }
}

export function deleteRecord(region, userID, key) {
  return (
    firebase
      .database()
      .ref(region)
      .child("users")
      // this can be any user id
      .child(userID)
      .child("records")
      .child(key)
      .remove()
  );
}

export async function transferRecord(
  transferEmail,
  recordID,
  sourceUserID,
  region
) {
  const regionUsersRef = firebase.database().ref(region).child("users");
  const regionUsers = (await regionUsersRef.once("value")).val();

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

    const recordRef = regionUsersRef
      .child(sourceUserID)
      .child("records")
      .child(recordID);

    const record = (await recordRef.once("value")).val();

    const newRecordRef = await regionUsersRef
      .child(matchingUserID)
      .child("records")
      .push(record);
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
  return firebase
    .database()
    .ref(region)
    .child("users")
    .child(userID)
    .child("records")
    .child(key)
    .child("status")
    .set("");
}
