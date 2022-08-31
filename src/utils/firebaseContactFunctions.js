import firebase from "../firebase";

export async function cloneContact(region, userID, contactID) {
  const contactsRef = firebase
    .database()
    .ref(region)
    .child("users")
    .child(userID)
    .child("contacts");

  const contact = (await contactsRef.child(contactID).once("value")).val();

  if (contact.lastName) contact.lastName += " (Copy)";
  else contact.orgName += " (Copy)";
  contactsRef.push(contact);
}

export function deleteContact(region, userID, contactID) {
  return firebase
    .database()
    .ref(region)
    .child("users")
    .child(userID)
    .child("contacts")
    .child(contactID)
    .remove();
}

export async function newContact(region, userID) {
  const newNode = await firebase
    .database()
    .ref(region)
    .child("users")
    .child(userID)
    .child("contacts")
    .push({});

  return newNode.key;
}
