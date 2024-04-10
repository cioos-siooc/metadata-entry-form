import { getDatabase, ref, child, get, remove, push } from "firebase/database";
import firebase from "../firebase";

export async function cloneContact(region, userID, contactID) {
  const database = getDatabase(firebase);
  const contactsRef = ref(database, `${region}/users/${userID}/contacts`);

  const contact = (await get(child(contactsRef, contactID), "value")).val();

  if (contact.lastName) contact.lastName += " (Copy)";
  else contact.orgName += " (Copy)";
  push(contactsRef, contact);
}

export function deleteContact(region, userID, contactID) {
  const database = getDatabase(firebase);
  return remove(ref(database, `${region}/users/${userID}/contacts/${contactID}`));
}

export async function newContact(region, userID) {
  const database = getDatabase(firebase);
  const newNode = await push(ref(database, `${region}/users/${userID}/contacts`), {});

  return newNode.key;
}
