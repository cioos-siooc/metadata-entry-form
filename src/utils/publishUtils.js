import { convertMetadata } from "../api/actions";
import { getRecordFilename } from "./misc";

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
  const { fileTemplate } = config;

  // Logic to generate filename matches the backend helper
  let filenameBase = fileTemplate || "{filename}";
  if (filenameBase.includes("{filename}")) {
    const historicalFilename = getRecordFilename(record);
    filenameBase = filenameBase.replace("{filename}", historicalFilename);
  }
  const { id, identifier, title: recordTitle } = record;
  const uuid = id || identifier;
  filenameBase = filenameBase.replace("{uuid}", uuid);
  const title = recordTitle
    ? recordTitle.en || recordTitle.fr || "untitled"
    : "untitled";
  const sanitizedTitle = title.replace(/[^a-zA-Z0-9-_]/g, "-");
  filenameBase = filenameBase.replace("{title}", sanitizedTitle);

  const [xmlContent, yamlContent] = await Promise.all([
    convertRecord(record, "iso19115-3_xml", region),
    convertRecord(record, "yaml", region),
  ]);
  // Store only the record JSON, excluding database-specific user info
  const recordForJson = { ...record };
  if (recordForJson.userinfo) delete recordForJson.userinfo;
  const jsonContent = JSON.stringify(recordForJson, null, 2);

  const files = [];
  environments.forEach((env) => {
    const baseDir = region ? `forms/${region}/${env}` : `forms/${env}`;
    files.push({
      path: `${baseDir}/${filenameBase}.xml`,
      content: xmlContent,
    });
    files.push({
      path: `${baseDir}/${filenameBase}.yaml`,
      content: yamlContent,
    });
    files.push({
      path: `${baseDir}/${filenameBase}.json`,
      content: jsonContent,
    });
  });

  // Also store a copy of the original JSON in a top-level records directory
  files.push({
    path: `records/${filenameBase}.json`,
    content: jsonContent,
  });

  return {
    files,
    commitMessage: commitMessage || `Publish metadata record: ${title}`,
  };
};
