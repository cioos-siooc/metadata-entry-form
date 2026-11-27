/**
 * Local database schema.
 *
 * A record is a self-contained document and the sync set is one person's
 * records, so this is a table of documents plus a queue — no ORM, no relational
 * modelling of record content.
 */

export const SCHEMA_VERSION = 1;

/**
 * `localId` is the primary key forever and `recordID` is a nullable indexed
 * column, never the other way round. A record created offline has no server id
 * until it flushes, and SQLite cannot rename a primary key in place — making
 * `recordID` the key would force a delete-and-reinsert on every first sync,
 * taking every foreign reference with it.
 */
export const CREATE_TABLES = `
CREATE TABLE IF NOT EXISTS records (
  local_id        TEXT PRIMARY KEY NOT NULL,
  region          TEXT NOT NULL,
  record_id       TEXT,
  owner_user_id   TEXT,
  status          TEXT NOT NULL DEFAULT '',
  -- The full API document, verbatim.
  document        TEXT NOT NULL,
  -- The server's updatedAt at last sync; the If-Unmodified-Since token.
  server_updated_at TEXT,
  -- The document as the server last gave it to us, for three-way conflict
  -- resolution. Without a base, a conflict can only offer "mine or theirs".
  server_snapshot TEXT,
  sync_state      TEXT NOT NULL DEFAULT 'synced',
  client_updated_at TEXT NOT NULL,
  scope           TEXT NOT NULL DEFAULT 'mine'
);
CREATE INDEX IF NOT EXISTS records_region_idx ON records (region, scope);
CREATE INDEX IF NOT EXISTS records_record_id_idx ON records (record_id);
CREATE INDEX IF NOT EXISTS records_sync_state_idx ON records (sync_state);

CREATE TABLE IF NOT EXISTS mutations (
  seq             INTEGER PRIMARY KEY AUTOINCREMENT,
  op_id           TEXT NOT NULL UNIQUE,
  kind            TEXT NOT NULL,
  region          TEXT NOT NULL,
  target_local_id TEXT NOT NULL,
  method          TEXT NOT NULL,
  -- No URL is stored. Paths and If-Unmodified-Since are recomputed from the
  -- records row at flush time, so when a create finally returns a server id
  -- there is nothing in the queue to rewrite.
  body            TEXT,
  if_unmodified_since TEXT,
  attempts        INTEGER NOT NULL DEFAULT 0,
  next_attempt_at TEXT,
  status          TEXT NOT NULL DEFAULT 'pending',
  last_error      TEXT,
  was_recovered   INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL,
  user_id         TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS mutations_status_idx ON mutations (status, seq);
CREATE INDEX IF NOT EXISTS mutations_target_idx ON mutations (target_local_id);

CREATE TABLE IF NOT EXISTS meta (
  key   TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);
`;

export type SyncState =
  /** Matches the server as of the last sync. */
  | "synced"
  /** Local-only edits not yet queued (autosave). */
  | "draft"
  /** Queued for the server. */
  | "pending"
  /** The server rejected our version as stale. */
  | "conflict";

export type MutationStatus = "pending" | "inflight" | "failed" | "conflict" | "poison";

export type MutationKind =
  | "record.create"
  | "record.update"
  | "record.status"
  | "record.delete";

/** Which list a cached record belongs to, so scopes can be served offline. */
export type RecordScope = "mine" | "shared" | "published";
