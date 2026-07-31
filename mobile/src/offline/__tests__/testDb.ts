import BetterSqlite3 from "better-sqlite3";

import type { Database } from "../db";
import { initSchema } from "../db";

/**
 * An in-memory database implementing the same interface as expo-sqlite.
 *
 * Real SQL rather than a fake, because the behaviour under test *is* SQL:
 * ON CONFLICT upserts, AUTOINCREMENT ordering, the NOT IN subquery that
 * protects unsynced work. A hand-rolled stub would pass while the real thing
 * failed.
 */
export function createTestDb(): Database & { close: () => void } {
  const sqlite = new BetterSqlite3(":memory:");

  return {
    async execAsync(sql: string) {
      sqlite.exec(sql);
    },
    async runAsync(sql: string, params: unknown[] = []) {
      const info = sqlite.prepare(sql).run(...(params as never[]));
      return { lastInsertRowId: Number(info.lastInsertRowid), changes: info.changes };
    },
    async getAllAsync<T>(sql: string, params: unknown[] = []) {
      return sqlite.prepare(sql).all(...(params as never[])) as T[];
    },
    async getFirstAsync<T>(sql: string, params: unknown[] = []) {
      return (sqlite.prepare(sql).get(...(params as never[])) as T) ?? null;
    },
    close: () => sqlite.close(),
  };
}

export async function freshDb() {
  const db = createTestDb();
  await initSchema(db);
  return db;
}
