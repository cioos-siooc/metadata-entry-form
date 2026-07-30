import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { ApiError, NetworkError } from "@/api/errors";
import type { MetadataRecord } from "@/api/records";

import {
  getRecordByLocalId,
  upsertRecord,
  type CachedRecord,
  type Database,
} from "../db";
import { enqueue, listMutations, markInflight, recoverInflight } from "../queue";
import { flush, type SyncTransport } from "../sync";
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
  syncState: "pending",
  clientUpdatedAt: "2026-07-30T12:00:00.000Z",
  scope: "mine",
  ...overrides,
});

const stubTransport = (overrides: Partial<SyncTransport> = {}): SyncTransport => ({
  createRecord: vi.fn(async () => ({ recordID: "new-server-id", updatedAt: "T1" }) as MetadataRecord),
  saveRecord: vi.fn(async () => ({ recordID: "server-1", updatedAt: "T2" }) as MetadataRecord),
  setStatus: vi.fn(async () => ({ recordID: "server-1", updatedAt: "T3" }) as MetadataRecord),
  deleteRecord: vi.fn(async () => {}),
  getRecord: vi.fn(async () => ({ recordID: "server-1" }) as MetadataRecord),
  ...overrides,
});

const queue = (overrides: Partial<Parameters<typeof enqueue>[1]> = {}) =>
  enqueue(db, {
    opId: `op-${Math.random().toString(36).slice(2)}`,
    kind: "record.update",
    region: "pacific",
    targetLocalId: "local-1",
    method: "PUT",
    body: { title: { en: "edited", fr: "" } },
    userId: "user-1",
    ...overrides,
  });

describe("flushing an update", () => {
  test("sends, clears the op, and marks the record synced", async () => {
    await upsertRecord(db, cached());
    await queue();

    const transport = stubTransport();
    const result = await flush(db, transport);

    expect(result.sent).toBe(1);
    expect(await listMutations(db)).toHaveLength(0);
    expect((await getRecordByLocalId(db, "local-1"))?.syncState).toBe("synced");
  });

  test("always sends If-Unmodified-Since", async () => {
    // The server's concurrency check is opt-in: omitting the header turns a
    // lost update into a silent success.
    await upsertRecord(db, cached({ serverUpdatedAt: "2026-07-30T12:00:00.000Z" }));
    await queue();

    const transport = stubTransport();
    await flush(db, transport);

    expect(transport.saveRecord).toHaveBeenCalledWith(
      "pacific",
      "server-1",
      { title: { en: "edited", fr: "" } },
      "2026-07-30T12:00:00.000Z",
    );
  });
});

describe("flushing a create", () => {
  test("attaches the server id without changing the local key", async () => {
    await upsertRecord(db, cached({ recordID: null, syncState: "pending" }));
    await queue({ kind: "record.create", method: "POST", body: { title: { en: "new", fr: "" } } });

    await flush(db, stubTransport());

    const record = await getRecordByLocalId(db, "local-1");
    expect(record?.localId).toBe("local-1");
    expect(record?.recordID).toBe("new-server-id");
    expect(record?.syncState).toBe("synced");
  });

  test("a queued update behind a create sends after it, using the new id", async () => {
    // The payoff of storing no URL on the op: the path is resolved at flush
    // time, so the update needs no rewriting when the id appears.
    await upsertRecord(db, cached({ recordID: null }));
    await queue({ kind: "record.create", method: "POST", body: { v: 1 } });
    await queue({ kind: "record.status", body: { status: "submitted" } });

    const transport = stubTransport();
    await flush(db, transport);

    expect(transport.createRecord).toHaveBeenCalledTimes(1);
    expect(transport.setStatus).toHaveBeenCalledWith("pacific", "new-server-id", "submitted");
  });
});

describe("failures", () => {
  test("offline leaves the op queued for later", async () => {
    await upsertRecord(db, cached());
    await queue();

    const result = await flush(db, stubTransport({
      saveRecord: vi.fn(async () => {
        throw new NetworkError();
      }),
    }));

    expect(result.sent).toBe(0);
    const [op] = await listMutations(db);
    expect(op.status).toBe("pending");
    expect(op.attempts).toBe(1);
    expect(op.nextAttemptAt).not.toBeNull();
  });

  test("a 409 parks the record as conflicted", async () => {
    await upsertRecord(db, cached());
    await queue();

    const result = await flush(db, stubTransport({
      saveRecord: vi.fn(async () => {
        throw new ApiError(409, "Record was changed by someone else");
      }),
    }));

    expect(result.conflicts).toBe(1);
    expect((await listMutations(db))[0].status).toBe("conflict");
    expect((await getRecordByLocalId(db, "local-1"))?.syncState).toBe("conflict");
  });

  test("a 401 stops the run without burning attempts", async () => {
    await upsertRecord(db, cached());
    await queue();

    const result = await flush(db, stubTransport({
      saveRecord: vi.fn(async () => {
        throw new ApiError(401, "Invalid token");
      }),
    }));

    expect(result.authPaused).toBe(true);
    const [op] = await listMutations(db);
    expect(op.attempts).toBe(0);
    expect(op.status).toBe("pending");
  });

  test("a poison op is kept, and its record no longer blocks others", async () => {
    await upsertRecord(db, cached({ localId: "bad", recordID: "s-bad" }));
    await upsertRecord(db, cached({ localId: "good", recordID: "s-good" }));
    await queue({ targetLocalId: "bad" });
    await queue({ targetLocalId: "good" });

    const saveRecord = vi.fn(async (_region: string, recordID: string) => {
      if (recordID === "s-bad") throw new ApiError(422, "invalid");
      return { recordID, updatedAt: "T" } as MetadataRecord;
    });

    const result = await flush(db, stubTransport({ saveRecord }));

    // One record failing must not stall the other.
    expect(result.sent).toBe(1);
    expect(result.poisoned).toBe(1);
    const remaining = await listMutations(db);
    expect(remaining).toHaveLength(1);
    expect(remaining[0].targetLocalId).toBe("bad");
    expect(remaining[0].body).toEqual({ title: { en: "edited", fr: "" } });
  });
});

describe("crash recovery", () => {
  test("a recovered write that already landed is not reported as a conflict", async () => {
    // Killed after the request landed but before the response was applied.
    // Replaying produces a 409 against a version we wrote ourselves — telling
    // the user their work conflicts with itself would be nonsense.
    await upsertRecord(db, cached());
    const seq = await queue({ body: { title: { en: "edited", fr: "" } } });
    await markInflight(db, seq);
    await recoverInflight(db);

    const transport = stubTransport({
      saveRecord: vi.fn(async () => {
        throw new ApiError(409, "Record was changed by someone else");
      }),
      // The server already holds exactly what we tried to send.
      getRecord: vi.fn(
        async () =>
          ({
            title: { en: "edited", fr: "" },
            updatedAt: "T9",
          }) as unknown as MetadataRecord,
      ),
    });

    const result = await flush(db, transport);

    expect(result.conflicts).toBe(0);
    expect(result.sent).toBe(1);
    expect(await listMutations(db)).toHaveLength(0);
    expect((await getRecordByLocalId(db, "local-1"))?.syncState).toBe("synced");
  });

  test("a recovered write that did NOT land is still a real conflict", async () => {
    await upsertRecord(db, cached());
    const seq = await queue({ body: { title: { en: "mine", fr: "" } } });
    await markInflight(db, seq);
    await recoverInflight(db);

    const result = await flush(db, stubTransport({
      saveRecord: vi.fn(async () => {
        throw new ApiError(409, "changed");
      }),
      getRecord: vi.fn(
        async () => ({ title: { en: "someone else", fr: "" } }) as unknown as MetadataRecord,
      ),
    }));

    expect(result.conflicts).toBe(1);
    expect((await getRecordByLocalId(db, "local-1"))?.syncState).toBe("conflict");
  });
});

describe("guards", () => {
  test("a purged record poisons its op rather than crashing the flush", async () => {
    await queue({ targetLocalId: "vanished" });
    const result = await flush(db, stubTransport());
    expect(result.poisoned).toBe(1);
  });

  test("stops at maxOps so a huge backlog cannot block the app", async () => {
    for (let i = 0; i < 5; i += 1) {
      await upsertRecord(db, cached({ localId: `r-${i}`, recordID: `s-${i}` }));
      await queue({ targetLocalId: `r-${i}` });
    }
    const result = await flush(db, stubTransport(), { maxOps: 2 });
    expect(result.sent).toBe(2);
    expect(await listMutations(db)).toHaveLength(3);
  });
});
