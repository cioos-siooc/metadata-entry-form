import React from "react";
import { Typography, List, CircularProgress } from "@material-ui/core";
import firebase from "../../firebase";
import MetadataRecordListItem from "../FormComponents/MetadataRecordListItem";
import { auth } from "../../auth";
import { cloneRecord, loadRegionRecords } from "../../utils/firebaseFunctions";
import { Fr, En, I18n } from "../I18n";
import FormClassTemplate from "./FormClassTemplate";

class Published extends FormClassTemplate {
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

    this.unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const usersRef = firebase.database().ref(region).child("users");

        usersRef.on("value", (regionRecordsFB) => {
          const records = loadRegionRecords(regionRecordsFB, "published");
          this.setState({ records, loading: false });
        });
        this.listenerRefs.push(usersRef);
      }
    });
  }

  async componentDidMount() {
    this.loadRecords();
  }

  editRecord(key, userID) {
    const { match, history } = this.props;
    const { language, region } = match.params;
    history.push(`/${language}/${region}/${userID}/${key}`);
  }

  // user ID is that of the record owner, not the editor
  handleCloneRecord(recordID, sourceUserID) {
    const { match } = this.props;
    const { region } = match.params;

    if (auth.currentUser) {
      cloneRecord(recordID, sourceUserID, auth.currentUser.uid, region);
    }
  }

  render() {
    const { match } = this.props;
    const { language, region } = match.params;
    const { records, loading } = this.state;

    const recordDateSort = (a, b) =>
      new Date(b[1].created) - new Date(a[1].created);

    return (
      <div>
        <Typography variant="h5">
          <I18n>
            <En>Published Records</En>
            <Fr>Dossiers publiés</Fr>
          </I18n>
        </Typography>

        {loading ? (
          <CircularProgress />
        ) : (
          <span>
            <div>
              <Typography>
                <I18n>
                  <En>These are the published records in your region.</En>
                  <Fr>
                    Il s'agit des enregistrements publiés dans votre région.
                  </Fr>
                </I18n>
              </Typography>

              <List>
                {records &&
                  records.length &&
                  records
                    .sort(recordDateSort)
                    .filter((record) => record.status === "published")
                    .map((record) => {
                      const { title } = record;

                      if (!(title?.en || !title?.fr)) return null;

                      return (
                        <MetadataRecordListItem
                          record={record}
                          key={record.key}
                          language={language}
                          onViewClick={() =>
                            this.editRecord(record.key, record.userinfo?.userID)
                          }
                          showDeleteAction={false}
                          showUnSubmitAction={false}
                          showCloneAction
                          showAuthor
                          onCloneClick={() =>
                            this.handleCloneRecord(
                              record.key,
                              record.userinfo?.userID,
                              region
                            )
                          }
                        />
                      );
                    })}
              </List>
            </div>

            {!records && (
              <Typography>
                <I18n>
                  <En>There are no published records.</En>
                  <Fr>Il n'y a pas de documents publiés.</Fr>
                </I18n>
              </Typography>
            )}
          </span>
        )}
      </div>
    );
  }
}

export default Published;
