import { afterEach, beforeEach, describe, expect, test } from "vitest";

import type { MetadataRecord } from "@/api/records";

import {
  attachServerId,
  getMeta,
  getRecord,
  getRecordByLocalId,
  listRecords,
  purgeAll,
  replaceScope,
  setMeta,
  setRecordSyncState,
  upsertRecord,
  type CachedRecord,
  type Database,
} from "../db";
import { enqueue, listMutations } from "../queue";
import { freshDb } from "./testDb";

let db: Database & { close: () => void };

beforeEach(async () => {
  db = await freshDb();
});
afterEach(() => db.close());

const cached = (overrides: Partial<CachedRecord> = {}): CachedRecord => ({
  localId: "local-1",
  region: "pacific",
  recordID: "server-1",
  ownerUserId: "user-1",
  status: "",
  document: { recordID: "server-1", status: "", title: { en: "A", fr: "" } } as MetadataRecord,
  serverUpdatedAt: "2026-07-30T12:00:00.000Z",
  serverSnapshot: null,
  syncState: "synced",
  clientUpdatedAt: "2026-07-30T12:00:00.000Z",
  scope: "mine",
  ...overrides,
});

describe("record cache", () => {
  test("round-trips a record including its nested document", async () => {
    await upsertRecord(db, cached());
    const found = await getRecordByLocalId(db, "local-1");
    expect(found?.document.title).toEqual({ en: "A", fr: "" });
    expect(found?.serverUpdatedAt).toBe("2026-07-30T12:00:00.000Z");
  });

  test("upsert replaces rather than duplicating", async () => {
    await upsertRecord(db, cached());
    await upsertRecord(db, cached({ status: "submitted" }));
    const all = await listRecords(db, "pacific", "mine");
    expect(all).toHaveLength(1);
    expect(all[0].status).toBe("submitted");
  });

  test("resolves by server id or local id, so stale links keep working", async () => {
    // A record created offline is navigated to by local id; after it syncs the
    // same screen may still be holding that id.
    await upsertRecord(db, cached());
    expect((await getRecord(db, "server-1"))?.localId).toBe("local-1");
    expect((await getRecord(db, "local-1"))?.localId).toBe("local-1");
    expect(await getRecord(db, "nope")).toBeNull();
  });

  test("lists are scoped by region and scope", async () => {
    await upsertRecord(db, cached({ localId: "a", scope: "mine" }));
    await upsertRecord(db, cached({ localId: "b", recordID: "s-b", scope: "shared" }));
    await upsertRecord(db, cached({ localId: "c", recordID: "s-c", region: "atlantic" }));

    expect(await listRecords(db, "pacific", "mine")).toHaveLength(1);
    expect(await listRecords(db, "pacific", "shared")).toHaveLength(1);
    expect(await listRecords(db, "atlantic", "mine")).toHaveLength(1);
  });
});

describe("replaceScope", () => {
  test("replaces synced rows with the server's list", async () => {
    await upsertRecord(db, cached({ localId: "old", recordID: "s-old" }));
    await replaceScope(db, "pacific", "mine", [
      cached({ localId: "new", recordID: "s-new" }),
    ]);

    const all = await listRecords(db, "pacific", "mine");
    expect(all.map((r) => r.localId)).toEqual(["new"]);
  });

  test("never destroys a record with unsynced local edits", async () => {
    // The critical property. A server list is authoritative about what exists
    // remotely, not about work this device has not sent yet — losing a draft
    // to a background refresh would be the worst bug this app could have.
    await upsertRecord(db, cached({ localId: "dirty", syncState: "draft" }));

    await replaceScope(db, "pacific", "mine", [
      cached({ localId: "fresh", recordID: "s-fresh" }),
    ]);

    const all = await listRecords(db, "pacific", "mine");
    expect(all.map((r) => r.localId).sort()).toEqual(["dirty", "fresh"]);
    expect(all.find((r) => r.localId === "dirty")?.syncState).toBe("draft");
  });

  test("never destroys a record with a queued mutation", async () => {
    // Marked synced, but a queued op still references it — deleting the row
    // would leave the queue pointing at nothing.
    await upsertRecord(db, cached({ localId: "queued", syncState: "synced" }));
    await enqueue(db, {
      opId: "op-1",
      kind: "record.update",
      region: "pacific",
      targetLocalId: "queued",
      method: "PUT",
      body: {},
      userId: "user-1",
    });

    await replaceScope(db, "pacific", "mine", []);

    expect(await getRecordByLocalId(db, "queued")).not.toBeNull();
    expect(await listMutations(db)).toHaveLength(1);
  });

  test("a server row does not overwrite local edits to the same record", async () => {
    await upsertRecord(db, cached({ localId: "local-1", syncState: "draft", status: "" }));

    await replaceScope(db, "pacific", "mine", [
      cached({ localId: "local-1", status: "published" }),
    ]);

    const found = await getRecordByLocalId(db, "local-1");
    expect(found?.status).toBe("");
    expect(found?.syncState).toBe("draft");
  });
});

describe("attachServerId", () => {
  test("fills in the server id without changing the local key", async () => {
    // The payoff of keeping localId as the primary key: nothing that references
    // this record has to be rewritten when it finally syncs.
    await upsertRecord(db, cached({ localId: "local-9", recordID: null, syncState: "pending" }));

    await attachServerId(db, "local-9", "server-9", "2026-08-01T00:00:00.000Z", {
      recordID: "server-9",
    } as MetadataRecord);

    const found = await getRecordByLocalId(db, "local-9");
    expect(found?.localId).toBe("local-9");
    expect(found?.recordID).toBe("server-9");
    expect(found?.syncState).toBe("synced");
    expect(found?.serverSnapshot).toEqual({ recordID: "server-9" });
  });
});

describe("meta and purge", () => {
  test("stores and overwrites keys", async () => {
    await setMeta(db, "lastSync:pacific", "2026-07-30T12:00:00.000Z");
    await setMeta(db, "lastSync:pacific", "2026-07-31T12:00:00.000Z");
    expect(await getMeta(db, "lastSync:pacific")).toBe("2026-07-31T12:00:00.000Z");
    expect(await getMeta(db, "missing")).toBeNull();
  });

  test("purge clears everything, including queued work", async () => {
    // Used on sign-out and when the offline window expires. A stale queue
    // belonging to a previous user must never survive.
    await upsertRecord(db, cached());
    await enqueue(db, {
      opId: "op-1",
      kind: "record.update",
      region: "pacific",
      targetLocalId: "local-1",
      method: "PUT",
      userId: "user-1",
    });
    await setMeta(db, "k", "v");

    await purgeAll(db);

    expect(await listRecords(db, "pacific", "mine")).toHaveLength(0);
    expect(await listMutations(db)).toHaveLength(0);
    expect(await getMeta(db, "k")).toBeNull();
  });
});

describe("sync state", () => {
  test("can be moved without rewriting the document", async () => {
    await upsertRecord(db, cached());
    await setRecordSyncState(db, "local-1", "conflict");
    const found = await getRecordByLocalId(db, "local-1");
    expect(found?.syncState).toBe("conflict");
    expect(found?.document.title).toEqual({ en: "A", fr: "" });
  });
});
