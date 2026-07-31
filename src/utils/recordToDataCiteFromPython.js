import axios from "axios";
import firebase from "../firebase";
import regions from "../regions";

/**
 * Gets the URL for the Python convert_metadata Firebase function.
 * Supports both local development (emulator) and production deployment.
 */
const getConvertMetadataUrl = () => {
  const { options: { projectId } } = firebase;
  const functionRegion = import.meta.env.VITE_FUNCTION_REGION || "us-central1";

  // Check if we should use the emulator
  const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  const useLocalFunctions = import.meta.env.VITE_FIREBASE_LOCAL_FUNCTIONS === "true";

  if (isLocal && useLocalFunctions) {
    // Port 5001 is standard for Firebase functions and matches root firebase.json
    return `http://localhost:5001/${projectId}/${functionRegion}/convert_metadata`;
  }

  return `https://${functionRegion}-${projectId}.cloudfunctions.net/convert_metadata`;
};

/**
 * Converts a metadata record to DataCite JSON format using the Python conversion function,
 * then formats it for the DataCite API.
 *
 * @param {Object} record - The metadata record (Firebase schema)
 * @param {string} language - Language code ('en' or 'fr')
 * @param {string} region - Region identifier (e.g., 'pacific', 'atlantic', 'stlaurent')
 * @param {string} datacitePrefix - DataCite prefix for DOI creation (e.g., '10.0000')
 * @param {Object} options - Additional options
 * @param {boolean} options.forUpdate - If true, omits 'type' and 'prefix' fields (for DOI updates)
 * @returns {Promise<Object>} DataCite API-formatted object ready for DataCite API calls
 * @throws {Error} If conversion fails or response is invalid
 */
export async function recordToDataCiteFromPython(
  record,
  language,
  region,
  datacitePrefix,
  options = {}
) {
  const { forUpdate = false } = options;

  try {
    // Step 1: Call Python convert_metadata to get DataCite JSON
    const url = getConvertMetadataUrl();
    console.log("[recordToDataCite] Calling convert_metadata", { url, forUpdate, language, region, datacitePrefix });
    const response = await axios.post(url, {
      data: {
        record_data: record,
        output_format: "datacite_json",
      },
    });

    console.log("[recordToDataCite] convert_metadata response status:", response.status);

    // Extract the DataCite object from the response
    // Response structure: { data: <converted_datacite_object> }
    if (!response.data || !response.data.data) {
      throw new Error("Invalid response structure from convert_metadata function");
    }

    let dataciteObject = response.data.data;
    console.log("[recordToDataCite] Raw dataciteObject type:", typeof dataciteObject);

    // Step 2: Parse if the response is a JSON string (some output formats return strings)
    if (typeof dataciteObject === "string") {
      try {
        dataciteObject = JSON.parse(dataciteObject);
      } catch (parseError) {
        throw new Error(`Failed to parse DataCite response as JSON: ${parseError.message}`);
      }
    }

    // Step 3: Validate that the response is a valid DataCite object
    if (typeof dataciteObject !== "object" || Array.isArray(dataciteObject)) {
      throw new Error("DataCite response is not a valid object");
    }

    // Step 4: Add the catalogue URL field (specific to region and record's primary language)
    // This URL will be the permanent location of the dataset once published
    const recordLanguage = record.language || language;
    if (!recordLanguage) {
      throw new Error("Please assign a primary language to the record before creating a DOI.");
    }
    const catalogueUrl = regions[region]?.catalogueURL?.[recordLanguage];
    if (!catalogueUrl) {
      throw new Error(`Invalid region/language combination: ${region}/${recordLanguage}`);
    }

    dataciteObject.url = `${catalogueUrl}dataset/ca-cioos_${record.identifier}`;

    // Step 4b: If no publisher was set by the conversion (no contact with publisher role),
    // fall back to the region's organization as the default publisher.
    if (!dataciteObject.publisher || dataciteObject.publisher.name === ":unav") {
      const regionConfig = regions[region] || {};
      const regionTitle = regionConfig.title?.[recordLanguage] || regionConfig.title?.en;
      if (regionTitle) {
        const publisher = { name: regionTitle, lang: recordLanguage };
        if (regionConfig.ror) {
          publisher.publisherIdentifier = regionConfig.ror;
          publisher.publisherIdentifierScheme = "ROR";
          publisher.schemeUri = "https://ror.org/";
        }
        dataciteObject.publisher = publisher;
      }
    }

    // Step 5: Wrap in DataCite API structure
    const apiObject = {
      data: {
        attributes: dataciteObject,
      },
    };

    // Step 6: Add type and prefix for CREATE operations (not for UPDATE)
    // For updates, these fields are not sent to the DataCite API
    if (!forUpdate) {
      apiObject.data.type = "dois";
      apiObject.data.attributes.prefix = datacitePrefix;
    }

    return apiObject;
  } catch (error) {
    console.error("[recordToDataCite] Error:", error);
    // Re-throw with context about what went wrong
    if (error.response) {
      // HTTP error from the convert_metadata function
      throw new Error(
        `DataCite conversion failed (${error.response.status}): ${
          error.response.data?.error || error.message
        }`
      );
    }

    if (error.message.includes("Invalid")) {
      throw error;
    }

    // Network or other errors
    throw new Error(`Failed to convert record to DataCite format: ${error.message}`);
  }
}

export default recordToDataCiteFromPython;
