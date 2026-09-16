import type { MetadataRecord } from "@/api/records";

import {
  CREATE_TABLES,
  type MutationKind,
  type MutationStatus,
  type RecordScope,
  type SyncState,
} from "./schema";

/**
 * Data access.
 *
 * Every function takes the database handle as a parameter rather than reaching
 * for a module singleton. That is what lets the whole offline engine be tested
 * against an in-memory database with no native module and no mocks — and the
 * queue is the part of this app most in need of real tests.
 */

/** The slice of expo-sqlite we use, so tests can supply their own. */
export interface Database {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params?: unknown[]): Promise<{ lastInsertRowId: number; changes: number }>;
  getAllAsync<T>(sql: string, params?: unknown[]): Promise<T[]>;
  getFirstAsync<T>(sql: string, params?: unknown[]): Promise<T | null>;
}

export interface CachedRecord {
  localId: string;
  region: string;
  recordID: string | null;
  ownerUserId: string | null;
  status: string;
  document: MetadataRecord;
  serverUpdatedAt: string | null;
  serverSnapshot: MetadataRecord | null;
  syncState: SyncState;
  clientUpdatedAt: string;
  scope: RecordScope;
}

export interface Mutation {
  seq: number;
  opId: string;
  kind: MutationKind;
  region: string;
  targetLocalId: string;
  method: string;
  body: unknown;
  ifUnmodifiedSince: string | null;
  attempts: number;
  nextAttemptAt: string | null;
  status: MutationStatus;
  lastError: string | null;
  wasRecovered: boolean;
  createdAt: string;
  userId: string;
}

interface RecordRow {
  local_id: string;
  region: string;
  record_id: string | null;
  owner_user_id: string | null;
  status: string;
  document: string;
  server_updated_at: string | null;
  server_snapshot: string | null;
  sync_state: SyncState;
  client_updated_at: string;
  scope: RecordScope;
}

interface MutationRow {
  seq: number;
  op_id: string;
  kind: MutationKind;
  region: string;
  target_local_id: string;
  method: string;
  body: string | null;
  if_unmodified_since: string | null;
  attempts: number;
  next_attempt_at: string | null;
  status: MutationStatus;
  last_error: string | null;
  was_recovered: number;
  created_at: string;
  user_id: string;
}

const toRecord = (row: RecordRow): CachedRecord => ({
  localId: row.local_id,
  region: row.region,
  recordID: row.record_id,
  ownerUserId: row.owner_user_id,
  status: row.status,
  document: JSON.parse(row.document) as MetadataRecord,
  serverUpdatedAt: row.server_updated_at,
  serverSnapshot: row.server_snapshot
    ? (JSON.parse(row.server_snapshot) as MetadataRecord)
    : null,
  syncState: row.sync_state,
  clientUpdatedAt: row.client_updated_at,
  scope: row.scope,
});

const toMutation = (row: MutationRow): Mutation => ({
  seq: row.seq,
  opId: row.op_id,
  kind: row.kind,
  region: row.region,
  targetLocalId: row.target_local_id,
  method: row.method,
  body: row.body ? JSON.parse(row.body) : null,
  ifUnmodifiedSince: row.if_unmodified_since,
  attempts: row.attempts,
  nextAttemptAt: row.next_attempt_at,
  status: row.status,
  lastError: row.last_error,
  wasRecovered: row.was_recovered === 1,
  createdAt: row.created_at,
  userId: row.user_id,
});

export async function initSchema(db: Database): Promise<void> {
  await db.execAsync(CREATE_TABLES);
}

// --- Records ---------------------------------------------------------------

export async function upsertRecord(db: Database, record: CachedRecord): Promise<void> {
  await db.runAsync(
    `INSERT INTO records
       (local_id, region, record_id, owner_user_id, status, document,
        server_updated_at, server_snapshot, sync_state, client_updated_at, scope)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(local_id) DO UPDATE SET
       region = excluded.region,
       record_id = excluded.record_id,
       owner_user_id = excluded.owner_user_id,
       status = excluded.status,
       document = excluded.document,
       server_updated_at = excluded.server_updated_at,
       server_snapshot = excluded.server_snapshot,
       sync_state = excluded.sync_state,
       client_updated_at = excluded.client_updated_at,
       scope = excluded.scope`,
    [
      record.localId,
      record.region,
      record.recordID,
      record.ownerUserId,
      record.status,
      JSON.stringify(record.document),
      record.serverUpdatedAt,
      record.serverSnapshot ? JSON.stringify(record.serverSnapshot) : null,
      record.syncState,
      record.clientUpdatedAt,
      record.scope,
    ],
  );
}

export async function getRecordByLocalId(
  db: Database,
  localId: string,
): Promise<CachedRecord | null> {
  const row = await db.getFirstAsync<RecordRow>(
    "SELECT * FROM records WHERE local_id = ?",
    [localId],
  );
  return row ? toRecord(row) : null;
}

/** Resolves either a server id or a local id, so stale links keep working. */
export async function getRecord(db: Database, id: string): Promise<CachedRecord | null> {
  const row = await db.getFirstAsync<RecordRow>(
    "SELECT * FROM records WHERE record_id = ? OR local_id = ? LIMIT 1",
    [id, id],
  );
  return row ? toRecord(row) : null;
}

export async function listRecords(
  db: Database,
  region: string,
  scope: RecordScope,
): Promise<CachedRecord[]> {
  const rows = await db.getAllAsync<RecordRow>(
    "SELECT * FROM records WHERE region = ? AND scope = ? ORDER BY client_updated_at DESC",
    [region, scope],
  );
  return rows.map(toRecord);
}

/**
 * Replaces a scope's cached rows with a fresh server list, without touching
 * anything that has unsynced local work. A server list is authoritative about
 * what exists remotely, not about edits the device has not sent yet.
 */
export async function replaceScope(
  db: Database,
  region: string,
  scope: RecordScope,
  records: CachedRecord[],
): Promise<void> {
  await db.runAsync(
    `DELETE FROM records
     WHERE region = ? AND scope = ? AND sync_state = 'synced'
       AND local_id NOT IN (SELECT target_local_id FROM mutations)`,
    [region, scope],
  );
  for (const record of records) {
    const existing = await db.getFirstAsync<RecordRow>(
      "SELECT sync_state FROM records WHERE local_id = ?",
      [record.localId],
    );
    // Never overwrite local work with a server row.
    if (existing && existing.sync_state !== "synced") continue;
    await upsertRecord(db, record);
  }
}

export async function setRecordSyncState(
  db: Database,
  localId: string,
  syncState: SyncState,
): Promise<void> {
  await db.runAsync("UPDATE records SET sync_state = ? WHERE local_id = ?", [
    syncState,
    localId,
  ]);
}

/** Called when a create finally lands and the server assigns an id. */
export async function attachServerId(
  db: Database,
  localId: string,
  recordID: string,
  serverUpdatedAt: string | null,
  snapshot: MetadataRecord,
): Promise<void> {
  await db.runAsync(
    `UPDATE records
     SET record_id = ?, server_updated_at = ?, server_snapshot = ?, sync_state = 'synced'
     WHERE local_id = ?`,
    [recordID, serverUpdatedAt, JSON.stringify(snapshot), localId],
  );
}

// --- Meta ------------------------------------------------------------------

export async function setMeta(db: Database, key: string, value: string): Promise<void> {
  await db.runAsync(
    "INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    [key, value],
  );
}

export async function getMeta(db: Database, key: string): Promise<string | null> {
  const row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM meta WHERE key = ?",
    [key],
  );
  return row?.value ?? null;
}

/** Wipes everything. Used on sign-out and when the offline window expires. */
export async function purgeAll(db: Database): Promise<void> {
  await db.execAsync("DELETE FROM records; DELETE FROM mutations; DELETE FROM meta;");
}

export { toMutation };
export type { MutationRow, RecordRow };
