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
import MetadataRecordListItem from "../FormComponents/MetadataRecordListItem";

import blankRecord from "../../utils/blankRecord";
import FormClassTemplate from "./FormClassTemplate";

const unique = (arr) => [...new Set(arr)];
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
      modalKey: "",
      modalUserID: "",
      loading: false,
      showRecordTypes: ["submitted"],
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

    this.unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        const usersRef = firebase.database().ref(region).child("users");

        usersRef.on("value", (regionUsersRaw) => {
          const regionUsers = regionUsersRaw.toJSON();
          const records = [];

          Object.entries(regionUsers).forEach(([userID, user]) => {
            if (user.records) {
              Object.entries(user.records).forEach(([key, record]) => {
                records.push({
                  ...{ ...blankRecord, ...record },
                  userinfo: { ...user.userinfo, userID },
                  key,
                });
              });
            }
          });
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
    const { match, history } = this.props;
    const { language, region } = match.params;
    history.push(`/${language}/${region}/${userID}/${key}`);
  }

  async submitRecord(key, userID, status) {
    const { match } = this.props;
    const { region } = match.params;

    if (key && userID) {
      this.setState({ loading: true });

      const recordRef = firebase
        .database()
        .ref(region)
        .child("users")
        .child(userID)
        .child("records")
        .child(key);

      await recordRef.child("status").set(status);
      await recordRef.child("timeFirstPublished").set(new Date().toISOString());

      this.setState({ loading: false });
    }
  }

  async deleteRecord(key, userID) {
    const { match } = this.props;
    const { region } = match.params;
    if (key && userID) {
      this.setState({ loading: true });

      await firebase
        .database()
        .ref(region)
        .child("users")
        // this can be any user id
        .child(userID)
        .child("records")
        .child(key)
        .remove();

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
      modalKey,
      modalUserID,
      unPublishModalOpen,
      publishModalOpen,
      unSubmitModalOpen,
      loading,
      users,
    } = this.state;

    const { match } = this.props;
    const { language } = match.params;

    const recordTypeOptions = ["", "submitted", "published"];

    // sort records - drafts then submitted then published
    let recordsToShow = records.filter((record) =>
      showUsers.includes(record.userinfo.email)
    );

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

    const DraftRecordItem = ({ record }) => {
      return (
        <MetadataRecordListItem
          record={record}
          key={record.key}
          language={language}
          onViewClick={() =>
            this.editRecord(record.key, record.userinfo.userID)
          }
          onDeleteClick={() =>
            this.toggleModal(
              "deleteModalOpen",
              true,
              record.key,
              record.userinfo.userID
            )
          }
          onSubmitClick={() =>
            this.toggleModal(
              "submitModalOpen",
              true,
              record.key,
              record.userinfo.userID
            )
          }
          showUnSubmitAction
          showAuthor
        />
      );
    };
    const SubmittedRecordItem = ({ record }) => (
      <MetadataRecordListItem
        record={record}
        key={record.key}
        language={language}
        onViewClick={() => this.editRecord(record.key, record.userinfo.userID)}
        onDeleteClick={() =>
          this.toggleModal(
            "deleteModalOpen",
            true,
            record.key,
            record.userinfo.userID
          )
        }
        onSubmitClick={() =>
          this.toggleModal(
            "publishModalOpen",
            true,
            record.key,
            record.userinfo.userID
          )
        }
        onUnSubmitClick={() =>
          this.toggleModal(
            "unSubmitModalOpen",
            true,
            record.key,
            record.userinfo.userID
          )
        }
        showPublishAction
        showUnSubmitAction
        showAuthor
      />
    );
    const PublishedRecordItem = ({ record }) => {
      return (
        <MetadataRecordListItem
          record={record}
          key={record.key}
          language={language}
          onViewClick={() =>
            this.editRecord(record.key, record.userinfo.userID)
          }
          onDeleteClick={() =>
            this.toggleModal(
              "deleteModalOpen",
              true,
              record.key,
              record.userinfo.userID
            )
          }
          onUnPublishClick={() =>
            this.toggleModal(
              "unPublishModalOpen",
              true,
              record.key,
              record.userinfo.userID
            )
          }
          showUnPublishAction
          showAuthor
        />
      );
    };

    const RecordItem = (props) => {
      const { record } = props;

      if (record.status === "") return <DraftRecordItem {...props} />;
      if (record.status === "submitted")
        return <SubmittedRecordItem {...props} />;
      if (record.status === "published")
        return <PublishedRecordItem {...props} />;
    };

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
        <SimpleModal
          open={deleteModalOpen}
          onClose={() => this.toggleModal("deleteModalOpen", false)}
          onAccept={() => this.deleteRecord(modalKey, modalUserID)}
          aria-labelledby="simple-modal-title"
          aria-describedby="simple-modal-description"
        />
        <SimpleModal
          open={publishModalOpen}
          onClose={() => this.toggleModal("publishModalOpen", false)}
          onAccept={() => this.submitRecord(modalKey, modalUserID, "published")}
          aria-labelledby="simple-modal-title"
          aria-describedby="simple-modal-description"
        />
        <SimpleModal
          open={unPublishModalOpen}
          onClose={() => this.toggleModal("unPublishModalOpen", false)}
          onAccept={() => this.submitRecord(modalKey, modalUserID, "submitted")}
          aria-labelledby="simple-modal-title"
          aria-describedby="simple-modal-description"
        />
        <SimpleModal
          open={unSubmitModalOpen}
          onClose={() => this.toggleModal("unSubmitModalOpen", false)}
          onAccept={() => this.submitRecord(modalKey, modalUserID, "")}
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
                          key={record.key}
                          record={record}
                          language={language}
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
