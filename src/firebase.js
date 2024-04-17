import { initializeApp } from 'firebase/app'
// import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
// import "firebase/compat/database";
// import { useEmulator} from "firebase/auth";
// import { useFunctionsEmulator} from "firebase/functions";
// import "firebase/compat/firestore";

const deployedOnTestServer = process.env.REACT_APP_DEV_DEPLOYMENT;

const productionDB = "https://cioos-metadata-form.firebaseio.com";
const devDB = "https://cioos-metadata-form-dev.firebaseio.com";

const config = {
  // see https://console.cloud.google.com/apis/credentials?project=cioos-metadata-form
  // and https://console.cloud.google.com/apis/credentials?project=cioos-metadata-form-dev
  // for api key location which is then stored in a github secret and added to several
  // github actions to support testing and deployment.
  // see https://firebase.google.com/docs/projects/api-keys for a discussion of why we 
  // don't need to restrict api keys for firebase but might in some situations.
  // To prevent the future foot gun, we are restricting the key now.
  apiKey: process.env.NODE_ENV === "production" && !deployedOnTestServer 
      ? process.env.REACT_APP_GOOGLE_CLOUD_API_KEY
      : process.env.REACT_APP_GOOGLE_CLOUD_API_KEY_DEV,
  authDomain: process.env.NODE_ENV === "production" && !deployedOnTestServer
      ? "cioos-metadata-form.firebaseapp.com"
      : "cioos-metadata-form-dev.firebaseapp.com",
  databaseURL:
    process.env.NODE_ENV === "production" && !deployedOnTestServer
      ? productionDB
      : devDB,
  projectId: process.env.NODE_ENV === "production" && !deployedOnTestServer
      ? "cioos-metadata-form"
      : "cioos-metadata-form-dev",
  storageBucket: "cioos-metadata-form.appspot.com",
  messagingSenderId: "646114203434",
  appId: "1:646114203434:web:bccceadc5144270f98f053",
};

if (window.location.hostname === "localhost" && deployedOnTestServer) {
  config.databaseURL = "http://localhost:9001?ns=cioos-metadata-form"
}

const App = initializeApp(config);

// uncomment below to use firebase emulator for local development
// if (window.location.hostname === "localhost" && deployedOnTestServer) {
//   const functions = getFunctions(App);
//   connectFunctionsEmulator(functions, "127.0.0.1", 5001);
//   connectFunctionsEmulator(functions, "127.0.0.1", 5002);
// //   // firebase.auth().useEmulator("http://localhost:9099");
// }


export default App;

