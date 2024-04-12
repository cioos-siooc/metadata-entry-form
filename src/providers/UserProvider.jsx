/* eslint-disable camelcase */
import React, { createContext } from "react";
import { withRouter } from "react-router-dom";
import * as Sentry from "@sentry/react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getDatabase, ref, update, onValue } from "firebase/database";

import { getAuth, onAuthStateChanged } from "../auth";
import firebase from "../firebase";
import FormClassTemplate from "../components/Pages/FormClassTemplate";

export const UserContext = createContext({ user: null, authIsLoading: false });

class UserProvider extends FormClassTemplate {
  constructor(props) {
    super(props);
    this.state = {
      user: null,
      authIsLoading: false,
      admins: [],
      reviewers: [],
      isReviewer: false,
      loggedIn: false,
      hasSharedRecords: false,
    };
  }

  componentDidMount = () => {
    const { match } = this.props;

    const { region } = match.params;
    this.setState({ authIsLoading: true });
    this.unsubscribe = onAuthStateChanged(getAuth(firebase), (userAuth) => {
      if (userAuth) {
        const { displayName, email, uid } = userAuth;
        this.setState({ user: userAuth, authIsLoading: false, loggedIn: true });

        Sentry.configureScope((scope) => {
          scope.setUser({
            email,
            username: email,
          });
        });


        // should be replaced with getDatacitePrefix but can't as this function is not async
        const functions = getFunctions();
        const getDatacitePrefix = httpsCallable(functions, "getDatacitePrefix");
        getDatacitePrefix(region)
          .then((prefix) => {
            this.setState({
              datacitePrefix: prefix?.data,
            });
          });

        const database = getDatabase(firebase);
        update( ref(database, `${region}/users/${uid}/userinfo`), { displayName, email });
        
        const permissionsRef = ref(database, `admin/${region}/permissions`)

        onValue(permissionsRef, (permissionsFB) => {
          const permissions = permissionsFB.toJSON();

          const admins = permissions?.admins || "";
          const reviewers = permissions?.reviewers || "";

          const isAdmin = admins.includes(email);
          const isReviewer = reviewers.includes(email);

          this.setState({
            admins,
            reviewers,
            isAdmin,
            isReviewer,
          });
        });

        this.listenerRefs.push(permissionsRef);

        // real-time listener for shared records
        const sharesRef = ref(database, `${region}/shares/${uid}`);

        onValue(sharesRef, (snapshot) => {
            const hasSharedRecords = snapshot.exists();
            this.setState({ hasSharedRecords, authIsLoading: false });
          });

        this.listenerRefs.push(sharesRef);

      } else {
        this.setState({
          loggedIn: false,
          authIsLoading: false,
        });
      }
      this.setState({ user: userAuth, authIsLoading: false });
    });
  };

  render() {
    const { children } = this.props;
    const functions = getFunctions();
    const translate = httpsCallable(functions, "translate");
    const regenerateXMLforRecord = httpsCallable(functions, "regenerateXMLforRecord");
    const downloadRecord = httpsCallable(functions, "downloadRecord");
    const createDraftDoi = httpsCallable(functions, "createDraftDoi");
    const updateDraftDoi = httpsCallable(functions, "updateDraftDoi");
    const deleteDraftDoi = httpsCallable(functions, "deleteDraftDoi");
    const getDoiStatus = httpsCallable(functions, "getDoiStatus");
    const checkURLActive = httpsCallable(functions, "checkURLActive");
    const recordToDataCite = httpsCallable(functions, "recordToDataCite");
    const getCredentialsStored = httpsCallable(functions, "getCredentialsStored");
    const getDatacitePrefix = httpsCallable(functions, "getDatacitePrefix");

    return (
      <UserContext.Provider
        value={{
          ...this.state,
          translate,
          regenerateXMLforRecord,
          downloadRecord,
          createDraftDoi,
          updateDraftDoi,
          deleteDraftDoi,
          getDoiStatus,
          checkURLActive,
          recordToDataCite,
          getCredentialsStored,
          getDatacitePrefix,
        }}
      >
        {children}
      </UserContext.Provider>
    );
  }
}

export default withRouter(UserProvider);
