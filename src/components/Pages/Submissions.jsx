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
  FileCopy,
  Visibility,
  Add,
  Eject,
  // CloudDownload,
  // Code,
} from "@material-ui/icons";
import StatusChip from "../FormComponents/StatusChip";

import firebase from "../../firebase";
import { auth } from "../../auth";
import { percentValid } from "../../utils/validate";

import { Fr, En, I18n } from "../I18n";
import { firebaseToJSObject } from "../../utils/misc";
import LastEdited from "../FormComponents/LastEdited";
import SimpleModal from "../FormComponents/SimpleModal";

import regions from "../../regions";
import RecordStatusIcon from "../FormComponents/RecordStatusIcon";

// const WAF_URL = "https://pac-dev1.cioos.org/dev/metadata";
// function openInNewTab(url) {
//   const newWindow = window.open(url, "_blank", "noopener,noreferrer");
//   if (newWindow) newWindow.opener = null;
// }
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
  async componentDidUpdate(prevProps) {
    // check for region change
    if (this.props.match.params.region !== prevProps.match.params.region) {
      this.loadRecords();
    }
  }

  async loadRecords() {
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

  async componentDidMount() {
    this.loadRecords();
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
          <I18n>
            <En>My Records</En>
            <Fr>Mes dossiers</Fr>
          </I18n>
        </Typography>

        {loading ? (
          <CircularProgress />
        ) : (
          <span>
            <div>
              <Typography>
                <I18n>
                  <En>
                    To start a new record, click on "New Record" and begin
                    adding information. To continue working on a record, select
                    it from the list below. Once your record is completed and
                    information has been provided for all mandatory fields, you
                    can submit your record for review by clicking the "Submit
                    for review" icon to the right of your record title. The
                    record will not be published until it is reviewed and
                    approved by {regions[region].title[language]} staff.
                  </En>
                  <Fr>
                    Afin de soumettre vos métadonnées, cliquez sur « Nouvel
                    enregistrement » et ajoutez-y les informations demandées. Si
                    vous désirez reprendre la saisie d’un formulaire déjà
                    entamé, sélectionnez-le dans la liste ci-dessous. Lorsque
                    les informations sont saisies pour tous les champs
                    obligatoires, vous pouvez soumettre vos métadonnées pour
                    validation en cliquant sur l’icône « soumettre pour
                    validation ». Vos métadonnées seront publiées lorsqu’elles
                    auront été validées et approuvées par un professionel du{" "}
                    {regions[region].title[language]}.
                  </Fr>
                </I18n>
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
                    // const recordTitleShortened = `${record.title[
                    //   language
                    // ].slice(0, 30)}_${record.identifier.slice(0, 5)}`
                    //   .trim()
                    //   .toLowerCase()
                    //   .replace(/[^a-zA-Z0-9]/g, "_");

                    // let wafPath = `${WAF_URL}/${region}`;
                    // if (status !== "published") wafPath += "/unpublished";
                    // const recordURLXML = `${wafPath}/${recordTitleShortened}.xml`;
                    // const recordURLERDDAP = `${wafPath}/${recordTitleShortened}_erddap.txt`;

                    return (
                      <ListItem
                        key={key}
                        button
                        onClick={() => this.editRecord(key)}
                      >
                        <ListItemAvatar>
                          <Avatar>
                            <RecordStatusIcon status={record.status} />
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
                                <I18n>
                                  <En>{percentValidInt}% complete</En>
                                  <Fr>{percentValidInt}% Achevée</Fr>
                                </I18n>
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
                <I18n>
                  <En>You don't have any records.</En>
                  <Fr>Vous n'avez pas d'historique de saisie.</Fr>
                </I18n>
              </Typography>
            )}
          </span>
        )}
      </div>
    );
  }
}

export default Submissions;
