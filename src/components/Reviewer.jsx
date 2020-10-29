import React from "react";
import {
  Typography,
  List,
  ListItem,
  ListItemText,
  Avatar,
  ListItemAvatar,
  Tooltip,
  ListItemSecondaryAction,
  IconButton,
  Grid,
  CircularProgress,
} from "@material-ui/core";
import { Delete, Publish, Description, Visibility } from "@material-ui/icons";
import firebase from "../firebase";
import { auth } from "../auth";
import { Fr, En, I18n } from "./I18n";

import SimpleModal from "./SimpleModal";

const MetadataRecordListItem = ({
  record,
  language,
  onViewClick,
  onDeleteClick,
  onSubmitClick,
  showPublishAction,
}) => (
  <ListItem key={record.key}>
    <ListItemAvatar>
      <Avatar>
        <Description />
      </Avatar>
    </ListItemAvatar>
    <ListItemText
      primary={record.title[language]}
      secondary={record.userinfo.displayName}
    />
    <ListItemSecondaryAction>
      <Tooltip title={<I18n en="View" fr="Vue" />}>
        <span>
          <IconButton onClick={onViewClick} edge="end" aria-label="delete">
            <Visibility />
          </IconButton>
        </span>
      </Tooltip>

      <Tooltip title={<I18n en="Delete" fr="Supprimer" />}>
        <span>
          <IconButton onClick={onDeleteClick} edge="end" aria-label="delete">
            <Delete />
          </IconButton>
        </span>
      </Tooltip>
      {showPublishAction && (
        <Tooltip title={<I18n en="Publish" fr="Publier" />}>
          <span>
            <IconButton onClick={onSubmitClick} edge="end" aria-label="delete">
              <Publish />
            </IconButton>
          </span>
        </Tooltip>
      )}
    </ListItemSecondaryAction>
  </ListItem>
);
class Submissions extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      users: {},
      deleteModalOpen: false,
      publishModalOpen: false,
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
    history.push(`/${language}/${region}/review/${userID}/${key}`);
  }

  async submitRecord(key, userID) {
    const { match } = this.props;
    const { region } = match.params;

    if (key && userID) {
      this.setState({ loading: true });

      await firebase
        .database()
        .ref(region)
        .child("users")
        .child(userID)
        .child("records")
        .child(key)
        .child("status")
        .set("published");
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
    // eslint-disable-next-line react/destructuring-assignment
    const { match } = this.props;
    const { language } = match.params;

    const records = [];

    Object.entries(users).forEach(([userID, user]) => {
      if (user.records) {
        Object.entries(user.records).forEach(([k, record]) => {
          records.push({
            ...record,
            userinfo: { ...user.userinfo, userID },
            key: k,
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
      publishModalOpen,
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
          onAccept={() => this.submitRecord(modalKey, modalUserID)}
          aria-labelledby="simple-modal-title"
          aria-describedby="simple-modal-description"
        />
        <Grid item xs>
          <Typography variant="h3">
            <En>Review submissions</En>
            <Fr>Examen des soumissions</Fr>
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
                    <En>
                      These are the submissions we have received from all users
                      that have not yet been reviewed. To accept a record, click
                      the 'Publish' button.
                    </En>
                    <Fr>
                      Ce sont les soumissions que nous avons reçues de tous les
                      utilisateurs qui n'ont pas encore été examinées. Pour
                      accepter un enregistrement, cliquez sur le bouton «
                      Publier ».
                    </Fr>
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
                          showPublishAction={record.status !== "published"}
                        />
                      );
                    })}
                  </List>
                </Grid>
              </>
            ) : (
              <Grid item xs>
                <Typography>
                  <En>There are no records waiting to be reviewed.</En>
                  <Fr>Aucun dossier n'attend d'être examiné.</Fr>
                </Typography>
              </Grid>
            )}

            {recordsPublished.length ? (
              <Grid item xs>
                <Typography>
                  <En>Published records:</En>
                  <Fr>Documents publiés:</Fr>
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
                      />
                    );
                  })}
                </List>
              </Grid>
            ) : (
              <Grid item xs>
                <Typography>
                  <En>There are no published records.</En>
                  <Fr>Il n'y a pas d'enregistrements publiés</Fr>
                </Typography>
              </Grid>
            )}
          </>
        )}
      </Grid>
    );
  }
}

export default Submissions;
