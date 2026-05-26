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
  RadioGroup,
  Radio,
  FormControl,
  FormLabel,
  Alert,
} from "@mui/material";
import { Save, Delete, PlayArrow, Visibility, VisibilityOff } from "@mui/icons-material";
import { getDatabase, ref, child, onValue, update, remove } from "firebase/database";
import { Buffer } from 'buffer';

import firebase from "../../firebase";
import { UserContext } from "../../providers/UserProvider";
import { auth, getAuth, onAuthStateChanged } from "../../auth";
import { En, Fr, I18n } from "../I18n";
import FormClassTemplate from "./FormClassTemplate";
import withRouter from "../../utils/withRouter";

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
      dataciteApiDomain: "production",
      loading: false,
      showPassword: false,
      isDoiCreationEnabled: false,
      credentialsStored: false,
      showDeletionDialog: false,
      showCredentialsMissingDialog: false,
      showErrorDialog: false,
      errorMessage: "",
      testingCredentials: false,
      testResult: null,
      githubOwner: "cioos-siooc",
      githubRepo: "cioos-siooc-forms",
      githubToken: "",
      githubBranch: "main",
      githubFileTemplate: "{filename}",
      githubEnvironments: "prod",
      showGithubToken: false,
      apiTokens: [],
      apiTokenLabel: "",
      newlyMintedToken: null,
      apiTokenLoading: false,
    };
  }

  loadApiTokens = async () => {
    const { listApiTokens } = this.context;
    const { region } = this.props.match.params;
    if (!listApiTokens) return;
    try {
      const result = await listApiTokens({ region });
      this.setState({ apiTokens: result.data || [] });
    } catch (err) {
      console.error("Failed to load API tokens", err);
    }
  };

  handleMintApiToken = async () => {
    const { mintApiToken } = this.context;
    const { region } = this.props.match.params;
    const { apiTokenLabel } = this.state;
    this.setState({ apiTokenLoading: true });
    try {
      const result = await mintApiToken({ region, label: apiTokenLabel });
      this.setState({
        newlyMintedToken: result.data.token,
        apiTokenLabel: "",
      });
      await this.loadApiTokens();
    } catch (err) {
      this.setState({
        showErrorDialog: true,
        errorMessage: `Failed to mint API token: ${err.message}`,
      });
    } finally {
      this.setState({ apiTokenLoading: false });
    }
  };

  handleRevokeApiToken = async (tokenId) => {
    const { revokeApiToken } = this.context;
    const { region } = this.props.match.params;
    try {
      await revokeApiToken({ region, tokenId });
      await this.loadApiTokens();
    } catch (err) {
      this.setState({
        showErrorDialog: true,
        errorMessage: `Failed to revoke API token: ${err.message}`,
      });
    }
  };

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

        // Projects are loaded via the realtime listener below; no prefetch needed
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

        const dataciteRef = child(regionAdminRef, "dataciteCredentials");
        onValue(dataciteRef, (snapshot) => {
          const data = snapshot.val();
          if (data?.apiDomain) {
            this.setState({ dataciteApiDomain: data.apiDomain });
          }
        });
        this.listenerRefs.push(dataciteRef);

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

          // Do not set `projects` here to avoid overwriting the more recent
          // value from the `projectsRef` listener above.
          this.setState({
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

        this.loadApiTokens();
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
      const database = getDatabase(firebase);
      await remove(ref(database, `admin/${region}/dataciteCredentials`));
      this.setState({
        datacitePrefix: "",
        dataciteAccountId: "",
        datacitePass: "",
        dataciteApiDomain: "production",
        credentialsStored: false,
        isDoiCreationEnabled: false,
        showDeletionDialog: false,
      });
    } catch (error) {
      throw new Error(`Failed to delete DataCite credentials: ${error}`);
    }
  };

  handleClearDataciteFields = async () => {
    const { region } = this.props.match.params;

    try {
      const database = getDatabase(firebase);
      await remove(ref(database, `admin/${region}/dataciteCredentials`));
      this.setState({
        datacitePrefix: "",
        dataciteAccountId: "",
        datacitePass: "",
        dataciteApiDomain: "production",
        credentialsStored: false,
      });
    } catch (error) {
      this.setState({
        showErrorDialog: true,
        errorMessage: `Failed to clear DataCite credentials: ${error.message}`,
      });
    }
  };

  handleSaveDatacite = () => {
    const { match } = this.props;
    const { region } = match.params;
    const {
      datacitePrefix,
      dataciteAccountId,
      datacitePass,
      dataciteApiDomain,
      credentialsStored,
    } = this.state;

    if (!auth.currentUser) {
      this.setState({
        showErrorDialog: true,
        errorMessage: "You must be logged in to save DataCite settings",
      });
      return;
    }

    // For new credentials, all fields are required
    if (!credentialsStored && (!datacitePrefix || !dataciteAccountId || !datacitePass)) {
      this.setState({ showCredentialsMissingDialog: true });
      return;
    }

    // For updates, at least one field must be provided
    if (credentialsStored && !datacitePrefix && !dataciteAccountId && !datacitePass && !dataciteApiDomain) {
      this.setState({ showCredentialsMissingDialog: true });
      return;
    }

    const database = getDatabase(firebase);
    const updates = {};

    if (datacitePrefix) {
      updates["dataciteCredentials/prefix"] = datacitePrefix;
    }

    if (dataciteAccountId && datacitePass) {
      const bufferObj = Buffer.from(
        `${dataciteAccountId}:${datacitePass}`,
        "utf8"
      );
      updates["dataciteCredentials/dataciteHash"] = bufferObj.toString("base64");
    }

    if (dataciteApiDomain) {
      updates["dataciteCredentials/apiDomain"] = dataciteApiDomain;
    }

    const regionAdminRef = ref(database, `admin/${region}`);
    update(regionAdminRef, updates)
      .then(() => {
        this.setState({
          datacitePass: "",
          dataciteAccountId: "",
          credentialsStored: true,
        });
      })
      .catch((error) => {
        this.setState({
          showErrorDialog: true,
          errorMessage: `Failed to save DataCite settings: ${error.message}`,
        });
      });
  };

  handleTestCredentials = async () => {
    const { region } = this.props.match.params;
    const { testDataciteCredentials } = this.context;

    this.setState({ testingCredentials: true, testResult: null });

    try {
      const result = await testDataciteCredentials(region);
      this.setState({
        testingCredentials: false,
        testResult: { success: true, message: result.data.message },
      });
    } catch (error) {
      this.setState({
        testingCredentials: false,
        testResult: {
          success: false,
          message: error.message || "Failed to connect to DataCite API.",
        },
      });
    }
  };

  handleSave() {
    const { match } = this.props;
    const { region } = match.params;
    const {
      reviewers,
      admins,
      projects,
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

      // 2. GitHub Credentials
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
          this.setState({
            showErrorDialog: true,
            errorMessage: `Failed to save admin settings: ${error.message}`,
          });
        });
    } else {
      console.error('No authenticated user found');
      this.setState({
        showErrorDialog: true,
        errorMessage: 'You must be logged in to save admin settings',
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
          <I18n>
            <En>Missing DataCite Credentials</En>
            <Fr>Informations d'identification DataCite manquantes</Fr>
          </I18n>
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="credentials-missing-dialog-description">
            <I18n>
              <En>
                Other settings were saved; DataCite credentials were not. Please add credentials to enable DOI creation.
              </En>
              <Fr>
                Les autres paramètres ont été enregistrés; les informations DataCite ne l'ont pas été. Ajoutez les informations pour activer la création de DOI.
              </Fr>
            </I18n>
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

  renderErrorDialog() {
    return (
      <Dialog
        open={this.state.showErrorDialog}
        onClose={() => this.setState({ showErrorDialog: false })}
        aria-labelledby="error-dialog-title"
        aria-describedby="error-dialog-description"
      >
        <DialogTitle id="error-dialog-title">
          Error
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="error-dialog-description">
            {this.state.errorMessage}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => this.setState({ showErrorDialog: false })}
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
        <Grid >
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
              <Grid >
                <Typography>
                  <I18n>
                    <En>Projects</En>
                    <Fr>Projets</Fr>
                  </I18n>
                </Typography>
              </Grid>
              <Grid >
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
              <Grid >
                <Typography>
                  <I18n>
                    <En>Admins</En>
                    <Fr>Administrateurs</Fr>
                  </I18n>
                </Typography>
              </Grid>
              <Grid >
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
              <Grid >
                <Typography>
                  <I18n>
                    <En>Reviewers</En>
                    <Fr>Réviseurs</Fr>
                  </I18n>
                </Typography>
              </Grid>
              <Grid >
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
                <Grid size={12}>
                  <Typography variant="h5">
                    <I18n>
                      <En>DOI Creation Settings</En>
                      <Fr>Paramètres de création de DOI</Fr>
                    </I18n>
                  </Typography>
                </Grid>
                <Grid
                  size={12}
                  container
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Grid>
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
                  {isDoiCreationEnabled && (
                    <Grid size={12}>
                      <Alert severity={credentialsStored ? "success" : "warning"}>
                        <I18n>
                          <En>
                            {credentialsStored
                              ? "DataCite credentials are saved. Enter new values below to update them."
                              : "No DataCite credentials stored. Please enter your credentials below."}
                          </En>
                          <Fr>
                            {credentialsStored
                              ? "Les identifiants DataCite sont enregistrés. Entrez de nouvelles valeurs ci-dessous pour les mettre à jour."
                              : "Aucun identifiant DataCite enregistré. Veuillez entrer vos identifiants ci-dessous."}
                          </Fr>
                        </I18n>
                      </Alert>
                    </Grid>
                  )}
                </Grid>
                {isDoiCreationEnabled && (
                  <>
                    <Grid size={12}>
                      <FormControl>
                        <FormLabel>
                          <I18n>
                            <En>DataCite API</En>
                            <Fr>API DataCite</Fr>
                          </I18n>
                        </FormLabel>
                        <RadioGroup
                          row
                          name="dataciteApiDomain"
                          value={this.state.dataciteApiDomain}
                          onChange={this.handleChange}
                        >
                          <FormControlLabel
                            value="production"
                            control={<Radio />}
                            label={
                              <I18n>
                                <En>Production (api.datacite.org)</En>
                                <Fr>Production (api.datacite.org)</Fr>
                              </I18n>
                            }
                          />
                          <FormControlLabel
                            value="test"
                            control={<Radio />}
                            label={
                              <I18n>
                                <En>Test (api.test.datacite.org)</En>
                                <Fr>Test (api.test.datacite.org)</Fr>
                              </I18n>
                            }
                          />
                        </RadioGroup>
                      </FormControl>
                    </Grid>
                    <Grid size={12}>
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
                    <Grid size={12}>
                      <TextField
                        name="dataciteAccountId"
                        label={
                          <I18n>
                            <En>Account ID</En>
                            <Fr>Identifiant du compte</Fr>
                          </I18n>
                        }
                        placeholder={credentialsStored ? "••••••••" : ""}
                        helperText={
                          credentialsStored && !this.state.dataciteAccountId ? (
                            <I18n>
                              <En>Account ID is saved. Enter a new value to update it.</En>
                              <Fr>L'identifiant est enregistré. Entrez une nouvelle valeur pour le mettre à jour.</Fr>
                            </I18n>
                          ) : undefined
                        }
                        onChange={this.handleChange}
                        fullWidth
                      />
                    </Grid>
                    <Grid size={12}>
                      <TextField
                        name="datacitePass"
                        label={
                          <I18n>
                            <En>Password</En>
                            <Fr>Mot de passe</Fr>
                          </I18n>
                        }
                        placeholder={credentialsStored ? "••••••••" : ""}
                        helperText={
                          credentialsStored && !this.state.datacitePass ? (
                            <I18n>
                              <En>Password is saved. Enter a new value to update it.</En>
                              <Fr>Le mot de passe est enregistré. Entrez une nouvelle valeur pour le mettre à jour.</Fr>
                            </I18n>
                          ) : undefined
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
                    {this.state.testResult && (
                      <Grid size={12}>
                        <Alert
                          severity={this.state.testResult.success ? "success" : "error"}
                          onClose={() => this.setState({ testResult: null })}
                        >
                          {this.state.testResult.message}
                        </Alert>
                      </Grid>
                    )}
                    <Grid size={12} container spacing={1} justifyContent="flex-end">
                      <Grid>
                        <Button
                          startIcon={this.state.testingCredentials ? <CircularProgress size={20} /> : <PlayArrow />}
                          variant="outlined"
                          color="secondary"
                          onClick={this.handleTestCredentials}
                          disabled={!credentialsStored || this.state.testingCredentials}
                        >
                          <I18n>
                            <En>Test Credentials</En>
                            <Fr>Tester les identifiants</Fr>
                          </I18n>
                        </Button>
                      </Grid>
                      <Grid>
                        <Button
                          startIcon={<Delete />}
                          variant="outlined"
                          color="error"
                          onClick={this.handleClearDataciteFields}
                          disabled={!credentialsStored}
                        >
                          <I18n>
                            <En>Clear DataCite Credentials</En>
                            <Fr>Effacer les identifiants DataCite</Fr>
                          </I18n>
                        </Button>
                      </Grid>
                      <Grid>
                        <Button
                          startIcon={<Save />}
                          variant="contained"
                          color="primary"
                          onClick={this.handleSaveDatacite}
                        >
                          <I18n>
                            <En>{credentialsStored ? "Update" : "Save"} DataCite Settings</En>
                            <Fr>{credentialsStored ? "Mettre à jour" : "Enregistrer"} les paramètres DataCite</Fr>
                          </I18n>
                        </Button>
                      </Grid>
                    </Grid>
                  </>
                )}
              </Grid>
            </Paper>
            <Paper style={paperClass}>
              <Grid container spacing={2}>
                <Grid size={12}>
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
                <Grid size={12}>
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
                <Grid size={12}>
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
                <Grid size={12}>
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
                <Grid size={12}>
                  <TextField
                    name="githubBranch"
                    label="Target Branch"
                    value={this.state.githubBranch}
                    onChange={this.handleChange}
                    fullWidth
                  />
                </Grid>
                <Grid size={12}>
                  <TextField
                    name="githubFileTemplate"
                    label="File Naming Template"
                    value={this.state.githubFileTemplate}
                    onChange={this.handleChange}
                    fullWidth
                    helperText="Default: {filename}"
                  />
                </Grid>
                <Grid size={12}>
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
            <Paper style={paperClass}>
              <Grid container direction="column" spacing={2}>
                <Grid>
                  <Typography variant="h6">
                    <I18n>
                      <En>API Tokens</En>
                      <Fr>Jetons d'API</Fr>
                    </I18n>
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    <I18n>
                      <En>
                        Mint a bearer token to access this region's records as JSON via the
                        REST API. The token is shown only once — copy it now.
                        Endpoints:{" "}
                        <code>GET /api/records/{this.props.match.params.region}</code>
                        {" "}(optional <code>?status=draft|submitted|published</code>),{" "}
                        <code>GET /api/records/{this.props.match.params.region}/{"{userId}"}/{"{recordId}"}</code>.
                      </En>
                      <Fr>
                        Créez un jeton bearer pour accéder aux enregistrements de cette
                        région en JSON via l'API REST. Le jeton n'est affiché qu'une seule
                        fois — copiez-le maintenant.
                      </Fr>
                    </I18n>
                  </Typography>
                </Grid>
                <Grid container spacing={1} alignItems="center">
                  <Grid size={8}>
                    <TextField
                      name="apiTokenLabel"
                      label="Label (optional)"
                      value={this.state.apiTokenLabel}
                      onChange={this.handleChange}
                      fullWidth
                      placeholder="e.g. catalogue-sync"
                    />
                  </Grid>
                  <Grid size={4}>
                    <Button
                      variant="contained"
                      color="primary"
                      disabled={this.state.apiTokenLoading}
                      onClick={this.handleMintApiToken}
                    >
                      <I18n>
                        <En>Mint Token</En>
                        <Fr>Créer un jeton</Fr>
                      </I18n>
                    </Button>
                  </Grid>
                </Grid>
                {this.state.newlyMintedToken && (
                  <Grid>
                    <Alert
                      severity="success"
                      onClose={() => this.setState({ newlyMintedToken: null })}
                    >
                      <Typography variant="body2" gutterBottom>
                        <I18n>
                          <En>
                            Copy this token now — it will not be shown again.
                          </En>
                          <Fr>
                            Copiez ce jeton maintenant — il ne sera plus affiché.
                          </Fr>
                        </I18n>
                      </Typography>
                      <TextField
                        value={this.state.newlyMintedToken}
                        fullWidth
                        InputProps={{ readOnly: true }}
                        onFocus={(e) => e.target.select()}
                      />
                    </Alert>
                  </Grid>
                )}
                {this.state.apiTokens.length === 0 ? (
                  <Grid>
                    <Typography variant="body2" color="textSecondary">
                      <I18n>
                        <En>No active tokens.</En>
                        <Fr>Aucun jeton actif.</Fr>
                      </I18n>
                    </Typography>
                  </Grid>
                ) : (
                  this.state.apiTokens.map((t) => (
                    <Grid container key={t.id} spacing={1} alignItems="center">
                      <Grid size={4}>
                        <Typography variant="body2">
                          {t.label || <em>(unlabeled)</em>}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {t.id}
                        </Typography>
                      </Grid>
                      <Grid size={3}>
                        <Typography variant="caption">
                          {t.createdBy}
                        </Typography>
                      </Grid>
                      <Grid size={3}>
                        <Typography variant="caption">
                          {t.createdAt
                            ? new Date(t.createdAt).toLocaleString()
                            : "—"}
                        </Typography>
                        <br />
                        <Typography variant="caption" color="textSecondary">
                          last used:{" "}
                          {t.lastUsedAt
                            ? new Date(t.lastUsedAt).toLocaleString()
                            : "never"}
                        </Typography>
                      </Grid>
                      <Grid size={2}>
                        <IconButton
                          onClick={() => this.handleRevokeApiToken(t.id)}
                          title="Revoke"
                        >
                          <Delete />
                        </IconButton>
                      </Grid>
                    </Grid>
                  ))
                )}
              </Grid>
            </Paper>
            <Grid >
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
        {this.renderErrorDialog()}
      </Grid>
    );
  }
}

Admin.contextType = UserContext;
export default withRouter(Admin);
