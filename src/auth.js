import {
  getAuth,
  signInWithPopup,
  onAuthStateChanged,
  GoogleAuthProvider,
  OAuthProvider,
  fetchSignInMethodsForEmail,
  linkWithCredential,
} from "firebase/auth";
import firebase from "./firebase";

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

const microsoftProvider = new OAuthProvider("microsoft.com");
microsoftProvider.setCustomParameters({ prompt: "select_account" });

const orcidProvider = new OAuthProvider("oidc.orcid");
orcidProvider.setCustomParameters({ prompt: "login" });

const providersById = {
  "google.com": googleProvider,
  "microsoft.com": microsoftProvider,
  "oidc.orcid": orcidProvider,
};

const credentialFromError = (err) => {
  if (err?.customData?._tokenResponse) {
    if (GoogleAuthProvider.credentialFromError) {
      const c = GoogleAuthProvider.credentialFromError(err);
      if (c) return c;
    }
    if (OAuthProvider.credentialFromError) {
      const c = OAuthProvider.credentialFromError(err);
      if (c) return c;
    }
  }
  return null;
};

const auth = getAuth(firebase);

const signInWithProvider = async (provider) => {
  try {
    return await signInWithPopup(auth, provider);
  } catch (err) {
    if (err?.code !== "auth/account-exists-with-different-credential") throw err;

    const email = err.customData?.email;
    const pendingCred = credentialFromError(err);
    if (!email || !pendingCred) throw err;

    const methods = await fetchSignInMethodsForEmail(auth, email);
    const existingProviderId = methods.find((m) => providersById[m]);
    const existingProvider = providersById[existingProviderId];

    if (!existingProvider) {
      const friendly = new Error(
        `An account already exists for ${email} using ${
          methods.join(", ") || "another sign-in method"
        }. Please sign in with that method first, then link this provider from your account.`
      );
      friendly.code = err.code;
      throw friendly;
    }

    if (existingProvider.setCustomParameters) {
      existingProvider.setCustomParameters({ login_hint: email, prompt: "select_account" });
    }

    const result = await signInWithPopup(auth, existingProvider);
    await linkWithCredential(result.user, pendingCred);
    return result;
  }
};

const signInWithGoogle = () => signInWithProvider(googleProvider);
const signInWithMicrosoft = () => signInWithProvider(microsoftProvider);
const signInWithOrcid = () => signInWithProvider(orcidProvider);

export {
  signInWithGoogle,
  signInWithMicrosoft,
  signInWithOrcid,
  auth,
  getAuth,
  onAuthStateChanged,
};
