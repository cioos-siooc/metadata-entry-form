import firebase from "./firebase";

const provider = new firebase.auth.GoogleAuthProvider();

provider.setCustomParameters({ prompt: "select_account" });

export const auth = firebase.auth();

export const signInWithGoogle = () => auth.signInWithPopup(provider);
