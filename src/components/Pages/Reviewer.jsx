import React from "react";
import {
  Typography,
  List,
  Grid,
  CircularProgress,
  Checkbox,
  TextField,
  Paper,
} from "@material-ui/core";

import Accordion from "@material-ui/core/Accordion";
import AccordionSummary from "@material-ui/core/AccordionSummary";
import AccordionDetails from "@material-ui/core/AccordionDetails";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import { QuestionText } from "../FormComponents/QuestionStyles";

import firebase from "../../firebase";
import { auth } from "../../auth";
import { Fr, En, I18n } from "../I18n";

import CheckBoxList from "../FormComponents/CheckBoxList";

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
    onCloneClick: () => handleCloneRecord(record.recordID, record.userinfo.userID),
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

    this.unsubscribe = auth.onAuthStateChanged((authUser) => {
      if (authUser) {
        const usersRef = firebase.database().ref(region).child("users");
        usersRef.on("value", (regionUsersRaw) => {
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
            showUsers: users,
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
    let recordsToShow = records
      .filter((record) => showUsers.includes(record.userinfo.email))
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
    const selectedText = language === "fr" ? "sélectionnés" : "selected";
    return (
      <Grid
        container
        direction="column"
        justify="space-between"
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
              style={{
                padding: "10px",
                margin: "10px",
                width: "100%",
              }}
            >
              <QuestionText>
                <En>Filters</En>
                <Fr>Filtres</Fr>
              </QuestionText>
              <Grid container direction="column" spacing={2}>
                <Grid item xs>
                  <CheckBoxList
                    value={showRecordTypes}
                    onChange={(e) => {
                      this.setState({ showRecordTypes: e });
                    }}
                    options={recordTypeOptions}
                    optionLabels={["draft", "submitted", "published"].map(
                      (status) =>
                        `${recordStatusTranslate[status][language]} (${recordCountsByStatus[status]})`
                    )}
                  />
                </Grid>
                <Grid item xs>
                  <Accordion>
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      aria-controls="panel2a-content"
                      id="panel2a-header"
                    >
                      <Typography>
                        {showUsers.length === users.length ? (
                          <I18n
                            en="Users (All users selected)"
                            fr="Utilisateurs (Tous les utilisateurs)"
                          />
                        ) : (
                          <I18n
                            en={`Users (${showUsers.length}  ${selectedText})`}
                            fr={`Utilisateurs (${showUsers.length}  ${selectedText})`}
                          />
                        )}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container direction="column">
                        <Grid item xs>
                          <En>Select All / None</En>
                          <Fr>Tout sélectionner/Aucun</Fr>

                          <Checkbox
                            label="Show All / None"
                            onChange={(e) => {
                              this.setState({
                                showUsers: e.target.checked ? users : [],
                              });
                            }}
                          />
                        </Grid>
                        <Grid item xs>
                          <CheckBoxList
                            value={showUsers}
                            onChange={(e) => {
                              this.setState({ showUsers: e });
                            }}
                            options={users}
                            labelSize={null}
                          />
                        </Grid>
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                </Grid>
                <Grid item xs>
                  <TextField
                    fullWidth
                    onChange={(e) => {
                      this.setState({ recordsFilter: e.target.value });
                    }}
                    label={
                      <I18n
                        en="Search title and abstract"
                        fr="Rechercher le titre et le résumé"
                      />
                    }
                  />
                </Grid>
              </Grid>
            </Paper>
            {recordsToShow.length ? (
              <>
                <Grid container direction="column">
                  <Grid item xs>
                    <Typography>
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
                  <Grid item xs>
                    <List>
                      {recordsToShow.map((record) => (
                        <RecordItem
                          key={record.recordID}
                          record={record}
                          toggleModal={this.toggleModal.bind(this)}
                          editRecord={this.editRecord.bind(this)}
                          handleCloneRecord={this.handleCloneRecord.bind(this)}
                        />
                      ))}
                    </List>
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
