import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { MetadataRecord } from "@/api/records";
import { getRecordByLocalId, type CachedRecord, type Database } from "@/offline/db";

import {
  AUTOSAVE_DEBOUNCE_MS,
  AUTOSAVE_MAX_WAIT_MS,
  autosaveDraft,
  saveDraft,
  setField,
} from "./draft";

/**
 * Editing state for one record.
 *
 * Autosave is debounced and local-only; explicit save enqueues. The debounce
 * has a hard ceiling so a fast typist cannot outrun it — without `maxWait`, a
 * trailing debounce can defer indefinitely under continuous input, which is
 * exactly when losing the work would hurt most.
 */
export type DraftStatus = "loading" | "clean" | "savingLocally" | "savedLocally" | "queued";

export function useRecordDraft(db: Database | null, localId: string | undefined, userId?: string) {
  const [record, setRecord] = useState<CachedRecord | null>(null);
  const [document, setDocument] = useState<MetadataRecord | null>(null);
  const [status, setStatus] = useState<DraftStatus>("loading");

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstEditAt = useRef<number | null>(null);
  const pending = useRef<MetadataRecord | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!db || !localId) return;
    (async () => {
      const loaded = await getRecordByLocalId(db, localId);
      if (cancelled) return;
      setRecord(loaded);
      setDocument(loaded?.document ?? null);
      setStatus("clean");
    })();
    return () => {
      cancelled = true;
    };
  }, [db, localId]);

  const commit = useCallback(async () => {
    if (!db || !localId || !pending.current) return;
    const next = pending.current;
    pending.current = null;
    firstEditAt.current = null;
    setStatus("savingLocally");
    await autosaveDraft(db, localId, next);
    setStatus("savedLocally");
  }, [db, localId]);

  // Flush on unmount. componentWillUnmount-equivalent cleanup does not run when
  // iOS kills a backgrounded app, so this is a backstop rather than the only
  // guarantee — the maxWait ceiling above is what actually bounds the loss.
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      void commit();
    },
    [commit],
  );

  const update = useCallback(
    (field: string, value: unknown) => {
      setDocument((current) => {
        if (!current) return current;
        const next = setField(current, field, value);
        pending.current = next;

        if (firstEditAt.current === null) firstEditAt.current = Date.now();
        if (timer.current) clearTimeout(timer.current);

        const elapsed = Date.now() - firstEditAt.current;
        const delay = Math.max(0, Math.min(AUTOSAVE_DEBOUNCE_MS, AUTOSAVE_MAX_WAIT_MS - elapsed));
        timer.current = setTimeout(() => void commit(), delay);

        return next;
      });
    },
    [commit],
  );

  /** Persists immediately and queues for the server. */
  const save = useCallback(async () => {
    if (!db || !localId || !document || !userId) return;
    if (timer.current) clearTimeout(timer.current);
    pending.current = null;
    await saveDraft(db, localId, document, userId);
    setStatus("queued");
  }, [db, localId, document, userId]);

  /**
   * Writes any debounced edit through, now.
   *
   * Leaving the screen must not race the debounce: the hub re-reads the draft
   * from the database the moment it regains focus, and a pending edit still
   * sitting in the timer would make it show the record as it was before.
   */
  const flush = useCallback(async () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    await commit();
  }, [commit]);

  const dirty = useMemo(
    () => record !== null && document !== null && record.document !== document,
    [record, document],
  );

  return { record, document, status, dirty, update, save, flush };
}
