import firebase from "firebase/app";
import "firebase/database";
import "firebase/auth";
import "firebase/functions";
import "firebase/firestore";

const deployedOnTestSserver = process.env.REACT_APP_DEV_DEPLOYMENT;

const productionDB = "https://cioos-metadata-form.firebaseio.com";
const devDB = "https://cioos-metadata-form-dev.firebaseio.com";

const prodConfig = {
  apiKey: "AIzaSyAdlELZS5Lbea5NquotMT8amwO-Lc_7ogc",
  authDomain: "cioos-metadata-form.firebaseapp.com",
  databaseURL:
    process.env.NODE_ENV === "production" && !deployedOnTestSserver
      ? productionDB
      : devDB,
  projectId: "cioos-metadata-form",
  storageBucket: "cioos-metadata-form.appspot.com",
  messagingSenderId: "646114203434",
  appId: "1:646114203434:web:bccceadc5144270f98f053",
};

const devConfig = {
  apiKey: "AIzaSyCbwcwHh3sEIvD3gm8SBwCQfAyjGS9a0sc",
  authDomain: "cioos-metadata-form-dev.firebaseapp.com",
  databaseURL: "https://cioos-metadata-form-dev-default-rtdb.firebaseio.com",
  projectId: "cioos-metadata-form-dev",
  storageBucket: "cioos-metadata-form-dev.appspot.com",
  messagingSenderId: "392401521083",
  appId: "1:392401521083:web:45d1539f9d284f446d5c9e",
}

const config = process.env.REACT_APP_ENVIRONMENT === "production" && !deployedOnTestSserver
  ? prodConfig
  : devConfig;

firebase.initializeApp(config);
// uncomment below to use firebase emulator for local development
// if (window.location.hostname === "localhost") {
//   firebase.functions().useFunctionsEmulator("http://localhost:5002");
//   // firebase.auth().useEmulator("http://localhost:9099");
// }

export default firebase;
