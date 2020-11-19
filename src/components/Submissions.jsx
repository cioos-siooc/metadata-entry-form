import React from "react";
import { v4 as uuidv4 } from "uuid";

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
  FileCopy,
  Visibility,
} from "@material-ui/icons";
import firebase from "../firebase";
import { auth } from "../auth";
import { percentValid } from "./validate";

import { Fr, En, I18n } from "./I18n";
import { firebaseToJSObject } from "../utils/misc";

import SimpleModal from "./SimpleModal";

class Submissions extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      records: {},
      deleteModalOpen: false,
      publishModalOpen: false,
      modalKey: "",
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
          .child(user.uid)
          .child("records")
          .on("value", (records) =>
            this.setState({ records: records.toJSON(), loading: false })
          );
      }
    });
  }

  componentWillUnmount() {
    if (this.unsubscribe) this.unsubscribe();
  }

  editRecord(key) {
    const { match, history } = this.props;
    const { language, region } = match.params;

    history.push(`/${language}/${region}/new/${key}`);
  }

  // eslint-disable-next-line class-methods-use-this
  submitRecord(key) {
    const { match } = this.props;
    const { region } = match.params;

    if (auth.currentUser && key) {
      firebase
        .database()
        .ref(region)
        .child("users")
        .child(auth.currentUser.uid)
        .child("records")
        .child(key)
        .child("status")
        .set("submitted");
    }
  }

  cloneRecord(key) {
    const { match } = this.props;
    const { region } = match.params;

    if (auth.currentUser) {
      const recordsRef = firebase
        .database()
        .ref(region)
        .child("users")
        .child(auth.currentUser.uid)
        .child("records");

      recordsRef.child(key).once("value", (recordFirebase) => {
        const record = recordFirebase.toJSON();

        // reset record details
        record.recordID = "";
        record.status = "";
        record.identifier = uuidv4();
        record.created = new Date().toISOString();

        recordsRef.push(record);
      });
    }
  }

  // eslint-disable-next-line class-methods-use-this
  deleteRecord(key) {
    const { match } = this.props;
    const { region } = match.params;

    if (auth.currentUser) {
      firebase
        .database()
        .ref(region)
        .child("users")
        .child(auth.currentUser.uid)
        .child("records")
        .child(key)
        .remove();
    }
  }

  toggleModal(modalName, state, key = "") {
    this.setState({ modalKey: key, [modalName]: state });
  }

  render() {
    const { match } = this.props;
    const { language } = match.params;
    const {
      deleteModalOpen,
      modalKey,
      publishModalOpen,
      records,
      loading,
    } = this.state;
    return (
      <div>
        <SimpleModal
          open={deleteModalOpen}
          onClose={() => this.toggleModal("deleteModalOpen", false)}
          onAccept={() => this.deleteRecord(modalKey)}
          aria-labelledby="simple-modal-title"
          aria-describedby="simple-modal-description"
        />
        <SimpleModal
          open={publishModalOpen}
          onClose={() => this.toggleModal("publishModalOpen", false)}
          onAccept={() => this.submitRecord(modalKey)}
          aria-labelledby="simple-modal-title"
          aria-describedby="simple-modal-description"
        />

        <Typography variant="h5">
          <En>Saved Records</En>
          <Fr>Enregistrements enregistrés</Fr>
        </Typography>
        {loading ? (
          <CircularProgress />
        ) : (
          <span>
            {records && Object.keys(records).length ? (
              <div>
                <Typography>
                  <En>
                    These are the records you have submitted. To submit a record
                    for review, click the "Submit for review" button. The record
                    won't be published until the reviewer approves it. You
                    cannot submit a record until all the required fields are
                    filled out.
                  </En>
                  <Fr>
                    Ce sont les documents que vous avez soumis. Pour soumettre
                    un enregistrement pour examen, cliquez sur le bouton «
                    Soumettre pour révision ». L'enregistrement ne sera pas
                    publié tant que le réviseur ne l'aura pas approuvé. Vous ne
                    pouvez pas soumettre un enregistrement tant que tous les
                    champs requis ne sont pas remplis.
                  </Fr>
                </Typography>
                <List>
                  {Object.entries(records).map(([key, recordFireBase]) => {
                    const record = firebaseToJSObject(recordFireBase);

                    const disabled =
                      record.status === "submitted" ||
                      record.status === "published";
                    const percentValidInt = Math.round(
                      percentValid(record) * 100
                    );
                    const recordIsComplete = percentValidInt === 100;

                    return (
                      <ListItem key={key}>
                        <ListItemAvatar>
                          <Avatar>
                            <Description />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <div style={{ width: "80%" }}>
                              {record.title[language]}
                            </div>
                          }
                          secondary={
                            record.created && (
                              <span>
                                <En>
                                  {`Created/Updated ${record.created} ${percentValidInt}% complete`}
                                </En>
                                <Fr>
                                  {`Créé/mis à jour ${record.created} ${percentValidInt}% Achevée`}
                                </Fr>
                              </span>
                            )
                          }
                        />
                        <ListItemSecondaryAction>
                          <Tooltip title={<I18n en="Clone" fr="Clone" />}>
                            <span>
                              <IconButton
                                onClick={() => this.cloneRecord(key)}
                                edge="end"
                                aria-label="clone"
                              >
                                <FileCopy />
                              </IconButton>
                            </span>
                          </Tooltip>
                          {disabled ? (
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
                                en={
                                  recordIsComplete
                                    ? "Submit for review"
                                    : "Can't submit incomplete record"
                                }
                                fr={
                                  recordIsComplete
                                    ? "Soumettre pour examen"
                                    : "Impossible de soumettre un enregistrement incomplet"
                                }
                              />
                            }
                          >
                            <span>
                              <IconButton
                                disabled={disabled || !recordIsComplete}
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
                <En>You don't have any saved records.</En>
                <Fr>Vous n'avez pas d'enregistrements enregistrés.</Fr>
              </Typography>
            )}
          </span>
        )}
      </div>
    );
  }
}

export default Submissions;
