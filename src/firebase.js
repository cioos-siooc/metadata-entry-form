import firebase from "firebase/app";
import "firebase/database";
import "firebase/auth";
import "firebase/functions";
import "firebase/firestore";

const deployedOnTestSserver = process.env.REACT_APP_DEV_DEPLOYMENT;

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
  apiKey: process.env.REACT_APP_GOOGLE_CLOUD_API_KEY,
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

firebase.initializeApp(config);
// uncomment below to use firebase emulator for local development
// if (window.location.hostname === "localhost") {
//   firebase.functions().useFunctionsEmulator("http://localhost:5002");
//   // firebase.auth().useEmulator("http://localhost:9099");
// }

export default firebase;
