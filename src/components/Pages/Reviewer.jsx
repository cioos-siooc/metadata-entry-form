import React from "react";
import { Typography, List, Grid, CircularProgress } from "@material-ui/core";

import firebase from "../../firebase";
import { auth } from "../../auth";
import { Fr, En, I18n } from "../I18n";

import SimpleModal from "../FormComponents/SimpleModal";
import MetadataRecordListItem from "../FormComponents/MetadataRecordListItem";

class Reviewer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      users: {},
      deleteModalOpen: false,
      publishModalOpen: false,
      unPublishModalOpen: false,
      unSubmitModalOpen: false,
      modalKey: "",
      modalUserID: "",
      loading: false,
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
          .on("value", (users) =>
            this.setState({ users: users.toJSON(), loading: false })
          );
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
    const { users } = this.state;

    const { match } = this.props;
    const { language } = match.params;

    const records = [];

    Object.entries(users).forEach(([userID, user]) => {
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

    const recordsForReview = records.filter(
      (record) => record.status === "submitted"
    );
    const recordsPublished = records.filter(
      (record) => record.status === "published"
    );
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
      <Grid container direction="column" spacing={3}>
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
            {recordsForReview.length ? (
              <>
                <Grid item xs>
                  <Typography>
                    <I18n>
                      <En>
                        These are the submissions we have received from all
                        users that have not yet been reviewed. To accept a
                        record, click the 'Publish' button. Once a record is
                        published, you can download the xml or yaml
                      </En>
                      <Fr>
                        Ce sont les soumissions que nous avons reçues de tous
                        les utilisateurs qui n'ont pas encore été examinées.
                        Pour accepter un enregistrement, cliquez sur le bouton «
                        Publier ». Une fois qu'un enregistrement est publié,
                        vous pouvez télécharger le xml ou yaml
                      </Fr>
                    </I18n>{" "}
                    .
                  </Typography>
                </Grid>
                <Grid item xs>
                  <List>
                    {recordsForReview.map((record) => {
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
                    })}
                  </List>
                </Grid>
              </>
            ) : (
              <Grid item xs>
                <Typography>
                  <I18n>
                    <En>There are no records waiting to be reviewed.</En>
                    <Fr>Aucun dossier n'attend d'être examiné.</Fr>
                  </I18n>
                </Typography>
              </Grid>
            )}

            {recordsPublished.length ? (
              <Grid item xs>
                <Typography>
                  <I18n>
                    <En>Published records:</En>
                    <Fr>Documents publiés:</Fr>
                  </I18n>
                </Typography>
                <List>
                  {recordsPublished.map((record, i) => {
                    return (
                      <MetadataRecordListItem
                        record={record}
                        key={i}
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
                  })}
                </List>
              </Grid>
            ) : (
              <Grid item xs>
                <Typography>
                  <I18n>
                    <En>There are no published records.</En>
                    <Fr>Il n'y a pas d'enregistrements publiés</Fr>
                  </I18n>
                </Typography>
              </Grid>
            )}
          </>
        )}
      </Grid>
    );
  }
}

export default Reviewer;
