import { useCallback, useEffect, useState } from "react";

import { createEntity, listEntities, type EntityKind, type SavedEntity } from "@/api/entities";
import { useSession } from "@/auth/SessionProvider";
import { useDatabase } from "@/offline/DatabaseProvider";
import { cacheLibrary, readCachedLibrary } from "@/offline/libraryCache";

/**
 * The saved library, from cache first and the network second.
 *
 * Cache-first because the list is small, changes rarely, and is most wanted at
 * the moment there is no signal. `fromCache` is exposed so the UI can say the
 * list may be stale rather than pretending it is live.
 */
export function useLibrary(kind: EntityKind) {
  const { region, user, isOffline } = useSession();
  const db = useDatabase();

  const [entries, setEntries] = useState<SavedEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromCache, setFromCache] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!region || !user) return;
    setLoading(true);
    setError(null);

    if (db) {
      const cached = await readCachedLibrary(db, region, kind);
      if (cached) {
        setEntries(cached);
        setFromCache(true);
      }
    }

    try {
      const fresh = await listEntities(region, user.userID, kind);
      setEntries(fresh);
      setFromCache(false);
      if (db) await cacheLibrary(db, region, kind, fresh);
    } catch (err) {
      // Offline with a cache is a success, not a failure — say nothing.
      if (!fromCache) setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
    // `fromCache` is read for the error decision only; including it would
    // re-run the fetch every time a cache hit flips it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [region, user, kind, db]);

  useEffect(() => {
    void load();
  }, [load]);

  /** Adds an entry to the library. Online only — see libraryCache. */
  const save = useCallback(
    async (data: Record<string, unknown>) => {
      if (!region || !user) throw new Error("No region");
      await createEntity(region, user.userID, kind, data);
      await load();
    },
    [region, user, kind, load],
  );

  return { entries, loading, fromCache, error, offline: isOffline, reload: load, save };
}
