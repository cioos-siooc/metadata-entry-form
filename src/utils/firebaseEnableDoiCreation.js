import { getDatabase, ref, child, get, set, remove } from "firebase/database";
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

export async function getDatacitePrefix(region) {
    try {
      const database = getDatabase(firebase);
      const prefix = (await get(ref(database, `admin/${region}/dataciteCredentials/prefix`), "value")).val();
      return prefix;
  } catch (error) {
      throw new Error(`Error fetching Datacite Prefix for region ${region}: ${error}`);
  }
}

export async function getAuthHash(region) {
  try {
    const database = getDatabase(firebase);
    const authHash = (await get(ref(database, `admin/${region}/dataciteCredentials/dataciteHash`), "value")).val();
    return authHash;
  } catch (error) {
      throw new Error(`Error fetching Datacite Auth Hash for region  ${region}: ${error}`);
  } 
}

export async function getCredentialsStored(region) {
  try {
    const database = getDatabase(firebase);
    const credentialsRef = ref(database, `admin/${region}/dataciteCredentials`);
    const authHashSnapshot = await get(child(credentialsRef, "dataciteHash"), "value");
    const prefixSnapshot = await get(child(credentialsRef, "prefix"), "value");

    const authHash = authHashSnapshot.val();
    const prefix = prefixSnapshot.val();

    // Check for non-null and non-empty
    return authHash && authHash !== "" && prefix && prefix !== "";
  } catch (error) {
    throw new Error(`Error checking Datacite credentials: ${error}`);
  }
}
