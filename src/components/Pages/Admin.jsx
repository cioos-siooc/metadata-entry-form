import React from "react";
import {
  Typography,
  Button,
  CircularProgress,
  TextField,
  Grid,
} from "@material-ui/core";
import { Save } from "@material-ui/icons";

import firebase from "../../firebase";
import { getRegionProjects } from "../../utils/firebaseRecordFunctions";
import { auth } from "../../auth";
import { En, Fr, I18n } from "../I18n";
import FormClassTemplate from "./FormClassTemplate";

import { unique } from "../../utils/misc";

const cleanArr = (arr) => unique(arr.map((e) => e.trim()).filter((e) => e));

class Admin extends FormClassTemplate {
  constructor(props) {
    super(props);
    this.state = {
      // array of strings which are email addresses or reviewers, admins
      admins: [],
      projects: [],
      reviewers: [],
      loading: false,
    };
  }

  async componentDidMount() {
    const { match } = this.props;
    const { region } = match.params;

    this.setState({ loading: true });

    this.unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const regionRef = firebase.database().ref(region);
        const permissionsRef = regionRef.child("permissions");
        const projects = await getRegionProjects(region);
        permissionsRef.on("value", (permissionsFirebase) => {
          const permissions = permissionsFirebase.toJSON();

          // const projects = permissions.projects.split(",");
          const admins = permissions.admins.split(",");
          const reviewers = permissions.reviewers.split(",");

          this.setState({
            projects,
            admins,
            reviewers,
            loading: false,
          });
        });
        this.listenerRefs.push(permissionsRef);
      }
    });
  }

  save() {
    const { match } = this.props;
    const { region } = match.params;

    const { reviewers, admins, projects } = this.state;

    if (auth.currentUser) {
      const regionRef = firebase.database().ref(region);
      const permissionsRef = regionRef.child("permissions");
      const projectsRef = regionRef.child("projects");

      permissionsRef.child("admins").set(cleanArr(admins).join());

      projectsRef.set(cleanArr(projects));
      permissionsRef.child("reviewers").set(cleanArr(reviewers).join());
    }
  }

  render() {
    const { loading, reviewers, admins, projects } = this.state;
    return (
      <Grid container direction="column" spacing={3}>
        <Grid item xs>
          <Typography variant="h5">
            <I18n>
              <En>Admin</En>
              <Fr>Administrateurs</Fr>
            </I18n>
          </Typography>
          <Typography>
            <I18n>
              <En>
                Add each admin or reviewer's email address on it's own line
              </En>
              <Fr>
                Ajouter l'adresse e-mail de chaque administrateur ou réviseur
                sur sa propre ligne
              </Fr>
            </I18n>
          </Typography>
        </Grid>

        {loading ? (
          <CircularProgress />
        ) : (
          <>
            <Grid item xs>
              <Typography>
                <I18n>
                  <En>Projects</En>
                  <Fr>Projets</Fr>
                </I18n>
              </Typography>
            </Grid>
            <Grid item xs>
              <TextField
                multiline
                fullWidth
                value={projects.join("\n")}
                onChange={(e) =>
                  this.setState({ projects: e.target.value.split("\n") })
                }
              />
            </Grid>
            <Grid item xs>
              <Typography>
                <I18n>
                  <En>Admins</En>
                  <Fr>Administrateurs</Fr>
                </I18n>
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
                <I18n>
                  <En>Reviewers</En>
                  <Fr>Réviseurs</Fr>
                </I18n>
              </Typography>
            </Grid>
            <Grid item xs>
              <TextField
                multiline
                fullWidth
                value={reviewers.join("\n")}
                onChange={(e) =>
                  this.setState({
                    reviewers: e.target.value.split("\n"),
                  })
                }
              />
            </Grid>
            <Grid item xs>
              <Button
                startIcon={<Save />}
                variant="contained"
                color="secondary"
                onClick={() => this.save()}
              >
                <I18n>
                  <En>Save</En>
                  <Fr>Enregistrer</Fr>
                </I18n>
              </Button>
            </Grid>
          </>
        )}
      </Grid>
    );
  }
}

export default Admin;
