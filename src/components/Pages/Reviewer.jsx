/* eslint-disable react/jsx-no-bind */
import React, { forwardRef } from "react";
import {
  Typography,
  Grid,
  CircularProgress,
  Checkbox,
  TextField,
  Paper,
  Chip,
  Box,
  Divider,
  Button,
  ButtonGroup,
} from "@material-ui/core";
import {
  Edit,
  Visibility,
  Delete,
  FileCopy,
  Publish,
  Eject,
  TransferWithinAStation,
  ArrowDownward,
  ChevronLeft,
  ChevronRight,
  Clear,
  FirstPage,
  LastPage,
  Search,
  FilterList,
  Remove,
  ViewColumn,
  SaveAlt,
  Check,
} from "@material-ui/icons";
import Autocomplete from "@material-ui/lab/Autocomplete";
import MaterialTable from "material-table";

import { getDatabase, ref, onValue } from "firebase/database";

import firebase from "../../firebase";
import { auth, getAuth, onAuthStateChanged } from "../../auth";
import { Fr, En, I18n } from "../I18n";
import regions from "../../regions";
import { percentValid } from "../../utils/validate";
import LastEdited from "../FormComponents/LastEdited";

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
    };
  }

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
      recordsFilter,
      showRecordTypes,
      showUsers,
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
      users,
    } = this.state;

    const { match } = this.props;
    const { language } = match.params;

    const recordTypeOptions = ["", "submitted", "published"];

    // sort records - drafts then submitted then published
    // Empty showUsers array means "show all users"
    let recordsToShow = records
      .filter((record) =>
        showUsers.length === 0 || showUsers.includes(record.userinfo.email)
      )
      .sort((a, b) => a.created < b.created);

    // the text search
    if (recordsFilter) {
      recordsToShow = recordsToShow.filter((record) => {
        const recordText = JSON.stringify([
          record.title || {},
          record.abstract || {},
        ]).toUpperCase();
        return recordText.includes(recordsFilter.toUpperCase());
      });
    }

    const recordCountsByStatus = {
      draft: (recordsToShow.filter((record) => record.status === "") || [])
        .length,
      submitted: (
        recordsToShow.filter((record) => record.status === "submitted") || []
      ).length,
      published: (
        recordsToShow.filter((record) => record.status === "published") || []
      ).length,
    };

    recordsToShow = recordsToShow.filter((record) =>
      showRecordTypes.includes(record.status)
    );

    recordsToShow = recordsToShow.sort((a, b) => {
      return (
        showRecordTypes.indexOf(a.status) > showRecordTypes.indexOf(b.status)
      );
    });

    const recordStatusTranslate = {
      draft: { en: "Draft", fr: "Brouillon" },
      submitted: { en: "Submitted", fr: "Soumis" },
      published: { en: "Published", fr: "Publié" },
    };
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
        </Grid>
        {loading ? (
          <CircularProgress />
        ) : (
          <>
            <Paper
              elevation={1}
              style={{
                padding: "16px",
                marginBottom: "16px",
              }}
            >
              <Box mb={2}>
                <Typography variant="h6" gutterBottom>
                  <I18n en="Filters" fr="Filtres" />
                </Typography>
                <Divider />
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography
                    variant="subtitle2"
                    gutterBottom
                    style={{ fontWeight: 600, marginBottom: 12 }}
                  >
                    <I18n en="Search" fr="Recherche" />
                  </Typography>
                  <TextField
                    fullWidth
                    variant="outlined"
                    size="small"
                    onChange={(e) => {
                      this.setState({ recordsFilter: e.target.value });
                    }}
                    placeholder={
                      language === "en"
                        ? "Search title and abstract..."
                        : "Rechercher le titre et le résumé..."
                    }
                  />
                </Grid>

                <Grid item xs={12}>
                  <Box>
                    <Typography
                      variant="subtitle2"
                      gutterBottom
                      style={{ fontWeight: 600, marginBottom: 12 }}
                    >
                      <I18n en="Status" fr="Statut" />
                    </Typography>
                    <ButtonGroup
                      fullWidth
                      size="small"
                    >
                      {["draft", "submitted", "published"].map((status) => {
                        const isSelected = showRecordTypes.includes(
                          recordTypeOptions[
                            ["draft", "submitted", "published"].indexOf(status)
                          ]
                        );
                        return (
                          <Button
                            key={status}
                            variant={isSelected ? "contained" : "outlined"}
                            color={isSelected ? "primary" : "default"}
                            onClick={() => {
                              const option =
                                recordTypeOptions[
                                  ["draft", "submitted", "published"].indexOf(
                                    status
                                  )
                                ];
                              const newTypes = isSelected
                                ? showRecordTypes.filter((t) => t !== option)
                                : [...showRecordTypes, option];
                              this.setState({ showRecordTypes: newTypes });
                            }}
                          >
                            {`${recordStatusTranslate[status][language]} (${recordCountsByStatus[status] || 0})`}
                          </Button>
                        );
                      })}
                    </ButtonGroup>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Typography
                    variant="subtitle2"
                    gutterBottom
                    style={{ fontWeight: 600, marginBottom: 12 }}
                  >
                    <I18n en="Users" fr="Utilisateurs" />
                  </Typography>
                  <Autocomplete
                    multiple
                    id="users-filter"
                    options={users}
                    disableCloseOnSelect
                    value={showUsers}
                    onChange={(_, newValue) => {
                      this.setState({ showUsers: newValue });
                    }}
                    getOptionLabel={(option) => option}
                    renderOption={(option, { selected }) => (
                      <>
                        <Checkbox
                          style={{ marginRight: 8 }}
                          checked={selected}
                        />
                        {option}
                      </>
                    )}
                    renderTags={(value, getTagProps) => {
                      if (value.length === 0) {
                        return null;
                      }
                      return value.map((option, index) => {
                        const tagProps = getTagProps({ index });
                        return (
                          // eslint-disable-next-line react/jsx-props-no-spreading
                          <Chip key={option} size="small" label={option} {...tagProps} />
                        );
                      });
                    }}
                    renderInput={(params) => {
                      let placeholderText = "";
                      if (showUsers.length === 0) {
                        placeholderText =
                          language === "en"
                            ? "All users"
                            : "Tous les utilisateurs";
                      } else {
                        placeholderText =
                          language === "en"
                            ? "Search users..."
                            : "Rechercher des utilisateurs...";
                      }

                      return (
                        <TextField
                          // eslint-disable-next-line react/jsx-props-no-spreading
                          {...params}
                          placeholder={placeholderText}
                          variant="outlined"
                          size="small"
                        />
                      );
                    }}
                  />
                </Grid>
              </Grid>
            </Paper>
            <MaterialTable
              title=""
              icons={{
                /* eslint-disable react/jsx-props-no-spreading */
                Check: forwardRef((props, refParam) => <Check {...props} ref={refParam} />),
                Clear: forwardRef((props, refParam) => <Clear {...props} ref={refParam} />),
                Delete: forwardRef((props, refParam) => <Delete {...props} ref={refParam} />),
                DetailPanel: forwardRef((props, refParam) => <ChevronRight {...props} ref={refParam} />),
                Edit: forwardRef((props, refParam) => <Edit {...props} ref={refParam} />),
                Export: forwardRef((props, refParam) => <SaveAlt {...props} ref={refParam} />),
                Filter: forwardRef((props, refParam) => <FilterList {...props} ref={refParam} />),
                FirstPage: forwardRef((props, refParam) => <FirstPage {...props} ref={refParam} />),
                LastPage: forwardRef((props, refParam) => <LastPage {...props} ref={refParam} />),
                NextPage: forwardRef((props, refParam) => <ChevronRight {...props} ref={refParam} />),
                PreviousPage: forwardRef((props, refParam) => <ChevronLeft {...props} ref={refParam} />),
                ResetSearch: forwardRef((props, refParam) => <Clear {...props} ref={refParam} />),
                Search: forwardRef((props, refParam) => <Search {...props} ref={refParam} />),
                SortArrow: forwardRef((props, refParam) => <ArrowDownward {...props} ref={refParam} />),
                ThirdStateCheck: forwardRef((props, refParam) => <Remove {...props} ref={refParam} />),
                ViewColumn: forwardRef((props, refParam) => <ViewColumn {...props} ref={refParam} />),
                /* eslint-enable react/jsx-props-no-spreading */
              }}
              columns={[
                {
                  title: language === "en" ? "Title" : "Titre",
                  field: "title",
                  grouping: false,
                  render: (rowData) => rowData.title?.[language] || "",
                  customFilterAndSearch: (term, rowData) => {
                    const title = rowData.title?.[language] || "";
                    return title.toLowerCase().includes(term.toLowerCase());
                  },
                },
                {
                  title: language === "en" ? "Status" : "Statut",
                  field: "status",
                  lookup: {
                    "": language === "en" ? "Draft" : "Brouillon",
                    submitted: language === "en" ? "Submitted" : "Soumis",
                    published: language === "en" ? "Published" : "Publié",
                  },
                  render: (rowData) => {
                    const regionColor = regions[rowData.region]?.colors?.primary || "#006e90";
                    let bgColor = "#757575";
                    let label = language === "en" ? "Draft" : "Brouillon";

                    if (rowData.status === "published") {
                      bgColor = regionColor;
                      label = language === "en" ? "Published" : "Publié";
                    } else if (rowData.status === "submitted") {
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
                },
                {
                  title: language === "en" ? "Author" : "Auteur",
                  field: "userinfo.email",
                  filtering: false,
                },
                {
                  title: language === "en" ? "Progress" : "Progrès",
                  field: "progress",
                  filtering: false,
                  grouping: false,
                  render: (rowData) => `${percentValid(rowData)}%`,
                  customSort: (a, b) => percentValid(a) - percentValid(b),
                },
                {
                  title: language === "en" ? "Last Edited" : "Dernière modification",
                  field: "created",
                  filtering: false,
                  grouping: false,
                  render: (rowData) => <LastEdited dateStr={rowData.created} />,
                  customSort: (a, b) => {
                    const dateA = a.created ? new Date(a.created).getTime() : 0;
                    const dateB = b.created ? new Date(b.created).getTime() : 0;
                    return dateA - dateB;
                  },
                },
              ]}
              data={recordsToShow}
              actions={[
                (rowData) => {
                  const isPublished = rowData.status === "published";
                  let tooltip = "";
                  if (isPublished) {
                    tooltip = language === "en" ? "View" : "Voir";
                  } else {
                    tooltip = language === "en" ? "Edit" : "Modifier";
                  }
                  return {
                    icon: () => isPublished ? <Visibility /> : <Edit />,
                    tooltip,
                    onClick: (_, row) => this.editRecord(row.recordID, row.userinfo.userID),
                  };
                },
                () => ({
                  icon: () => <FileCopy />,
                  tooltip: language === "en" ? "Clone" : "Dupliquer",
                  onClick: (_, row) => this.handleCloneRecord(row.recordID, row.userinfo.userID),
                }),
                () => ({
                  icon: () => <Delete />,
                  tooltip: language === "en" ? "Delete" : "Supprimer",
                  onClick: (_, row) => this.toggleModal("deleteModalOpen", true, row.recordID, row.userinfo.userID),
                }),
                () => ({
                  icon: () => <TransferWithinAStation />,
                  tooltip: language === "en" ? "Transfer" : "Transférer",
                  onClick: (_, row) => this.toggleModal("transferModalOpen", true, row.recordID, row.userinfo.userID),
                }),
                (rowData) => {
                  if (rowData.status === "") {
                    return {
                      icon: () => <Publish />,
                      tooltip: language === "en" ? "Submit" : "Soumettre",
                      onClick: (_, row) => this.toggleModal("submitModalOpen", true, row.recordID, row.userinfo.userID),
                    };
                  }
                  if (rowData.status === "submitted") {
                    return {
                      icon: () => <Publish />,
                      tooltip: language === "en" ? "Publish" : "Publier",
                      onClick: (_, row) => this.toggleModal("publishModalOpen", true, row.recordID, row.userinfo.userID),
                    };
                  }
                  if (rowData.status === "published") {
                    return {
                      icon: () => <Eject />,
                      tooltip: language === "en" ? "Unpublish" : "Dépublier",
                      onClick: (_, row) => this.toggleModal("unPublishModalOpen", true, row.recordID, row.userinfo.userID),
                    };
                  }
                  return null;
                },
                (rowData) => {
                  if (rowData.status === "submitted") {
                    return {
                      icon: () => <Eject />,
                      tooltip: language === "en" ? "Unsubmit" : "Annuler la soumission",
                      onClick: (_, row) => this.toggleModal("unSubmitModalOpen", true, row.recordID, row.userinfo.userID),
                    };
                  }
                  return null;
                },
              ].filter(action => typeof action === "function" || action !== null)}
              options={{
                filtering: true,
                sorting: true,
                search: false,
                grouping: true,
                pageSize: 20,
                pageSizeOptions: [10, 20, 50, 100],
                actionsColumnIndex: -1,
                showTitle: false,
                toolbar: true,
                exportButton: true,
                exportAllData: true,
                columnsButton: true,
                headerStyle: {
                  fontWeight: 600,
                  fontSize: "0.875rem",
                },
                actionsCellStyle: {
                  padding: "4px 8px",
                },
              }}
              localization={{
                pagination: {
                  labelDisplayedRows: language === "en" ? "{from}-{to} of {count}" : "{from}-{to} de {count}",
                  labelRowsSelect: language === "en" ? "rows" : "lignes",
                  labelRowsPerPage: language === "en" ? "Rows per page:" : "Lignes par page:",
                  firstAriaLabel: language === "en" ? "First Page" : "Première page",
                  firstTooltip: language === "en" ? "First Page" : "Première page",
                  previousAriaLabel: language === "en" ? "Previous Page" : "Page précédente",
                  previousTooltip: language === "en" ? "Previous Page" : "Page précédente",
                  nextAriaLabel: language === "en" ? "Next Page" : "Page suivante",
                  nextTooltip: language === "en" ? "Next Page" : "Page suivante",
                  lastAriaLabel: language === "en" ? "Last Page" : "Dernière page",
                  lastTooltip: language === "en" ? "Last Page" : "Dernière page",
                },
                toolbar: {
                  searchTooltip: language === "en" ? "Search" : "Rechercher",
                  searchPlaceholder: language === "en" ? "Search" : "Rechercher",
                  exportTitle: language === "en" ? "Export" : "Exporter",
                  exportAriaLabel: language === "en" ? "Export" : "Exporter",
                  exportName: language === "en" ? "Export as CSV" : "Exporter en CSV",
                  showColumnsTitle: language === "en" ? "Show Columns" : "Afficher les colonnes",
                  showColumnsAriaLabel: language === "en" ? "Show Columns" : "Afficher les colonnes",
                  nRowsSelected: language === "en" ? "{0} row(s) selected" : "{0} ligne(s) sélectionnée(s)",
                },
                header: {
                  actions: language === "en" ? "Actions" : "Actions",
                },
                body: {
                  emptyDataSourceMessage: language === "en"
                    ? "There are no records waiting to be reviewed."
                    : "Aucun dossier n'attend d'être examiné.",
                  filterRow: {
                    filterTooltip: language === "en" ? "Filter" : "Filtrer",
                  },
                },
              }}
            />
          </>
        )}
      </Grid>
    );
  }
}

export default Reviewer;
