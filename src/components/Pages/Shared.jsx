import React from "react";

import { Typography, CircularProgress, List } from "@material-ui/core";
import { I18n, En, Fr } from "../I18n";
import FormClassTemplate from "./FormClassTemplate";

import firebase from "../../firebase";
import { auth } from "../../auth";

import { multipleFirebaseToJSObject } from "../../utils/firebaseRecordFunctions";
import MetadataRecordListItem from "../FormComponents/MetadataRecordListItem";

class Shared extends FormClassTemplate {
  constructor(props) {
    super(props);
    this.state = {
      sharedRecords: {},
      loading: false,
    };
  }

  async loadSharedRecords() {
    this.setState({ loading: true });
    const { match } = this.props;
    const { region } = match.params;

    this.unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        const SharesRef = firebase
          .database()
          .ref(region)
          .child("shares")
          .child(user.uid);

        SharesRef.on("value", (records) => {
          const allUsersSharedRecords = records.toJSON();

          this.setState({
            sharedRecords: multipleFirebaseToJSObject(allUsersSharedRecords),
            loading: false,
          });
        });

        this.listenerRefs.push(SharesRef);
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
      this.listenerRefs.forEach((ref) => ref.off());
    }
  }

  async componentDidMount() {
    this.loadSharedRecords();
  }

  editRecord(key) {
    const { match, history } = this.props;
    const { language, region } = match.params;
    const { currentUser } = auth;
    history.push(`/${language}/${region}/${currentUser.uid}/${key}`);
  }

  render() {
    const { sharedRecords, loading } = this.state;

    const recordDateSort = (a, b) =>
      new Date(b[1].created) - new Date(a[1].created);

    return (
      <div>
        <Typography variant="h5">
          <I18n>
            <En>Shared with me</En>
            <Fr>Partagé avec moi</Fr>
          </I18n>
        </Typography>

        {loading ? (
          <CircularProgress />
        ) : (
          <span>
            <div>
              <Typography style={{ marginTop: "20px"}}>
                <I18n>
                  <En>
                    The following records have been shared with you for editing.
                  </En>
                  <Fr>
                    Les enregistrements suivants ont été partagés avec vous pour
                    modification.
                  </Fr>
                </I18n>
              </Typography>
              <Typography>
                <I18n>
                  <En>You can edit them, but you cannot submit or delete.</En>
                  <Fr>
                    Vous pouvez les modifier, mais vous ne pouvez pas les
                    soumettre ou les supprimer.
                  </Fr>
                </I18n>
              </Typography>
              <List>
                {Object.entries(sharedRecords || {})
                  .sort(recordDateSort)
                  .map(([key, record]) => {
                    const { title } = record;

                    if (!(title?.en || !title?.fr)) return null;

                    return (
                      <MetadataRecordListItem
                        key={key}
                        record={record}
                        showCloneAction
                        onCloneClick={() => this.cloneRecord(key)}
                        showEditAction
                        showPercentComplete
                        onViewEditClick={() => this.editRecord(key)}
                      />
                    );
                  })}
              </List>
            </div>
            {!sharedRecords && (
              <Typography>
                <I18n>
                  <En>You don't have any records shared with you.</En>
                  <Fr>Vous n'avez aucun enregistrement partagé avec vous.</Fr>
                </I18n>
              </Typography>
            )}
          </span>
        )}
      </div>
    );
  }
}

export default Shared;
