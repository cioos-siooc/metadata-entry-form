import firebase from "../firebase";

export async function cloneInstrument(region, userID, instrumentID) {
  const instrumentsRef = firebase
    .database()
    .ref(region)
    .child("users")
    .child(userID)
    .child("instruments");

  const instrument = (await instrumentsRef.child(instrumentID).once("value")).val();

  instrumentsRef.push(instrument);
}

export function deleteInstrument(region, userID, instrumentID) {
  return firebase
    .database()
    .ref(region)
    .child("users")
    .child(userID)
    .child("instruments")
    .child(instrumentID)
    .remove();
}

export async function newInstrument(region, userID) {
  const newNode = await firebase
    .database()
    .ref(region)
    .child("users")
    .child(userID)
    .child("instruments")
    .push({});

  return newNode.key;
}
