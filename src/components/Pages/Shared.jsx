import React from "react";

import { Typography, CircularProgress, List } from "@material-ui/core";
import { getDatabase, ref, onValue, get, off } from "firebase/database";
import { I18n, En, Fr } from "../I18n";
import FormClassTemplate from "./FormClassTemplate";
import firebase from "../../firebase";
import {
  multipleFirebaseToJSObject,

} from "../../utils/firebaseRecordFunctions";

import { getAuth, onAuthStateChanged } from "../../auth";

import MetadataRecordListItem from "../FormComponents/MetadataRecordListItem";

class Shared extends FormClassTemplate {
  constructor(props) {
    super(props);
    this.state = {
      sharedRecords: {},
      loading: false,
    };
    this.unsubscribe = null;
    this.listenerRefs = [];
  }

  async loadSharedRecords() {
    this.setState({ loading: true });
    const { match } = this.props;
    const { region } = match.params;
    const database = getDatabase();

    // Set up a listener for changes in authentication state
    this.unsubscribe = onAuthStateChanged(getAuth(firebase), async (user) => {
      if (user) {
        // Reference to the 'shares' node for the current user in the specified region
        const sharesRef = ref(database, `${region}/shares/${user.uid}`);
        this.listenerRefs.push(sharesRef);

        // Listen for changes in the shares data
        onValue(sharesRef, async (snapshot) => {
          // Snapshot of the user's shares
          const sharesSnapshot = snapshot.val();

          // Initialize an array to hold promises for fetching each shared record
          const recordsPromises = [];

          // Iterate over each shared record, organized by authorID under the user's ID
          Object.entries(sharesSnapshot || {}).forEach(([authorID, recordsByAuthor]) => {
            // Iterate over each recordID shared by this author
            Object.keys(recordsByAuthor || {}).forEach((recordID) => {
              // Construct the path to the actual record data based on its authorID and recordID
              const recordPath = `${region}/users/${authorID}/records/${recordID}`;
              const recordRef = ref(database, recordPath);
              // Fetch the record's details and store the promise in the array
              const recordPromise = get(recordRef).then((recordSnapshot) => {
                const recordDetails = recordSnapshot.val();
                if (recordDetails) {
                  // Return the complete record details, ensuring all data fields are included
                  return {
                    ...recordDetails, 
                    recordID,
                  };
                }
                throw new Error(`No details found for record ${recordID} by author ${authorID}`);
              });
              recordsPromises.push(recordPromise); // Collect the promise
            });
          });

          // Await the resolution of all record detail promises
          const records = await Promise.all(recordsPromises);
          // Accumulate the records into an object mapping record IDs to record details
          const sharedRecords = records.reduce((acc, record) => {
            acc[record.recordID] = record; // Map each record by its ID
            return acc;
          }, {});

          // Update the component state with the fetched shared records and set loading to false
          this.setState({
            sharedRecords: multipleFirebaseToJSObject(sharedRecords),
            loading: false,
          });
        });

        // Keep a reference to the listener to remove it when the component unmounts
        this.listenerRefs.push(sharesRef);
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
    this.loadSharedRecords();
  }

  editRecord(key, authorID) {
    const { match, history } = this.props;
    const { language, region } = match.params;
    history.push(`/${language}/${region}/${authorID}/${key}`);
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
              <Typography style={{ marginTop: "20px" }}>
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
                        onViewEditClick={() => this.editRecord(key, record.userID)}
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
