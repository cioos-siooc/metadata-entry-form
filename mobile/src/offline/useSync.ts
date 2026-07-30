import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";

import {
  createRecord,
  deleteRecord,
  getRecord,
  saveRecord,
  setRecordStatus,
} from "@/api/records";

import type { Database } from "./db";
import { queueStats, type QueueStats } from "./queue";
import { flush, type SyncTransport } from "./sync";

/**
 * Drives the flush loop and reports queue depth.
 *
 * Triggers on app foreground and a timer, plus explicitly after a save.
 * `navigator.onLine`-style connectivity events are deliberately not the only
 * signal: on a boat the device often believes it has a connection it cannot
 * use, so a failed request is itself evidence and the timer picks it up.
 */

const POLL_MS = 30_000;

const transport: SyncTransport = {
  createRecord: (region, body) => createRecord(region, body as never),
  saveRecord: (region, recordID, body, ifUnmodifiedSince) =>
    saveRecord(region, recordID, body as never, ifUnmodifiedSince),
  setStatus: (region, recordID, status) =>
    setRecordStatus(region, recordID, status as never),
  deleteRecord: (region, recordID) => deleteRecord(region, recordID),
  getRecord: (region, recordID) => getRecord(region, recordID),
};

const EMPTY: QueueStats = { pending: 0, failed: 0, conflicts: 0, poison: 0 };

export function useSync(db: Database | null, enabled: boolean) {
  const [stats, setStats] = useState<QueueStats>(EMPTY);
  const [syncing, setSyncing] = useState(false);

  const readStats = useCallback(async () => {
    if (!db) return;
    setStats(await queueStats(db));
  }, [db]);

  const runFlush = useCallback(async () => {
    if (!db || !enabled) return;
    setSyncing(true);
    try {
      await flush(db, transport);
    } finally {
      setSyncing(false);
      await readStats();
    }
  }, [db, enabled, readStats]);

  useEffect(() => {
    void readStats();
  }, [readStats]);

  // Foreground: the most reliable moment to catch up, because the user has just
  // opened the app and is waiting anyway.
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (next) => {
      if (next === "active") void runFlush();
    });
    return () => subscription.remove();
  }, [runFlush]);

  useEffect(() => {
    if (!enabled) return;
    void runFlush();
    const timer = setInterval(() => void runFlush(), POLL_MS);
    return () => clearInterval(timer);
  }, [enabled, runFlush]);

  return { stats, syncing, flushNow: runFlush, refreshStats: readStats };
}
