import { initializeApp } from 'firebase/app'
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions'
import { getDatabase, connectDatabaseEmulator } from 'firebase/database'
// NOTE: compat import kept only if elsewhere in the app we still use firebase.database() compat API.
// Remove if fully migrated.
import 'firebase/compat/database'

// Environment flags (strings 'true'/'false')
const deployedOnTestServer = process.env.REACT_APP_DEV_DEPLOYMENT;
const localFirebaseFunctions = process.env.REACT_APP_FIREBASE_LOCAL_FUNCTIONS;
const localFirebaseDatabase = process.env.REACT_APP_FIREBASE_LOCAL_DATABASE;

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


// Decide which remote project config to use. In local dev we generally want devConfig.
const config = process.env.NODE_ENV === 'production' && deployedOnTestServer !== 'true'
  ? prodConfig
  : devConfig

const App = initializeApp(config);

// Connect to Database Emulator if running locally.
// Port comes from firebase-functions/firebase.json (database.port = 9001).
// Using 127.0.0.1 ensures connection inside devcontainer forwarded to host.
if (typeof window !== 'undefined' && window.location.hostname === 'localhost' && localFirebaseDatabase === 'true') {
  try {
    const database = getDatabase(App)
    connectDatabaseEmulator(database, '127.0.0.1', 9001)
    // eslint-disable-next-line no-console
    console.info('[firebase] Connected to Realtime Database emulator on 127.0.0.1:9001')
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[firebase] Failed to connect to Database emulator', err)
  }
}

// Export the resolved config so UI components can reference values (e.g., databaseURL)
export const firebaseConfig = config;

// Connect to Functions emulator(s). We have two codebases (py + js) configured: root firebase.json (5001) and firebase-functions/firebase.json (5002).
// Only attempt ports that are actually running.
if (typeof window !== 'undefined' && window.location.hostname === 'localhost' && localFirebaseFunctions === 'true') {
  try {
    const functions = getFunctions(App)
    // Prefer 5002 per emulate-functions.sh script output; attempt 5001 if also forwarded.
    const functionPorts = [5002, 5001]
    functionPorts.forEach((p) => {
      try {
        connectFunctionsEmulator(functions, '127.0.0.1', p)
        // eslint-disable-next-line no-console
        console.info(`[firebase] Connected to Functions emulator on 127.0.0.1:${p}`)
      } catch (inner) {
        // eslint-disable-next-line no-console
        console.warn(`[firebase] Could not connect to Functions emulator on port ${p}`, inner)
      }
    })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[firebase] Failed setting up Functions emulator connections', err)
  }
}


export default App;

