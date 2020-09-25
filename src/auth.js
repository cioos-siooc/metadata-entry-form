import firebase from "./firebase";

const provider = new firebase.auth.GoogleAuthProvider();

provider.setCustomParameters({ promt: "select_account" });

export const auth = firebase.auth();

auth.onAuthStateChanged((user) => {
  if (user) {
    if (auth.currentUser) {
      const { displayName, email, uid } = auth.currentUser;
      firebase
        .database()
        .ref(`test/users`)
        .child(uid)
        .child("userinfo")
        .update({ displayName, email });
    }
  }
});

export const signInWithGoogle = () => auth.signInWithPopup(provider);
