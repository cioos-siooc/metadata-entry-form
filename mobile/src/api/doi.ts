import { del, get, post, put } from "./client";

/**
 * DataCite DOIs.
 *
 * Every call is a proxy to DataCite through our API, and none of them may ever
 * be queued: a DOI is a permanent public identifier, and replaying a create
 * after a flaky connection would register a second one that nothing points at.
 * The UI disables these offline rather than deferring them.
 */

export interface DoiConfig {
  /** Empty when the region has no DataCite account — the UI hides DOI entirely. */
  prefix: string;
  hasCredentials: boolean;
}

export function getDoiConfig(region: string) {
  return get<DoiConfig>(`/regions/${region}/doi/config`);
}

/** Returns DataCite's own response; `data.attributes.doi` is the new DOI. */
export function createDraftDoi(region: string, record: unknown) {
  return post<{ data: { attributes: { doi: string; state?: string } } }>(
    `/regions/${region}/doi`,
    { record },
  );
}

export function updateDraftDoi(region: string, doi: string, data: unknown) {
  return put<{ status: number }>(`/regions/${region}/doi`, { doi, data });
}

export function deleteDraftDoi(region: string, doi: string) {
  return del<{ status: number }>(`/regions/${region}/doi`, { doi });
}

export function getDoiStatus(region: string, doi: string) {
  return get<{ status: string }>(`/regions/${region}/doi/status`, { doi });
}

/**
 * Record conversion, via the converter service.
 *
 * Shared with the export feature: DataCite updates are just the
 * `datacite_json` output format.
 */
export function convertRecord(region: string, record: unknown, fileType: string) {
  return post<{ data: unknown }>(`/regions/${region}/record-export`, { record, fileType });
}
