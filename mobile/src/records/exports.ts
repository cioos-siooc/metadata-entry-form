import { getRecordFilename } from "@cioos/shared/misc.js";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

import { convertRecord } from "@/api/doi";
import type { MetadataRecord } from "@/api/records";

/**
 * Record downloads.
 *
 * On a phone "download" means "hand the file to the share sheet" — there is no
 * downloads folder to save into, and a file written somewhere the user cannot
 * reach is not a download. So each export is written to the cache directory and
 * then shared, which is how it reaches Mail, Files, AirDrop or anything else.
 *
 * Conversion is server-side for every format but JSON, which is the record
 * itself and needs no service.
 */

export type ExportFormat =
  | "iso19115-3_xml"
  | "erddap"
  | "yaml"
  | "eml"
  | "json"
  | "datacite_json"
  | "datacite_xml";

const EXTENSIONS: Record<ExportFormat, string> = {
  "iso19115-3_xml": ".xml",
  erddap: "_erddap.xml",
  yaml: ".yaml",
  eml: "_eml.xml",
  json: ".json",
  datacite_json: "_dataCite.json",
  datacite_xml: "_dataCite.xml",
};

const MIME: Record<ExportFormat, string> = {
  "iso19115-3_xml": "application/xml",
  erddap: "application/xml",
  yaml: "application/x-yaml",
  eml: "application/xml",
  json: "application/json",
  datacite_json: "application/json",
  datacite_xml: "application/xml",
};

/** The formats offered, in the order the web app lists them. */
export const EXPORT_FORMATS: ExportFormat[] = [
  "iso19115-3_xml",
  "erddap",
  "yaml",
  "eml",
  "json",
  "datacite_json",
  "datacite_xml",
];

async function contentFor(
  region: string,
  record: MetadataRecord,
  format: ExportFormat,
): Promise<string> {
  if (format === "json") return JSON.stringify(record, null, 2);

  const response = await convertRecord(region, record, format);
  const data = response?.data;
  return typeof data === "string" ? data : JSON.stringify(data, null, 2);
}

/**
 * Converts and shares one export.
 *
 * Returns the file URI so a caller can report where it went; throws whatever
 * the converter threw, so "the converter is down" stays distinguishable from
 * "sharing is unavailable".
 */
export async function exportRecord(
  region: string,
  record: MetadataRecord,
  format: ExportFormat,
): Promise<string> {
  const content = await contentFor(region, record, format);
  const name = `${getRecordFilename(record)}${EXTENSIONS[format]}`;
  const file = new FileSystem.File(FileSystem.Paths.cache, name);

  // Overwrite: exporting the same record twice must not fail on the second go.
  if (file.exists) file.delete();
  file.create();
  file.write(content);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: MIME[format],
      dialogTitle: name,
      UTI: format.includes("json") ? "public.json" : "public.xml",
    });
  }

  return file.uri;
}
