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

import { QuestionText } from "../FormComponents/QuestionStyles";

import Accordion from "@material-ui/core/Accordion";
import AccordionSummary from "@material-ui/core/AccordionSummary";
import AccordionDetails from "@material-ui/core/AccordionDetails";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import RecordStatusIcon from "../FormComponents/RecordStatusIcon";

import firebase from "../../firebase";
import { auth } from "../../auth";
import { Fr, En, I18n } from "../I18n";

import CheckBoxList from "../FormComponents/CheckBoxList";

import SimpleModal from "../FormComponents/SimpleModal";
import MetadataRecordListItem from "../FormComponents/MetadataRecordListItem";

const unique = (arr) => [...new Set(arr)];

class Reviewer extends React.Component {
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
      showRecordTypes: ["", "submitted", "published"],
      showUsers: [],
      records: [],
      recordsFilter: "",
    };
  }

  async componentDidMount() {
    this.setState({ loading: true });
    const { match } = this.props;
    const { region } = match.params;

    this.unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        firebase
          .database()
          .ref(region)
          .child("users")
          .on("value", (regionUsersRaw) => {
            const regionUsers = regionUsersRaw.toJSON();
            const records = [];

            Object.entries(regionUsers).forEach(([userID, user]) => {
              if (user.records) {
                Object.entries(user.records).forEach(([key, record]) => {
                  records.push({
                    ...record,
                    userinfo: { ...user.userinfo, userID },
                    key,
                  });
                });
              }
            });

            const users = unique(
              records.map((record) => record.userinfo.email)
            );

            this.setState({ records, loading: false, users, showUsers: users });
          });
      }
    });
  }

  componentWillUnmount() {
    if (this.unsubscribe) this.unsubscribe();
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
    const { records, recordsFilter, showRecordTypes, showUsers } = this.state;

    const { match } = this.props;
    const { language } = match.params;

    const recordTypeOptions = ["", "submitted", "published"];

    const DraftRecordItem = ({ record, language }) => {
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
        />
      );
    };
    const SubmittedRecordItem = ({ record, language }) => (
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
      />
    );
    const PublishedRecordItem = ({ record, language }) => {
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
    // sort records - drafts then submitted then published
    let recordsToShow = records
      .filter(
        (record) =>
          showRecordTypes.includes(record.status) &&
          showUsers.includes(record.userinfo.email)
      )
      .sort((a, b) => {
        return (
          showRecordTypes.indexOf(a.status) > showRecordTypes.indexOf(b.status)
        );
      });
    if (recordsFilter) {
      recordsToShow = recordsToShow.filter((record) => {
        const recordText = JSON.stringify([
          record.title,
          record.abstract,
        ]).toUpperCase();
        return recordText.includes(recordsFilter.toUpperCase());
      });
    }
    const {
      deleteModalOpen,
      modalKey,
      modalUserID,
      unPublishModalOpen,
      publishModalOpen,
      unSubmitModalOpen,
      loading,
    } = this.state;

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
              <QuestionText>Filters</QuestionText>
              <Grid container direction="column" spacing={2}>
                <Grid item xs>
                  <CheckBoxList
                    value={this.state.showRecordTypes}
                    onChange={(e) => {
                      this.setState((s) => (s.showRecordTypes = e));
                    }}
                    options={recordTypeOptions}
                    optionLabels={[
                      "Drafts",
                      "Submitted records",
                      "Published Records",
                    ]}
                  />
                </Grid>
                <Grid item xs>
                  <Accordion>
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      aria-controls="panel2a-content"
                      id="panel2a-header"
                    >
                      <Typography>Users</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container direction="column">
                        <Grid item xs>
                          Select All/None
                          <Checkbox
                            label="Show All/None"
                            onChange={(e) => {
                              this.setState({
                                showUsers: e.target.checked
                                  ? this.state.users
                                  : [],
                              });
                            }}
                          />
                        </Grid>
                        <Grid item xs>
                          <CheckBoxList
                            value={this.state.showUsers}
                            onChange={(e) => {
                              this.setState({ showUsers: e });
                            }}
                            options={this.state.users}
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
                    label="Search title and abstract"
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
