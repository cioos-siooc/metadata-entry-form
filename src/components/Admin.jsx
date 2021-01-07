import React from "react";
import {
  Typography,
  Button,
  CircularProgress,
  TextField,
  Grid,
} from "@material-ui/core";
import { Save } from "@material-ui/icons";

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
    if (this.unsubscribe) this.unsubscribe();
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
      <Grid container direction="column" spacing={3}>
        <Grid item xs>
          <Typography variant="h5">
            <En>Admin</En>
            <Fr>Administrateurs</Fr>
          </Typography>
          <Typography>
            <En>Add each admin or reviewer's email address on it's own line</En>
            <Fr>
              Ajouter l'adresse e-mail de chaque administrateur ou réviseur sur
              sa propre ligne
            </Fr>
          </Typography>
        </Grid>

        {loading ? (
          <CircularProgress />
        ) : (
          <>
            <Grid item xs>
              <Typography>
                <En>Admins</En>
                <Fr>Administrateurs</Fr>
              </Typography>
            </Grid>
            <Grid item xs>
              <TextField
                multiline
                fullWidth
                value={admins.join("\n")}
                onChange={(e) =>
                  this.setState({ admins: e.target.value.split("\n") })
                }
              />
            </Grid>
            <Grid item xs>
              <Typography>
                <En>Reviewers</En>
                <Fr>Réviseurs</Fr>
              </Typography>
            </Grid>
            <Grid item xs>
              <TextField
                multiline
                fullWidth
                value={reviewers.join("\n")}
                onChange={(e) =>
                  this.setState({ reviewers: e.target.value.split("\n") })
                }
              />
            </Grid>
            <Grid item xs>
              <Button
                startIcon={<Save />}
                variant="contained"
                color="primary"
                onClick={() => this.updatePermissions()}
              >
                <En>Save</En>
                <Fr>Enregistrer</Fr>
              </Button>
            </Grid>
          </>
        )}
      </Grid>
    );
  }
}

export default Admin;
