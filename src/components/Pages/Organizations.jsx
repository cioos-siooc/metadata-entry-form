import React from "react";
import {
  Typography,
  Button,
  Grid,
  CircularProgress,
  TextField,
  InputAdornment,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@material-ui/core";
import { Add, Search, CloudUpload } from "@material-ui/icons";
import { Pagination } from "@material-ui/lab";
import { I18n, En, Fr } from "../I18n";
import FormClassTemplate from "./FormClassTemplate";
import OrganizationCard from "../FormComponents/OrganizationCard";
import OrganizationEditModal from "../FormComponents/OrganizationEditModal";
import { UserContext } from "../../providers/UserProvider";
import {
  loadOrganizations,
  saveOrganizations,
  initializeOrganizationsFromJSON,
} from "../../utils/firebaseOrganizationFunctions";

class Organizations extends FormClassTemplate {
  static contextType = UserContext;

  constructor(props) {
    super(props);
    this.state = {
      organizations: [],
      filteredOrganizations: [],
      loading: true,
      searchTerm: "",
      editModalOpen: false,
      selectedOrganization: null,
      isCreatingNew: false,
      showInitializeDialog: false,
      noDataInFirebase: false,
      currentPage: 1,
      pageSize: 12, // 3 columns * 4 rows per page
    };
  }

  async componentDidMount() {
    this.loadOrganizationsFromFirebase();
  }

  componentWillUnmount() {
    // Clean up Firebase listener
    if (this.unsubscribeOrganizations) {
      this.unsubscribeOrganizations();
    }
  }

  loadOrganizationsFromFirebase() {
    this.setState({ loading: true });

    // Set up real-time listener for organizations
    this.unsubscribeOrganizations = loadOrganizations((organizations) => {
      const hasData = organizations && organizations.length > 0;

      this.setState({
        organizations,
        filteredOrganizations: organizations,
        loading: false,
        noDataInFirebase: !hasData,
        showInitializeDialog: !hasData,
      });
    });
  }

  async initializeFromJSON() {
    try {
      this.setState({ loading: true });
      // Fetch organizations.json from the public directory
      const response = await fetch("/organizations.json");
      const organizations = await response.json();

      // Initialize Firebase with JSON data
      const initialized = await initializeOrganizationsFromJSON(organizations);

      if (initialized) {
        this.setState({
          showInitializeDialog: false,
          loading: false,
        });
      } else {
        // Data already exists
        this.setState({
          showInitializeDialog: false,
          loading: false,
        });
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error initializing organizations:", error);
      this.setState({ loading: false });
    }
  }

  handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        this.setState({ loading: true });
        const organizations = JSON.parse(e.target.result);

        if (!Array.isArray(organizations)) {
          // eslint-disable-next-line no-alert
          alert('Invalid file format. Organizations must be an array.');
          this.setState({ loading: false });
          return;
        }

        // Initialize Firebase with JSON data
        await initializeOrganizationsFromJSON(organizations);

        this.setState({
          showInitializeDialog: false,
          loading: false,
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error parsing JSON file:", error);
        // eslint-disable-next-line no-alert
        alert('Error parsing JSON file. Please check the file format.');
        this.setState({ loading: false });
      }
    };

    reader.onerror = () => {
      // eslint-disable-next-line no-console
      console.error("Error reading file");
      // eslint-disable-next-line no-alert
      alert('Error reading file. Please try again.');
      this.setState({ loading: false });
    };

    reader.readAsText(file);
  };

  handleSearchChange = (event) => {
    const searchTerm = event.target.value.toLowerCase();
    const { organizations } = this.state;

    const filtered = organizations.filter((org) => {
      const title = org.title?.toLowerCase() || "";
      const titleEn = org.title_translated?.en?.toLowerCase() || "";
      const titleFr = org.title_translated?.fr?.toLowerCase() || "";
      const name = org.name?.toLowerCase() || "";
      const descEn = org.description_translated?.en?.toLowerCase() || "";
      const descFr = org.description_translated?.fr?.toLowerCase() || "";
      const aliases = org.aliases?.join(" ").toLowerCase() || "";
      const address = org.address?.toLowerCase() || "";
      const city = org.city?.toLowerCase() || "";
      const country = org.country?.toLowerCase() || "";
      const email = org.email?.toLowerCase() || "";

      return (
        title.includes(searchTerm) ||
        titleEn.includes(searchTerm) ||
        titleFr.includes(searchTerm) ||
        name.includes(searchTerm) ||
        descEn.includes(searchTerm) ||
        descFr.includes(searchTerm) ||
        aliases.includes(searchTerm) ||
        address.includes(searchTerm) ||
        city.includes(searchTerm) ||
        country.includes(searchTerm) ||
        email.includes(searchTerm)
      );
    });

    // Reset to first page when search changes
    this.setState({ searchTerm, filteredOrganizations: filtered, currentPage: 1 });
  };

  handleEditOrganization = (organization) => {
    this.setState({
      selectedOrganization: organization,
      editModalOpen: true,
      isCreatingNew: false,
    });
  };

  handleAddOrganization = () => {
    const newOrg = {
      name: "",
      title: "",
      title_translated: { en: "", fr: "" },
      description: "",
      description_translated: { en: "", fr: "" },
      image_url: "",
      image_url_translated: { en: "", fr: "" },
      external_home_url: "",
      "organization-uri": [
        {
          authority: "",
          code: "",
          "code-space": "",
          version: "",
        },
      ],
      aliases: [],
      address: "",
      city: "",
      country: "",
      email: "",
    };

    this.setState({
      selectedOrganization: newOrg,
      editModalOpen: true,
      isCreatingNew: true,
    });
  };

  handleCloseModal = () => {
    this.setState({
      editModalOpen: false,
      selectedOrganization: null,
      isCreatingNew: false,
    });
  };

  handleSaveOrganization = async (updatedOrganization) => {
    const { organizations, isCreatingNew } = this.state;

    try {
      let updatedOrganizations;

      if (isCreatingNew) {
        // Add new organization
        updatedOrganizations = [...organizations, updatedOrganization];
      } else {
        // Update existing organization
        updatedOrganizations = organizations.map((org) =>
          org.name === updatedOrganization.name ? updatedOrganization : org
        );
      }

      // Save to Firebase
      await saveOrganizations(updatedOrganizations);

      this.setState({
        editModalOpen: false,
        selectedOrganization: null,
        isCreatingNew: false,
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error saving organization:", error);
      // eslint-disable-next-line no-alert
      alert("Error saving organization. Please try again.");
    }
  };

  handleDeleteOrganization = async (organizationName) => {
    const { organizations } = this.state;

    try {
      const updatedOrganizations = organizations.filter(
        (org) => org.name !== organizationName
      );

      // Save to Firebase
      await saveOrganizations(updatedOrganizations);

      this.setState({
        editModalOpen: false,
        selectedOrganization: null,
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error deleting organization:", error);
      // eslint-disable-next-line no-alert
      alert("Error deleting organization. Please try again.");
    }
  };

  handlePageChange = (event, page) => {
    this.setState({ currentPage: page });
  };

  render() {
    const {
      loading,
      filteredOrganizations,
      searchTerm,
      editModalOpen,
      selectedOrganization,
      isCreatingNew,
      showInitializeDialog,
      currentPage,
      pageSize,
    } = this.state;
    const { match } = this.props;
    const { language } = match.params;
    const { isReviewer, isAdmin } = this.context;

    const canEdit = isReviewer || isAdmin;

    return (
      <Grid container direction="column" spacing={3}>
        <Grid item xs>
          <Typography variant="h5">
            <I18n>
              <En>Organizations</En>
              <Fr>Organisations</Fr>
            </I18n>
          </Typography>
        </Grid>

        <Grid item xs>
          <Typography>
            <I18n>
              <En>
                Browse and search organizations across all regions. Only
                reviewers and administrators can edit organization information.
              </En>
              <Fr>
                Parcourir et rechercher des organisations dans toutes les
                régions. Seuls les réviseurs et les administrateurs peuvent
                modifier les informations sur les organisations.
              </Fr>
            </I18n>
          </Typography>
        </Grid>

        <Grid item xs>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={8} md={6}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder={
                  language === "en"
                    ? "Search organizations..."
                    : "Rechercher des organisations..."
                }
                value={searchTerm}
                onChange={this.handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
              {/* Count of filtered organizations */}
              <Typography variant="caption" style={{ marginTop: 4, display: 'block' }}>
                <I18n>
                  <En>
                    {filteredOrganizations.length === 0
                      ? 'No organizations'
                      : `Showing ${Math.min((currentPage - 1) * pageSize + 1, filteredOrganizations.length)}–${Math.min(currentPage * pageSize, filteredOrganizations.length)} of ${filteredOrganizations.length} organizations`}
                  </En>
                  <Fr>
                    {filteredOrganizations.length === 0
                      ? 'Aucune organisation'
                      : `Affichage ${Math.min((currentPage - 1) * pageSize + 1, filteredOrganizations.length)}–${Math.min(currentPage * pageSize, filteredOrganizations.length)} sur ${filteredOrganizations.length} organisations`}
                  </Fr>
                </I18n>
              </Typography>
            </Grid>
            {canEdit && (
              <>
                <Grid item>
                  <Button
                    startIcon={<Add />}
                    variant="contained"
                    color="primary"
                    onClick={this.handleAddOrganization}
                  >
                    <I18n>
                      <En>Add Organization</En>
                      <Fr>Ajouter une Organisation</Fr>
                    </I18n>
                  </Button>
                </Grid>
                {this.state.noDataInFirebase && (
                  <Grid item>
                    <input
                      accept="application/json"
                      style={{ display: 'none' }}
                      id="organizations-bulk-upload"
                      type="file"
                      onChange={this.handleFileUpload}
                    />
                    {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                    <label htmlFor="organizations-bulk-upload">
                      <Button
                        component="span"
                        variant="outlined"
                        color="primary"
                        startIcon={<CloudUpload />}
                      >
                        <I18n>
                          <En>Import JSON</En>
                          <Fr>Importer JSON</Fr>
                        </I18n>
                      </Button>
                    </label>
                  </Grid>
                )}
              </>
            )}
          </Grid>
        </Grid>

        {loading ? (
          <Grid item xs style={{ textAlign: "center" }}>
            <CircularProgress />
          </Grid>
        ) : (
          <Grid item xs>
            {filteredOrganizations && filteredOrganizations.length > 0 ? (
              (() => {
                const totalPages = Math.ceil(filteredOrganizations.length / pageSize) || 1;
                const startIndex = (currentPage - 1) * pageSize;
                const endIndex = startIndex + pageSize;
                const paginated = filteredOrganizations.slice(startIndex, endIndex);
                return (
                  <>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                      {paginated.map((org) => (
                        <div key={org.name} style={{ flex: '0 0 220px', maxWidth: '220px' }}>
                          <OrganizationCard
                            organization={org}
                            language={language}
                            canEdit={canEdit}
                            onEdit={() => this.handleEditOrganization(org)}
                          />
                        </div>
                      ))}
                    </div>
                    {totalPages > 1 && (
                      <Grid container justifyContent="center" style={{ marginTop: 24 }}>
                        <Pagination
                          count={totalPages}
                          page={currentPage}
                          onChange={this.handlePageChange}
                          color="primary"
                          size="small"
                          showFirstButton
                          showLastButton
                        />
                      </Grid>
                    )}
                  </>
                );
              })()
            ) : (
              <Paper style={{ padding: "20px", textAlign: "center" }}>
                <Typography>
                  <I18n>
                    <En>
                      No organizations found matching your search criteria.
                    </En>
                    <Fr>
                      Aucune organisation trouvée correspondant à vos critères
                      de recherche.
                    </Fr>
                  </I18n>
                </Typography>
              </Paper>
            )}
          </Grid>
        )}

        {editModalOpen && selectedOrganization && (
          <OrganizationEditModal
            open={editModalOpen}
            organization={selectedOrganization}
            isCreatingNew={isCreatingNew}
            onClose={this.handleCloseModal}
            onSave={this.handleSaveOrganization}
            onDelete={this.handleDeleteOrganization}
            language={language}
          />
        )}

        {showInitializeDialog && canEdit && (
          <Dialog open={showInitializeDialog} onClose={() => this.setState({ showInitializeDialog: false })} maxWidth="sm" fullWidth>
            <DialogTitle>
              <I18n en="Initialize Organizations Data" fr="Initialiser les données des organisations" />
            </DialogTitle>
            <DialogContent>
              <DialogContentText style={{ marginBottom: '20px' }}>
                <I18n>
                  <En>
                    No organizations data found in Firebase. Choose one of the following options to initialize the database:
                  </En>
                  <Fr>
                    Aucune donnée d'organisation trouvée dans Firebase. Choisissez l'une des options suivantes pour initialiser la base de données :
                  </Fr>
                </I18n>
              </DialogContentText>

              <Grid container spacing={2} direction="column">
                <Grid item>
                  <Button
                    onClick={() => this.initializeFromJSON()}
                    color="primary"
                    variant="outlined"
                    fullWidth
                    startIcon={<CloudUpload />}
                  >
                    <I18n en="Load from Default File" fr="Charger depuis le fichier par défaut" />
                  </Button>
                  <Typography variant="caption" display="block" style={{ marginTop: '8px', marginLeft: '8px' }}>
                    <I18n en="Loads from /public/organizations.json" fr="Charge depuis /public/organizations.json" />
                  </Typography>
                </Grid>

                <Grid item>
                  <input
                    accept="application/json"
                    style={{ display: 'none' }}
                    id="organizations-file-upload"
                    type="file"
                    onChange={this.handleFileUpload}
                  />
                  {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                  <label htmlFor="organizations-file-upload" style={{ width: '100%', display: 'block' }}>
                    <Button
                      component="span"
                      color="primary"
                      variant="contained"
                      fullWidth
                      startIcon={<Add />}
                    >
                      <I18n en="Upload JSON File" fr="Télécharger un fichier JSON" />
                    </Button>
                  </label>
                  <Typography variant="caption" display="block" style={{ marginTop: '8px', marginLeft: '8px' }}>
                    <I18n en="Upload your own organizations.json file" fr="Téléchargez votre propre fichier organizations.json" />
                  </Typography>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => this.setState({ showInitializeDialog: false })}>
                <I18n en="Cancel" fr="Annuler" />
              </Button>
            </DialogActions>
          </Dialog>
        )}
      </Grid>
    );
  }
}

export default Organizations;
