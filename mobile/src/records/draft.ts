import * as Crypto from "expo-crypto";

import type { MetadataRecord } from "@/api/records";
import type { CachedRecord, Database } from "@/offline/db";
import type { SyncState } from "@/offline/schema";
import { getRecordByLocalId, upsertRecord } from "@/offline/db";
import { enqueue } from "@/offline/queue";

/**
 * Draft persistence.
 *
 * Ids come from expo-crypto: React Native has no `crypto.randomUUID`, and the
 * react-native-get-random-values polyfill only provides `getRandomValues`.
 *
 * Two distinct concepts that must not be conflated:
 *
 *   autosave — local crash protection, debounced, never touches the network.
 *   save     — an explicit server mutation, enqueued for the sync engine.
 *
 * Merging them would put a queue op behind every keystroke. Keeping them apart
 * is also why the sync indicator's copy is load-bearing: "Saved on this device"
 * and "Saved to CIOOS" are genuinely different states, and the field user needs
 * to know which one they are in.
 */

export const AUTOSAVE_DEBOUNCE_MS = 800;
/** Never let more than this much typing sit unsaved, however fast someone types. */
export const AUTOSAVE_MAX_WAIT_MS = 5_000;

/**
 * Writes the working document to local storage.
 *
 * Marks the record `draft`, which is what stops a background list refresh from
 * replacing it — replaceScope only deletes rows that are `synced` and unqueued.
 */
export async function autosaveDraft(
  db: Database,
  localId: string,
  document: MetadataRecord,
  now: string = new Date().toISOString(),
): Promise<void> {
  const existing = await getRecordByLocalId(db, localId);
  if (!existing) return;

  await upsertRecord(db, {
    ...existing,
    document,
    status: (document.status as string) ?? existing.status,
    // A conflicted record stays conflicted until the user resolves it; going
    // back to `draft` here would hide the conflict from the sync indicator.
    syncState: existing.syncState === "conflict" ? "conflict" : "draft",
    clientUpdatedAt: now,
  });
}

export interface SaveResult {
  queued: boolean;
  localId: string;
}

/**
 * Queues the record for the server.
 *
 * Chooses create or update from whether a server id exists yet, so a record
 * authored entirely offline needs no special handling by the caller.
 */
export async function saveDraft(
  db: Database,
  localId: string,
  document: MetadataRecord,
  userId: string,
  opId: string = Crypto.randomUUID(),
): Promise<SaveResult> {
  const record = await getRecordByLocalId(db, localId);
  if (!record) return { queued: false, localId };

  const isCreate = !record.recordID;

  await upsertRecord(db, {
    ...record,
    document,
    status: (document.status as string) ?? record.status,
    syncState: record.syncState === "conflict" ? "conflict" : "pending",
    clientUpdatedAt: new Date().toISOString(),
  });

  await enqueue(db, {
    opId,
    kind: isCreate ? "record.create" : "record.update",
    region: record.region,
    targetLocalId: localId,
    method: isCreate ? "POST" : "PUT",
    body: isCreate
      ? // The idempotency key the server dedupes on. Without it a retried
        // create after a lost response silently duplicates the record.
        { ...document, clientRecordId: localId }
      : document,
    ifUnmodifiedSince: record.serverUpdatedAt,
    userId,
  });

  return { queued: true, localId };
}

/** Creates a local-only record, ready to edit before it has ever been sent. */
export async function createLocalRecord(
  db: Database,
  region: string,
  userId: string,
  blank: MetadataRecord,
  localId: string = Crypto.randomUUID(),
): Promise<CachedRecord> {
  const now = new Date().toISOString();
  const record: CachedRecord = {
    localId,
    region,
    recordID: null,
    ownerUserId: userId,
    status: "",
    document: { ...blank, recordID: "" },
    serverUpdatedAt: null,
    serverSnapshot: null,
    syncState: "draft",
    clientUpdatedAt: now,
    scope: "mine",
  };
  await upsertRecord(db, record);
  return record;
}

/**
 * Sets one field, returning a new document.
 *
 * Deliberately shallow: record fields are replaced wholesale, matching the
 * server's whole-record PUT. A deep merge here would silently diverge from what
 * actually gets sent.
 */
export function setField(
  document: MetadataRecord,
  field: string,
  value: unknown,
): MetadataRecord {
  return { ...document, [field]: value };
}

/**
 * May a freshly fetched server copy replace what is on screen?
 *
 * Only when the local row has nothing of its own. A record whose edits have not
 * reached the server is *ahead* of it, and displaying the server's version there
 * is a lie that looks like data loss: the hub read "Untitled record, 0 of 3
 * required" while the editor one screen away read "3 of 3".
 *
 * Kept as a named rule rather than an inline condition because all four sync
 * states have to be considered, and three of them mean "keep mine".
 */
export function serverCopyWins(cached: { syncState: SyncState } | null): boolean {
  if (!cached) return true;
  return cached.syncState === "synced";
}
