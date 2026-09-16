import { bareDoi, buildDataCitePayload } from "@cioos/shared/datacite.js";
import regions from "@cioos/shared/regions.js";

import { convertRecord, updateDraftDoi } from "@/api/doi";
import type { MetadataRecord } from "@/api/records";

/**
 * Pushes the record's current metadata to its existing draft DOI.
 *
 * Two hops: the converter turns the record into DataCite JSON, then the shared
 * builder wraps it. Keeping the wrapping in `@cioos/shared` is what stops the
 * phone and the web app registering subtly different metadata for the same DOI.
 */
export async function pushDoiMetadata(
  record: MetadataRecord,
  region: string,
  language: string,
): Promise<number> {
  const converted = await convertRecord(region, record, "datacite_json");

  let dataciteObject = converted?.data as unknown;
  // Some output formats come back as a JSON string.
  if (typeof dataciteObject === "string") dataciteObject = JSON.parse(dataciteObject);

  const catalogueUrl = (
    regions as Record<string, { catalogueURL?: Record<string, string> }>
  )[region]?.catalogueURL?.[language];

  const payload = buildDataCitePayload({
    dataciteObject,
    catalogueUrl,
    identifier: record.identifier,
    forUpdate: true,
  });

  const response = await updateDraftDoi(
    region,
    bareDoi(record.datasetIdentifier as string),
    payload,
  );
  return response?.status ?? 0;
}
