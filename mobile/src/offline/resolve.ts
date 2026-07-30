import type { MetadataRecord } from "@/api/records";

import { autoMerge, type ConflictAnalysis } from "./conflict";
import {
  getRecordByLocalId,
  setRecordSyncState,
  upsertRecord,
  type Database,
} from "./db";
import { enqueue, listMutations } from "./queue";

/**
 * Applying a conflict decision.
 *
 * The engine detects and analyses; this is what actually unblocks the queue.
 * Without it a conflicted record sits forever with its op parked and no route
 * out, which is worse than a lost update because the user cannot even see why
 * nothing is syncing.
 */

export type Resolution = "mine" | "theirs" | "merge";

/** Clears the parked op for a target so the queue can move again. */
async function dropParkedOps(db: Database, localId: string): Promise<void> {
  const parked = await listMutations(db);
  for (const op of parked) {
    if (op.targetLocalId === localId && (op.status === "conflict" || op.status === "poison")) {
      await db.runAsync("DELETE FROM mutations WHERE seq = ?", [op.seq]);
    }
  }
}

/**
 * Resolves a conflict and, where the user chose to keep local work, re-queues it
 * against the server's current version.
 *
 * @param theirs The server's current document — the version we lost to.
 */
export async function resolveConflict(
  db: Database,
  localId: string,
  resolution: Resolution,
  analysis: ConflictAnalysis,
  theirs: MetadataRecord,
  serverUpdatedAt: string | null,
  userId: string,
  opId: string,
): Promise<void> {
  const record = await getRecordByLocalId(db, localId);
  if (!record) return;

  await dropParkedOps(db, localId);

  if (resolution === "theirs") {
    // Accept the server wholesale. The local edits are gone by explicit choice,
    // which is the only way they may ever be discarded.
    await upsertRecord(db, {
      ...record,
      document: theirs,
      status: (theirs.status as string) ?? record.status,
      serverUpdatedAt,
      serverSnapshot: theirs,
      syncState: "synced",
    });
    return;
  }

  // "Keep mine" means our changes win where the two disagree — NOT that our
  // whole document replaces theirs. Applying every differing field would push
  // our *base* value over a field only they changed, silently reverting it: a
  // second lost update caused by resolving the first.
  const oursToApply =
    resolution === "mine" ? [...analysis.localOnly, ...analysis.contested] : [];

  const resolved =
    resolution === "merge"
      ? autoMerge(analysis, theirs)
      : { ...theirs, ...Object.fromEntries(oursToApply.map((f) => [f.field, f.mine])) };

  await upsertRecord(db, {
    ...record,
    document: resolved,
    status: (resolved.status as string) ?? record.status,
    // Their updatedAt becomes our new base: the next PUT must carry it or the
    // server will reject us for exactly the same reason again.
    serverUpdatedAt,
    serverSnapshot: theirs,
    syncState: "pending",
  });

  await enqueue(db, {
    opId,
    kind: "record.update",
    region: record.region,
    targetLocalId: localId,
    method: "PUT",
    body: resolved,
    ifUnmodifiedSince: serverUpdatedAt,
    userId,
  });
}
