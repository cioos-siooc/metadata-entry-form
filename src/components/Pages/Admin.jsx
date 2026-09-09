import React from "react";
import {
  Typography,
  Button,
  CircularProgress,
  TextField,
  Grid,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { Save, Visibility, VisibilityOff } from "@mui/icons-material";
import { getDatabase, ref, child, onValue, update, remove } from "firebase/database";
import { Buffer } from 'buffer';

import firebase from "../../firebase";
import { UserContext } from "../../providers/UserProvider";
import { auth, getAuth, onAuthStateChanged } from "../../auth";
import { En, Fr, I18n } from "../I18n";
import FormClassTemplate from "./FormClassTemplate";
import withRouter from "../../utils/withRouter";

import { unique } from "../../utils/misc";

import DataciteSettings from "../Admin/DataciteSettings";
import AdminDialogs from "../Admin/AdminDialogs";
import FormSection from "../FormShell/FormSection";

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
      dataciteHash: "",
      dataciteApiDomain: "production",
      doiSuffixModes: ["default"],
      doiStatusManagement: "datacite",
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
    };
  }

  async componentDidMount() {
    const { match } = this.props;
    const { region } = match.params;
    const database = getDatabase(firebase);

    this.setState({ loading: true });

    this.unsubscribe = onAuthStateChanged(getAuth(firebase), async (user) => {
      if (user) {
        // Reference to the regionAdmin in the database
        const adminRef = ref(database, "admin");
        const regionAdminRef = child(adminRef, region);
        const permissionsRef = child(regionAdminRef, "permissions");

        // Load datacite credentials directly from the realtime database (same DB the client writes to).
        // This avoids the Firebase Functions emulator potentially reading from a different project's DB.
        const dataciteRef = child(regionAdminRef, "dataciteCredentials");
        onValue(dataciteRef, (snapshot) => {
          const data = snapshot.val();
          const credentialsStored = !!(data?.dataciteHash && data?.prefix);
          const updates = {
            credentialsStored,
            isDoiCreationEnabled: credentialsStored || this.state.isDoiCreationEnabled,
            datacitePrefix: data?.prefix || this.state.datacitePrefix || "",
          };
          if (data?.apiDomain) {
            updates.dataciteApiDomain = data.apiDomain;
          }
          if (Array.isArray(data?.doiSuffixModes) && data.doiSuffixModes.length > 0) {
            updates.doiSuffixModes = data.doiSuffixModes;
          }
          if (data?.doiStatusManagement) {
            updates.doiStatusManagement = data.doiStatusManagement;
          }
          if (data?.accountId) {
            updates.dataciteAccountId = data.accountId;
          }
          if (data?.dataciteHash) {
            updates.dataciteHash = data.dataciteHash;
          }
          this.setState(updates);
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
          // credentialsStored / datacitePrefix are set by the dataciteRef listener.
          this.setState({
            admins,
            reviewers,
            loading: false,
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
      const database = getDatabase(firebase);
      await remove(ref(database, `admin/${region}/dataciteCredentials`));
      this.setState({
        datacitePrefix: "",
        dataciteAccountId: "",
        datacitePass: "",
        dataciteHash: "",
        dataciteApiDomain: "production",
        doiSuffixModes: ["default"],
        doiStatusManagement: "datacite",
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
        dataciteHash: "",
        dataciteApiDomain: "production",
        doiSuffixModes: ["default"],
        doiStatusManagement: "datacite",
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
      doiSuffixModes,
      doiStatusManagement,
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

    // Note: for updates, apiDomain / doiSuffixModes / doiStatusManagement always carry values so
    // there is always something to save. No blocking validation needed here.

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
      updates["dataciteCredentials/accountId"] = dataciteAccountId;
    } else if (dataciteAccountId && !datacitePass) {
      updates["dataciteCredentials/accountId"] = dataciteAccountId;
    }

    if (dataciteApiDomain) {
      updates["dataciteCredentials/apiDomain"] = dataciteApiDomain;
    }

    if (Array.isArray(doiSuffixModes) && doiSuffixModes.length > 0) {
      updates["dataciteCredentials/doiSuffixModes"] = doiSuffixModes;
    }

    updates["dataciteCredentials/doiStatusManagement"] = doiStatusManagement || "datacite";

    const regionAdminRef = ref(database, `admin/${region}`);
    update(regionAdminRef, updates)
      .then(() => {
        this.setState({
          datacitePass: "",
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
    const { dataciteHash, datacitePrefix, dataciteApiDomain } = this.state;

    this.setState({ testingCredentials: true, testResult: null });

    try {
      const result = await testDataciteCredentials({
        region,
        dataciteHash: dataciteHash || undefined,
        prefix: datacitePrefix || undefined,
        apiDomain: dataciteApiDomain || undefined,
      });
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

  handleToggleSuffixMode = (mode) => {
    this.setState((prevState) => {
      const current = Array.isArray(prevState.doiSuffixModes) ? prevState.doiSuffixModes : [];
      const next = current.includes(mode)
        ? current.filter((m) => m !== mode)
        : [...current, mode];
      // Always keep at least one option selected; default to "default"
      return { doiSuffixModes: next.length > 0 ? next : ["default"] };
    });
  };

  render() {
    const { loading, reviewers, admins, projects } = this.state;

    return (
      <Grid container direction="column" spacing={3}>
        <Grid size={12}>
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
            <FormSection>
              <Grid size={12}>
                <Typography>
                  <I18n>
                    <En>Projects</En>
                    <Fr>Projets</Fr>
                  </I18n>
                </Typography>
              </Grid>
              <Grid size={12}>
                <TextField
                  multiline
                  fullWidth
                  value={projects.join("\n")}
                  onChange={(e) =>
                    this.setState({ projects: e.target.value.split("\n") })
                  }
                />
              </Grid>
            </FormSection>
            <FormSection>
              <Grid size={12}>
                <Typography>
                  <I18n>
                    <En>Admins</En>
                    <Fr>Administrateurs</Fr>
                  </I18n>
                </Typography>
              </Grid>
              <Grid size={12}>
                <TextField
                  multiline
                  fullWidth
                  value={admins.join("\n")}
                  onChange={(e) =>
                    this.setState({ admins: e.target.value.split("\n") })
                  }
                />
              </Grid>
            </FormSection>
            <FormSection>
              <Grid size={12}>
                <Typography>
                  <I18n>
                    <En>Reviewers</En>
                    <Fr>Réviseurs</Fr>
                  </I18n>
                </Typography>
              </Grid>
              <Grid size={12}>
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
            </FormSection>
            <DataciteSettings
              values={this.state}
              onChange={this.handleChange}
              onToggleDoiCreation={this.handleToggleDoiCreation}
              onToggleSuffixMode={this.handleToggleSuffixMode}
              onTestCredentials={this.handleTestCredentials}
              onSave={this.handleSaveDatacite}
              onClearFields={this.handleClearDataciteFields}
              onToggleShowPassword={this.handleClickShowPassword}
              onMouseDownPassword={this.handleMouseDownPassword}
              onDismissTestResult={() => this.setState({ testResult: null })}
            />
            <FormSection>
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
            </FormSection>
            <Grid size={12}>
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
        <AdminDialogs
          showDeletionDialog={this.state.showDeletionDialog}
          onCloseDeletion={() => this.setState({ showDeletionDialog: false })}
          onConfirmDeletion={() => this.handleDisableDoiCreation()}
          showCredentialsMissingDialog={this.state.showCredentialsMissingDialog}
          onCloseCredentialsMissing={() =>
            this.setState({ showCredentialsMissingDialog: false })
          }
          showErrorDialog={this.state.showErrorDialog}
          onCloseError={() => this.setState({ showErrorDialog: false })}
          errorMessage={this.state.errorMessage}
        />
      </Grid>
    );
  }
}

Admin.contextType = UserContext;
export default withRouter(Admin);
