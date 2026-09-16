import { NetworkError, TimeoutError } from "./errors";

/**
 * GBIF species suggest.
 *
 * A direct third-party call, deliberately not proxied through our API: it needs
 * no credential, and routing it through the server would make species lookup
 * depend on CIOOS being reachable as well as GBIF.
 *
 * The whole suggestion object is what gets stored in `record.taxa` — the web
 * app does the same, and the record's consumers read fields (kingdom, phylum,
 * rank …) that a trimmed-down copy would lose.
 */

const SUGGEST_URL = "https://api.gbif.org/v1/species/suggest";
const DEADLINE_MS = 10_000;

export interface GbifSuggestion {
  key?: number;
  scientificName?: string;
  canonicalName?: string;
  rank?: string;
  kingdom?: string;
  phylum?: string;
  order?: string;
  family?: string;
  genus?: string;
  species?: string;
  [field: string]: unknown;
}

/** A display name for a suggestion, matching the web app's option label. */
export function taxonLabel(taxon: GbifSuggestion): string {
  if (taxon.scientificName && taxon.canonicalName && taxon.scientificName !== taxon.canonicalName) {
    return `${taxon.scientificName} (${taxon.canonicalName})`;
  }
  return taxon.scientificName || taxon.canonicalName || "";
}

export async function suggestSpecies(query: string): Promise<GbifSuggestion[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEADLINE_MS);

  try {
    const response = await fetch(`${SUGGEST_URL}?q=${encodeURIComponent(query)}`, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) throw new NetworkError(`GBIF returned ${response.status}`);
    const body = await response.json();
    return Array.isArray(body) ? (body as GbifSuggestion[]) : [];
  } catch (err) {
    if (err instanceof NetworkError) throw err;
    if (err instanceof Error && err.name === "AbortError") {
      throw new TimeoutError(DEADLINE_MS);
    }
    throw new NetworkError("GBIF is unreachable");
  } finally {
    clearTimeout(timer);
  }
}
