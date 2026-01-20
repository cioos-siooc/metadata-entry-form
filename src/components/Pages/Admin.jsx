import React from "react";
import {
  Typography,
  Button,
  CircularProgress,
  TextField,
  Grid,
  InputAdornment,
  IconButton,
  Checkbox,
  Paper,
  FormControlLabel,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@material-ui/core";
import { Save, Visibility, VisibilityOff } from "@material-ui/icons";
import CheckCircleIcon from "@material-ui/icons/CheckCircle";
import CancelIcon from "@material-ui/icons/Cancel";
import { getDatabase, ref, child, onValue, update } from "firebase/database";
import { Buffer } from 'buffer';

import firebase from "../../firebase";
import { getRegionProjects } from "../../utils/firebaseRecordFunctions";
import { UserContext } from "../../providers/UserProvider";
import { deleteAllDataciteCredentials } from "../../utils/firebaseEnableDoiCreation";
import { auth, getAuth, onAuthStateChanged } from "../../auth";
import { En, Fr, I18n } from "../I18n";
import FormClassTemplate from "./FormClassTemplate";

import { unique } from "../../utils/misc";

import { paperClass } from "../FormComponents/QuestionStyles";

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
      datacitePrefixValid: true,
      dataciteAccountId: "",
      datacitePass: "",
      loading: false,
      showPassword: false,
      isDoiCreationEnabled: false,
      credentialsStored: false,
      showDeletionDialog: false,
      showCredentialsMissingDialog: false,
      githubOwner: "cioos-siooc",
      githubRepo: "cioos-siooc-forms",
      githubToken: "",
      githubBranch: "main",
      githubFileTemplate: "{filename}",
      githubEnvironments: "prod",
      showGithubToken: false,
    };
  }

  async componentDidMount() {
    const { match } = this.props;
    const { region } = match.params;
    const { getCredentialsStored, getDatacitePrefix } = this.context;
    const database = getDatabase(firebase);

    this.setState({ loading: true });

    this.unsubscribe = onAuthStateChanged(getAuth(firebase), async (user) => {
      if (user) {
        // Reference to the regionAdmin in the database
        const adminRef = ref(database, "admin");
        const regionAdminRef = child(adminRef, region);
        const permissionsRef = child(regionAdminRef, "permissions");

        const projects = await getRegionProjects(region);
        const datacitePrefix = await getDatacitePrefix(region).then(
          (response) => {
            return response.data;
          }
        );
        const credentialsStored = await getCredentialsStored(region).then(
          (response) => {
            return response.data;
          }
        );

        const githubRef = child(regionAdminRef, "githubCredentials");
        onValue(githubRef, (snapshot) => {
          const data = snapshot.val();
          // Always update state, even if data is null (first time setup)
          this.setState({
            githubOwner: data?.owner || "cioos-siooc",
            githubRepo: data?.repo || "cioos-siooc-forms",
            githubBranch: data?.branch || "main",
            githubFileTemplate: data?.fileTemplate || "{filename}",
            githubEnvironments: (data?.environments || ["prod"]).join("\n"),
            githubToken: data?.token || "",
          });
        });

        const projectsRef = child(regionAdminRef, "projects");
        onValue(projectsRef, (snapshot) => {
          const projectsData = snapshot.val();
          if (projectsData) {
            this.setState({
              projects: Object.values(projectsData),
            });
          }
        });

        onValue(permissionsRef, (permissionsFirebase) => {
          const permissions = permissionsFirebase.toJSON();

          const admins = permissions.admins ? permissions.admins.split(",") : [];
          const reviewers = permissions.reviewers ? permissions.reviewers.split(",") : [];

          this.setState({
            projects, // Use the projects fetched by getRegionProjects initially
            admins,
            reviewers,
            loading: false,
            datacitePrefix,
            credentialsStored,
            isDoiCreationEnabled: credentialsStored,
          });
        });
        this.listenerRefs.push(permissionsRef);
        this.listenerRefs.push(projectsRef);
        this.listenerRefs.push(githubRef);
      }
    });
  }

  componentDidUpdate(prevProps, prevState) {
    // Check if credentialsStored state has changed
    if (prevState.credentialsStored !== this.state.credentialsStored) {
      if (this.state.credentialsStored) {
        // eslint-disable-next-line react/no-did-update-set-state
        this.setState({ isDoiCreationEnabled: true });
      }
    }
  }

  handleClickShowPassword = () =>
    this.setState((prevState) => ({
      showPassword: !prevState.showPassword,
    }));

  handleClickShowGithubToken = () =>
    this.setState((prevState) => ({
      showGithubToken: !prevState.showGithubToken,
    }));

  handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  handleToggleDoiCreation = () => {
    const { isDoiCreationEnabled, credentialsStored } = this.state;
    if (isDoiCreationEnabled && credentialsStored) {
      // Open confirmation dialog
      this.setState({ showDeletionDialog: true });
    } else {
      // Enable DOI creation or disable it without credentials stored
      this.setState((prevState) => ({
        isDoiCreationEnabled: !prevState.isDoiCreationEnabled,
      }));
    }
  };

  handleDisableDoiCreation = async () => {
    const { region } = this.props.match.params;

    try {
      await deleteAllDataciteCredentials(region);
      this.setState({
        datacitePrefix: "",
        dataciteAccountId: "",
        datacitePass: "",
        credentialsStored: false,
        isDoiCreationEnabled: false,
        showDeletionDialog: false,
      });
    } catch (error) {
      throw new Error(`Failed to delete DataCite credentials: ${error}`);
    }
  };

  handleSave() {
    const { match } = this.props;
    const { region } = match.params;
    const {
      reviewers,
      admins,
      projects,
      datacitePrefix,
      dataciteAccountId,
      datacitePass,
      isDoiCreationEnabled,
      githubOwner,
      githubRepo,
      githubToken,
      githubBranch,
      githubFileTemplate,
      githubEnvironments,
    } = this.state;
    const database = getDatabase(firebase);

    if (auth.currentUser) {
      const regionAdminRef = ref(database, `admin/${region}`);
      const updates = {};

      // 1. Permissions
      updates["permissions/admins"] = cleanArr(admins).join();
      updates["permissions/reviewers"] = cleanArr(reviewers).join();
      updates.projects = cleanArr(projects); // Save projects at the top level, not under permissions

      // 2. DOI Credentials if enabled
      if (isDoiCreationEnabled) {
        if (!datacitePrefix || !dataciteAccountId || !datacitePass) {
          this.setState({ showCredentialsMissingDialog: true });
        } else {
          const bufferObj = Buffer.from(
            `${dataciteAccountId}:${datacitePass}`,
            "utf8"
          );
          const base64String = bufferObj.toString("base64");

          updates["dataciteCredentials/prefix"] = datacitePrefix;
          updates["dataciteCredentials/dataciteHash"] = base64String;

          this.setState({
            datacitePass: "",
            credentialsStored: true,
          });
        }
      }

      // 3. GitHub Credentials
      const githubCredentials = {
        owner: githubOwner,
        repo: githubRepo,
        token: githubToken,
        branch: githubBranch,
        fileTemplate: githubFileTemplate,
        environments: cleanArr(githubEnvironments.split("\n")),
      };
      updates.githubCredentials = githubCredentials;

      update(regionAdminRef, updates)
        .catch((error) => {
          console.error('Failed to save admin settings:', error);
          alert(`Failed to save admin settings: ${error.message}`);
        });
    } else {
      console.error('No authenticated user found');
      alert('You must be logged in to save admin settings');
    }
  }

  renderDeletionDialog() {
    return (
      <Dialog
        open={this.state.showDeletionDialog}
        onClose={() => this.setState({ showDeletionDialog: false })}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Delete Datacite Credentials?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Disabling DOI creation will delete the stored credentials. Are you
            sure you want to proceed?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => this.setState({ showDeletionDialog: false })}
            color="primary"
          >
            Cancel
          </Button>
          <Button
            onClick={() => this.handleDisableDoiCreation()}
            color="primary"
            autoFocus
          >
            Delete Credentials
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  renderCredentialsMissingDialog() {
    return (
      <Dialog
        open={this.state.showCredentialsMissingDialog}
        onClose={() => this.setState({ showCredentialsMissingDialog: false })}
        aria-labelledby="credentials-missing-dialog-title"
        aria-describedby="credentials-=missing-dialog-description"
      >
        <DialogTitle id="credentials-missing-dialog-title">
          Missing DataCite Credentials
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="credentials-missing-dialog-description">
            Please add DataCite credentials before saving.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              this.setState({ showCredentialsMissingDialog: false })
            }
            color="primary"
            autoFocus
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  handleChange = (event) => {
    const { name, value } = event.target;
    this.setState({ [name]: value }, () => {
      if (name === "datacitePrefix") {
        this.validateDatacitePrefix(value);
      }
    });
  };

  validateDatacitePrefix = (prefix) => {
    const isValid = /^10\.\d+/.test(prefix);
    this.setState({ datacitePrefixValid: isValid });
  };

  render() {
    const {
      loading,
      reviewers,
      admins,
      projects,
      showPassword,
      datacitePrefix,
      isDoiCreationEnabled,
      credentialsStored,
    } = this.state;

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
            <Paper style={paperClass}>
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
            </Paper>
            <Paper style={paperClass}>
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
            </Paper>
            <Paper style={paperClass}>
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
            </Paper>
            <Paper style={paperClass}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="h5">
                    <I18n>
                      <En>DOI Creation Settings</En>
                      <Fr>Paramètres de création de DOI</Fr>
                    </I18n>
                  </Typography>
                </Grid>
                <Grid
                  item
                  xs={12}
                  container
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Grid item>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={this.state.isDoiCreationEnabled || false}
                          onChange={this.handleToggleDoiCreation}
                        />
                      }
                      label={
                        <I18n>
                          <En>Enable DOI Creation</En>
                          <Fr>Activer la création de DOI</Fr>
                        </I18n>
                      }
                    />
                  </Grid>
                  {isDoiCreationEnabled && credentialsStored && (
                    <Grid item container spacing={2} alignItems="center">
                      <Grid item>
                        <Typography variant="body1">
                          <CheckCircleIcon
                            style={{
                              color: "green",
                              marginRight: 4,
                              fontSize: "1.4rem",
                            }}
                          />
                          <I18n>
                            <En>Credentials Stored</En>
                            <Fr>Identifiants Enregistrés</Fr>
                          </I18n>
                        </Typography>
                      </Grid>
                    </Grid>
                  )}
                  {isDoiCreationEnabled && !credentialsStored && (
                    <Grid item container spacing={2} alignItems="center">
                      <Grid item>
                        <Typography variant="body1">
                          <CancelIcon
                            style={{
                              color: "red",
                              marginRight: 4,
                              fontSize: "1.4rem",
                            }}
                          />
                          <I18n>
                            <En>Please Add DataCite Credentials</En>
                            <Fr>Identifiants Enregistrés</Fr>
                          </I18n>
                        </Typography>
                      </Grid>
                    </Grid>
                  )}
                </Grid>
                {isDoiCreationEnabled && (
                  <>
                    <Grid item xs={12}>
                      <TextField
                        name="datacitePrefix"
                        label={
                          <I18n>
                            <En>DataCite Prefix</En>
                            <Fr>Préfixe DataCite</Fr>
                          </I18n>
                        }
                        placeholder="10.0000"
                        value={datacitePrefix || ""}
                        onChange={this.handleChange}
                        fullWidth
                        error={!this.state.datacitePrefixValid}
                        helperText={
                          !this.state.datacitePrefixValid &&
                          "Prefix must start with '10.' followed by numbers."
                        }
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        name="dataciteAccountId"
                        label={
                          <I18n>
                            <En>Account ID</En>
                            <Fr>Identifiant du compte</Fr>
                          </I18n>
                        }
                        onChange={this.handleChange}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        name="datacitePass"
                        label={
                          <I18n>
                            <En>Password</En>
                            <Fr>Mot de passe</Fr>
                          </I18n>
                        }
                        type={showPassword ? "text" : "password"}
                        onChange={this.handleChange}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={this.handleClickShowPassword}
                                onMouseDown={this.handleMouseDownPassword}
                                edge="end"
                              >
                                {showPassword ? (
                                  <VisibilityOff />
                                ) : (
                                  <Visibility />
                                )}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                        fullWidth
                      />
                    </Grid>
                  </>
                )}
              </Grid>
            </Paper>
            <Paper style={paperClass}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="h5">
                    <I18n>
                      <En>GitHub Publishing Configuration</En>
                      <Fr>Configuration de publication GitHub</Fr>
                    </I18n>
                  </Typography>
                  <Typography variant="body2" style={{ marginTop: "10px" }}>
                    <I18n>
                      <En>
                        Configure the GitHub repository where metadata records will
                        be published. This allows reviewers to push approved
                        records directly to a GitHub repository as XML and YAML
                        files.
                      </En>
                      <Fr>
                        Configurez le référentiel GitHub où les enregistrements de
                        métadonnées seront publiés. Cela permet aux réviseurs de
                        pousser les enregistrements approuvés directement vers un
                        référentiel GitHub sous forme de fichiers XML et YAML.
                      </Fr>
                    </I18n>
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    name="githubOwner"
                    label={
                      <I18n>
                        <En>Repository Owner</En>
                        <Fr>Propriétaire du dépôt</Fr>
                      </I18n>
                    }
                    value={this.state.githubOwner}
                    onChange={this.handleChange}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    name="githubRepo"
                    label={
                      <I18n>
                        <En>Repository Name</En>
                        <Fr>Nom du dépôt</Fr>
                      </I18n>
                    }
                    value={this.state.githubRepo}
                    onChange={this.handleChange}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    name="githubToken"
                    label="GitHub Token"
                    type={this.state.showGithubToken ? "text" : "password"}
                    value={this.state.githubToken}
                    onChange={this.handleChange}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={this.handleClickShowGithubToken}
                            onMouseDown={this.handleMouseDownPassword}
                            edge="end"
                          >
                            {this.state.showGithubToken ? (
                              <VisibilityOff />
                            ) : (
                              <Visibility />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    fullWidth
                  />
                  <Typography variant="caption" color="textSecondary">
                    <I18n>
                      <En>
                        Personal Access Token (PAT) with 'repo' scope.
                      </En>
                      <Fr>
                        Jeton d'accès personnel (PAT) avec la portée 'repo'.
                      </Fr>
                    </I18n>
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    name="githubBranch"
                    label="Target Branch"
                    value={this.state.githubBranch}
                    onChange={this.handleChange}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    name="githubFileTemplate"
                    label="File Naming Template"
                    value={this.state.githubFileTemplate}
                    onChange={this.handleChange}
                    fullWidth
                    helperText="Default: {filename}"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    name="githubEnvironments"
                    label="Environments"
                    multiline
                    value={this.state.githubEnvironments}
                    onChange={this.handleChange}
                    fullWidth
                    helperText="One environment per line (e.g. prod)"
                  />
                </Grid>
              </Grid>
            </Paper>
            <Grid item xs>
              <Button
                startIcon={<Save />}
                variant="contained"
                color="primary"
                style={{ margin: 10 }}
                onClick={() => this.handleSave()}
              >
                <I18n>
                  <En>Save Admin Settings</En>
                  <Fr>Enregistrer les paramètres d'administration</Fr>
                </I18n>
              </Button>
            </Grid>
          </>
        )}
        {this.renderDeletionDialog()}
        {this.renderCredentialsMissingDialog()}
      </Grid>
    );
  }
}

Admin.contextType = UserContext;
export default Admin;
