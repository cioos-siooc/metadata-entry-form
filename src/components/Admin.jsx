import React from "react";
import firebase from "../firebase";
import { auth } from "../auth";
import {
  Typography,
  Button,
  CircularProgress,
  TextField,
} from "@material-ui/core";

import { Fr, En } from "./I18n";
const unique = (arr) => [...new Set(arr)];

class Admin extends React.Component {
  state = {
    // array of strings which are email addresses or reviewers, admins
    admins: [],
    reviewers: [],
    loading: false,
  };
  componentWillUnmount() {
    this.unsubscribe();
  }

  async componentDidMount() {
    this.setState({ loading: true });

    this.unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        firebase
          .database()
          .ref(`test/permissions`)
          .on("value", (permissionsFirebase) => {
            const permissions = permissionsFirebase.toJSON();

            const admins = Object.values(permissions.admins || {});
            const reviewers = Object.values(permissions.reviewers || {});

            this.setState({
              admins,
              reviewers,
              loading: false,
            });
          });
      }
    });
  }

  updatePermissions() {
    if (auth.currentUser) {
      const dbRef = firebase.database().ref(`test/permissions`);

      dbRef.child("admins").set(unique(this.state.admins));
      dbRef.child("reviewers").set(unique(this.state.reviewers));
    }
  }

  render() {
    return (
      <div>
        <Typography variant="h3">
          <En>Admin</En>
          <Fr>Admin</Fr>
        </Typography>
        {this.state.loading ? (
          <CircularProgress />
        ) : (
          <div>
            <div>
              <Typography>
                <En>Admins</En>
                <Fr>Admins</Fr>
              </Typography>
              <TextField
                multiline
                fullWidth
                value={this.state.admins.join("\n")}
                onChange={(e) =>
                  this.setState({ admins: e.target.value.split("\n") })
                }
              />
            </div>
            <div>
              <Typography>
                <En>Reviewers</En>
                <Fr>Reviewers</Fr>
              </Typography>
              <TextField
                multiline
                fullWidth
                value={this.state.reviewers.join("\n")}
                onChange={(e) =>
                  this.setState({ reviewers: e.target.value.split("\n") })
                }
              />
            </div>
            <Button
              variant="contained"
              color="primary"
              onClick={() => this.updatePermissions()}
            >
              Update
            </Button>
          </div>
        )}
      </div>
    );
  }
}

export default Admin;
