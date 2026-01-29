import axios from "axios";
import firebase from "../firebase";
import { getRecordFilename } from "./misc";

const getConvertMetadataUrl = () => {
  const { options: { projectId } } = firebase;
  const functionRegion = process.env.REACT_APP_FUNCTION_REGION || "us-central1";

  // Check if we should use the emulator
  const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  const useLocalFunctions = process.env.REACT_APP_FIREBASE_LOCAL_FUNCTIONS === "true";

  if (isLocal && useLocalFunctions) {
    // Port 5001 is standard for Firebase functions and matches root firebase.json
    return `http://localhost:5001/${projectId}/${functionRegion}/convert_metadata`;
  }

  return `https://${functionRegion}-${projectId}.cloudfunctions.net/convert_metadata`;
};

/**
 * Converts a record to the specified format using the cloud function.
 */
export const convertRecord = async (record, format) => {
  const url = getConvertMetadataUrl();
  try {
    const response = await axios.post(url, {
      data: {
        record_data: record,
        output_format: format,
      },
    });

    if (response.data && response.data.data) {
      return response.data.data;
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
export const preparePublishPayload = async (record, environments, commitMessage, config, region) => {
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
  const title = recordTitle ? (recordTitle.en || recordTitle.fr || "untitled") : "untitled";
  const sanitizedTitle = title.replace(/[^a-zA-Z0-9-_]/g, "-");
  filenameBase = filenameBase.replace("{title}", sanitizedTitle);

  const [xmlContent, yamlContent] = await Promise.all([
    convertRecord(record, "iso19115-3_xml"),
    convertRecord(record, "yaml"),
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