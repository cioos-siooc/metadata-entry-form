import React, { useState, useEffect, useRef } from "react";
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

import { unique } from "../../utils/misc";

const cleanArr = (arr) => unique(arr.map((e) => e.trim()).filter((e) => e));

const Admin = (props) => {
  const { match } = props;
  const { region } = match.params;
  const mounted = useRef(false);

  const [state, setState] = useState({
    admins: [],
    projects: [],
    reviewers: [],
    loading: false,
  })

  useEffect(() => {
    mounted.current = true;
    let projects;

    // Before initiating any async operations, the component's state is updated to indicate loading is in progress.
    setState((prevState) => ({ ...prevState, loading: true }));

    // subscribe to auth state changes
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        // Reference to the region in the database
        const regionRef = firebase.database().ref(region);
        // Reference to permissions
        const permissionsRef = regionRef.child('permissions');
        // fetch projects for the region
        if (mounted.current) {
          projects = await getRegionProjects(region);
        }
        
        // Listen for changes to permissions
        const unsubscribePermissions = permissionsRef.on('value', (permissionsFirebase) => {
          const permissions = permissionsFirebase.toJSON();
          // const projects = permissions.projects.split(",");
          const admins = permissions.admins.split(",");
          const reviewers = permissions.reviewers.split(",");

          // Update state with fetched data
          setState(prevState => ({
            ...prevState,
            projects,
            admins,
            reviewers,
            loading: false,
          }));
        });

        // Cleanup function for permissionsRef listener
        return () => permissionsRef.off('value', unsubscribePermissions);
      }
    return () => {};
    });
    // Cleanup function for the entire useEffect hook
    // This is to clean up the auth listener when the component unmounts
  return () => {
      mounted.current = false;
      unsubscribe();
  };
  }, [region]);

  const save = () => {

    const { reviewers, admins, projects } = state;

    if (auth.currentUser) {
      const regionRef = firebase.database().ref(region);
      const permissionsRef = regionRef.child("permissions");
      const projectsRef = regionRef.child("projects");

      permissionsRef.child("admins").set(cleanArr(admins).join());

      projectsRef.set(cleanArr(projects));
      permissionsRef.child("reviewers").set(cleanArr(reviewers).join());
    }
  }

  const { loading, reviewers, admins, projects } = state;

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
            <En>Add each admin or reviewer's email address on it's own line</En>
            <Fr>
              Ajouter l'adresse e-mail de chaque administrateur ou réviseur sur
              sa propre ligne
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
                setState((prevState) => ({
                  ...prevState,
                  projects: e.target.value.split("\n"),
                }))
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
                setState(prevState => ({
                  ...prevState,
                  admins: e.target.value.split("\n"),
                }))
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
                setState(prevState => ({
                ...prevState,
                reviewers: e.target.value.split("\n"),
                }))
              }
            />
          </Grid>
          <Grid item xs>
        <Typography variant="h5">
          <I18n>
            <En>Enable DOI Creation</En>
            <Fr>Activer la création de DOI</Fr>
          </I18n>
        </Typography>
        <Typography>
          <I18n>
            <En>Enter the region's DataCite Prefix and Authentication Credentials</En>
            <Fr>
                Entrez le préfixe DataCite et les informations d'authentification de la région.
            </Fr>
          </I18n>
        </Typography>
      </Grid>
          <Grid item xs>
            <Typography>
              <I18n>
                <En>Datacite Prefix Eg, '10.0000'</En>
                <Fr>Préfixe Datacite par exemple, '10.0000'</Fr>
              </I18n>
            </Typography>
          </Grid>
          <Grid item xs>
            <TextField
              multiline
              fullWidth
              onChange={(e) =>
              console.log(e.target.value)
              }
            />
          </Grid>
          <Grid item xs>
            <Button
              startIcon={<Save />}
              variant="contained"
              color="secondary"
              onClick={() => save()}
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

export default Admin;
