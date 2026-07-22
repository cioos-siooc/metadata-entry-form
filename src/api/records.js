import { get, post, put, del } from "./client";

// Record data operations. Replaces src/utils/firebaseRecordFunctions.js —
// same function names and near-identical signatures so call-site diffs stay
// small. Records travel in the familiar shape: status "" = draft,
// title{en,fr}, recordID, etc.

export function loadRegionRecords(region, statusFilter) {
  // statusFilter: array of API statuses, e.g. ["", "submitted", "published"]
  return get(`/regions/${region}/records`, { status: statusFilter.join(",") });
}

export function loadUserRecords(region, userID) {
  return get(`/regions/${region}/records`, { ownerId: userID });
}

export function loadSharedRecords(region) {
  return get(`/regions/${region}/records/shared-with-me`);
}

export function getRecord(region, recordID) {
  return get(`/regions/${region}/records/${recordID}`);
}

export function createRecord(region, record) {
  return post(`/regions/${region}/records`, record);
}

export function saveRecord(region, recordID, record, { ifUnmodifiedSince } = {}) {
  return put(
    `/regions/${region}/records/${recordID}`,
    record,
    ifUnmodifiedSince ? { "If-Unmodified-Since": ifUnmodifiedSince } : undefined,
  );
}

export function submitRecord(region, recordID, status) {
  return put(`/regions/${region}/records/${recordID}/status`, { status });
}

export function returnRecordToDraft(region, recordID) {
  return submitRecord(region, recordID, "");
}

export function deleteRecord(region, recordID) {
  return del(`/regions/${region}/records/${recordID}`);
}

export function cloneRecord(region, recordID) {
  return post(`/regions/${region}/records/${recordID}/clone`, {});
}

export function transferRecord(region, recordID, email) {
  return post(`/regions/${region}/records/${recordID}/transfer`, { email });
}

export function updateRecordShares(region, recordID, userIds) {
  return put(`/regions/${region}/records/${recordID}/shares`, { userIds });
}

export function loadRegionUsers(region) {
  return get(`/regions/${region}/users`);
}

export function getRegionProjects(region) {
  return get(`/regions/${region}/projects`);
}
