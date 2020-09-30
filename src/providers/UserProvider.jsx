import React, { Component, createContext } from "react";
import { auth } from "../auth";
import firebase from "../firebase";

export const UserContext = createContext({ user: null, authIsLoading: false });

class UserProvider extends Component {
  state = {
    user: null,
    authIsLoading: false,
  };

  componentWillUnmount() {
    this.unsubscribe();
  }

  componentDidMount = () => {
    this.setState({ authIsLoading: true });
    this.unsubscribe = auth.onAuthStateChanged((userAuth) => {
      if (userAuth) {
        const { email } = userAuth;
        firebase
          .database()
          .ref(`test/permissions`)
          .on("value", (permissionsFB) => {
            const permissions = permissionsFB.toJSON();

            const admins = Object.values(permissions.admins);
            const reviewers = Object.values(permissions.reviewers);

            const isAdmin = admins.includes(email);
            const isReviewer = reviewers.includes(email);

            this.setState({
              admins,
              reviewers,
              isAdmin,
              isReviewer,
              authIsLoading: false,
            });
          });
      }

      this.setState({ user: userAuth });
    });
  };

  render() {
    return (
      <UserContext.Provider value={this.state}>
        {this.props.children}
      </UserContext.Provider>
    );
  }
}

export default UserProvider;
