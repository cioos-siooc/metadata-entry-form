import React, { Component, createContext } from "react";
import { auth } from "../auth";
import firebase from "../firebase";

export const UserContext = createContext({ user: null, authIsLoading: false });

class UserProvider extends Component {
  constructor(props) {
    super(props);
    this.state = {
      user: null,
      authIsLoading: false,
      admins: [],
      reviewers: [],
      isReviewer: false,
    };
  }

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

  render({ children }) {
    return (
      <UserContext.Provider value={{ ...this.state }}>
        {children}
      </UserContext.Provider>
    );
  }
}

export default UserProvider;
