import React from "react";
import firebase from "../firebase";
import { auth } from "../auth";
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
  CircularProgress,
} from "@material-ui/core";

import { Delete, Publish, Description, Visibility } from "@material-ui/icons";
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
          </IconButton>{" "}
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
      loading: false,
    };
  }

  databaseCallback = (users) =>
    this.setState({ users: users.toJSON(), loading: false });

  async componentDidMount() {
    this.setState({ loading: true });

    auth.onAuthStateChanged((user) => {
      if (user) {
        firebase
          .database()
          .ref(`test/users`)
          .on("value", this.databaseCallback);
      }
    });
  }

  editRecord(key) {
    this.props.history.push(
      "/" + this.props.match.params.language + `/new/${key}`
    );
  }

  submitRecord(key) {
    if (auth.currentUser && key) {
      firebase
        .database()
        .ref(`test/users`)
        .child(auth.currentUser.uid)
        .child("records")
        .child(key)
        .child("status")
        .set("published");
    }
  }

  deleteRecord(key) {
    if (auth.currentUser) {
      firebase
        .database()
        .ref(`test/users`)
        .child(auth.currentUser.uid)
        .child("users")
        .child(key)
        .remove();
    }
  }
  toggleModal(modalName, state, key = "") {
    this.setState({ modalKey: key, [modalName]: state });
  }
  shorten(txt) {
    const maxLen = 100;
    if (txt.length > maxLen) return txt.substr(0, maxLen) + "...";
    else return txt;
  }
  render() {
    const { language } = this.props.match.params;
    const records = [];

    Object.values(this.state.users).forEach((user) => {
      if (user.records) {
        Object.entries(user.records).forEach(([k, record]) => {
          records.push({ ...record, userinfo: user.userinfo, key: k });
        });
      }
    });

    const recordsForReview = records.filter(
      (record) => record.status === "submitted"
    );
    const recordsPublished = records.filter(
      (record) => record.status === "published"
    );
    return (
      <div>
        <SimpleModal
          open={this.state.deleteModalOpen}
          onClose={() => this.toggleModal("deleteModalOpen", false)}
          onAccept={() => this.deleteRecord(this.state.modalKey)}
          aria-labelledby="simple-modal-title"
          aria-describedby="simple-modal-description"
        />
        <SimpleModal
          open={this.state.publishModalOpen}
          onClose={() => this.toggleModal("publishModalOpen", false)}
          onAccept={() => this.submitRecord(this.state.modalKey)}
          aria-labelledby="simple-modal-title"
          aria-describedby="simple-modal-description"
        />

        <Typography variant="h3">
          <En>Review submissions</En>
          <Fr>Examen des soumissions</Fr>
        </Typography>
        {this.state.loading ? (
          <CircularProgress />
        ) : (
          <span>
            <span>
              {recordsForReview.length > 0 ? (
                <div>
                  <Typography>
                    <En>
                      These are the submissions we have received from all users
                      that have not yet been reviewed:
                    </En>
                    <Fr>Ce sont les soumissions que nous avons reçues</Fr>
                  </Typography>
                  <List>
                    {recordsForReview.map((record) => {
                      return (
                        <MetadataRecordListItem
                          record={record}
                          key={record.key}
                          language={language}
                          onViewClick={() => this.editRecord(record.key)}
                          onDeleteClick={() =>
                            this.toggleModal(
                              "deleteModalOpen",
                              true,
                              record.key
                            )
                          }
                          onSubmitClick={() =>
                            this.toggleModal(
                              "publishModalOpen",
                              true,
                              record.key
                            )
                          }
                          showPublishAction={record.status !== "published"}
                        />
                      );
                    })}
                  </List>
                </div>
              ) : (
                <Typography>
                  <En>There are no records waiting to be reviewed.</En>
                  <Fr>Aucun dossier n'attend d'être examiné.</Fr>
                </Typography>
              )}
            </span>
            <span>
              {recordsPublished.length > 0 ? (
                <div>
                  <Typography>
                    <En>Published records:</En>
                    <Fr>Documents publiés:</Fr>
                  </Typography>
                  <List>
                    {recordsPublished.map((record, key) => {
                      return (
                        <MetadataRecordListItem
                          record={record}
                          key={key}
                          language={language}
                          onViewClick={() => this.editRecord(record.key)}
                          onDeleteClick={() =>
                            this.toggleModal(
                              "deleteModalOpen",
                              true,
                              record.key
                            )
                          }
                        />
                      );
                    })}
                  </List>
                </div>
              ) : (
                <Typography>
                  <En>No users submitted yet!</En>
                  <Fr>Aucun enregistrement n'a encore été soumis</Fr>
                </Typography>
              )}
            </span>
          </span>
        )}
      </div>
    );
  }
}

export default Submissions;
