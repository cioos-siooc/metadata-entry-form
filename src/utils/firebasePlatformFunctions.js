import {child, get, getDatabase, push, ref, remove} from "firebase/database";
import firebase from "../firebase";

export async function clonePlatform(region, userID, platformID) {
  const database = getDatabase(firebase)
  const platformsRef = ref(database, `${region}/users/${userID}/platforms/`);
  const platform = (await get(child(platformsRef, platformID), "value")).val();

  if (platform.id) platform.id += " (Copy)";

  push(platformsRef, platform);
}

export function deletePlatform(region, userID, platformID) {
  const database = getDatabase(firebase)
  return remove(ref(database, `${region}/users/${userID}/platforms/${platformID}`));
}

export async function newPlatform(region, userID) {
  const database = getDatabase(firebase)
  const newNode = push(ref(database, `${region}/users/${userID}/platforms/`), {});
  return newNode.key;
}
