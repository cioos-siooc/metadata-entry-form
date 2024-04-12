import { getAuth, signInWithPopup, onAuthStateChanged, GoogleAuthProvider } from "firebase/auth";
import firebase from "./firebase";

const provider = new GoogleAuthProvider();

provider.setCustomParameters({ promt: "select_account" });
const auth = getAuth(firebase);
const signInWithGoogle = () => signInWithPopup(auth, provider);
export { signInWithGoogle, auth, getAuth, onAuthStateChanged };
