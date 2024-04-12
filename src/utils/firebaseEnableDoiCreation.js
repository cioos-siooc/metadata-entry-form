import { getDatabase, ref, set, remove } from "firebase/database";
import firebase from "../firebase";

export async function newDataciteAccount(region, prefix, authHash) {
    const database = getDatabase(firebase);
    const dataciteRef = ref(database, `admin/${region}/dataciteCredentials`);
    
    // Overwriting prefix and authHash directly under dataciteCredentials
    await set(dataciteRef,{
      prefix,
      dataciteHash: authHash,
  });
}

export async function deleteAllDataciteCredentials(region) {
  try {
    // Reference to the dataciteCredentials node for the specified region
    const database = getDatabase(firebase);

    // Deleting the dataciteCredentials node and all its children
    await remove(ref(database, `admin/${region}/dataciteCredentials`));

    // Return a message indicating success
    return { success: true, message: "All Datacite credentials deleted successfully." };
  } catch (error) {
    throw new Error(`Failed to delete Datacite credentials.: ${error}`);    
  }
}