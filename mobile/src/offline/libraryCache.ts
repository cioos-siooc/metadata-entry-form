import type { EntityKind, SavedEntity } from "@/api/entities";

import type { Database } from "./db";

/**
 * The saved library, cached for offline use.
 *
 * The library is "the gear you carry" — the ship, the CTD, the same three
 * contacts on every record — which makes it exactly the thing a field user
 * needs when there is no signal. It rides in the existing `meta` key/value
 * table rather than a table of its own: it is a whole-list snapshot that is
 * replaced wholesale, never queried by field, and never mutated offline.
 *
 * Saving *to* the library still requires a connection. Queuing it would need a
 * second mutation kind with its own conflict story, for a convenience that has
 * a working alternative — type it into the record now, save it to the library
 * later.
 */

const key = (region: string, kind: EntityKind) => `library:${region}:${kind}`;

export async function cacheLibrary(
  db: Database,
  region: string,
  kind: EntityKind,
  entries: SavedEntity[],
): Promise<void> {
  await db.runAsync("INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)", [
    key(region, kind),
    JSON.stringify(entries),
  ]);
}

export async function readCachedLibrary(
  db: Database,
  region: string,
  kind: EntityKind,
): Promise<SavedEntity[] | null> {
  const row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM meta WHERE key = ?",
    [key(region, kind)],
  );
  if (!row) return null;
  try {
    const parsed = JSON.parse(row.value);
    return Array.isArray(parsed) ? (parsed as SavedEntity[]) : null;
  } catch {
    // A corrupt cache is a missing cache, not a crash on a boat.
    return null;
  }
}
