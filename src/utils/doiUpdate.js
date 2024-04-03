import recordToDataCite from "./recordToDataCite";
import firebase from "../firebase";
import {getAuthHash} from "./firebaseEnableDoiCreation";

async function performUpdateDraftDoi(record, region, language) {
     const dataciteAuthHash = await getAuthHash(region);

      const mappedDataCiteObject = recordToDataCite(record, language, region);
      delete mappedDataCiteObject.data.type;
      delete mappedDataCiteObject.data.attributes.prefix;

      // Extract DOI from the full URL
      const doi = record.datasetIdentifier.replace('https://doi.org/', '');

      const dataObject = {
        doi,
        data: mappedDataCiteObject,
        dataciteAuthHash,
      }

      const response = await firebase.functions().httpsCallable("updateDraftDoi")(dataObject);
      return response.data.status;
    }

export default performUpdateDraftDoi;
