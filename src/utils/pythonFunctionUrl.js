import firebase from "../firebase";

/**
 * Gets the URL for a Python Firebase function.
 * Supports both local development (emulator) and production deployment.
 *
 * @param {string} name - The deployed function name, e.g. "convert_metadata"
 * @returns {string} The function URL
 */
export const getPythonFunctionUrl = (name) => {
  const { options: { projectId } } = firebase;
  const functionRegion = import.meta.env.VITE_FUNCTION_REGION || "us-central1";

  // Check if we should use the emulator
  const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  const useLocalFunctions = import.meta.env.VITE_FIREBASE_LOCAL_FUNCTIONS === "true";

  if (isLocal && useLocalFunctions) {
    // Port 5001 is standard for Firebase functions and matches root firebase.json
    return `http://localhost:5001/${projectId}/${functionRegion}/${name}`;
  }

  return `https://${functionRegion}-${projectId}.cloudfunctions.net/${name}`;
};
