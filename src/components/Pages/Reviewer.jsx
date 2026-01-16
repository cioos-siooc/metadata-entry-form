/* eslint-disable react/jsx-no-bind */
import React from "react";
import {
  Typography,
  Grid,
  CircularProgress,
  Chip,
  IconButton,
} from "@material-ui/core";
import {
  Edit,
  Visibility,
  Delete,
  FileCopy,
  Publish,
  Eject,
  TransferWithinAStation,
} from "@material-ui/icons";
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarQuickFilter,
  GridToolbarExport,
} from "@mui/x-data-grid";

import { getDatabase, ref, onValue } from "firebase/database";

import firebase from "../../firebase";
import { auth, getAuth, onAuthStateChanged } from "../../auth";
import { Fr, En, I18n } from "../I18n";
import regions from "../../regions";
import { percentValid } from "../../utils/validate";
import licenses from "../../utils/licenses";

import SimpleModal from "../FormComponents/SimpleModal";
import TransferModal from "../FormComponents/TransferModal";

import {
  loadRegionRecords,
  transferRecord,
  deleteRecord,
  submitRecord,
  cloneRecord,
} from "../../utils/firebaseRecordFunctions";
import { unique } from "../../utils/misc";
import FormClassTemplate from "./FormClassTemplate";

const COLUMN_VISIBILITY_STORAGE_KEY = "reviewer-column-visibility";

const defaultColumnVisibility = {
  title: true,
  status: true,
  author: true,
  progress: true,
  created: true,
  abstract: false,
  license: false,
  verticalExtentMin: false,
  verticalExtentMax: false,
  contacts: false,
  formLanguage: false,
  actions: true,
};

function loadColumnVisibility() {
  try {
    const saved = localStorage.getItem(COLUMN_VISIBILITY_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    // Ignore errors
  }
  return defaultColumnVisibility;
}

function saveColumnVisibility(model) {
  try {
    localStorage.setItem(COLUMN_VISIBILITY_STORAGE_KEY, JSON.stringify(model));
  } catch (e) {
    // Ignore errors
  }
}

class Reviewer extends FormClassTemplate {
  constructor(props) {
    super(props);
    this.state = {
      users: [],
      deleteModalOpen: false,
      publishModalOpen: false,
      unPublishModalOpen: false,
      unSubmitModalOpen: false,
      submitModalOpen: false,
      transferModalOpen: false,
      modalKey: "",
      modalUserID: "",
      loading: false,
      showRecordTypes: ["submitted", "published"],
      showUsers: [],
      records: [],
      recordsFilter: "",
      recordCountsByStatus: {},
      columnVisibilityModel: loadColumnVisibility(),
    };
  }

  handleColumnVisibilityChange = (newModel) => {
    this.setState({ columnVisibilityModel: newModel });
    saveColumnVisibility(newModel);
  };

  async componentDidMount() {
    this.setState({ loading: true });
    const { match } = this.props;
    const { region } = match.params;

    this.unsubscribe = onAuthStateChanged(getAuth(firebase), (authUser) => {
      if (authUser) {
        const database = getDatabase(firebase);
        const usersRef = ref(database, `${region}/users`);

        onValue(usersRef, (regionUsersRaw) => {
          const records = loadRegionRecords(regionUsersRaw, [
            "",
            "submitted",
            "published",
          ]);

          this.setState({ records, loading: false });

          const users = unique(records.map((record) => record.userinfo.email));

          this.setState({
            records,
            loading: false,
            users,
            // Keep showUsers empty to indicate "all users selected"
          });
        });
        this.listenerRefs.push(usersRef);
      }
    });
  }

  editRecord(key, userID) {
    const { history } = this.props;
    const { language, region } = this.props.match.params;
    history.push(`/${language}/${region}/${userID}/${key}`);
  }

  async handleTransferRecord(recordID, userID) {
    const { match } = this.props;
    const { region } = match.params;

    return transferRecord(this.state.transferEmail, recordID, userID, region);
  }

  // user ID is that of the record owner, not the editor
  handleCloneRecord(recordID, sourceUserID) {
    const { match } = this.props;
    const { region } = match.params;

    if (auth.currentUser) {
      cloneRecord(recordID, sourceUserID, auth.currentUser.uid, region);
    }
  }

  async handleSubmitRecord(key, userID, status) {
    const { match } = this.props;
    const { region } = match.params;

    if (key && userID) {
      this.setState({ loading: true });
      await submitRecord(region, userID, key, status);
      this.setState({ loading: false });
    }
  }

  async deleteRecord(key, userID) {
    const { match } = this.props;
    const { region } = match.params;

    if (key && userID) {
      this.setState({ loading: true });
      await deleteRecord(region, userID, key);
      this.setState({ loading: false });
    }
  }

  toggleModal(modalName, state, key = "", userID) {
    this.setState({ modalKey: key, [modalName]: state, modalUserID: userID });
  }

  render() {
    const {
      records,
      deleteModalOpen,
      transferModalOpen,
      transferEmail,
      transferUserNotFound,
      modalKey,
      modalUserID,
      unPublishModalOpen,
      publishModalOpen,
      unSubmitModalOpen,
      submitModalOpen,
      loading,
      columnVisibilityModel,
    } = this.state;

    const { match } = this.props;
    const { language } = match.params;
    return (
      <Grid
        container
        direction="column"
        justifyContent="space-between"
        alignItems="stretch"
        spacing={3}
      >
        <TransferModal
          open={transferModalOpen}
          onClose={() => {
            this.toggleModal("transferModalOpen", false);
            this.setState({ transferEmail: "" });
          }}
          onAccept={() => this.handleTransferRecord(modalKey, modalUserID)}
          transferUserNotFound={transferUserNotFound}
          aria-labelledby="simple-modal-title"
          aria-describedby="simple-modal-description"
          email={transferEmail}
          setEmail={(v) => this.setState({ transferEmail: v })}
        />
        <SimpleModal
          open={deleteModalOpen}
          onClose={() => this.toggleModal("deleteModalOpen", false)}
          onAccept={() => this.deleteRecord(modalKey, modalUserID)}
          aria-labelledby="simple-modal-title"
          aria-describedby="simple-modal-description"
        />
        <SimpleModal
          open={submitModalOpen}
          onClose={() => this.toggleModal("submitModalOpen", false)}
          onAccept={() =>
            this.handleSubmitRecord(modalKey, modalUserID, "submitted")
          }
          aria-labelledby="simple-modal-title"
        />
        <SimpleModal
          open={publishModalOpen}
          onClose={() => this.toggleModal("publishModalOpen", false)}
          onAccept={() =>
            this.handleSubmitRecord(modalKey, modalUserID, "published")
          }
          aria-labelledby="simple-modal-title"
          aria-describedby="simple-modal-description"
        />
        <SimpleModal
          open={unPublishModalOpen}
          onClose={() => this.toggleModal("unPublishModalOpen", false)}
          onAccept={() =>
            this.handleSubmitRecord(modalKey, modalUserID, "submitted")
          }
          aria-labelledby="simple-modal-title"
          aria-describedby="simple-modal-description"
        />
        <SimpleModal
          open={unSubmitModalOpen}
          onClose={() => this.toggleModal("unSubmitModalOpen", false)}
          onAccept={() => this.handleSubmitRecord(modalKey, modalUserID, "")}
          aria-labelledby="simple-modal-title"
          aria-describedby="simple-modal-description"
        />
        <Grid item xs>
          <Typography variant="h5">
            <I18n>
              <En>Review submissions</En>
              <Fr>Examen des soumissions</Fr>
            </I18n>
          </Typography>
          <Typography variant="body2" color="textSecondary" style={{ marginTop: "8px" }}>
            <I18n>
              <En>
                Review, manage, and publish metadata records. Use filters to find specific submissions by status, author, or title.
              </En>
              <Fr>
                Examinez, gérez et publiez les enregistrements de métadonnées. Utilisez les filtres pour trouver des soumissions spécifiques par statut, auteur ou titre.
              </Fr>
            </I18n>
          </Typography>
        </Grid>
        {loading ? (
          <CircularProgress />
        ) : (
          <div style={{ height: "calc(100vh - 300px)", width: "100%" }}>
            <DataGrid
              sx={{
                "& .MuiDataGrid-columnHeaderTitle": {
                  fontWeight: "bold",
                },
              }}
              rows={records.map((record, index) => ({
                id: record.recordID || index,
                recordID: record.recordID,
                userID: record.userinfo.userID,
                title: record.title?.[language] || "",
                status: record.status,
                author: record.userinfo.email,
                progress: Math.round(percentValid(record) * 100),
                created: record.created,
                region: record.region,
                abstract: record.abstract?.[language] || "",
                license: record.license || "",
                verticalExtentMin: record.verticalExtentMin,
                verticalExtentMax: record.verticalExtentMax,
                verticalExtentDirection: record.verticalExtentDirection,
                contacts: record.contacts || [],
                formLanguage: record.language || "",
                fullRecord: record,
              }))}
                columns={[
                {
                  field: "status",
                  headerName: language === "en" ? "Status" : "Statut",
                  flex: 1,
                  minWidth: 130,
                  headerAlign: "center",
                  align: "center",
                  renderCell: (params) => {
                    const regionColor = regions[params.row.region]?.colors?.primary || "#006e90";
                    let bgColor = "#757575";
                    let label = language === "en" ? "Draft" : "Brouillon";

                    if (params.value === "published") {
                      bgColor = regionColor;
                      label = language === "en" ? "Published" : "Publié";
                    } else if (params.value === "submitted") {
                      bgColor = "#f57c00";
                      label = language === "en" ? "Submitted" : "Soumis";
                    }

                    return (
                      <Chip
                        label={label}
                        size="small"
                        style={{
                          backgroundColor: bgColor,
                          color: "#ffffff",
                          fontWeight: 500,
                        }}
                      />
                    );
                  },
                  type: "singleSelect",
                  maxWidth: 110,
                  valueOptions: [
                    { value: "", label: language === "en" ? "Draft" : "Brouillon" },
                    { value: "submitted", label: language === "en" ? "Submitted" : "Soumis" },
                    { value: "published", label: language === "en" ? "Published" : "Publié" },
                  ],
                  filterOperators: [
                    {
                      label: language === "en" ? "is any of" : "est l'un de",
                      value: "isAnyOf",
                      getApplyFilterFn: (filterItem) => {
                        if (!filterItem.value || filterItem.value.length === 0) {
                          return null;
                        }
                        return (params) => {
                          return filterItem.value.includes(params.value);
                        };
                      },
                      InputComponent: ({ item, applyValue }) => {
                        const handleFilterChange = (value) => {
                          applyValue({ ...item, value });
                        };

                        return (
                          <div style={{ padding: "8px" }}>
                            {[
                              { value: "", label: language === "en" ? "Draft" : "Brouillon" },
                              { value: "submitted", label: language === "en" ? "Submitted" : "Soumis" },
                              { value: "published", label: language === "en" ? "Published" : "Publié" },
                            ].map((option) => {
                              const checkboxId = `status-filter-${option.value}`;
                              return (
                                <div key={option.value} style={{ marginBottom: "4px" }}>
                                  <label htmlFor={checkboxId} style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                                    <input
                                      id={checkboxId}
                                      type="checkbox"
                                      checked={(item.value || []).includes(option.value)}
                                      onChange={(e) => {
                                        const currentValues = item.value || [];
                                        const newValues = e.target.checked
                                          ? [...currentValues, option.value]
                                          : currentValues.filter((v) => v !== option.value);
                                        handleFilterChange(newValues);
                                      }}
                                      style={{ marginRight: "8px" }}
                                    />
                                    {option.label}
                                  </label>
                                </div>
                              );
                            })}
                          </div>
                        );
                      },
                    },
                  ],
                },
              {
                  field: "progress",
                  headerName: language === "en" ? "Progress" : "Progrès",
                  flex: 0.8,
                  maxWidth: 90,
                  type: "number",
                  headerAlign: "center",
                  align: "center",
                  renderCell: (params) => `${params.value}%`,
                },
                {
                  field: "created",
                  headerName: language === "en" ? "Last Edited" : "Dernière modification",
                  flex: 1.2,
                  maxWidth: 110,
                  headerAlign: "center",
                  align: "center",
                  renderCell: (params) => {
                    if (!params.value) return null;
                    const dateObj = new Date(params.value);
                    const now = Date.now();
                    const diffMs = now - dateObj.getTime();
                    const twoDaysMs = 2 * 24 * 60 * 60 * 1000;

                    let displayStr;
                    if (diffMs > twoDaysMs) {
                      const options = { year: "numeric", month: "short", day: "2-digit" };
                      displayStr = dateObj.toLocaleDateString(
                        language === "fr" ? "fr-CA" : "en-CA",
                        options
                      );
                    } else {
                      // For relative time, we'll use a simple calculation
                      const hours = Math.floor(diffMs / (1000 * 60 * 60));
                      if (hours < 24) {
                        displayStr = language === "en"
                          ? `${hours} hour${hours !== 1 ? 's' : ''} ago`
                          : `il y a ${hours} heure${hours !== 1 ? 's' : ''}`;
                      } else {
                        const days = Math.floor(hours / 24);
                        displayStr = language === "en"
                          ? `${days} day${days !== 1 ? 's' : ''} ago`
                          : `il y a ${days} jour${days !== 1 ? 's' : ''}`;
                      }
                    }
                    return <span>{displayStr}</span>;
                  },
                  sortComparator: (v1, v2) => {
                    const date1 = v1 ? new Date(v1).getTime() : 0;
                    const date2 = v2 ? new Date(v2).getTime() : 0;
                    return date1 - date2;
                  },
                },
                {
                  field: "title",
                  headerName: language === "en" ? "Title" : "Titre",
                  flex: 2,
                  minWidth: 200,
                },
                
                {
                  field: "author",
                  headerName: language === "en" ? "Author" : "Auteur",
                  flex: 1.5,
                  minWidth: 180,
                },
                {
                  field: "abstract",
                  headerName: language === "en" ? "Abstract" : "Résumé",
                  flex: 2,
                  minWidth: 200,
                                    renderCell: (params) => (
                    <div
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={params.value}
                    >
                      {params.value}
                    </div>
                  ),
                },
                {
                  field: "license",
                  headerName: language === "en" ? "License" : "Licence",
                  flex: 1,
                  minWidth: 150,
                                    renderCell: (params) => {
                    const licenseData = licenses[params.value];
                    if (!licenseData) return params.value || "";
                    return licenseData.title?.[language] || licenseData.title?.en || params.value;
                  },
                },
                {
                  field: "verticalExtentMin",
                  headerName: language === "en" ? "Vertical Min" : "Étendue verticale min",
                  flex: 0.8,
                  minWidth: 100,
                                    type: "number",
                  headerAlign: "center",
                  align: "center",
                  renderCell: (params) => {
                    if (params.value === undefined || params.value === null) return "";
                    return params.value;
                  },
                },
                {
                  field: "verticalExtentMax",
                  headerName: language === "en" ? "Vertical Max" : "Étendue verticale max",
                  flex: 0.8,
                  minWidth: 100,
                                    type: "number",
                  headerAlign: "center",
                  align: "center",
                  renderCell: (params) => {
                    if (params.value === undefined || params.value === null) return "";
                    return params.value;
                  },
                },
                {
                  field: "contacts",
                  headerName: language === "en" ? "Contacts" : "Contacts",
                  flex: 1.5,
                  minWidth: 200,
                                    sortable: false,
                  renderCell: (params) => {
                    const contactsList = params.value || [];
                    if (contactsList.length === 0) return "";
                    const contactNames = contactsList.map((c) => {
                      if (c.givenNames || c.lastName) {
                        return `${c.givenNames || ""} ${c.lastName || ""}`.trim();
                      }
                      return c.orgName || "";
                    }).filter(Boolean);
                    const displayText = contactNames.join(", ");
                    return (
                      <div
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={displayText}
                      >
                        {displayText}
                      </div>
                    );
                  },
                },
                {
                  field: "formLanguage",
                  headerName: language === "en" ? "Form Language" : "Langue du formulaire",
                  flex: 0.8,
                  minWidth: 100,
                                    headerAlign: "center",
                  align: "center",
                  renderCell: (params) => {
                    if (!params.value) return "";
                    if (params.value === "en") return "English";
                    if (params.value === "fr") return "Français";
                    return params.value;
                  },
                },
                {
                  field: "actions",
                  headerName: language === "en" ? "Actions" : "Actions",
                  flex: 1.5,
                  minWidth: 220,
                  sortable: false,
                  filterable: false,
                  renderCell: (params) => {
                    const rowData = params.row;
                    const isPublished = rowData.status === "published";

                    let editTooltip = language === "en" ? "Edit" : "Modifier";
                    if (isPublished) {
                      editTooltip = language === "en" ? "View" : "Voir";
                    }

                    return (
                      <div style={{ display: "flex", gap: "4px" }}>
                        <IconButton
                          size="small"
                          onClick={() => this.editRecord(rowData.recordID, rowData.userID)}
                          title={editTooltip}
                        >
                          {isPublished ? <Visibility fontSize="small" /> : <Edit fontSize="small" />}
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => this.handleCloneRecord(rowData.recordID, rowData.userID)}
                          title={language === "en" ? "Clone" : "Dupliquer"}
                        >
                          <FileCopy fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => this.toggleModal("deleteModalOpen", true, rowData.recordID, rowData.userID)}
                          title={language === "en" ? "Delete" : "Supprimer"}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => this.toggleModal("transferModalOpen", true, rowData.recordID, rowData.userID)}
                          title={language === "en" ? "Transfer" : "Transférer"}
                        >
                          <TransferWithinAStation fontSize="small" />
                        </IconButton>
                        {rowData.status === "" && (
                          <IconButton
                            size="small"
                            onClick={() => this.toggleModal("submitModalOpen", true, rowData.recordID, rowData.userID)}
                            title={language === "en" ? "Submit" : "Soumettre"}
                          >
                            <Publish fontSize="small" />
                          </IconButton>
                        )}
                        {rowData.status === "submitted" && (
                          <>
                            <IconButton
                              size="small"
                              onClick={() => this.toggleModal("publishModalOpen", true, rowData.recordID, rowData.userID)}
                              title={language === "en" ? "Publish" : "Publier"}
                            >
                              <Publish fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => this.toggleModal("unSubmitModalOpen", true, rowData.recordID, rowData.userID)}
                              title={language === "en" ? "Unsubmit" : "Annuler la soumission"}
                            >
                              <Eject fontSize="small" />
                            </IconButton>
                          </>
                        )}
                        {rowData.status === "published" && (
                          <IconButton
                            size="small"
                            onClick={() => this.toggleModal("unPublishModalOpen", true, rowData.recordID, rowData.userID)}
                            title={language === "en" ? "Unpublish" : "Dépublier"}
                          >
                            <Eject fontSize="small" />
                          </IconButton>
                        )}
                      </div>
                    );
                  },
                },
              ]}
              pageSize={20}
              rowsPerPageOptions={[10, 20, 50, 100]}
              checkboxSelection={false}
              disableSelectionOnClick
              components={{
                Toolbar: () => (
                  <GridToolbarContainer style={{ padding: "8px", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                    <GridToolbarQuickFilter />
                    <GridToolbarColumnsButton />
                    <GridToolbarExport  />
                  </GridToolbarContainer>
                ),
                NoRowsOverlay: () => (
                  <div style={{ padding: "20px", textAlign: "center" }}>
                    {language === "en"
                      ? "There are no records waiting to be reviewed."
                      : "Aucun dossier n'attend d'être examiné."}
                  </div>
                ),
              }}
              localeText={{
                toolbarColumns: language === "en" ? "Columns" : "Colonnes",
                toolbarColumnsLabel: language === "en" ? "Select columns" : "Sélectionner les colonnes",
                columnsPanelTextFieldLabel: language === "en" ? "Find column" : "Rechercher une colonne",
                columnsPanelTextFieldPlaceholder: language === "en" ? "Column title" : "Titre de la colonne",
                columnsPanelShowAllButton: language === "en" ? "Show all" : "Afficher tout",
                columnsPanelHideAllButton: language === "en" ? "Hide all" : "Masquer tout",
                toolbarQuickFilterPlaceholder: language === "en" ? "Search..." : "Rechercher...",
              }}
              columnVisibilityModel={columnVisibilityModel}
              onColumnVisibilityModelChange={this.handleColumnVisibilityChange}
            />
          </div>
        )}
      </Grid>
    );
  }
}

export default Reviewer;
