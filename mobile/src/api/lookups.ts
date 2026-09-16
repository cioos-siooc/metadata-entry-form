import { NetworkError, TimeoutError } from "./errors";

/**
 * ROR and ORCID.
 *
 * Third-party calls made directly, like GBIF: neither needs a credential, and
 * routing them through our API would make a contact impossible to look up
 * whenever CIOOS is unreachable — for a convenience that is already optional.
 *
 * Nothing here gates anything. `contactIsFilled` needs a role plus a name or an
 * organisation, so a contact typed by hand on a boat is exactly as valid as one
 * pulled from ROR.
 */

const DEADLINE_MS = 10_000;

async function getJson<T>(url: string, headers: Record<string, string> = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEADLINE_MS);
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json", ...headers },
      signal: controller.signal,
    });
    if (!response.ok) throw new NetworkError(`Lookup returned ${response.status}`);
    return (await response.json()) as T;
  } catch (err) {
    if (err instanceof NetworkError) throw err;
    if (err instanceof Error && err.name === "AbortError") throw new TimeoutError(DEADLINE_MS);
    throw new NetworkError("Lookup service is unreachable");
  } finally {
    clearTimeout(timer);
  }
}

export interface RorOrganization {
  id: string;
  names?: { lang: string | null; types?: string[]; value: string }[];
  links?: { type: string; value: string }[];
  locations?: { geonames_details?: { name?: string; country_name?: string } }[];
  [field: string]: unknown;
}

export async function searchRor(query: string): Promise<RorOrganization[]> {
  const body = await getJson<{ items?: RorOrganization[] }>(
    // Quoted, as the web app does: ROR treats an unquoted multi-word query as
    // OR and buries the exact match.
    `https://api.ror.org/organizations?query=${encodeURIComponent(`"${query}"`)}`,
  );
  return Array.isArray(body.items) ? body.items : [];
}

export interface OrcidRecord {
  "orcid-identifier"?: { uri?: string };
  person?: {
    name?: { "given-names"?: { value?: string }; "family-name"?: { value?: string } };
    emails?: { email?: { email?: string }[] };
  };
}

export function fetchOrcid(orcid: string): Promise<OrcidRecord> {
  return getJson<OrcidRecord>(`https://pub.orcid.org/v3.0/${orcid}/record`);
}
