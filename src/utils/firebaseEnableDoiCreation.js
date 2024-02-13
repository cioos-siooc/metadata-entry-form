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
      authHash,
  });

    return newNode.key;
}

export async function deleteAllDataciteCredentials(region) {
  try {
    // Reference to the dataciteCredentials node for the specified region
    const dataciteCredentialsRef = firebase
      .database()
      .ref("admin")
      .child(region)
      .child("dataciteCredentials");
    .child(credentialKey);

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
    const prefix = 
        (await firebase.database().ref('admin').child(region).child("dataciteCredentials").child("prefix").once("value")).val();
        
    return prefix;
  }
