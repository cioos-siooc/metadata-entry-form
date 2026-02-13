/* eslint-disable react/jsx-no-bind */
import React from "react";
import {
  Typography,
  List,
  Grid,
  CircularProgress,
  Checkbox,
  TextField,
  Paper,
} from "@mui/material";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { getDatabase, ref, onValue, get } from "firebase/database";
import { QuestionText } from "../FormComponents/QuestionStyles";

import firebase from "../../firebase";
import { auth, getAuth, onAuthStateChanged } from "../../auth";
import { Fr, En, I18n } from "../I18n";
import { UserContext } from "../../providers/UserProvider";

import CheckBoxList from "../FormComponents/CheckBoxList";

import SimpleModal from "../FormComponents/SimpleModal";
import TransferModal from "../FormComponents/TransferModal";
import MetadataRecordListItem from "../FormComponents/MetadataRecordListItem";
import GitHubPublishDialog from "../Dialogs/GitHubPublishDialog";

import {
  loadRegionRecords,
  transferRecord,
  deleteRecord,
  submitRecord,
  cloneRecord,
} from "../../utils/firebaseRecordFunctions";
import { unique } from "../../utils/misc";
import { preparePublishPayload } from "../../utils/publishUtils";
import FormClassTemplate from "./FormClassTemplate";
import withRouter from "../../utils/withRouter";

const RecordItem = ({
  record,
  language,
  editRecord,
  toggleModal,
  handleCloneRecord,
  githubPublishEnabled,
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
      showGithubPublishAction
      githubPublishEnabled={githubPublishEnabled}
      onGithubPublishClick={() =>
        toggleModal(
          "githubPublishModalOpen",
          true,
          record.recordID,
          record.userinfo.userID
        )
      }
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
        showGithubPublishAction
        githubPublishEnabled={githubPublishEnabled}
        onGithubPublishClick={() =>
          toggleModal(
            "githubPublishModalOpen",
            true,
            record.recordID,
            record.userinfo.userID
          )
        }
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
      githubPublishModalOpen: false,
      githubPublishLoading: false,
      toastOpen: false,
      toastMessage: "",
      toastSeverity: "info",
      publishLogs: [],
      githubPublishEnabled: false,
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
        const githubRef = ref(database, `admin/${region}/githubCredentials`);
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
            showUsers: users,
          });
        });
        this.listenerRefs.push(usersRef);
        onValue(githubRef, (snapshot) => {
          const creds = snapshot.val() || {};
          const token = creds.token || "";
          this.setState({ githubPublishEnabled: !!token && token.trim().length > 0 });
        });
        this.listenerRefs.push(githubRef);
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

  showToast = (message, severity = "info") => {
    this.setState({ toastOpen: true, toastMessage: message, toastSeverity: severity });
  };

  closeToast = () => {
    this.setState({ toastOpen: false });
  };

  addPublishLog = (message) => {
    this.setState((prev) => ({ publishLogs: [...prev.publishLogs, message] }));
  };

  getLogMessage = (key, arg) => {
    const { language } = this.props.match.params;
    const messages = {
      start: {
        en: "Starting GitHub publish…",
        fr: "Démarrage de la publication sur GitHub…",
      },
      fetchConfig: {
        en: "Fetching GitHub configuration…",
        fr: "Récupération de la configuration GitHub…",
      },
      preparingPayload: {
        en: "Preparing publish payload…",
        fr: "Préparation du contenu de publication…",
      },
      publishing: {
        en: "Publishing record to GitHub…",
        fr: "Publication de l’enregistrement sur GitHub…",
      },
      markingPublished: {
        en: "Marking record as published…",
        fr: "Marquage de l’enregistrement comme publié…",
      },
      complete: {
        en: "Publish complete ✅",
        fr: "Publication terminée ✅",
      },
      error: {
        en: (msg) => `Error: ${msg}`,
        fr: (msg) => `Erreur : ${msg}`,
      },
      githubNotConfigured: {
        en: "GitHub publishing is not configured",
        fr: "La publication GitHub n’est pas configurée",
      },
    };

    const entry = messages[key];
    if (!entry) return key;
    const value = entry[language] || entry.en;
    return typeof value === "function" ? value(arg) : value;
  };

  handleGithubPublish = async (environments, commitMessage) => {
    if (!this.state.githubPublishEnabled) {
      this.showToast(this.getLogMessage("githubNotConfigured"), "warning");
      return;
    }
    this.setState({ githubPublishLoading: true, publishLogs: [] });
    try {
      const { match } = this.props;
      const { region } = match.params;
      const { publishRecordToGitHub } = this.context;

      this.addPublishLog(this.getLogMessage("start"));
      const record = this.state.records.find((r) => r.recordID === this.state.modalKey);
      if (!record) throw new Error("Record not found in state.");

      // Fetch GitHub config for file naming template
      this.addPublishLog(this.getLogMessage("fetchConfig"));
      const db = getDatabase(firebase);
      const configSnapshot = await get(ref(db, `admin/${region}/githubCredentials`));
      const config = configSnapshot.val() || {};

      this.addPublishLog(this.getLogMessage("preparingPayload"));
      const payload = await preparePublishPayload(record, environments, commitMessage, config, region);

      this.addPublishLog(this.getLogMessage("publishing"));
      await publishRecordToGitHub({
        ...payload,
        recordId: this.state.modalKey,
        userId: this.state.modalUserID,
        region,
      });

      this.addPublishLog(this.getLogMessage("markingPublished"));
      await this.handleSubmitRecord(this.state.modalKey, this.state.modalUserID, "published");
      this.showToast("Published to GitHub successfully!", "success");
      this.addPublishLog(this.getLogMessage("complete"));
      this.setState({ githubPublishModalOpen: false });
    } catch (error) {
      console.error("Publish error:", error);
      this.showToast(`Error publishing: ${error.message}`, "error");
      this.addPublishLog(this.getLogMessage("error", error.message));
    } finally {
      this.setState({ githubPublishLoading: false });
    }
  };

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
        justifyContent="space-between"
        alignItems="stretch"
        spacing={1}
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
        <GitHubPublishDialog
          open={this.state.githubPublishModalOpen}
          onClose={() => this.setState({ githubPublishModalOpen: false })}
          onPublish={this.handleGithubPublish}
          region={match.params.region}
          recordTitle={
            records.find((r) => r.recordID === modalKey)?.title?.[language] ||
            ""
          }
          loading={this.state.githubPublishLoading}
          progressLogs={this.state.publishLogs}
        />
        <Grid >
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
            <Snackbar
              open={this.state.toastOpen}
              autoHideDuration={6000}
              onClose={this.closeToast}
              anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
              <Alert onClose={this.closeToast} severity={this.state.toastSeverity} variant="filled" elevation={6}>
                {this.state.toastMessage}
              </Alert>
            </Snackbar>
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
                <Grid >
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
                <Grid >
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
                        <Grid >
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
                        <Grid >
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
                <Grid >
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
                  <Grid>
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
                  <Grid>
                    <List>
                      {recordsToShow.map((record) => (
                        <RecordItem
                          key={record.recordID}
                          record={record}
                          // eslint-disable-next-line react/jsx-no-bind
                          toggleModal={this.toggleModal.bind(this)}
                          editRecord={this.editRecord.bind(this)}
                          handleCloneRecord={this.handleCloneRecord.bind(this)}
                          githubPublishEnabled={this.state.githubPublishEnabled}
                        />
                      ))}
                    </List>
                  </Grid>
                </Grid>
              </>
            ) : (
              <Grid container direction="column">
                <Grid>
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

Reviewer.contextType = UserContext;
export default withRouter(Reviewer);
