import React, { createContext } from "react";
import { withRouter } from "react-router-dom";
import * as Sentry from "@sentry/react";
import { auth } from "../auth";
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
    };
  }

  componentDidMount = () => {
    const { match } = this.props;

    const { region } = match.params;
    this.setState({ authIsLoading: true });
    this.unsubscribe = auth.onAuthStateChanged((userAuth) => {
      if (userAuth) {
        const { displayName, email, uid } = userAuth;

        Sentry.configureScope((scope) => {
          scope.setUser({
            email,
            username: email,
          });
        });

        firebase
          .database()
          .ref(region)
          .child("users")
          .child(uid)
          .child("userinfo")
          .update({ displayName, email });

        const permissionsRef = firebase
          .database()
          .ref(region)
          .child(`permissions`);

        permissionsRef.on("value", (permissionsFB) => {
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
            loggedIn: true,
          });
        });
        this.listenerRefs.push(permissionsRef);
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
    const translate = firebase.functions().httpsCallable("translate");
    const regenerateXMLforRecord = firebase
      .functions()
      .httpsCallable("regenerateXMLforRecord");
    const downloadRecord = firebase.functions().httpsCallable("downloadRecord");
    const createDraftDoi = firebase.functions().httpsCallable("createDraftDoi");
    const updateDraftDoi = firebase.functions().httpsCallable("updateDraftDoi");
    const deleteDraftDoi = firebase.functions().httpsCallable("deleteDraftDoi");
    const getDoiStatus = firebase.functions().httpsCallable("getDoiStatus");
    const checkURLActive = firebase.functions().httpsCallable("checkURLActive");

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
        }}
      >
        {children}
      </UserContext.Provider>
    );
  }
}

export default withRouter(UserProvider);
