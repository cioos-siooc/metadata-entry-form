import { del, get, post, put } from "./client";

/**
 * Record operations. Mirrors the web SPA's src/api/records.js so the two
 * clients speak the same API surface.
 *
 * Status vocabulary is the server's, unchanged: "" is draft, then "submitted",
 * then "published".
 */

export type RecordStatus = "" | "submitted" | "published";

/** The record as the API returns it — a self-contained document. */
export interface MetadataRecord {
  recordID: string;
  status: RecordStatus;
  title: { en: string; fr: string };
  /** Optimistic-concurrency token; send it back as If-Unmodified-Since. */
  updatedAt?: string;
  /** Misleadingly named on the server: this is last-updated, not created. */
  created?: string;
  userID?: string;
  identifier?: string;
  datasetIdentifier?: string;
  [field: string]: unknown;
}

export interface RecordListItem extends MetadataRecord {
  owner_email?: string;
  owner_name?: string;
}

/** The caller's own records. */
export function myRecords(region: string, userID: string) {
  return get<RecordListItem[]>(`/regions/${region}/records`, { ownerId: userID });
}

export function sharedWithMe(region: string) {
  return get<RecordListItem[]>(`/regions/${region}/records/shared-with-me`);
}

export function publishedRecords(region: string) {
  return get<RecordListItem[]>(`/regions/${region}/records`, { status: "published" });
}

/** Every record at any status — reviewer/admin only. */
export function allRegionRecords(region: string) {
  return get<RecordListItem[]>(`/regions/${region}/records`, {
    status: ",submitted,published",
  });
}

export function getRecord(region: string, recordID: string) {
  return get<MetadataRecord>(`/regions/${region}/records/${recordID}`);
}

export function createRecord(region: string, record: MetadataRecord) {
  return post<MetadataRecord>(`/regions/${region}/records`, record);
}

/**
 * Saves a record.
 *
 * `ifUnmodifiedSince` must always be passed when editing an existing record.
 * The server's concurrency check is opt-in — omit the header and it silently
 * does not run, making a lost update indistinguishable from a successful save.
 */
export function saveRecord(
  region: string,
  recordID: string,
  record: MetadataRecord,
  ifUnmodifiedSince?: string,
) {
  return put<MetadataRecord>(
    `/regions/${region}/records/${recordID}`,
    record,
    ifUnmodifiedSince ? { "If-Unmodified-Since": ifUnmodifiedSince } : undefined,
  );
}

export function setRecordStatus(region: string, recordID: string, status: RecordStatus) {
  return put<MetadataRecord>(`/regions/${region}/records/${recordID}/status`, { status });
}

export function deleteRecord(region: string, recordID: string) {
  return del<void>(`/regions/${region}/records/${recordID}`);
}

export function cloneRecord(region: string, recordID: string) {
  return post<MetadataRecord>(`/regions/${region}/records/${recordID}/clone`, {});
}
