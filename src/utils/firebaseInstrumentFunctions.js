import {child, get, getDatabase, push, ref, remove} from "firebase/database";
import firebase from "../firebase";

export async function cloneInstrument(region, userID, instrumentID) {

  const database = getDatabase(firebase)
  const instrumentsRef = ref(database, `${region}/users/${userID}/instruments/`)
  const instrument = (await get(child(instrumentsRef, instrumentID), "value")).val();
  if (instrument.id) instrument.id += " (Copy)";
  push(instrumentsRef, instrument);
}

export function deleteInstrument(region, userID, instrumentID) {
  const database = getDatabase(firebase)

  return remove(ref(database, `${region}/users/${userID}/instruments/${instrumentID}`));
}

export async function newInstrument(region, userID) {
  const database = getDatabase(firebase);
  const newNode = await push(ref(database, `${region}/users/${userID}/instruments/`), {});
  return newNode.key;
}
