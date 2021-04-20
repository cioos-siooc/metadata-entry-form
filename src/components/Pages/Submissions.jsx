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
  Button,
} from "@material-ui/core";

import {
  Delete,
  Edit,
  Publish,
  Description,
  FileCopy,
  Visibility,
  Add,
  Eject,
  CloudDownload,
  Code,
} from "@material-ui/icons";
import StatusChip from "../FormComponents/StatusChip";

import firebase from "../../firebase";
import { auth } from "../../auth";
import { percentValid } from "../../utils/validate";

import { Fr, En, I18n } from "../I18n";
import { firebaseToJSObject } from "../../utils/misc";
import LastEdited from "../FormComponents/LastEdited";
import SimpleModal from "../FormComponents/SimpleModal";

const WAF_URL = "https://pac-dev1.cioos.org/dev/metadata";
function openInNewTab(url) {
  const newWindow = window.open(url, "_blank", "noopener,noreferrer");
  if (newWindow) newWindow.opener = null;
}
class Submissions extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      records: {},
      deleteModalOpen: false,
      submitModalOpen: false,
      withdrawModalOpen: false,
      modalKey: "",
      modalRecord: null,
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
      } else {
        this.setState({ loading: false });
      }
    });
  }

  static getRecordFilename(record) {
    return `${record.title[record.language].slice(
      0,
      30
    )}_${record.identifier.slice(0, 5)}`
      .trim()
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, "_");
  }

  componentWillUnmount() {
    if (this.unsubscribe) this.unsubscribe();
  }

  editRecord(key) {
    const { match, history } = this.props;
    const { language, region } = match.params;
    const { currentUser } = auth;
    history.push(`/${language}/${region}/${currentUser.uid}/${key}`);
  }

  submitRecord(key, record) {
    const { match } = this.props;
    const { region } = match.params;

    if (auth.currentUser && key) {
      const recordRef = firebase
        .database()
        .ref(region)
        .child("users")
        .child(auth.currentUser.uid)
        .child("records")
        .child(key);

      recordRef.child("status").set("submitted");

      if (record && !record.filename) {
        const filename = Submissions.getRecordFilename(record);
        recordRef.child("filename").set(filename);
      }
    }
  }

  // Make record a draft again
  // eslint-disable-next-line class-methods-use-this
  withdrawRecord(key) {
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
        .set("");
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
        record.lastEditedBy = {};
        record.created = new Date().toISOString();
        record.filename = "";
        record.timeFirstPublished = "";

        if (record.title.en) record.title.en = `${record.title.en} (Copy)`;
        if (record.title.fr) record.title.fr = `${record.title.fr} (Copte)`;
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

  toggleModal(modalName, state, key = "", record = null) {
    this.setState({ modalKey: key, [modalName]: state, modalRecord: record });
  }

  render() {
    const { match, history } = this.props;

    const { language, region } = match.params;

    const {
      deleteModalOpen,
      withdrawModalOpen,
      modalKey,
      modalRecord,
      submitModalOpen,
      records,
      loading,
    } = this.state;

    const recordDateSort = (a, b) =>
      new Date(b[1].created) - new Date(a[1].created);

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
          open={submitModalOpen}
          onClose={() => this.toggleModal("submitModalOpen", false)}
          onAccept={() => this.submitRecord(modalKey, modalRecord)}
          aria-labelledby="simple-modal-title"
          aria-describedby="simple-modal-description"
        />
        <SimpleModal
          open={withdrawModalOpen}
          onClose={() => this.toggleModal("withdrawModalOpen", false)}
          onAccept={() => this.withdrawRecord(modalKey)}
          aria-labelledby="simple-modal-title"
          aria-describedby="simple-modal-description"
        />

        <Typography variant="h5">
          <En>My Records</En>
          <Fr>Mes dossiers</Fr>
        </Typography>

        {loading ? (
          <CircularProgress />
        ) : (
          <span>
            <div>
              <Typography>
                <En>
                  These are the records you have submitted. To submit a record
                  for review, click the "Submit for review" button. The record
                  won't be published until the reviewer approves it. You cannot
                  submit a record until all the required fields are filled out.
                </En>
                <Fr>
                  Ce sont les documents que vous avez soumis. Pour soumettre un
                  enregistrement pour examen, cliquez sur le bouton « Soumettre
                  pour révision ». L'enregistrement ne sera pas publié tant que
                  le réviseur ne l'aura pas approuvé. Vous ne pouvez pas
                  soumettre un enregistrement tant que tous les champs requis ne
                  sont pas remplis.
                </Fr>
              </Typography>

              <div style={{ marginTop: "10px" }}>
                <Button
                  startIcon={<Add />}
                  onClick={() => history.push(`/${language}/${region}/new`)}
                >
                  <I18n en="New Record" fr="Nouvel enregistrement" />
                </Button>
              </div>

              <List>
                {Object.entries(records || {})
                  .sort(recordDateSort)
                  .map(([key, recordFireBase]) => {
                    const record = firebaseToJSObject(recordFireBase);
                    const { status, title, created } = record;

                    if (!title || (!title.en && !title.fr)) return null;

                    const submitted = status === "submitted";
                    const published = status === "published";

                    const percentValidInt = Math.round(
                      percentValid(record) * 100
                    );
                    const recordIsComplete = percentValidInt === 100;
                    let submitTooltip = {
                      en: "Submit for review",
                      fr: "Soumettre pour examen",
                    };
                    const withdrawTooltip = {
                      en: "Return record to draft for editing",
                      fr:
                        "Retourner l'enregistrement au brouillon pour modification",
                    };

                    if (!recordIsComplete)
                      submitTooltip = {
                        en: "Can't submit incomplete record",
                        fr:
                          "Impossible de soumettre un enregistrement incomplet",
                      };
                    else if (status === "submitted" || status === "published")
                      submitTooltip = {
                        en: "Record has been submitted",
                        fr: "L'enregistrement a été soumis",
                      };
                    const recordTitleShortened = `${record.title[
                      language
                    ].slice(0, 30)}_${record.identifier.slice(0, 5)}`
                      .trim()
                      .toLowerCase()
                      .replace(/[^a-zA-Z0-9]/g, "_");

                    let wafPath = `${WAF_URL}/${region}`;
                    if (status !== "published") wafPath += "/unpublished";
                    const recordURLXML = `${wafPath}/${recordTitleShortened}.xml`;
                    const recordURLERDDAP = `${wafPath}/${recordTitleShortened}_erddap.txt`;

                    return (
                      <ListItem
                        key={key}
                        button
                        onClick={() => this.editRecord(key)}
                      >
                        <ListItemAvatar>
                          <Avatar>
                            <Description />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <div style={{ width: "60%" }}>
                              {title[language]} <StatusChip status={status} />
                            </div>
                          }
                          secondary={
                            created && (
                              <span>
                                <LastEdited dateStr={created} />
                                <En>{percentValidInt}% complete</En>
                                <Fr>{percentValidInt}% Achevée</Fr>
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
                          {published ? (
                            <Tooltip title={<I18n en="View" fr="Vue" />}>
                              <span>
                                <IconButton
                                  onClick={() => this.editRecord(key)}
                                  edge="end"
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
                                >
                                  <Edit />
                                </IconButton>
                              </span>
                            </Tooltip>
                          )}
                          <Tooltip title={<I18n en="Delete" fr="Supprimer" />}>
                            <span>
                              <IconButton
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
                                en={submitTooltip.en}
                                fr={submitTooltip.fr}
                              />
                            }
                          >
                            <span>
                              <IconButton
                                disabled={
                                  submitted || published || !recordIsComplete
                                }
                                onClick={() =>
                                  this.toggleModal(
                                    "submitModalOpen",
                                    true,
                                    key,
                                    record
                                  )
                                }
                                edge="end"
                                aria-label="delete"
                              >
                                <Publish />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip
                            title={
                              <I18n
                                en={withdrawTooltip.en}
                                fr={withdrawTooltip.fr}
                              />
                            }
                          >
                            <span>
                              <IconButton
                                disabled={!status}
                                onClick={() =>
                                  this.toggleModal(
                                    "withdrawModalOpen",
                                    true,
                                    key
                                  )
                                }
                                edge="end"
                                aria-label="delete"
                              >
                                <Eject />
                              </IconButton>
                            </span>
                          </Tooltip>
                          {/* <Tooltip
                            title={
                              <I18n en="Download XML" fr="Télécharger XML" />
                            }
                          >
                            <span>
                              <IconButton
                                disabled={!status}
                                onClick={() => openInNewTab(recordURLXML)}
                                edge="end"
                                aria-label="delete"
                              >
                                <CloudDownload />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip
                            title={
                              <I18n
                                en="Download ERDDAP snippet"
                                fr={"Télécharger l'extrait ERDDAP"}
                              />
                            }
                          >
                            <span>
                              <IconButton
                                disabled={!status}
                                onClick={() => openInNewTab(recordURLERDDAP)}
                                edge="end"
                                aria-label="delete"
                              >
                                <Code />
                              </IconButton>
                            </span>
                          </Tooltip> */}
                        </ListItemSecondaryAction>
                      </ListItem>
                    );
                  })}
              </List>
            </div>

            {!records && (
              <Typography>
                <En>You don't have any records.</En>
                <Fr>Vous n'avez pas d'enregistrements.</Fr>
              </Typography>
            )}
          </span>
        )}
      </div>
    );
  }
}

export default Submissions;
