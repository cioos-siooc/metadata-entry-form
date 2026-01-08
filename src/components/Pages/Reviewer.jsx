/* eslint-disable react/jsx-no-bind */
import React from "react";
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
import Autocomplete from "@material-ui/lab/Autocomplete";

import { getDatabase, ref, onValue } from "firebase/database";

import firebase from "../../firebase";
import { auth, getAuth, onAuthStateChanged } from "../../auth";
import { Fr, En, I18n } from "../I18n";

import SimpleModal from "../FormComponents/SimpleModal";
import TransferModal from "../FormComponents/TransferModal";
import MetadataRecordListItem from "../FormComponents/MetadataRecordListItem";

import {
  loadRegionRecords,
  transferRecord,
  deleteRecord,
  submitRecord,
  cloneRecord,
} from "../../utils/firebaseRecordFunctions";
import { unique } from "../../utils/misc";
import FormClassTemplate from "./FormClassTemplate";

const RecordItem = ({
  record,
  language,
  editRecord,
  toggleModal,
  handleCloneRecord,
}) => {
  const commonProps = {
    record,
    language,
    onViewEditClick: () => editRecord(record.recordID, record.userinfo.userID),
    onCloneClick: () =>
      handleCloneRecord(record.recordID, record.userinfo.userID),
    onDeleteClick: () =>
      toggleModal(
        "deleteModalOpen",
        true,
        record.recordID,
        record.userinfo.userID
      ),
    onTransferClick: () =>
      toggleModal(
        "transferModalOpen",
        true,
        record.recordID,
        record.userinfo.userID
      ),
    showAuthor: true,
    showTransferButton: true,
    showDeleteAction: true,
    showCloneAction: true,
  };

  const DraftRecordItem = () => {
    return (
      <MetadataRecordListItem
        onSubmitClick={() => {
          return toggleModal(
            "submitModalOpen",
            true,
            record.recordID,
            record.userinfo.userID
          );
        }}
        showSubmitAction
        showEditAction
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...commonProps}
        showPercentComplete
      />
    );
  };
  const SubmittedRecordItem = () => (
    <MetadataRecordListItem
      onSubmitClick={() =>
        toggleModal(
          "publishModalOpen",
          true,
          record.recordID,
          record.userinfo.userID
        )
      }
      onUnSubmitClick={() =>
        toggleModal(
          "unSubmitModalOpen",
          true,
          record.recordID,
          record.userinfo.userID
        )
      }
      showPublishAction
      showUnSubmitAction
      showEditAction
      showPercentComplete
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...commonProps}
    />
  );
  const PublishedRecordItem = () => {
    return (
      <MetadataRecordListItem
        onUnPublishClick={() =>
          toggleModal(
            "unPublishModalOpen",
            true,
            record.recordID,
            record.userinfo.userID
          )
        }
        showUnPublishAction
        showViewAction
        showPercentComplete
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...commonProps}
      />
    );
  };

  if (record.status === "submitted") return <SubmittedRecordItem />;
  if (record.status === "published") return <PublishedRecordItem />;
  return <DraftRecordItem />;
};

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
            {recordsToShow.length ? (
              <>
                <Grid container direction="column" spacing={1}>
                  <Grid item xs={12}>
                    <Typography variant="body2" gutterBottom>
                      <I18n>
                        <En>
                          These are the submissions we have received from all
                          users that have not yet been reviewed. To accept a
                          record, click the 'Publish' button.
                        </En>
                        <Fr>
                          Ce sont les soumissions que nous avons reçues de tous
                          les utilisateurs qui n'ont pas encore été examinées.
                          Pour accepter un enregistrement, cliquez sur le bouton
                          « Publier ».
                        </Fr>
                      </I18n>
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    {recordsToShow.map((record) => (
                      <RecordItem
                        key={record.recordID}
                        record={record}
                        // eslint-disable-next-line react/jsx-no-bind
                        toggleModal={this.toggleModal.bind(this)}
                        editRecord={this.editRecord.bind(this)}
                        handleCloneRecord={this.handleCloneRecord.bind(this)}
                      />
                    ))}
                  </Grid>
                </Grid>
              </>
            ) : (
              <Grid container direction="column">
                <Grid item xs>
                  <Typography>
                    <I18n>
                      <En>There are no records waiting to be reviewed.</En>
                      <Fr>Aucun dossier n'attend d'être examiné.</Fr>
                    </I18n>
                  </Typography>
                </Grid>
              </Grid>
            )}
          </>
        )}
      </Grid>
    );
  }
}

export default Reviewer;
