import firebase from 'firebase/compat/app';
import "firebase/compat/database";
import "firebase/compat/auth";
import "firebase/compat/functions";
import "firebase/compat/firestore";

const deployedOnTestServer = process.env.REACT_APP_DEV_DEPLOYMENT;

const productionDB = "https://cioos-metadata-form.firebaseio.com";
const devDB = "https://cioos-metadata-form-dev.firebaseio.com";

const config = {
  apiKey: "AIzaSyAdlELZS5Lbea5NquotMT8amwO-Lc_7ogc",
  authDomain: "cioos-metadata-form.firebaseapp.com",
  databaseURL:
    process.env.NODE_ENV === "production" && !deployedOnTestServer
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
