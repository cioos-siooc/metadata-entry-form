import { useCallback, useEffect, useState } from "react";

import { NetworkError } from "@/api/errors";
import {
  myRecords,
  publishedRecords,
  sharedWithMe,
  type RecordListItem,
} from "@/api/records";
import {
  listRecords,
  replaceScope,
  type CachedRecord,
  type Database,
} from "@/offline/db";
import type { RecordScope } from "@/offline/schema";

/**
 * Offline-first record lists.
 *
 * Reads the cache immediately so the list paints without waiting on the
 * network, then refreshes in the background. Offline, the cache *is* the answer
 * — which is the whole point, and the difference from the web app's "the form
 * cannot save or load records until you reconnect".
 */

export type ListState = "loading" | "ready" | "stale" | "error";

const toCached = (
  record: RecordListItem,
  region: string,
  scope: RecordScope,
): CachedRecord => ({
  // A record from the server is keyed by its server id: it has one, and using
  // it as the local key keeps a server row and its cached copy the same row.
  localId: record.recordID,
  region,
  recordID: record.recordID,
  ownerUserId: (record.userID as string) ?? null,
  status: record.status ?? "",
  document: record,
  serverUpdatedAt: record.updatedAt ?? null,
  serverSnapshot: record,
  syncState: "synced",
  clientUpdatedAt: record.updatedAt ?? new Date().toISOString(),
  scope,
});

export function useRecords(
  db: Database | null,
  region: string | null,
  userId: string | undefined,
  scope: RecordScope,
) {
  const [records, setRecords] = useState<CachedRecord[]>([]);
  const [state, setState] = useState<ListState>("loading");

  const readCache = useCallback(async () => {
    if (!db || !region) return [];
    const cached = await listRecords(db, region, scope);
    setRecords(cached);
    return cached;
  }, [db, region, scope]);

  const refresh = useCallback(async () => {
    if (!db || !region) return;

    const cached = await readCache();
    setState(cached.length ? "ready" : "loading");

    if (!userId) return;
    try {
      const fetched =
        scope === "mine"
          ? await myRecords(region, userId)
          : scope === "shared"
            ? await sharedWithMe(region)
            : await publishedRecords(region);

      // Refuses to touch anything with unsynced work — see replaceScope.
      await replaceScope(
        db,
        region,
        scope,
        fetched.map((r) => toCached(r, region, scope)),
      );
      await readCache();
      setState("ready");
    } catch (err) {
      // Offline is not an error when there is a cache to show; it just means
      // what is on screen may be behind the server.
      setState(err instanceof NetworkError ? "stale" : "error");
    }
  }, [db, region, userId, scope, readCache]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { records, state, refresh, readCache };
}
