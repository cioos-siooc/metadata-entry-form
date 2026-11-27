import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { ApiError, NetworkError, TimeoutError } from "@/api/errors";

import type { Database } from "../db";
import {
  MAX_ATTEMPTS,
  MAX_BACKOFF_MS,
  backoffMs,
  blockedTargets,
  classify,
  completeMutation,
  enqueue,
  listMutations,
  markInflight,
  nextReadyMutation,
  queueStats,
  recordFailure,
  recoverInflight,
} from "../queue";
import { freshDb } from "./testDb";

let db: Database & { close: () => void };

beforeEach(async () => {
  db = await freshDb();
});
afterEach(() => db.close());

const op = (overrides: Partial<Parameters<typeof enqueue>[1]> = {}) => ({
  opId: `op-${Math.random().toString(36).slice(2)}`,
  kind: "record.update" as const,
  region: "pacific",
  targetLocalId: "local-1",
  method: "PUT",
  body: { title: { en: "a", fr: "" } },
  userId: "user-1",
  ...overrides,
});

describe("classify", () => {
  test("retries only transient failures", () => {
    expect(classify(new NetworkError(), 0)).toBe("retry");
    expect(classify(new TimeoutError(20_000), 0)).toBe("retry");
    for (const status of [429, 500, 502, 503, 504]) {
      expect(classify(new ApiError(status, "x"), 0), String(status)).toBe("retry");
    }
  });

  test("treats client errors as poison — they will never succeed", () => {
    for (const status of [400, 403, 404, 422]) {
      expect(classify(new ApiError(status, "x"), 0), String(status)).toBe("poison");
    }
  });

  test("pauses on 401 instead of consuming attempts", () => {
    // The op is fine; the session is not. Burning attempts here would poison
    // perfectly good work just because a token expired.
    expect(classify(new ApiError(401, "x"), 0)).toBe("authPaused");
  });

  test("routes 409 to conflict, not poison", () => {
    expect(classify(new ApiError(409, "changed"), 0)).toBe("conflict");
  });

  test("gives up on a retryable failure eventually", () => {
    expect(classify(new NetworkError(), MAX_ATTEMPTS)).toBe("poison");
  });

  test("an unrecognised throwable is poison, not an infinite retry", () => {
    expect(classify(new Error("bug"), 0)).toBe("poison");
  });
});

describe("backoff", () => {
  test("grows exponentially and caps", () => {
    const fixed = () => 0.5; // no jitter
    expect(backoffMs(1, fixed)).toBe(5_000);
    expect(backoffMs(2, fixed)).toBe(10_000);
    expect(backoffMs(3, fixed)).toBe(20_000);
    expect(backoffMs(20, fixed)).toBe(MAX_BACKOFF_MS);
  });

  test("jitters, so a boat regaining signal doesn't retry in lockstep", () => {
    const low = backoffMs(3, () => 0);
    const high = backoffMs(3, () => 1);
    expect(low).toBeLessThan(high);
    expect(low).toBeGreaterThan(0);
  });
});

describe("coalescing", () => {
  test("successive updates to one record collapse into a single op", async () => {
    // Mandatory, not an optimisation: a whole-record PUT is last-write-wins by
    // nature, and 20 minutes of offline editing would otherwise queue hundreds
    // of identical-effect requests.
    await enqueue(db, op({ body: { v: 1 } }));
    await enqueue(db, op({ body: { v: 2 } }));
    await enqueue(db, op({ body: { v: 3 } }));

    const queued = await listMutations(db);
    expect(queued).toHaveLength(1);
    expect(queued[0].body).toEqual({ v: 3 });
  });

  test("an update folds into a pending create without changing its kind", async () => {
    // The record still does not exist server-side, so it must remain a create —
    // but it should carry the newest body.
    await enqueue(db, op({ kind: "record.create", method: "POST", body: { v: 1 } }));
    await enqueue(db, op({ body: { v: 2 } }));

    const queued = await listMutations(db);
    expect(queued).toHaveLength(1);
    expect(queued[0].kind).toBe("record.create");
    expect(queued[0].body).toEqual({ v: 2 });
  });

  test("never coalesces across a status transition", async () => {
    await enqueue(db, op({ body: { v: 1 } }));
    await enqueue(db, op({ kind: "record.status", body: { status: "submitted" } }));
    await enqueue(db, op({ body: { v: 2 } }));

    const queued = await listMutations(db);
    expect(queued.map((m) => m.kind)).toEqual([
      "record.update",
      "record.status",
      "record.update",
    ]);
  });

  test("does not coalesce across different records", async () => {
    await enqueue(db, op({ targetLocalId: "local-1" }));
    await enqueue(db, op({ targetLocalId: "local-2" }));
    expect(await listMutations(db)).toHaveLength(2);
  });

  test("coalescing resets backoff, so a fresh edit is tried immediately", async () => {
    const seq = await enqueue(db, op());
    const [queued] = await listMutations(db);
    await recordFailure(db, queued, "retry", "offline");

    await enqueue(db, op({ body: { v: 99 } }));
    const [after] = await listMutations(db);
    expect(after.seq).toBe(seq);
    expect(after.attempts).toBe(0);
    expect(after.nextAttemptAt).toBeNull();
  });
});

describe("ordering", () => {
  test("is FIFO within a record", async () => {
    await enqueue(db, op({ kind: "record.create", method: "POST" }));
    await enqueue(db, op({ kind: "record.status", body: { status: "submitted" } }));

    const first = await nextReadyMutation(db);
    expect(first?.kind).toBe("record.create");
  });

  test("one record's stuck op does not block another record", async () => {
    // The reason ordering is per-record rather than global: a week of field
    // work must not be held hostage by one bad record.
    await enqueue(db, op({ targetLocalId: "stuck" }));
    await enqueue(db, op({ targetLocalId: "fine" }));

    const blocked = new Set(["stuck"]);
    const next = await nextReadyMutation(db, { blocked });
    expect(next?.targetLocalId).toBe("fine");
  });

  test("respects backoff timing", async () => {
    await enqueue(db, op());
    const [queued] = await listMutations(db);
    await recordFailure(db, queued, "retry", "offline", { now: Date.parse("2026-07-30T12:00:00Z") });

    const tooSoon = await nextReadyMutation(db, { now: "2026-07-30T12:00:01Z" });
    expect(tooSoon).toBeNull();

    const later = await nextReadyMutation(db, { now: "2026-07-30T13:00:00Z" });
    expect(later).not.toBeNull();
  });

  test("skips conflicted and poisoned targets", async () => {
    await enqueue(db, op({ targetLocalId: "bad" }));
    const [queued] = await listMutations(db);
    await recordFailure(db, queued, "conflict", "changed by someone else");

    expect(await nextReadyMutation(db, { blocked: await blockedTargets(db) })).toBeNull();
  });
});

describe("failure handling", () => {
  test("a poisoned op is parked, never deleted", async () => {
    // It holds the user's typing. Deleting it would silently destroy work.
    await enqueue(db, op());
    const [queued] = await listMutations(db);
    await recordFailure(db, queued, "poison", "422 invalid");

    const after = await listMutations(db);
    expect(after).toHaveLength(1);
    expect(after[0].status).toBe("poison");
    expect(after[0].body).toEqual({ title: { en: "a", fr: "" } });
  });

  test("an auth pause does not consume attempts", async () => {
    await enqueue(db, op());
    const [queued] = await listMutations(db);
    await recordFailure(db, queued, "authPaused", "401");

    const [after] = await listMutations(db);
    expect(after.attempts).toBe(0);
    expect(after.status).toBe("pending");
  });

  test("a conflict parks the op for the user to resolve", async () => {
    await enqueue(db, op());
    const [queued] = await listMutations(db);
    await recordFailure(db, queued, "conflict", "stale");

    expect((await listMutations(db))[0].status).toBe("conflict");
    expect(await blockedTargets(db)).toContain("local-1");
  });

  test("a successful op is removed", async () => {
    const seq = await enqueue(db, op());
    await completeMutation(db, seq);
    expect(await listMutations(db)).toHaveLength(0);
  });
});

describe("crash recovery", () => {
  test("in-flight ops are reset and flagged as recovered", async () => {
    // Every kill resolves to "inflight, outcome unknown". Replay is safe
    // because creates are idempotent server-side and updates are whole-record
    // PUTs — but the flusher needs to know to check before trusting a 409.
    const seq = await enqueue(db, op());
    await markInflight(db, seq);

    expect(await nextReadyMutation(db)).toBeNull(); // inflight is not pending

    const recovered = await recoverInflight(db);
    expect(recovered).toBe(1);

    const [after] = await listMutations(db);
    expect(after.status).toBe("pending");
    expect(after.wasRecovered).toBe(true);
    expect(await nextReadyMutation(db)).not.toBeNull();
  });

  test("recovery leaves already-pending ops alone", async () => {
    await enqueue(db, op());
    expect(await recoverInflight(db)).toBe(0);
  });
});

describe("queueStats", () => {
  test("counts what the sync indicator needs", async () => {
    await enqueue(db, op({ targetLocalId: "a" }));
    await enqueue(db, op({ targetLocalId: "b" }));
    await enqueue(db, op({ targetLocalId: "c" }));

    const all = await listMutations(db);
    await recordFailure(db, all[1], "conflict", "stale");
    await recordFailure(db, all[2], "poison", "422");

    expect(await queueStats(db)).toEqual({
      pending: 1,
      failed: 0,
      conflicts: 1,
      poison: 1,
    });
  });
});
