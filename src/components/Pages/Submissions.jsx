import React from "react";

import { Typography, List, CircularProgress, Button } from "@material-ui/core";

import { Add } from "@material-ui/icons";
import { getDatabase, ref, onValue, off } from "firebase/database";
import FormClassTemplate from "./FormClassTemplate";
import firebase from "../../firebase";
import { auth, getAuth, onAuthStateChanged  }from "../../auth";


import { Fr, En, I18n } from "../I18n";
import {
  multipleFirebaseToJSObject,
  cloneRecord,
  deleteRecord,
  submitRecord,
  returnRecordToDraft,
} from "../../utils/firebaseRecordFunctions";
import SimpleModal from "../FormComponents/SimpleModal";

import regions from "../../regions";

import MetadataRecordListItem from "../FormComponents/MetadataRecordListItem";

class Submissions extends FormClassTemplate {
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

  async loadRecords() {
    this.setState({ loading: true });
    const { match } = this.props;
    const { region } = match.params;

    this.unsubscribe = onAuthStateChanged(getAuth(firebase), (user) => {
      if (user) {
        const database = getDatabase(firebase);
        const recordsRef = ref(database, `${region}/users/${user.uid}/records`);

        onValue(recordsRef, (records) => {
          const allUsersRecords = records.toJSON();

          this.setState({
            records: multipleFirebaseToJSObject(allUsersRecords),
            loading: false,
          });
        });

        this.listenerRefs.push(recordsRef);
      }
    });
  }

  componentWillUnmount() {
    // fixes error Can't perform a React state update on an unmounted component
    this.unsubscribeAndCloseListeners();
  }

  unsubscribeAndCloseListeners() {
    if (this.unsubscribe) this.unsubscribe();
    if (this.listenerRefs.length) {
      this.listenerRefs.forEach((refListener) => off(refListener));
    }
  }

  async componentDidMount() {
    this.loadRecords();
  }

  editRecord(key) {
    const { match, history } = this.props;
    const { language, region } = match.params;
    const { currentUser } = auth;
    history.push(`/${language}/${region}/${currentUser.uid}/${key}`);
  }

  handleSubmitRecord(key) {
    const { match } = this.props;
    const { region } = match.params;

    if (auth.currentUser && key) {
      return submitRecord(region, auth.currentUser.uid, key, "submitted");
    }
    return false;
  }

  // Make record a draft again
  withdrawRecord(key) {
    const { match } = this.props;
    const { region } = match.params;

    if (auth.currentUser && key) {
      return returnRecordToDraft(region, auth.currentUser.uid, key);
    }
    return false;
  }

  cloneRecord(recordID) {
    const { match } = this.props;
    const { region } = match.params;

    if (auth.currentUser) {
      cloneRecord(recordID, auth.currentUser.uid, auth.currentUser.uid, region);
    }
  }

  deleteRecord(key) {
    const { match } = this.props;
    const { region } = match.params;

    if (auth.currentUser) {
      return deleteRecord(region, auth.currentUser.uid, key);
    }
    return false;
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
          onAccept={() => this.handleSubmitRecord(modalKey, modalRecord)}
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
                  .map(([key, record]) => {
                    const { status, title } = record;

                    if (!(title?.en || !title?.fr)) return null;

                    return (
                      <MetadataRecordListItem
                        key={key}
                        record={record}
                        showCloneAction
                        onCloneClick={() => this.cloneRecord(key)}
                        showDeleteAction
                        onDeleteClick={() =>
                          this.toggleModal("deleteModalOpen", true, key)
                        }
                        showEditAction
                        showPercentComplete
                        onViewEditClick={() => this.editRecord(key)}
                        showSubmitAction
                        onSubmitClick={() => {
                          if (status === "")
                            this.toggleModal(
                              "submitModalOpen",
                              true,
                              key,
                              record
                            );
                          else this.toggleModal("withdrawModalOpen", true, key);
                        }}
                      />
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
