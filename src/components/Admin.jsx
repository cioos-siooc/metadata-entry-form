import React from "react";
import {
  Typography,
  Button,
  CircularProgress,
  TextField,
} from "@material-ui/core";

import firebase from "../firebase";
import { auth } from "../auth";
import { Fr, En } from "./I18n";

const unique = (arr) => [...new Set(arr)];

class Admin extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      // array of strings which are email addresses or reviewers, admins
      admins: [],
      reviewers: [],
      loading: false,
    };
  }

  async componentDidMount() {
    const { match } = this.props;
    const { region } = match.params;

    this.setState({ loading: true });

    this.unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        firebase
          .database()
          .ref(region)
          .child(`permissions`)
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

  componentWillUnmount() {
    this.unsubscribe();
  }

  updatePermissions() {
    const { match } = this.props;
    const { region } = match.params;

    const { reviewers, admins } = this.state;
    if (auth.currentUser) {
      const dbRef = firebase.database().ref(region).child("permissions");

      dbRef.child("admins").set(unique(admins));
      dbRef.child("reviewers").set(unique(reviewers));
    }
  }

  render() {
    const { loading, reviewers, admins } = this.state;
    return (
      <div>
        <Typography variant="h3">
          <En>Admin</En>
          <Fr>Admin</Fr>
        </Typography>
        {loading ? (
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
                value={admins.join("\n")}
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
                value={reviewers.join("\n")}
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
