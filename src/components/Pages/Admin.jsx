import React from "react";
import {
  Typography,
  Button,
  CircularProgress,
  TextField,
  Grid,
  InputAdornment,
  IconButton,
} from "@material-ui/core";
import { Save, Visibility, VisibilityOff } from "@material-ui/icons";

import firebase from "../../firebase";
import { getRegionProjects } from "../../utils/firebaseRecordFunctions";
import { getDatacitePrefix } from "../../utils/firebaseEnableDoiCreation";
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
      datacitePrefix: "",
      dataciteAccountId: "",
      datacitePass: "",
      loading: false,
      showPassword: false,
    };
  }

  async componentDidMount() {
    const { match } = this.props;
    const { region } = match.params;

    this.setState({ loading: true });

    this.unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        // Reference to the regionAdmin in the database
        const adminRef = firebase.database().ref("admin");
        const regionAdminRef = adminRef.child(region);
        const permissionsRef = regionAdminRef.child("permissions");

        const projects = await getRegionProjects(region);
        const datacitePrefix = await getDatacitePrefix(region);
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
            datacitePrefix,
          });
        });
        this.listenerRefs.push(permissionsRef);
      }
    });
  }

  handleClickShowPassword = () =>
    this.setState((prevState) => ({
      showPassword: !prevState.showPassword,
    }));

  handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  save() {
    const { match } = this.props;
    const { region } = match.params;

    const { reviewers, admins, projects, datacitePrefix, dataciteAccountId, datacitePass } = this.state;

    const bufferObj = Buffer.from(`${dataciteAccountId}:${datacitePass}`, "utf8");
    const base64String = bufferObj.toString("base64"); 

    if (auth.currentUser) {
      const regionAdminRef = firebase.database().ref("admin").child(region);
      const permissionsRef = regionAdminRef.child("permissions");
      const projectsRef = regionAdminRef.child("projects");
      const dataciteRef = regionAdminRef.child("dataciteCredentials");

      permissionsRef.child("admins").set(cleanArr(admins).join());

      projectsRef.set(cleanArr(projects));
      permissionsRef.child("reviewers").set(cleanArr(reviewers).join());
      dataciteRef.child("prefix").set(datacitePrefix);
      dataciteRef.child("dataciteHash").set(base64String);

      this.setState({
        datacitePass: "",
      });
    }
  }

  render() {
    const { loading, reviewers, admins, projects, showPassword, datacitePrefix } = this.state;

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
              <Typography variant="h5">
                <I18n>
                  <En>Enable DOI Creation</En>
                  <Fr>Activer la création de DOI</Fr>
                </I18n>
              </Typography>
              <Typography>
                <I18n>
                  <En>
                    Enter the region's DataCite Prefix and Authentication
                    Credentials
                  </En>
                  <Fr>
                    Entrez le préfixe DataCite et les informations
                    d'authentification de la région.
                  </Fr>
                </I18n>
              </Typography>
            </Grid>
            <Grid item xs>
              <Typography>
                <I18n>
                  <En>Datacite Prefix For example, '10.0000'</En>
                  <Fr>Préfixe Datacite par exemple, '10.0000'</Fr>
                </I18n>
              </Typography>
            </Grid>
            <Grid item xs>
              <TextField
                label="Prefix"
                value={datacitePrefix}
                onChange={(e) =>
                  this.setState({ datacitePrefix: e.target.value })
                }
              />
            </Grid>
            <Grid item xs>
              <Typography>
                <I18n>
                  <En>Datacite account ID</En>
                  <Fr>Identifiant du compte Datacite</Fr>
                </I18n>
              </Typography>
            </Grid>
            <Grid item xs>
              <TextField
                label="AccountID"
                onChange={(e) =>
                  this.setState({ dataciteAccountId: e.target.value })
                }
              />
            </Grid>
            <Grid item xs>
              <Typography>
                <I18n>
                  <En>Datacite account Password</En>
                  <Fr>Mot de passe du compte Datacite</Fr>
                </I18n>
              </Typography>
            </Grid>
            <Grid item xs>
              <TextField
                label="Password"
                type={showPassword ? "text" : "password"}
                onChange={(e) =>
                  this.setState({ datacitePass: e.target.value })
                }
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={this.handleClickShowPassword}
                        onMouseDown={this.handleMouseDownPassword}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
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
