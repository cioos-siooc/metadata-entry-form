import { getFunctions, httpsCallable } from "firebase/functions";
import { recordToDataCiteFromPython } from "./recordToDataCiteFromPython";

async function performUpdateDraftDoi(record, region, language, datacitePrefix) {
  const functions = getFunctions();
  const updateDraftDoi = httpsCallable(functions, "updateDraftDoi");

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

// True when the record's DOI lives on our DataCite prefix and DataCite knows it,
// i.e. we are able to push metadata updates to it.
export function isManagedDoi(record, datacitePrefix) {
  return Boolean(
    datacitePrefix &&
    record.datasetIdentifier?.includes(datacitePrefix) &&
    ["draft", "registered", "findable"].includes(record.doiCreationStatus),
  );
}

// Unreviewed form edits may reach DataCite only while the DOI is a draft.
// Registered and findable DOIs are permanent and resolvable, so their DataCite
// record is updated only when the record is published (see Reviewer).
export function canPushFormToDoi(record, datacitePrefix) {
  return (
    isManagedDoi(record, datacitePrefix) && record.doiCreationStatus === "draft"
  );
}

export default performUpdateDraftDoi;
