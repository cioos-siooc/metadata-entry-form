import { getAuth, signInWithPopup, onAuthStateChanged, GoogleAuthProvider, OAuthProvider } from "firebase/auth";
import firebase from "./firebase";

const provider = new GoogleAuthProvider();

provider.setCustomParameters({ prompt: "select_account" });

const microsoftProvider = new OAuthProvider('microsoft.com');
microsoftProvider.setCustomParameters({
  prompt: "select_account",
});

const orcidProvider = new OAuthProvider('oidc.orcid');
orcidProvider.setCustomParameters({
  prompt: "login",
});

const auth = getAuth(firebase);
const signInWithGoogle = () => signInWithPopup(auth, provider);
const signInWithMicrosoft = () => signInWithPopup(auth, microsoftProvider);
const signInWithOrcid = () => signInWithPopup(auth, orcidProvider);
export { signInWithGoogle, signInWithMicrosoft, signInWithOrcid, auth, getAuth, onAuthStateChanged };
