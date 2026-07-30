import { localized } from "@cioos/shared/localized.js";
import bundledRegions, { mergeRegions } from "@cioos/shared/regions.js";

import { rawRequest } from "./transport";
import type { Language } from "@/i18n";

/**
 * Region catalogue.
 *
 * GET /regions is unauthenticated, so this works before sign-in. The bundled
 * table in @cioos/shared is the offline fallback and also supplies brand
 * colours and titles for regions whose server config is minimal — the web SPA
 * relies on the same merge.
 */

export interface Region {
  id: string;
  title: string;
  brandHex: string;
  showInSelector: boolean;
}

interface BundledRegion {
  title?: { en?: string; fr?: string };
  colors?: { primary?: string; secondary?: string };
  showInRegionSelector?: boolean;
}

const DEFAULT_BRAND = "#52a79b";

function toRegion(id: string, entry: BundledRegion, language: Language): Region {
  return {
    id,
    title: localized(entry.title ?? {}, language) ?? id,
    brandHex: entry.colors?.primary ?? DEFAULT_BRAND,
    showInSelector: entry.showInRegionSelector !== false,
  };
}

/** Reads the bundled table without touching the network. */
export function bundledRegionList(language: Language): Region[] {
  return Object.entries(bundledRegions as Record<string, BundledRegion>)
    .map(([id, entry]) => toRegion(id, entry, language))
    .filter((r) => r.showInSelector);
}

export function regionBrandHex(id: string | null): string {
  if (!id) return DEFAULT_BRAND;
  const entry = (bundledRegions as Record<string, BundledRegion>)[id];
  return entry?.colors?.primary ?? DEFAULT_BRAND;
}

/**
 * Fetches the live catalogue and merges it into the bundled table, so later
 * lookups (including regionBrandHex) see runtime-created regions.
 *
 * Throws on failure — the caller decides whether to fall back, because at the
 * region picker a stale list is better than an error, while elsewhere it is
 * not.
 */
export async function fetchRegions(language: Language): Promise<Region[]> {
  const rows = await rawRequest<{ id: string; config?: BundledRegion }[]>("/regions");
  mergeRegions(
    Object.fromEntries(rows.map((row) => [row.id, row.config ?? {}])),
  );
  return rows
    .map((row) => toRegion(row.id, (bundledRegions as Record<string, BundledRegion>)[row.id] ?? row.config ?? {}, language))
    .filter((r) => r.showInSelector);
}
