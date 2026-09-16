import { updateDraftDoi } from "../api/actions";
import { recordToDataCiteFromPython } from "./recordToDataCiteFromPython";

async function performUpdateDraftDoi(record, region, language, datacitePrefix) {
  // Use Python-based conversion with forUpdate flag to automatically omit type and prefix
  const mappedDataCiteObject = await recordToDataCiteFromPython(
    record,
    language,
    region,
    datacitePrefix,
    { forUpdate: true },
  );

  // Extract DOI from the full URL (supports http/https and dx.doi.org)
  const doi = record.datasetIdentifier.replace(
    /^https?:\/\/(?:dx\.)?doi\.org\//,
    "",
  );

  const dataObject = {
    doi,
    region,
    data: mappedDataCiteObject,
  };

  const response = await updateDraftDoi(dataObject);
  return response.data.status;
}

export default performUpdateDraftDoi;
