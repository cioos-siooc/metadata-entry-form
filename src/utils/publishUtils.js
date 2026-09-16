import { buildPublishPayload } from "@cioos/shared/publishPayload.js";

import { convertMetadata } from "../api/actions";

/**
 * Converts a record to the specified format using the metadata conversion API.
 */
export const convertRecord = async (record, format, region) => {
  try {
    const response = await convertMetadata({
      region,
      record,
      outputFormat: format,
    });

    if (response && response.data) {
      return response.data;
    }
    throw new Error("Invalid response from conversion service");
  } catch (error) {
    console.error(`Conversion to ${format} failed:`, error);
    throw new Error(`Failed to convert record to ${format}: ${error.message}`);
  }
};

/**
 * Prepares the payload for GitHub publishing by converting the record and generating paths.
 */
export const preparePublishPayload = async (
  record,
  environments,
  commitMessage,
  config,
  region,
) => {
  const [xmlContent, yamlContent] = await Promise.all([
    convertRecord(record, "iso19115-3_xml", region),
    convertRecord(record, "yaml", region),
  ]);

  // Path construction lives in @cioos/shared: the WAF harvests these paths, so
  // the web app and the mobile app have to produce exactly the same ones.
  return buildPublishPayload({
    record,
    environments,
    commitMessage,
    config,
    region,
    xmlContent,
    yamlContent,
  });
};
