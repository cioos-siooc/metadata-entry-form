import { v4 as uuidv4 } from "uuid";
import firebase from "../firebase";

import blankRecord from "./blankRecord";
import { firebaseToJSObject } from "./misc";

export function cloneRecord(recordID, sourceUserID, destinationUserID, region) {
  const sourceUserRecordsRef = firebase
    .database()
    .ref(region)
    .child("users")
    .child(sourceUserID)
    .child("records");

  const destinationUserRecordsRef = firebase
    .database()
    .ref(region)
    .child("users")
    .child(destinationUserID)
    .child("records");

  sourceUserRecordsRef.child(recordID).once("value", (recordFirebase) => {
    const record = recordFirebase.toJSON();

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

    destinationUserRecordsRef.push(record);
  });
}
export const loadRegionRecords = (regionRecords, statusFilter) => {
  const regionUsers = regionRecords.toJSON();
  const records = [];

  Object.entries(regionUsers).forEach(([userID, user]) => {
    if (user.records) {
      Object.entries(user.records).forEach(([key, record]) => {
        if (statusFilter.includes(record.status))
          records.push({
            ...{ ...blankRecord, ...firebaseToJSObject(record) },
            userinfo: { ...user.userinfo, userID },
            key,
          });
      });
    }
  });

  return records;
};
