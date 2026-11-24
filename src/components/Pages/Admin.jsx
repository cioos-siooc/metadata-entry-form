import React from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  TextField,
  Grid,
  InputAdornment,
  IconButton,
  Snackbar,
  Stack,
  Tab,
  Tabs,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import {
  getDatabase,
  ref,
  child,
  onValue,
  update,
  remove,
} from "firebase/database";
import { Buffer } from "buffer";

import firebase from "../../firebase";
import { UserContext } from "../../providers/UserProvider";
import { auth, getAuth, onAuthStateChanged } from "../../auth";
import { I18n } from "../I18n";
import FormClassTemplate from "./FormClassTemplate";
import withRouter from "../../utils/withRouter";

import { unique } from "../../utils/misc";

import DataciteSettings from "../Admin/DataciteSettings";
import AdminDialogs from "../Admin/AdminDialogs";
import FormSection from "../FormShell/FormSection";
import ListEditor from "../Admin/ListEditor";
import { Page, PageHeader } from "../Layout/Page";

const TABS = [
  { value: "people", en: "People", fr: "Personnes" },
  { value: "projects", en: "Projects", fr: "Projets" },
  { value: "doi", en: "DOIs", fr: "DOI" },
  { value: "publishing", en: "GitHub publishing", fr: "Publication GitHub" },
];

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
      savedToast: "",
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
            isDoiCreationEnabled:
              credentialsStored || this.state.isDoiCreationEnabled,
            datacitePrefix: data?.prefix || this.state.datacitePrefix || "",
          };
          if (data?.apiDomain) {
            updates.dataciteApiDomain = data.apiDomain;
          }
          if (
            Array.isArray(data?.doiSuffixModes) &&
            data.doiSuffixModes.length > 0
          ) {
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
          const permissions = permissionsFirebase.toJSON() || {};

          const admins = permissions.admins
            ? permissions.admins.split(",")
            : [];
          const reviewers = permissions.reviewers
            ? permissions.reviewers.split(",")
            : [];

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
    if (
      !credentialsStored &&
      (!datacitePrefix || !dataciteAccountId || !datacitePass)
    ) {
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
        "utf8",
      );
      updates["dataciteCredentials/dataciteHash"] =
        bufferObj.toString("base64");
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

    updates["dataciteCredentials/doiStatusManagement"] =
      doiStatusManagement || "datacite";

    const regionAdminRef = ref(database, `admin/${region}`);
    update(regionAdminRef, updates)
      .then(() => {
        this.setState({
          datacitePass: "",
          credentialsStored: true,
          savedToast: this.tr(
            "DataCite settings saved",
            "Paramètres DataCite enregistrés",
          ),
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

  // Writes one slice of the region's admin node. People and projects save on
  // every change; GitHub settings save from their own button.
  saveAdmin(updates, message) {
    const { region } = this.props.match.params;
    if (!auth.currentUser) {
      this.setState({
        showErrorDialog: true,
        errorMessage: "You must be logged in to save admin settings",
      });
      return Promise.resolve();
    }
    return update(ref(getDatabase(firebase), `admin/${region}`), updates)
      .then(() => this.setState({ savedToast: message }))
      .catch((error) => {
        console.error("Failed to save admin settings:", error);
        this.setState({
          showErrorDialog: true,
          errorMessage: `Failed to save admin settings: ${error.message}`,
        });
      });
  }

  setPeople(role, list) {
    this.setState({ [role]: list });
    this.saveAdmin(
      { [`permissions/${role}`]: cleanArr(list).join() },
      this.tr("Saved", "Enregistré"),
    );
  }

  setProjects(list) {
    this.setState({ projects: list });
    this.saveAdmin(
      { projects: cleanArr(list) },
      this.tr("Saved", "Enregistré"),
    );
  }

  handleSaveGithub() {
    const {
      githubOwner,
      githubRepo,
      githubToken,
      githubBranch,
      githubFileTemplate,
      githubEnvironments,
    } = this.state;
    this.saveAdmin(
      {
        githubCredentials: {
          owner: githubOwner,
          repo: githubRepo,
          token: githubToken,
          branch: githubBranch,
          fileTemplate: githubFileTemplate,
          environments: cleanArr(githubEnvironments.split("\n")),
        },
      },
      this.tr("GitHub settings saved", "Paramètres GitHub enregistrés"),
    );
  }

  tr(en, fr) {
    return this.props.match.params.language === "fr" ? fr : en;
  }

  currentTab() {
    const tab = new URLSearchParams(this.props.location?.search).get("tab");
    return TABS.some((t) => t.value === tab) ? tab : "people";
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
      const current = Array.isArray(prevState.doiSuffixModes)
        ? prevState.doiSuffixModes
        : [];
      const next = current.includes(mode)
        ? current.filter((m) => m !== mode)
        : [...current, mode];
      // Always keep at least one option selected; default to "default"
      return { doiSuffixModes: next.length > 0 ? next : ["default"] };
    });
  };

  renderPeople() {
    const { admins, reviewers } = this.state;
    const ownEmail = auth.currentUser?.email;
    return (
      <Stack spacing={3}>
        <FormSection
          title={<I18n en="Reviewers" fr="Réviseurs" />}
          description={
            <I18n
              en="Reviewers see every record in this region, run automated reviews, and publish or return submitted records."
              fr="Les réviseurs voient tous les enregistrements de la région, lancent les révisions automatisées, et publient ou renvoient les enregistrements soumis."
            />
          }
        >
          <ListEditor
            email
            items={reviewers}
            onChange={(list) => this.setPeople("reviewers", list)}
            label={this.tr("Reviewer email", "Courriel du réviseur")}
            placeholder={this.tr(
              "name@example.org — paste several to add them all",
              "nom@exemple.org — collez-en plusieurs pour tous les ajouter",
            )}
            emptyText={this.tr(
              "No reviewers yet.",
              "Aucun réviseur pour l'instant.",
            )}
          />
        </FormSection>
        <FormSection
          title={<I18n en="Administrators" fr="Administrateurs" />}
          description={
            <I18n
              en="Administrators can do everything reviewers can, and also change the settings on this page."
              fr="Les administrateurs peuvent faire tout ce que font les réviseurs, et aussi modifier les paramètres de cette page."
            />
          }
        >
          <ListEditor
            email
            items={admins}
            onChange={(list) => this.setPeople("admins", list)}
            label={this.tr(
              "Administrator email",
              "Courriel de l'administrateur",
            )}
            placeholder="name@example.org"
            protectedItem={ownEmail}
            protectedNote={this.tr(
              "You can't remove yourself; ask another administrator.",
              "Vous ne pouvez pas vous retirer ; demandez à un autre administrateur.",
            )}
            emptyText={this.tr(
              "No administrators yet.",
              "Aucun administrateur pour l'instant.",
            )}
          />
        </FormSection>
      </Stack>
    );
  }

  renderProjects() {
    return (
      <FormSection
        title={<I18n en="Projects" fr="Projets" />}
        description={
          <I18n
            en="Data providers can tag a record with these projects in its Identification section."
            fr="Les fournisseurs de données peuvent associer un enregistrement à ces projets dans sa section Identification."
          />
        }
      >
        <ListEditor
          items={this.state.projects}
          onChange={(list) => this.setProjects(list)}
          label={this.tr("Project name", "Nom du projet")}
          placeholder={this.tr("Project name", "Nom du projet")}
          emptyText={this.tr(
            "No projects yet. Without any, the project question is hidden from the form.",
            "Aucun projet pour l'instant. Sans projet, la question est masquée dans le formulaire.",
          )}
        />
      </FormSection>
    );
  }

  renderPublishing() {
    const { language } = this.props.match.params;
    const field = (name, en, fr, extra = {}) => (
      <Grid size={extra.full ? 12 : { xs: 12, sm: 6 }}>
        <TextField
          name={name}
          label={this.tr(en, fr)}
          value={this.state[name]}
          onChange={this.handleChange}
          fullWidth
          {...extra.props}
        />
      </Grid>
    );
    return (
      <FormSection
        title={<I18n en="GitHub publishing" fr="Publication GitHub" />}
        description={
          <I18n
            en="Where reviewers push approved records, as XML and YAML files. Leave the token empty to turn GitHub publishing off."
            fr="Le dépôt où les réviseurs poussent les enregistrements approuvés, en fichiers XML et YAML. Laissez le jeton vide pour désactiver la publication GitHub."
          />
        }
      >
        <Grid container spacing={2.5}>
          {field("githubOwner", "Repository owner", "Propriétaire du dépôt")}
          {field("githubRepo", "Repository name", "Nom du dépôt")}
          {field("githubToken", "Access token", "Jeton d'accès", {
            full: true,
            props: {
              type: this.state.showGithubToken ? "text" : "password",
              helperText: this.tr(
                "A personal access token with the 'repo' scope.",
                "Un jeton d'accès personnel avec la portée « repo ».",
              ),
              slotProps: {
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={
                          language === "fr"
                            ? "Afficher ou masquer le jeton"
                            : "Show or hide token"
                        }
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
                },
              },
            },
          })}
          {field("githubBranch", "Target branch", "Branche cible")}
          {field(
            "githubFileTemplate",
            "File name template",
            "Modèle de nom de fichier",
            {
              props: {
                helperText: this.tr(
                  "Default: {filename}",
                  "Par défaut : {filename}",
                ),
              },
            },
          )}
          {field("githubEnvironments", "Environments", "Environnements", {
            full: true,
            props: {
              multiline: true,
              minRows: 2,
              helperText: this.tr(
                "One per line, e.g. prod",
                "Un par ligne, p. ex. prod",
              ),
            },
          })}
        </Grid>
        <Box sx={{ mt: 3 }}>
          <Button variant="contained" onClick={() => this.handleSaveGithub()}>
            <I18n
              en="Save GitHub settings"
              fr="Enregistrer les paramètres GitHub"
            />
          </Button>
        </Box>
      </FormSection>
    );
  }

  render() {
    const { loading, savedToast } = this.state;
    const { language } = this.props.match.params;
    const tab = this.currentTab();

    let panel;
    if (tab === "people") panel = this.renderPeople();
    else if (tab === "projects") panel = this.renderProjects();
    else if (tab === "publishing") panel = this.renderPublishing();
    else
      panel = (
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
      );

    return (
      <Page maxWidth={960}>
        <PageHeader
          title={<I18n en="Region settings" fr="Paramètres de la région" />}
          description={
            <I18n
              en="Who can review in this region, and how records get DOIs and are published."
              fr="Qui peut réviser dans cette région, et comment les enregistrements obtiennent un DOI et sont publiés."
            />
          }
        >
          <Tabs
            value={tab}
            onChange={(_e, value) =>
              this.props.navigate(`?tab=${value}`, { replace: true })
            }
            variant="scrollable"
            scrollButtons={false}
            aria-label={language === "fr" ? "Paramètres" : "Settings"}
            sx={(theme) => ({
              borderBottom: `1px solid ${theme.vars.palette.divider}`,
            })}
          >
            {TABS.map((t) => (
              <Tab
                key={t.value}
                value={t.value}
                label={language === "fr" ? t.fr : t.en}
              />
            ))}
          </Tabs>
        </PageHeader>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          panel
        )}

        <Snackbar
          open={Boolean(savedToast)}
          autoHideDuration={2500}
          onClose={() => this.setState({ savedToast: "" })}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert severity="success" variant="filled">
            {savedToast}
          </Alert>
        </Snackbar>

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
      </Page>
    );
  }
}

Admin.contextType = UserContext;
export default withRouter(Admin);
