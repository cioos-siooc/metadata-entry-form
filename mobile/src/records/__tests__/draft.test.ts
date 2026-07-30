import { afterEach, beforeEach, describe, expect, test } from "vitest";

import type { MetadataRecord } from "@/api/records";
import { getRecordByLocalId, listRecords, replaceScope, upsertRecord, type CachedRecord, type Database } from "@/offline/db";
import { freshDb } from "@/offline/__tests__/testDb";
import { listMutations } from "@/offline/queue";

import { autosaveDraft, createLocalRecord, saveDraft, setField } from "../draft";

let db: Database & { close: () => void };

beforeEach(async () => {
  db = await freshDb();
});
afterEach(() => db.close());

const blank = (): MetadataRecord =>
  ({ recordID: "", status: "", title: { en: "", fr: "" } }) as MetadataRecord;

const cached = (overrides: Partial<CachedRecord> = {}): CachedRecord => ({
  localId: "local-1",
  region: "pacific",
  recordID: "server-1",
  ownerUserId: "user-1",
  status: "",
  document: blank(),
  serverUpdatedAt: "2026-07-30T12:00:00.000Z",
  serverSnapshot: null,
  syncState: "synced",
  clientUpdatedAt: "2026-07-30T12:00:00.000Z",
  scope: "mine",
  ...overrides,
});

describe("autosave", () => {
  test("persists locally and queues nothing", async () => {
    // The whole point of separating the two: crash protection must not put an
    // op behind every keystroke.
    await upsertRecord(db, cached());
    await autosaveDraft(db, "local-1", { ...blank(), title: { en: "typing", fr: "" } });

    const record = await getRecordByLocalId(db, "local-1");
    expect(record?.document.title).toEqual({ en: "typing", fr: "" });
    expect(record?.syncState).toBe("draft");
    expect(await listMutations(db)).toHaveLength(0);
  });

  test("protects the draft from a background list refresh", async () => {
    // The failure this exists to prevent: a refresh landing mid-edit and
    // replacing the row the user is typing into.
    await upsertRecord(db, cached());
    await autosaveDraft(db, "local-1", { ...blank(), title: { en: "unsaved", fr: "" } });

    await replaceScope(db, "pacific", "mine", [cached({ document: blank() })]);

    const record = await getRecordByLocalId(db, "local-1");
    expect(record?.document.title).toEqual({ en: "unsaved", fr: "" });
  });

  test("does not clear a conflict", async () => {
    // Going back to `draft` would hide the conflict from the sync indicator.
    await upsertRecord(db, cached({ syncState: "conflict" }));
    await autosaveDraft(db, "local-1", { ...blank(), title: { en: "edit", fr: "" } });
    expect((await getRecordByLocalId(db, "local-1"))?.syncState).toBe("conflict");
  });

  test("is a no-op for an unknown record rather than creating one", async () => {
    await autosaveDraft(db, "ghost", blank());
    expect(await listRecords(db, "pacific", "mine")).toHaveLength(0);
  });
});

describe("saveDraft", () => {
  test("queues an update for a record that exists on the server", async () => {
    await upsertRecord(db, cached());
    await saveDraft(db, "local-1", { ...blank(), title: { en: "x", fr: "" } }, "user-1", "op-1");

    const [op] = await listMutations(db);
    expect(op.kind).toBe("record.update");
    expect(op.method).toBe("PUT");
    // Always carried, because the server's concurrency check is opt-in.
    expect(op.ifUnmodifiedSince).toBe("2026-07-30T12:00:00.000Z");
  });

  test("queues a create for a record that has never been sent", async () => {
    await createLocalRecord(db, "pacific", "user-1", blank(), "local-new");
    await saveDraft(db, "local-new", blank(), "user-1", "op-1");

    const [op] = await listMutations(db);
    expect(op.kind).toBe("record.create");
    expect(op.method).toBe("POST");
  });

  test("a create carries the idempotency key the server dedupes on", async () => {
    // Without it, a retry after a lost response duplicates the record.
    await createLocalRecord(db, "pacific", "user-1", blank(), "local-new");
    await saveDraft(db, "local-new", blank(), "user-1", "op-1");

    const [op] = await listMutations(db);
    expect((op.body as { clientRecordId?: string }).clientRecordId).toBe("local-new");
  });

  test("marks the record pending so the indicator can distinguish the states", async () => {
    await upsertRecord(db, cached());
    await saveDraft(db, "local-1", blank(), "user-1", "op-1");
    expect((await getRecordByLocalId(db, "local-1"))?.syncState).toBe("pending");
  });

  test("repeated saves coalesce into one queued op", async () => {
    await upsertRecord(db, cached());
    await saveDraft(db, "local-1", { ...blank(), title: { en: "1", fr: "" } }, "user-1", "op-1");
    await saveDraft(db, "local-1", { ...blank(), title: { en: "2", fr: "" } }, "user-1", "op-2");

    const ops = await listMutations(db);
    expect(ops).toHaveLength(1);
    expect((ops[0].body as MetadataRecord).title).toEqual({ en: "2", fr: "" });
  });
});

describe("createLocalRecord", () => {
  test("is immediately editable with no server round trip", async () => {
    const record = await createLocalRecord(db, "pacific", "user-1", blank(), "local-x");
    expect(record.recordID).toBeNull();
    expect(record.syncState).toBe("draft");
    expect(await getRecordByLocalId(db, "local-x")).not.toBeNull();
  });
});

describe("setField", () => {
  test("replaces wholesale, matching the server's whole-record PUT", async () => {
    // A deep merge here would silently diverge from what actually gets sent.
    const document = { ...blank(), map: { north: "1", south: "2" } } as MetadataRecord;
    const updated = setField(document, "map", { north: "9" });
    expect(updated.map).toEqual({ north: "9" });
    expect(document.map).toEqual({ north: "1", south: "2" });
  });
});
