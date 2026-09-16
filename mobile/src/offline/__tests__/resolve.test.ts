import { afterEach, beforeEach, describe, expect, test } from "vitest";

import type { MetadataRecord } from "@/api/records";

import { analyseConflict } from "../conflict";
import {
  getRecordByLocalId,
  upsertRecord,
  type CachedRecord,
  type Database,
} from "../db";
import { listMutations, recordFailure, enqueue } from "../queue";
import { resolveConflict } from "../resolve";
import { freshDb } from "./testDb";

let db: Database & { close: () => void };

beforeEach(async () => {
  db = await freshDb();
});
afterEach(() => db.close());

const doc = (fields: Record<string, unknown>): MetadataRecord =>
  ({ recordID: "s-1", status: "", title: { en: "Base", fr: "" }, ...fields }) as MetadataRecord;

const BASE = doc({ progress: "onGoing", license: "" });
const MINE = doc({ progress: "onGoing", license: "CC-BY-4.0" });
const THEIRS = doc({ progress: "completed", license: "", updatedAt: "T-new" });

const cached = (overrides: Partial<CachedRecord> = {}): CachedRecord => ({
  localId: "local-1",
  region: "pacific",
  recordID: "s-1",
  ownerUserId: "user-1",
  status: "",
  document: MINE,
  serverUpdatedAt: "T-old",
  serverSnapshot: BASE,
  syncState: "conflict",
  clientUpdatedAt: "T-old",
  scope: "mine",
  ...overrides,
});

/** Reproduces the state the sync engine leaves behind on a 409. */
async function conflicted() {
  await upsertRecord(db, cached());
  await enqueue(db, {
    opId: "op-original",
    kind: "record.update",
    region: "pacific",
    targetLocalId: "local-1",
    method: "PUT",
    body: MINE,
    userId: "user-1",
  });
  const [op] = await listMutations(db);
  await recordFailure(db, op, "conflict", "changed by someone else");
}

describe("resolveConflict", () => {
  test("keep theirs discards local work — but only by explicit choice", async () => {
    await conflicted();
    const analysis = analyseConflict(BASE, MINE, THEIRS);

    await resolveConflict(db, "local-1", "theirs", analysis, THEIRS, "T-new", "user-1", "op-new");

    const record = await getRecordByLocalId(db, "local-1");
    expect(record?.document.progress).toBe("completed");
    expect(record?.document.license).toBe("");
    expect(record?.syncState).toBe("synced");
    // Nothing to send: we accepted the server's version.
    expect(await listMutations(db)).toHaveLength(0);
  });

  test("keep both merges non-overlapping changes and re-queues", async () => {
    await conflicted();
    const analysis = analyseConflict(BASE, MINE, THEIRS);
    expect(analysis.autoMergeable).toBe(true);

    await resolveConflict(db, "local-1", "merge", analysis, THEIRS, "T-new", "user-1", "op-new");

    const record = await getRecordByLocalId(db, "local-1");
    // Their change survives...
    expect(record?.document.progress).toBe("completed");
    // ...and so does ours.
    expect(record?.document.license).toBe("CC-BY-4.0");
    expect(record?.syncState).toBe("pending");

    const ops = await listMutations(db);
    expect(ops).toHaveLength(1);
    // Rebased: the next PUT must carry *their* updatedAt or the server rejects
    // it for exactly the same reason again.
    expect(ops[0].ifUnmodifiedSince).toBe("T-new");
  });

  test("keep mine rebases onto their version rather than reverting it", async () => {
    // The subtle part. Sending our old document wholesale would silently undo
    // remote-only changes — a second lost update caused by resolving the first.
    await conflicted();
    const analysis = analyseConflict(BASE, MINE, THEIRS);

    await resolveConflict(db, "local-1", "mine", analysis, THEIRS, "T-new", "user-1", "op-new");

    const record = await getRecordByLocalId(db, "local-1");
    expect(record?.document.license).toBe("CC-BY-4.0");
    // `progress` was changed only on the server and we did not touch it, so it
    // must survive even though the user chose "keep mine".
    expect(record?.document.progress).toBe("completed");
  });

  test("keep mine wins a genuinely contested field", async () => {
    const theirs = doc({ progress: "historicalArchive", updatedAt: "T-new" });
    const mine = doc({ progress: "completed" });
    await upsertRecord(db, cached({ document: mine }));
    const analysis = analyseConflict(BASE, mine, theirs);
    expect(analysis.contested.map((f) => f.field)).toContain("progress");

    await resolveConflict(db, "local-1", "mine", analysis, theirs, "T-new", "user-1", "op-new");
    expect((await getRecordByLocalId(db, "local-1"))?.document.progress).toBe("completed");
  });

  test("clears the parked op so the queue can move again", async () => {
    // Without this the record sits forever with a conflicted op and no route
    // out — worse than a lost update, because nothing explains the silence.
    await conflicted();
    expect((await listMutations(db))[0].status).toBe("conflict");

    await resolveConflict(
      db,
      "local-1",
      "theirs",
      analyseConflict(BASE, MINE, THEIRS),
      THEIRS,
      "T-new",
      "user-1",
      "op-new",
    );

    const remaining = await listMutations(db);
    expect(remaining.filter((op) => op.status === "conflict")).toHaveLength(0);
  });

  test("is a no-op for a record that no longer exists", async () => {
    await resolveConflict(
      db,
      "ghost",
      "mine",
      analyseConflict(BASE, MINE, THEIRS),
      THEIRS,
      "T-new",
      "user-1",
      "op-new",
    );
    expect(await listMutations(db)).toHaveLength(0);
  });
});
