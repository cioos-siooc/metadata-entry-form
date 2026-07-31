import { ApiError } from "@/api/errors";

import { toMutation, type Database, type Mutation, type MutationRow } from "./db";
import type { MutationKind, MutationStatus } from "./schema";

/**
 * The mutation queue.
 *
 * Ops store no URL. Paths and If-Unmodified-Since are recomputed from the
 * records row at flush time, so when a create finally returns a server id there
 * is nothing queued to rewrite — which is the whole reason `localId` is the
 * permanent key and `recordID` is a nullable column.
 */

/** Retries stop escalating here; a device offline for a week shouldn't wait hours. */
export const MAX_BACKOFF_MS = 5 * 60 * 1000;
export const BASE_BACKOFF_MS = 5_000;
/** Past this many retryable failures, an op is parked rather than retried forever. */
export const MAX_ATTEMPTS = 8;

export interface EnqueueInput {
  opId: string;
  kind: MutationKind;
  region: string;
  targetLocalId: string;
  method: string;
  body?: unknown;
  ifUnmodifiedSince?: string | null;
  userId: string;
  now?: string;
}

/**
 * Backoff with jitter.
 *
 * Jitter matters more than usual here: a boat regaining signal reconnects every
 * device at once, and without it they would all retry in lockstep.
 */
export function backoffMs(attempts: number, random: () => number = Math.random): number {
  const exponential = Math.min(MAX_BACKOFF_MS, BASE_BACKOFF_MS * 2 ** Math.max(0, attempts - 1));
  const jitter = 0.8 + random() * 0.4; // ±20%
  return Math.round(exponential * jitter);
}

export type Disposition = "retry" | "poison" | "conflict" | "authPaused";

/**
 * How to treat a failure.
 *
 * The distinction the web SPA cannot make, because it lets fetch rejections
 * escape as bare TypeErrors with no status.
 */
export function classify(error: unknown, attempts: number): Disposition {
  if (!(error instanceof ApiError)) return "poison";

  // Pause everything rather than burning attempts: the token is gone and every
  // other op would fail identically.
  if (error.isAuthFailure) return "authPaused";

  // The server said our version is stale. Park this target for the user.
  if (error.status === 409) return "conflict";

  if (error.isRetryable) {
    return attempts >= MAX_ATTEMPTS ? "poison" : "retry";
  }

  // 400/403/404/422 will fail identically forever.
  return "poison";
}

/**
 * Adds an op, coalescing where it is safe to.
 *
 * Coalescing is mandatory rather than an optimisation: `record.update` is a
 * whole-record PUT, so successive edits are last-write-wins by nature, and a
 * twenty-minute offline session would otherwise queue hundreds of PUTs that all
 * do the same thing on flush.
 *
 * Never coalesces across a status transition, and never touches an op already
 * in flight.
 */
export async function enqueue(db: Database, input: EnqueueInput): Promise<number> {
  const now = input.now ?? new Date().toISOString();

  if (input.kind === "record.update") {
    const tail = await db.getFirstAsync<MutationRow>(
      `SELECT * FROM mutations
       WHERE target_local_id = ? AND status = 'pending'
       ORDER BY seq DESC LIMIT 1`,
      [input.targetLocalId],
    );

    if (tail && (tail.kind === "record.update" || tail.kind === "record.create")) {
      // Fold into the pending op. A create keeps its kind — the record still
      // does not exist on the server — but carries the newest body.
      await db.runAsync(
        `UPDATE mutations
         SET body = ?, if_unmodified_since = ?, attempts = 0, next_attempt_at = NULL,
             status = 'pending', last_error = NULL
         WHERE seq = ?`,
        [
          JSON.stringify(input.body ?? null),
          input.ifUnmodifiedSince ?? tail.if_unmodified_since,
          tail.seq,
        ],
      );
      return tail.seq;
    }
  }

  const result = await db.runAsync(
    `INSERT INTO mutations
       (op_id, kind, region, target_local_id, method, body, if_unmodified_since,
        attempts, next_attempt_at, status, last_error, was_recovered, created_at, user_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0, NULL, 'pending', NULL, 0, ?, ?)`,
    [
      input.opId,
      input.kind,
      input.region,
      input.targetLocalId,
      input.method,
      input.body === undefined ? null : JSON.stringify(input.body),
      input.ifUnmodifiedSince ?? null,
      now,
      input.userId,
    ],
  );
  return result.lastInsertRowId;
}

/**
 * The next op to send, honouring per-record ordering.
 *
 * FIFO within a record — an update must never overtake the create that gives
 * the record its server id — but records do not block each other, so one poison
 * op cannot stall a week of work on everything else.
 *
 * `blocked` carries targets parked by a conflict or an unresolved poison op.
 */
export async function nextReadyMutation(
  db: Database,
  options: { now?: string; blocked?: Set<string> } = {},
): Promise<Mutation | null> {
  const now = options.now ?? new Date().toISOString();
  const blocked = options.blocked ?? new Set<string>();

  const rows = await db.getAllAsync<MutationRow>(
    `SELECT * FROM mutations
     WHERE status = 'pending' AND (next_attempt_at IS NULL OR next_attempt_at <= ?)
     ORDER BY seq ASC`,
    [now],
  );

  const seenTargets = new Set<string>();
  for (const row of rows) {
    if (blocked.has(row.target_local_id)) continue;
    // Only the earliest pending op per record is eligible.
    if (seenTargets.has(row.target_local_id)) continue;
    seenTargets.add(row.target_local_id);
    return toMutation(row);
  }
  return null;
}

export async function markInflight(db: Database, seq: number): Promise<void> {
  await db.runAsync("UPDATE mutations SET status = 'inflight' WHERE seq = ?", [seq]);
}

export async function completeMutation(db: Database, seq: number): Promise<void> {
  await db.runAsync("DELETE FROM mutations WHERE seq = ?", [seq]);
}

export async function recordFailure(
  db: Database,
  mutation: Mutation,
  disposition: Disposition,
  message: string,
  options: { now?: number; random?: () => number } = {},
): Promise<MutationStatus> {
  const attempts = mutation.attempts + 1;
  const now = options.now ?? Date.now();

  if (disposition === "retry") {
    const nextAt = new Date(now + backoffMs(attempts, options.random)).toISOString();
    await db.runAsync(
      `UPDATE mutations SET status = 'pending', attempts = ?, next_attempt_at = ?, last_error = ?
       WHERE seq = ?`,
      [attempts, nextAt, message, mutation.seq],
    );
    return "pending";
  }

  // Auth failures do not count as attempts: the op is fine, the session is not.
  if (disposition === "authPaused") {
    await db.runAsync(
      "UPDATE mutations SET status = 'pending', last_error = ? WHERE seq = ?",
      [message, mutation.seq],
    );
    return "pending";
  }

  const status: MutationStatus = disposition === "conflict" ? "conflict" : "poison";
  await db.runAsync(
    "UPDATE mutations SET status = ?, attempts = ?, last_error = ? WHERE seq = ?",
    [status, attempts, message, mutation.seq],
  );
  return status;
}

/**
 * Resets ops left in flight by a crash or force-quit.
 *
 * Every kill resolves to "inflight, outcome unknown", and replay is safe
 * because creates are idempotent server-side and updates are whole-record PUTs.
 * `was_recovered` is set so the flusher knows to check whether its first
 * attempt actually landed before treating a 409 as a real conflict.
 */
export async function recoverInflight(db: Database): Promise<number> {
  const result = await db.runAsync(
    "UPDATE mutations SET status = 'pending', was_recovered = 1 WHERE status = 'inflight'",
  );
  return result.changes;
}

export interface QueueStats {
  pending: number;
  failed: number;
  conflicts: number;
  poison: number;
}

export async function queueStats(db: Database): Promise<QueueStats> {
  const rows = await db.getAllAsync<{ status: MutationStatus; n: number }>(
    "SELECT status, COUNT(*) AS n FROM mutations GROUP BY status",
  );
  const count = (status: MutationStatus) => rows.find((r) => r.status === status)?.n ?? 0;
  return {
    pending: count("pending") + count("inflight"),
    failed: count("failed"),
    conflicts: count("conflict"),
    poison: count("poison"),
  };
}

/** Targets that must not be sent until the user resolves them. */
export async function blockedTargets(db: Database): Promise<Set<string>> {
  const rows = await db.getAllAsync<{ target_local_id: string }>(
    "SELECT DISTINCT target_local_id FROM mutations WHERE status IN ('conflict', 'poison')",
  );
  return new Set(rows.map((r) => r.target_local_id));
}

export async function listMutations(db: Database): Promise<Mutation[]> {
  const rows = await db.getAllAsync<MutationRow>("SELECT * FROM mutations ORDER BY seq ASC");
  return rows.map(toMutation);
}
