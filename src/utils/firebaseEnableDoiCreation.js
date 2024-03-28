import firebase from "../firebase";

export async function newDataciteAccount(region, prefix, authHash) {
    const dataciteRef = await firebase
        .database()
        .ref("admin")
        .child(region)
        .child("dataciteCredentials");

    // Overwriting prefix and authHash directly under dataciteCredentials
    await dataciteRef.set({
      prefix,
      dataciteHash: authHash,
  });
}

export async function deleteAllDataciteCredentials(region) {
  try {
    // Reference to the dataciteCredentials node for the specified region
    const dataciteCredentialsRef = firebase
      .database()
      .ref("admin")
      .child(region)
      .child("dataciteCredentials");

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
      const prefix = (await firebase.database().ref('admin').child(region).child("dataciteCredentials").child("prefix").once("value")).val();
      return prefix;
  } catch (error) {
      console.error(`Error fetching Datacite Prefix for region ${region}:`, error);
      return null;
  }
}

export async function getAuthHash(region) {
  try {
    const authHash = (await firebase.database().ref('admin').child(region).child("dataciteCredentials").child("dataciteHash").once("value")).val();
    return authHash;
} catch (error) {
    console.error(`Error fetching Datacite Auth Hash for region ${region}:`, error);
    return null;
}
}

export async function getCredentialsStored(region) {
  try {
    const credentialsRef = firebase.database().ref('admin').child(region).child("dataciteCredentials");
    const authHashSnapshot = await credentialsRef.child("dataciteHash").once("value");
    const prefixSnapshot = await credentialsRef.child("prefix").once("value");

    const authHash = authHashSnapshot.val();
    const prefix = prefixSnapshot.val();

    // Check for non-null and non-empty
    return authHash && authHash !== "" && prefix && prefix !== "";
  } catch (error) {
    console.error("Error checking Datacite credentials:", error);
    return false;
  }
}
