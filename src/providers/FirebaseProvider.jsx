import React, { Component, createContext } from "react";
import firebase from "../firebase";

export const FirebaseContext = createContext({ records: null });

class FirebaseProvider extends Component {
  state = {
    user: null,
  };
  databaseCallback = (records) => this.setState({ records: records.toJSON() });

  async componentDidMount() {
    firebase.database().ref("test").on("value", this.databaseCallback);
  }

  render() {
    return (
      <FirebaseContext.Provider value={this.state.records}>
        {this.props.children}
      </FirebaseContext.Provider>
    );
  }
}

export default FirebaseProvider;
