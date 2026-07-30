import { ApiError } from "@/api/errors";
import type { MetadataRecord } from "@/api/records";

import {
  attachServerId,
  getRecordByLocalId,
  setRecordSyncState,
  upsertRecord,
  type Database,
  type Mutation,
} from "./db";
import {
  blockedTargets,
  classify,
  completeMutation,
  markInflight,
  nextReadyMutation,
  recordFailure,
} from "./queue";

/**
 * The flush loop.
 *
 * Transport is injected rather than imported so the whole engine can be driven
 * in tests against an in-memory database with no network and no mocking
 * framework — this is the part of the app where a subtle bug quietly destroys
 * someone's fieldwork, so it needs to be exercised properly.
 */

export interface SyncTransport {
  createRecord(region: string, body: unknown): Promise<MetadataRecord>;
  saveRecord(
    region: string,
    recordID: string,
    body: unknown,
    ifUnmodifiedSince?: string,
  ): Promise<MetadataRecord>;
  setStatus(region: string, recordID: string, status: string): Promise<MetadataRecord>;
  deleteRecord(region: string, recordID: string): Promise<void>;
  getRecord(region: string, recordID: string): Promise<MetadataRecord>;
}

export interface FlushResult {
  sent: number;
  conflicts: number;
  poisoned: number;
  /** Set when a 401 stopped the run; the caller should re-auth and retry. */
  authPaused: boolean;
}

const equalDocuments = (a: unknown, b: unknown) =>
  JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

/**
 * Sends one mutation.
 *
 * Paths are resolved here, from the records row, rather than being stored on
 * the op — which is what makes a create returning a server id a no-op for
 * everything queued behind it.
 */
async function send(
  db: Database,
  transport: SyncTransport,
  mutation: Mutation,
): Promise<void> {
  const record = await getRecordByLocalId(db, mutation.targetLocalId);
  if (!record) {
    // The record was purged out from under the queue. Nothing to send.
    throw new ApiError(404, "Local record no longer exists");
  }

  if (mutation.kind === "record.create") {
    const created = await transport.createRecord(mutation.region, mutation.body);
    await attachServerId(
      db,
      mutation.targetLocalId,
      created.recordID,
      created.updatedAt ?? null,
      created,
    );
    return;
  }

  if (!record.recordID) {
    // An update queued behind a create that has not landed. Per-record FIFO
    // should make this unreachable; treat it as retryable rather than losing
    // the edit.
    throw new ApiError(503, "Waiting for the record to be created");
  }

  if (mutation.kind === "record.delete") {
    await transport.deleteRecord(mutation.region, record.recordID);
    await completeMutation(db, mutation.seq);
    return;
  }

  const updated =
    mutation.kind === "record.status"
      ? await transport.setStatus(
          mutation.region,
          record.recordID,
          (mutation.body as { status: string }).status,
        )
      : await transport.saveRecord(
          mutation.region,
          record.recordID,
          mutation.body,
          // Always sent. The server's check is opt-in, so omitting it turns a
          // lost update into a silent success.
          record.serverUpdatedAt ?? undefined,
        );

  await upsertRecord(db, {
    ...record,
    document: updated,
    status: updated.status ?? record.status,
    serverUpdatedAt: updated.updatedAt ?? null,
    serverSnapshot: updated,
    syncState: "synced",
  });
}

/**
 * A 409 on a recovered op may be an echo of our own earlier attempt.
 *
 * If the process was killed after the request landed but before the response
 * was applied, replaying it produces a 409 against a version we ourselves
 * wrote. Fetch the server's copy and check before telling the user their work
 * conflicts with itself.
 */
async function recoveredWriteAlreadyLanded(
  transport: SyncTransport,
  mutation: Mutation,
  recordID: string,
): Promise<MetadataRecord | null> {
  try {
    const current = await transport.getRecord(mutation.region, recordID);
    return equalDocuments(stripVolatile(current), stripVolatile(mutation.body))
      ? current
      : null;
  } catch {
    return null;
  }
}

const VOLATILE = ["updatedAt", "created", "lastEditedBy", "userinfo", "sharedWith"];
function stripVolatile(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;
  const copy = { ...(value as Record<string, unknown>) };
  for (const key of VOLATILE) delete copy[key];
  return copy;
}

/** Sends ready mutations until none remain or the session fails. */
export async function flush(
  db: Database,
  transport: SyncTransport,
  options: { now?: () => string; maxOps?: number } = {},
): Promise<FlushResult> {
  const now = options.now ?? (() => new Date().toISOString());
  const maxOps = options.maxOps ?? 200;

  const result: FlushResult = { sent: 0, conflicts: 0, poisoned: 0, authPaused: false };
  const blocked = await blockedTargets(db);

  for (let i = 0; i < maxOps; i += 1) {
    const mutation = await nextReadyMutation(db, { now: now(), blocked });
    if (!mutation) break;

    await markInflight(db, mutation.seq);

    try {
      await send(db, transport, mutation);
      await completeMutation(db, mutation.seq);
      result.sent += 1;
    } catch (error) {
      const disposition = classify(error, mutation.attempts);

      if (disposition === "conflict" && mutation.wasRecovered) {
        const record = await getRecordByLocalId(db, mutation.targetLocalId);
        const landed =
          record?.recordID &&
          (await recoveredWriteAlreadyLanded(transport, mutation, record.recordID));
        if (landed && record) {
          // Our own write, echoed back. Not a conflict.
          await upsertRecord(db, {
            ...record,
            document: landed,
            serverUpdatedAt: landed.updatedAt ?? null,
            serverSnapshot: landed,
            syncState: "synced",
          });
          await completeMutation(db, mutation.seq);
          result.sent += 1;
          continue;
        }
      }

      const message = error instanceof Error ? error.message : String(error);
      await recordFailure(db, mutation, disposition, message);

      if (disposition === "authPaused") {
        result.authPaused = true;
        break;
      }
      if (disposition === "conflict") {
        result.conflicts += 1;
        blocked.add(mutation.targetLocalId);
        await setRecordSyncState(db, mutation.targetLocalId, "conflict");
      }
      if (disposition === "poison") {
        result.poisoned += 1;
        blocked.add(mutation.targetLocalId);
      }
      // A retry stays pending with its backoff; the loop moves to another
      // record rather than spinning on this one.
      if (disposition === "retry") blocked.add(mutation.targetLocalId);
    }
  }

  return result;
}
