import { getDatabase, ref, child, get } from "firebase/database";
import firebase from "../firebase";

export async function newDataciteAccount(region, prefix, authHash) {
    const database = getDatabase(firebase);
    const dataciteRef = ref(database, `admin/${region}/dataciteCredentials`);
    
    // Overwriting prefix and authHash directly under dataciteCredentials
    await dataciteRef.set({
      prefix,
      dataciteHash: authHash,
  });
}

export async function deleteAllDataciteCredentials(region) {
  try {
    // Reference to the dataciteCredentials node for the specified region
    const database = getDatabase(firebase);
    const dataciteCredentialsRef = ref(database, `admin/${region}/dataciteCredentials`);

    // Deleting the dataciteCredentials node and all its children
    await dataciteCredentialsRef.remove();

    // Return a message indicating success
    return { success: true, message: "All Datacite credentials deleted successfully." };
  } catch (error) {
    // Log and return an error message
    console.error("Error deleting Datacite credentials:", error);
    return { success: false, message: "Failed to delete Datacite credentials." };
  }
}

export async function getDatacitePrefix(region) {
    try {
      const database = getDatabase(firebase);
      const prefix = (await get(ref(database, `admin/${region}/dataciteCredentials/prefix`), "value")).val();
      return prefix;
  } catch (error) {
      console.error(`Error fetching Datacite Prefix for region ${region}:`, error);
      return null;
  }
}

export async function getAuthHash(region) {
  try {
    const database = getDatabase(firebase);
    const authHash = (await get(ref(database, `admin/${region}/dataciteCredentials/dataciteHash`), "value")).val();
    return authHash;
} catch (error) {
    console.error(`Error fetching Datacite Auth Hash for region ${region}:`, error);
    return null;
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
    console.error("Error checking Datacite credentials:", error);
    return false;
  }
}
