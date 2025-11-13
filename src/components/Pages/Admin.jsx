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
import { getDatabase, ref, child, onValue, set } from "firebase/database";
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
      // GitHub Publishing Configuration
      githubOwner: "cioos-siooc",
      githubRepo: "cioos-siooc-forms",
      githubToken: "",
      githubBranch: "main",
      githubEnvironments: ["prod"],
      githubFilenameTemplate: "{uuid}",
      showGithubToken: false,
      isGithubPublishingEnabled: false,
      githubCredentialsStored: false,
      githubOwnerValid: true,
      githubRepoValid: true,
      showGithubCredentialsMissingDialog: false,
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

        // Load GitHub credentials
        const githubCredentialsRef = child(regionAdminRef, "githubCredentials");
        onValue(githubCredentialsRef, (githubSnapshot) => {
          const githubCreds = githubSnapshot.toJSON();
          if (githubCreds) {
            this.setState({
              githubOwner: githubCreds.owner || "cioos-siooc",
              githubRepo: githubCreds.repo || "cioos-siooc-forms",
              githubBranch: githubCreds.branch || "main",
              githubEnvironments: githubCreds.environments || ["prod"],
              githubFilenameTemplate: githubCreds.filenameTemplate || "{uuid}",
              githubCredentialsStored: !!githubCreds.githubTokenHash,
              isGithubPublishingEnabled: !!githubCreds.githubTokenHash,
            });
          }
        });
        this.listenerRefs.push(githubCredentialsRef);

        onValue(permissionsRef, (permissionsFirebase) => {
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
            credentialsStored,
            isDoiCreationEnabled: credentialsStored,
          });
        });
        this.listenerRefs.push(permissionsRef);
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

  handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  handleClickShowGithubToken = () =>
    this.setState((prevState) => ({
      showGithubToken: !prevState.showGithubToken,
    }));

  handleMouseDownGithubToken = (event) => {
    event.preventDefault();
  };

  handleToggleGithubPublishing = () => {
    this.setState((prevState) => ({
      isGithubPublishingEnabled: !prevState.isGithubPublishingEnabled,
    }));
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

  save() {
    const { match } = this.props;
    const { region } = match.params;

    const { reviewers, admins, projects } = this.state;
    const database = getDatabase(firebase);

    if (auth.currentUser) {
      const regionAdminRef = ref(database, `admin/${region}`);
      const permissionsRef = child(regionAdminRef, "permissions");
      const projectsRef = child(regionAdminRef, "projects");

      set(child(permissionsRef, "admins"), cleanArr(admins).join());

      set(projectsRef, cleanArr(projects));
      set(child(permissionsRef, "reviewers"), cleanArr(reviewers).join());
    }
  }

  saveGithubCredentials() {
    const { match } = this.props;
    const { region } = match.params;

    const {
      githubOwner,
      githubRepo,
      githubToken,
      githubBranch,
      githubEnvironments,
      githubFilenameTemplate,
      isGithubPublishingEnabled,
    } = this.state;

    const database = getDatabase(firebase);

    // Check if GitHub publishing is enabled but credentials are not provided
    if (
      isGithubPublishingEnabled &&
      (!githubOwner || !githubRepo || !githubToken || !githubBranch)
    ) {
      this.setState({ showGithubCredentialsMissingDialog: true });
      return;
    }

    // Base64 encode the GitHub token
    const bufferObj = Buffer.from(githubToken, "utf8");
    const base64String = bufferObj.toString("base64");

    if (auth.currentUser) {
      const regionAdminRef = ref(database, `admin/${region}`);
      const githubRef = child(regionAdminRef, "githubCredentials");

      set(child(githubRef, "owner"), githubOwner);
      set(child(githubRef, "repo"), githubRepo);
      set(child(githubRef, "branch"), githubBranch);
      set(child(githubRef, "environments"), githubEnvironments);
      set(child(githubRef, "filenameTemplate"), githubFilenameTemplate);
      set(child(githubRef, "githubTokenHash"), base64String);

      this.setState({
        githubToken: "",
        githubCredentialsStored: true,
      });
    }
  }

  saveDoiCredentials() {
    const { match } = this.props;
    const { region } = match.params;

    const {
      datacitePrefix,
      dataciteAccountId,
      datacitePass,
      isDoiCreationEnabled,
    } = this.state;

    const database = getDatabase(firebase);

    const bufferObj = Buffer.from(
      `${dataciteAccountId}:${datacitePass}`,
      "utf8"
    );
    const base64String = bufferObj.toString("base64");

    // Check if DOI creation is enabled but credentials are not stored
    if (
      isDoiCreationEnabled &&
      (!datacitePrefix || !dataciteAccountId || !datacitePass)
    ) {
      this.setState({ showCredentialsMissingDialog: true });
      return;
    }

    if (auth.currentUser) {
      const regionAdminRef = ref(database, `admin/${region}`);
      const dataciteRef = child(regionAdminRef, "dataciteCredentials");

      set(child(dataciteRef, "prefix"), datacitePrefix);
      set(child(dataciteRef, "dataciteHash"), base64String);

      this.setState({
        datacitePass: "",
        credentialsStored: true,
      });
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

  renderGithubCredentialsMissingDialog() {
    return (
      <Dialog
        open={this.state.showGithubCredentialsMissingDialog}
        onClose={() =>
          this.setState({ showGithubCredentialsMissingDialog: false })
        }
        aria-labelledby="github-credentials-missing-dialog-title"
        aria-describedby="github-credentials-missing-dialog-description"
      >
        <DialogTitle id="github-credentials-missing-dialog-title">
          Missing GitHub Credentials
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="github-credentials-missing-dialog-description">
            Please add GitHub credentials before saving.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              this.setState({ showGithubCredentialsMissingDialog: false })
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
      if (name === "githubOwner") {
        this.validateGithubOwner(value);
      }
      if (name === "githubRepo") {
        this.validateGithubRepo(value);
      }
    });
  };

  validateDatacitePrefix = (prefix) => {
    const isValid = /^10\.\d+/.test(prefix);
    this.setState({ datacitePrefixValid: isValid });
  };

  validateGithubOwner = (owner) => {
    const isValid = /^[a-zA-Z0-9_-]+$/.test(owner);
    this.setState({ githubOwnerValid: isValid });
  };

  validateGithubRepo = (repo) => {
    const isValid = /^[a-zA-Z0-9_-]+$/.test(repo);
    this.setState({ githubRepoValid: isValid });
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
            <Grid item xs>
              <Button
                startIcon={<Save />}
                variant="contained"
                color="primary"
                style={{ margin: 10 }}
                onClick={() => this.save()}
              >
                <I18n>
                  <En>Save Admin Settings</En>
                  <Fr>Enregistrer</Fr>
                </I18n>
              </Button>
            </Grid>
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
                {this.state.isDoiCreationEnabled && (
                  <Button
                    startIcon={<Save />}
                    variant="contained"
                    color="primary"
                    onClick={() => this.saveDoiCredentials()}
                    style={{ margin: 10 }}
                  >
                    <I18n>
                      <En>Save DOI Settings</En>
                      <Fr>Enregistrer les paramètres DOI</Fr>
                    </I18n>
                  </Button>
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
                          checked={
                            this.state.isGithubPublishingEnabled || false
                          }
                          onChange={this.handleToggleGithubPublishing}
                        />
                      }
                      label={
                        <I18n>
                          <En>Enable GitHub Publishing</En>
                          <Fr>Activer la publication GitHub</Fr>
                        </I18n>
                      }
                    />
                  </Grid>
                  {this.state.isGithubPublishingEnabled &&
                    this.state.githubCredentialsStored && (
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
                  {this.state.isGithubPublishingEnabled &&
                    !this.state.githubCredentialsStored && (
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
                              <En>Please Add GitHub Credentials</En>
                              <Fr>Veuillez ajouter les identifiants GitHub</Fr>
                            </I18n>
                          </Typography>
                        </Grid>
                      </Grid>
                    )}
                </Grid>
                {this.state.isGithubPublishingEnabled && (
                  <>
                    <Grid item xs={12}>
                      <TextField
                        name="githubOwner"
                        label={
                          <I18n>
                            <En>Repository Owner</En>
                            <Fr>Propriétaire du référentiel</Fr>
                          </I18n>
                        }
                        placeholder="cioos-siooc"
                        value={this.state.githubOwner || ""}
                        onChange={this.handleChange}
                        fullWidth
                        error={!this.state.githubOwnerValid}
                        helperText={
                          !this.state.githubOwnerValid &&
                          "Owner must contain only alphanumeric characters, hyphens, and underscores."
                        }
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        name="githubRepo"
                        label={
                          <I18n>
                            <En>Repository Name</En>
                            <Fr>Nom du référentiel</Fr>
                          </I18n>
                        }
                        placeholder="cioos-siooc-forms"
                        value={this.state.githubRepo || ""}
                        onChange={this.handleChange}
                        fullWidth
                        error={!this.state.githubRepoValid}
                        helperText={
                          !this.state.githubRepoValid &&
                          "Repository name must contain only alphanumeric characters, hyphens, and underscores."
                        }
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        name="githubToken"
                        label={
                          <I18n>
                            <En>GitHub Token</En>
                            <Fr>Jeton GitHub</Fr>
                          </I18n>
                        }
                        type={this.state.showGithubToken ? "text" : "password"}
                        onChange={this.handleChange}
                        value={this.state.githubToken || ""}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={this.handleClickShowGithubToken}
                                onMouseDown={this.handleMouseDownGithubToken}
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
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        name="githubBranch"
                        label={
                          <I18n>
                            <En>Target Branch</En>
                            <Fr>Branche cible</Fr>
                          </I18n>
                        }
                        placeholder="main"
                        value={this.state.githubBranch || ""}
                        onChange={this.handleChange}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        name="githubEnvironments"
                        label={
                          <I18n>
                            <En>Environments (one per line)</En>
                            <Fr>Environnements (un par ligne)</Fr>
                          </I18n>
                        }
                        placeholder="prod"
                        multiline
                        value={this.state.githubEnvironments.join("\n")}
                        onChange={(e) =>
                          this.setState({
                            githubEnvironments: e.target.value.split("\n"),
                          })
                        }
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        name="githubFilenameTemplate"
                        label={
                          <I18n>
                            <En>File Naming Template</En>
                            <Fr>Modèle de nom de fichier</Fr>
                          </I18n>
                        }
                        placeholder="{uuid}"
                        value={this.state.githubFilenameTemplate || ""}
                        onChange={this.handleChange}
                        fullWidth
                        helperText={
                          <I18n>
                            <En>Available variables: {"{uuid}"}, {"{title}"}</En>
                            <Fr>Variables disponibles: {"{uuid}"}, {"{title}"}</Fr>
                          </I18n>
                        }
                      />
                    </Grid>
                  </>
                )}
                {this.state.isGithubPublishingEnabled && (
                  <Button
                    startIcon={<Save />}
                    variant="contained"
                    color="primary"
                    onClick={() => this.saveGithubCredentials()}
                    style={{ margin: 10 }}
                  >
                    <I18n>
                      <En>Save GitHub Settings</En>
                      <Fr>Enregistrer les paramètres GitHub</Fr>
                    </I18n>
                  </Button>
                )}
              </Grid>
            </Paper>
          </>
        )}
        {this.renderDeletionDialog()}
        {this.renderCredentialsMissingDialog()}
        {this.renderGithubCredentialsMissingDialog()}
      </Grid>
    );
  }
}

Admin.contextType = UserContext;
export default Admin;
