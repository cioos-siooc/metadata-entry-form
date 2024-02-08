import firebase from "../firebase";

export async function newDataciteAccount(region, prefix, authHash) {
    const dataciteRef = await firebase
        .database()
        .ref("admin")
        .child(region)
        .child("dataciteCredentials");
    
    // Setting prefix and authHash directly under dataciteCredentials
    const newNode = await dataciteRef.push({
        prefix,
        authHash,
    });

    return newNode.key;
}

export async function deleteDataciteAccount(region, credentialKey) {
  // Reference to the specific dataciteCredentials entry using the credentialKey
  const credentialRef = await firebase
    .database()
    .ref("admin")
    .child(region)
    .child("dataciteCredentials")
    .child(credentialKey);

  // Deleting the specified entry
  await credentialRef.remove();

  // Return a message indicating success, or handle errors as needed
  return { success: true, message: "Datacite account deleted successfully." };
}
