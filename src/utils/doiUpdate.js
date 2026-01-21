import { getFunctions, httpsCallable } from "firebase/functions";
import convertToDataCite from "./convertToDataCite";

async function performUpdateDraftDoi(record, region, language, datacitePrefix) {
  const functions = getFunctions();
  const updateDraftDoi = httpsCallable(functions, "updateDraftDoi");

  // For updates, regenerate schema and URL from backend; do not set explicit DOI here
  const mappedDataCiteObject = await convertToDataCite(record, { datacitePrefix, region, language, generateIfMissing: false });
  delete mappedDataCiteObject.data.type;
  delete mappedDataCiteObject.data.attributes.prefix;

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
