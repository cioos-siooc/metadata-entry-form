import { getFunctions, httpsCallable } from "firebase/functions";
import { recordToDataCiteFromPython } from "./recordToDataCiteFromPython";

async function performUpdateDraftDoi(record, region, language, datacitePrefix) {
  const functions = getFunctions();
  const updateDraftDoi = httpsCallable(functions, "updateDraftDoi");

  // Use Python-based conversion with forUpdate flag to automatically omit type and prefix
  const mappedDataCiteObject = await recordToDataCiteFromPython(record, language, region, datacitePrefix, { forUpdate: true });

  // Extract DOI from the full URL
  const doi = record.datasetIdentifier.replace('https://doi.org/', '');

  const dataObject = {
    doi,
    region,
    data: mappedDataCiteObject,
  }

  const response = await updateDraftDoi(dataObject);
  return response.data.status;
}

export default performUpdateDraftDoi;
