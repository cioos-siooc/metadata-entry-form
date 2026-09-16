import type { GbifSuggestion } from "@/api/gbif";

import type { Database } from "./db";

/**
 * Recent GBIF suggestions, kept for the trip.
 *
 * Species lookup is the one part of the form that needs a third party, and the
 * species being recorded on a cruise are largely the same twenty every day. So
 * whatever was looked up in port is available at sea: the cache is searched
 * locally when GBIF is unreachable.
 *
 * Bounded, because it is a convenience and not a dataset — the oldest queries
 * fall off rather than growing without limit on a phone.
 */

const KEY = "gbif:recent";
const MAX_QUERIES = 60;

interface CacheShape {
  /** Query text (lower-cased) → the suggestions it returned. */
  [query: string]: GbifSuggestion[];
}

async function readAll(db: Database): Promise<CacheShape> {
  const row = await db.getFirstAsync<{ value: string }>("SELECT value FROM meta WHERE key = ?", [
    KEY,
  ]);
  if (!row) return {};
  try {
    const parsed = JSON.parse(row.value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as CacheShape)
      : {};
  } catch {
    return {};
  }
}

export async function cacheSuggestions(
  db: Database,
  query: string,
  suggestions: GbifSuggestion[],
): Promise<void> {
  const all = await readAll(db);
  // Re-inserting moves the query to the end, so eviction is least-recently-used
  // rather than least-recently-*first*-seen.
  delete all[query.toLowerCase()];
  all[query.toLowerCase()] = suggestions;

  const keys = Object.keys(all);
  for (const stale of keys.slice(0, Math.max(0, keys.length - MAX_QUERIES))) delete all[stale];

  await db.runAsync("INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)", [
    KEY,
    JSON.stringify(all),
  ]);
}

/**
 * Everything cached that matches, deduplicated by GBIF key.
 *
 * Matches on the *suggestion* rather than only the query it arrived under, so a
 * search for "calanus" still finds entries first seen while typing "calan".
 */
export async function searchCachedSuggestions(
  db: Database,
  query: string,
): Promise<GbifSuggestion[]> {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];

  const all = await readAll(db);
  const seen = new Set<string>();
  const hits: GbifSuggestion[] = [];

  for (const suggestions of Object.values(all)) {
    for (const suggestion of suggestions) {
      const name = `${suggestion.scientificName ?? ""} ${suggestion.canonicalName ?? ""}`
        .trim()
        .toLowerCase();
      if (!name.includes(needle)) continue;
      const id = String(suggestion.key ?? name);
      if (seen.has(id)) continue;
      seen.add(id);
      hits.push(suggestion);
    }
  }

  return hits;
}
