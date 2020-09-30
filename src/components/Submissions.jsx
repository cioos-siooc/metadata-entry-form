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

import {
  Delete,
  Edit,
  Publish,
  Description,
  Visibility,
} from "@material-ui/icons";
import { Fr, En, I18n } from "./I18n";

import SimpleModal from "./SimpleModal";

class Submissions extends React.Component {
  state = {
    records: {},
    deleteModalOpen: false,
    publishModalOpen: false,
    modalKey: "",
    loading: false,
  };

  componentWillUnmount() {
    this.unsubscribe();
  }
  async componentDidMount() {
    this.setState({ loading: true });

    this.unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        firebase
          .database()
          .ref(`test/users`)
          .child(user.uid)
          .child("records")
          .on("value", (records) =>
            this.setState({ records: records.toJSON(), loading: false })
          );
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
        .set("submitted");
    }
  }

  deleteRecord(key) {
    if (auth.currentUser) {
      firebase
        .database()
        .ref(`test/users`)
        .child(auth.currentUser.uid)
        .child("records")
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
          <En>Submission list</En>
          <Fr>Liste des soumissions</Fr>
        </Typography>
        {this.state.loading ? (
          <CircularProgress />
        ) : (
          <span>
            {this.state.records &&
            Object.keys(this.state.records).length > 0 ? (
              <div>
                <Typography>
                  <En>These are the submissions we have received:</En>
                  <Fr>Ce sont les soumissions que nous avons reçues</Fr>
                </Typography>
                <List>
                  {Object.entries(this.state.records).map(([key, val]) => {
                    const disabled = val.status === "submitted";
                    return (
                      <ListItem key={key}>
                        <ListItemAvatar>
                          <Avatar>
                            <Description />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={val.title[language]}
                          secondary={
                            val.created && `Created/Updated ${val.created} `
                          }
                        />
                        <ListItemSecondaryAction>
                          {val.status === "submitted" ? (
                            <Tooltip title={<I18n en="View" fr="Vue" />}>
                              <span>
                                <IconButton
                                  onClick={() => this.editRecord(key)}
                                  edge="end"
                                  aria-label="delete"
                                >
                                  <Visibility />
                                </IconButton>
                              </span>
                            </Tooltip>
                          ) : (
                            <Tooltip title={<I18n en="Edit" fr="Éditer" />}>
                              <span>
                                <IconButton
                                  onClick={() => this.editRecord(key)}
                                  edge="end"
                                  aria-label="delete"
                                >
                                  <Edit />
                                </IconButton>
                              </span>
                            </Tooltip>
                          )}
                          <Tooltip title={<I18n en="Delete" fr="Supprimer" />}>
                            <span>
                              <IconButton
                                disabled={disabled}
                                onClick={() =>
                                  this.toggleModal("deleteModalOpen", true, key)
                                }
                                edge="end"
                                aria-label="delete"
                              >
                                <Delete />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip
                            title={
                              <I18n
                                en="Submit for review"
                                fr="Soumettre pour examen"
                              />
                            }
                          >
                            <span>
                              <IconButton
                                disabled={disabled}
                                onClick={() =>
                                  this.toggleModal(
                                    "publishModalOpen",
                                    true,
                                    key
                                  )
                                }
                                edge="end"
                                aria-label="delete"
                              >
                                <Publish />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </ListItemSecondaryAction>
                      </ListItem>
                    );
                  })}
                </List>
              </div>
            ) : (
              <Typography>
                <En>No records submitted yet!</En>
                <Fr>Aucun enregistrement n'a encore été soumis</Fr>
              </Typography>
            )}
          </span>
        )}
      </div>
    );
  }
}

export default Submissions;
