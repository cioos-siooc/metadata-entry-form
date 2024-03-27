import firebase from "../firebase";

export async function clonePlatform(region, userID, platformID) {
  const platformsRef = firebase
    .database()
    .ref(region)
    .child("users")
    .child(userID)
    .child("platforms");

  const platform = (await platformsRef.child(platformID).once("value")).val();

  platformsRef.push(platform);
}

export function deletePlatform(region, userID, platformID) {
  return firebase
    .database()
    .ref(region)
    .child("users")
    .child(userID)
    .child("platforms")
    .child(platformID)
    .remove();
}

export async function newPlatform(region, userID) {
  const newNode = await firebase
    .database()
    .ref(region)
    .child("users")
    .child(userID)
    .child("platforms")
    .push({});

  return newNode.key;
}
