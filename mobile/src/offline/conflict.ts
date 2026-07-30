import { validators } from "@cioos/shared/validate.js";

import type { MetadataRecord } from "@/api/records";

/**
 * Three-way conflict analysis.
 *
 * A 409 means the server's copy moved while ours was queued. With only "mine"
 * and "theirs" the user has to choose blind; with the base — the document as
 * the server last gave it to us — we can say which side actually changed each
 * field, and most conflicts turn out not to overlap at all.
 *
 * Grouped by `validators[field].tab` so the conflict screen and the
 * completeness ledger describe the record the same way.
 */

export type FieldResolution = "mine" | "theirs" | "same" | "both-changed";

export interface FieldConflict {
  field: string;
  /** Validator tab, or null for a field with no validator (e.g. dates). */
  tab: string | null;
  base: unknown;
  mine: unknown;
  theirs: unknown;
  resolution: FieldResolution;
}

export interface ConflictAnalysis {
  fields: FieldConflict[];
  /** Fields both sides changed differently — the only ones needing a decision. */
  contested: FieldConflict[];
  /** Changed only locally; safe to keep. */
  localOnly: FieldConflict[];
  /** Changed only remotely; safe to accept. */
  remoteOnly: FieldConflict[];
  /** True when nothing is contested, so the two can merge without asking. */
  autoMergeable: boolean;
}

/** Server-managed fields. Differences here are not the user's conflict. */
const IGNORED = new Set([
  "updatedAt",
  "created",
  "recordID",
  "clientRecordId",
  "lastEditedBy",
  "filename",
  "userID",
  "sharedWith",
  "userinfo",
  "region",
]);

const sameValue = (a: unknown, b: unknown): boolean => {
  if (a === b) return true;
  // Records are JSON documents throughout, so structural comparison is exact
  // and cheap enough. Key order is stable because both sides come from
  // JSON.parse of the same server shape.
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
};

const tabFor = (field: string): string | null =>
  (validators as Record<string, { tab?: string }>)[field]?.tab ?? null;

/**
 * Compares the local and server documents against the base they diverged from.
 *
 * @param base   The document as the server last gave it to us.
 * @param mine   The local document, including unsynced edits.
 * @param theirs The server's current document.
 */
export function analyseConflict(
  base: MetadataRecord | null,
  mine: MetadataRecord,
  theirs: MetadataRecord,
): ConflictAnalysis {
  const keys = new Set<string>([
    ...Object.keys(mine ?? {}),
    ...Object.keys(theirs ?? {}),
    ...Object.keys(base ?? {}),
  ]);

  const fields: FieldConflict[] = [];

  for (const field of keys) {
    if (IGNORED.has(field)) continue;

    const baseValue = base ? base[field] : undefined;
    const mineValue = mine?.[field];
    const theirsValue = theirs?.[field];

    if (sameValue(mineValue, theirsValue)) continue;

    // Without a base we cannot tell who changed what, so everything that
    // differs has to be treated as contested rather than silently merged.
    const iChanged = base ? !sameValue(baseValue, mineValue) : true;
    const theyChanged = base ? !sameValue(baseValue, theirsValue) : true;

    let resolution: FieldResolution;
    if (iChanged && theyChanged) resolution = "both-changed";
    else if (iChanged) resolution = "mine";
    else if (theyChanged) resolution = "theirs";
    else resolution = "same";

    fields.push({
      field,
      tab: tabFor(field),
      base: baseValue,
      mine: mineValue,
      theirs: theirsValue,
      resolution,
    });
  }

  const contested = fields.filter((f) => f.resolution === "both-changed");

  return {
    fields,
    contested,
    localOnly: fields.filter((f) => f.resolution === "mine"),
    remoteOnly: fields.filter((f) => f.resolution === "theirs"),
    autoMergeable: fields.length > 0 && contested.length === 0,
  };
}

/**
 * Merges the non-contested changes, taking `theirs` as the base so remote-only
 * edits survive and local-only edits are layered on top.
 *
 * Only safe when `autoMergeable`; contested fields are left as theirs so a
 * caller that ignores that flag loses nothing silently — it simply does not
 * apply the local side.
 */
export function autoMerge(analysis: ConflictAnalysis, theirs: MetadataRecord): MetadataRecord {
  const merged: MetadataRecord = { ...theirs };
  for (const field of analysis.localOnly) {
    merged[field.field] = field.mine;
  }
  return merged;
}

/** Groups contested fields by section for display. */
export function contestedByTab(analysis: ConflictAnalysis): Record<string, FieldConflict[]> {
  return analysis.contested.reduce<Record<string, FieldConflict[]>>((acc, field) => {
    const key = field.tab ?? "other";
    (acc[key] ||= []).push(field);
    return acc;
  }, {});
}
