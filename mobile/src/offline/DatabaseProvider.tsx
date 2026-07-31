import * as SQLite from "expo-sqlite";
import React, { createContext, useContext, useEffect, useState } from "react";

import { initSchema, type Database } from "./db";
import { recoverInflight } from "./queue";

/**
 * Opens the local database once and shares the handle.
 *
 * Everything below takes the handle as a parameter rather than importing a
 * singleton, which is what keeps the offline engine testable against an
 * in-memory database. This provider is the only place a real one is created.
 */

const DatabaseContext = createContext<Database | null>(null);

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<Database | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const handle = (await SQLite.openDatabaseAsync("cioos-offline.db")) as unknown as Database;
      await initSchema(handle);
      // Anything left in flight belongs to a previous run that was killed.
      // Safe to replay: creates are idempotent server-side and updates are
      // whole-record PUTs.
      await recoverInflight(handle);
      if (!cancelled) setDb(handle);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return <DatabaseContext.Provider value={db}>{children}</DatabaseContext.Provider>;
}

/** Null until the database is open. Callers must handle that. */
export function useDatabase(): Database | null {
  return useContext(DatabaseContext);
}
