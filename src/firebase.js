import { initializeApp } from 'firebase/app'
// import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
// import "firebase/compat/database";

const deployedOnTestServer = process.env.REACT_APP_DEV_DEPLOYMENT;

// Firebase configuration using environment variables
// This allows easy deployment to different Firebase projects
const getFirebaseConfig = () => {
  // If custom Firebase config is provided via environment variables, use it
  if (process.env.REACT_APP_FIREBASE_PROJECT_ID) {
    return {
      apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
      authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
      databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
      projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
      storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.REACT_APP_FIREBASE_APP_ID,
      measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
    };
  }

  // Fallback to legacy configurations for backward compatibility
  const prodConfig = {
    // see https://console.cloud.google.com/apis/credentials?project=cioos-metadata-form-8d942
    // and https://console.cloud.google.com/apis/credentials?project=cioos-metadata-form-dev-258dc
    // for api key location which is then stored in a github secret and added to several
    // github actions to support testing and deployment.
    // see https://firebase.google.com/docs/projects/api-keys for a discussion of why we 
    // don't need to restrict api keys for firebase but might in some situations.
    // To prevent the future foot gun, we are restricting the key now.
    apiKey: process.env.REACT_APP_GOOGLE_CLOUD_API_KEY,
    authDomain: "cioos-metadata-form-8d942.firebaseapp.com",
    databaseURL: "https://cioos-metadata-form-8d942-default-rtdb.firebaseio.com",
    projectId: "cioos-metadata-form-8d942",
    storageBucket: "cioos-metadata-form-8d942.firebasestorage.app",
    messagingSenderId: "467286137979",
    appId: "1:467286137979:web:250b09e3db2a56716016de",
    measurementId: "G-BEMJG40RHN",
  };

  const devConfig = {
    apiKey: process.env.REACT_APP_GOOGLE_CLOUD_API_KEY_DEV,
    authDomain: "cioos-metadata-form-dev-258dc.firebaseapp.com",
    databaseURL: "https://cioos-metadata-form-dev-258dc-default-rtdb.firebaseio.com",
    projectId: "cioos-metadata-form-dev-258dc",
    storageBucket: "cioos-metadata-form-dev-258dc.firebasestorage.app",
    messagingSenderId: "141560007794",
    appId: "1:141560007794:web:861d99b02210ea4d17c6eb",
    measurementId: "G-BSKRHNR1EW",
  };

  return process.env.NODE_ENV === "production" && !deployedOnTestServer
    ? prodConfig
    : devConfig;
};

const config = getFirebaseConfig();

// if (window.location.hostname === "localhost" && deployedOnTestServer) {
//   config.databaseURL = "http://localhost:9001?ns=cioos-metadata-form"
// }

const App = initializeApp(config);

// // uncomment below to use firebase emulator for local development
// if (window.location.hostname === "localhost" && deployedOnTestServer) {
//   const functions = getFunctions(App);
//   connectFunctionsEmulator(functions, "127.0.0.1", 5001);
//   connectFunctionsEmulator(functions, "127.0.0.1", 5002);
// }


export default App;

