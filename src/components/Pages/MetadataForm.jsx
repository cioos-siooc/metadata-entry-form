/* eslint-disable react/jsx-props-no-spreading */
import React from "react";
import {
  Box,
  CircularProgress,
  Grid,
  Tab,
  Tabs,
  Fab,
  Tooltip,
  Typography,
  LinearProgress,
} from "@material-ui/core";
import { withStyles } from "@material-ui/core/styles";
import { Save } from "@material-ui/icons";
import { withRouter } from "react-router-dom";
import { getDatabase, ref, child, onValue, update, push } from "firebase/database";

import FormClassTemplate from "./FormClassTemplate";
import { I18n, En, Fr } from "../I18n";
import StatusChip from "../FormComponents/StatusChip";
import LastEdited from "../FormComponents/LastEdited";
import NotFound from "./NotFound";

import SimpleModal from "../FormComponents/SimpleModal";
import StartTab from "../Tabs/StartTab";
import ContactTab from "../Tabs/ContactTab";
import ResourcesTab from "../Tabs/ResourcesTab";
import IdentificationTab from "../Tabs/IdentificationTab";
import PlatformTab from "../Tabs/PlatformTab";
import SpatialTab from "../Tabs/SpatialTab";
import SubmitTab from "../Tabs/SubmitTab";
import TaxaTab from "../Tabs/TaxaTab"

import { auth, getAuth, onAuthStateChanged } from "../../auth";
import firebase from "../../firebase";
import { firebaseToJSObject, trimStringsInObject } from "../../utils/misc";
import {
  submitRecord,
  getRegionProjects,
  standardizeRecord,
} from "../../utils/firebaseRecordFunctions";
import { UserContext } from "../../providers/UserProvider";
import { percentValid } from "../../utils/validate";
import tabs from "../../utils/tabs";

import { getBlankRecord } from "../../utils/blankRecord";
import performUpdateDraftDoi from "../../utils/doiUpdate";

const LinearProgressWithLabel = ({ value }) => (
  <Tooltip
    title={
      <I18n
        en="Percentage of required fields filled in"
        fr="Pourcentage de champs obligatoires remplis"
      />
    }
  >
    <Box display="flex" width="90%" style={{ margin: "auto" }}>
      <Box width="100%" mr={1}>
        <LinearProgress
          variant="determinate"
          value={value}
          style={{ marginLeft: "-30px" }}
        />
      </Box>
      <Box minWidth={35}>
        <Typography variant="body2" color="textSecondary">{`${Math.round(
          value
        )}%`}</Typography>
      </Box>
    </Box>
  </Tooltip>
);

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

const styles = (theme) => ({
  tabRoot: {
    minWidth: "115px",
  },
  fab: {
    position: "fixed",
    bottom: theme.spacing(2),
    right: theme.spacing(2),
  },
});


class MetadataForm extends FormClassTemplate {

  constructor(props) {
    super(props);

    this.state = {
      projects: [],
      record: getBlankRecord(),

      // contacts saved by user (not the ones saved in the record)
      // kept in firebase object format instead of array
      userContacts: {},

      // UI state:
      loading: false,
      tabIndex: "start",

      // whether the 'save' icon button is greyed out or not
      saveDisabled: true,

      highlightMissingRequireFields: false,

      editorInfo: { email: "", displayName: "" },
      loggedInUserCanEditRecord: false,
      saveIncompleteRecordModalOpen: false,
      doiUpdated: false,
      doiError: false,
    };
  }

  componentDidMount() {
    const { match } = this.props;
    this.setState({ loading: true });
    const database = getDatabase(firebase);

    this.unsubscribe = onAuthStateChanged(getAuth(firebase), async (user) => {
      if (user) {
        const { region, recordID } = match.params;
        const isNewRecord = match.url.endsWith("new");
        // could be viewer or reviewer
        const loggedInUserID = user.uid;
        const recordUserID = isNewRecord ? loggedInUserID : match.params.userID;
        const loggedInUserOwnsRecord = loggedInUserID === recordUserID;
        const { isReviewer } = this.context;

        this.setState({ projects: await getRegionProjects(region) });
        let editorInfo;
        // get info of the person openeing the record
        const editorDataRef = child(ref(database, `${region}/users`), loggedInUserID);
        const userinfoRef = child(editorDataRef, "userinfo");
        onValue(userinfoRef, (userinfo) => {
          editorInfo = userinfo.toJSON();

          this.setState({ editorInfo });
        });
        this.listenerRefs.push(userinfoRef);

        // get info of the original author of record
        const userDataRef = ref(database, `${region}/users/${recordUserID}`);

        // get contacts
        const editorContactsRef = child(editorDataRef, "contacts");

        onValue(editorContactsRef, (contactsFB) => {
          const userContacts = contactsFB.toJSON();
          Object.entries(userContacts || {}).forEach(([k, v]) => {
            // eslint-disable-next-line no-param-reassign
            v.contactID = k;
          });
          this.setState({ userContacts });
        });
        this.listenerRefs.push(editorContactsRef);

        // if recordID is set then the user is editing an existing record
        if (isNewRecord) {
          this.setState({ loading: false, loggedInUserCanEditRecord: true });
        } else {
          const recRef = child(userDataRef, `records/${recordID}`);
          onValue(recRef, (recordFireBase) => {
            // Record not found, eg a bad link
            const recordFireBaseObj = recordFireBase.toJSON();
            if (!recordFireBaseObj) {
              this.setState({ loading: false, record: null });

              return;
            }
            const record = firebaseToJSObject(recordFireBaseObj);

            const loggedInUserCanEditRecord =
              isReviewer || loggedInUserOwnsRecord;

            this.setState({
              record: standardizeRecord(record, null, null, recordID),
              loggedInUserCanEditRecord,
            });

            this.setState({ loading: false });
          });
          this.listenerRefs.push(recRef);
        }
      }
    });



  }

  toggleModal = (modalName, state, key = "", userID) => {
    this.setState({ modalKey: key, [modalName]: state, modalUserID: userID });
  };

  // genereric handler for updating state, used by most form components
  // generic event handler
  handleUpdateRecord = (key) => (event) => {
    const { value } = event.target;
    const changes = { [key]: value };

    this.setState(({ record }) => ({
      record: { ...record, ...changes },
      saveDisabled: false,
    }));
  };

  // a second genereric handler components that dont use onChange
  // generic state updater creator
  updateRecord = (key) => (value) => {
    const changes = { [key]: value };
    this.setState(({ record }) => ({
      record: { ...record, ...changes },
      saveDisabled: false,
    }));
  };

  saveUpdateContact(contact) {
    const { contactID } = contact;
    const { match } = this.props;
    const { region } = match.params;
    const database = getDatabase(firebase);

    const contactsRef = ref(database, `${region}/users/${auth.currentUser.uid}/contacts`);

    // existing contact
    if (contactID) {
      update(child(contactsRef, contactID), contact);
      return contactID;
    }
    // new contact

    return push(contactsRef, contact).getKey();
  }

  async handleUpdateDraftDOI() {
    const { match } = this.props;
    const { region, language } = match.params;
    const { record} = this.state;
    const { datacitePrefix, dataciteAuthHash } = this.context;

    try {
      if (datacitePrefix && dataciteAuthHash){
        const statusCode = await performUpdateDraftDoi(record, region, language, datacitePrefix, dataciteAuthHash);

      if (statusCode === 200) {
        this.state.doiUpdated = true
      } else {
        this.state.doiError = true
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error updating draft DOI: ', err);
      this.state.doiError = true
      throw err;
    }
  }

  async handleSubmitRecord() {
    const { match } = this.props;
    const { region, userID } = match.params;
    const isNewRecord = match.url.endsWith("new");
    const { record } = this.state;
    
    // Bit of logic here to decide if this is a user submitting their own form
    // or a reviewer submitting it
    const loggedInUserID = auth.currentUser.uid;
    const recordUserID = isNewRecord ? loggedInUserID : userID;

    const recordID = await this.handleSaveClick();
    await this.handleUpdateDraftDOI()

    return submitRecord(region, recordUserID, recordID, "submitted", record);
  }

  // userOKedRecordDemotion - user has clicked that they understand that their record will be
  // changed from published to draft since the record is incomplete
  async handleSaveClick(userOKedRecordDemotion = false) {
    const { match, history } = this.props;
    const { language, region } = match.params;
    const userID = match.params.userID || auth.currentUser.uid;
    const database = getDatabase(firebase);

    const recordsRef = ref(database,`${region}/users/${userID}/records`);

    // remove userContacts since they get saved elsewhere
    const { editorInfo } = this.state;

    // trim whitespace from all srtings in record
    const record = trimStringsInObject(this.state.record);

    // record doesn't have required fieds filled
    const recordIsComplete = percentValid(record) === 1;

    if (record.status === "published" && !recordIsComplete) {
      // if userOKedRecordDemotion is set, user has acknowledge that record will be demoted to draft
      if (userOKedRecordDemotion) {
        record.status = "";
      } else {
        // display warning modal
        this.toggleModal("saveIncompleteRecordModalOpen", true);

        return;
      }
    }
    // created is really "last updated"
    record.created = new Date().toISOString();

    // having userID down here makes it easier to transfer records
    record.userID = userID;

    record.region = region;

    record.lastEditedBy = editorInfo;
    let recordID;
    if (record.recordID) {
      recordID = record.recordID;
      await update(child(recordsRef,record.recordID),
        // using blankRecord here in case there are new fields that the old record didn't have
        { ...getBlankRecord(), ...record });
    } else {
      // new record
      const newNode = await push(recordsRef, record);

      // cheesy workaround to the issue of push() not saving dates
      await update(newNode, record);
      recordID = newNode.key;
      this.setState({
        record: { ...record, recordID },
      });
      history.push(`/${language}/${region}/${userID}/${recordID}`);
    }

    // regnerate XML on save
    if (["submitted", "published"].includes(record.status)) {
      const { regenerateXMLforRecord } = this.context;

      const path = `${region}/${userID}/${recordID}`;
      const { status, filename } = record;

      regenerateXMLforRecord({ path, status, filename });
    }

    this.setState({ saveDisabled: true });
    // if (match.url.endsWith("new")) {
    // set the URL so its shareable
    // }
    // eslint-disable-next-line consistent-return
    return recordID;
  }

  render() {
    const { match } = this.props;
    const { language } = match.params;
    const { isReviewer } = this.context;

    const {
      userContacts,
      tabIndex,
      record,
      saveDisabled,
      loading,
      highlightMissingRequireFields,
      loggedInUserCanEditRecord,
      saveIncompleteRecordModalOpen,
      projects,
    } = this.state;

    if (!record) {
      return <NotFound />;
    }
    const { classes } = this.props;

    const disabled = !loggedInUserCanEditRecord;

    const tabProps = {
      highlightMissingRequireFields,
      disabled,
      record,
      handleUpdateRecord: this.handleUpdateRecord,
      updateRecord: this.updateRecord,
    };
    const percentValidInt = Math.round(percentValid(record) * 100);
    return loading ? (
      <CircularProgress />
    ) : (
      <Grid
        container
        direction="column"
        justifyContent="space-between"
        alignItems="stretch"
        spacing={3}
      >
        <SimpleModal
          open={saveIncompleteRecordModalOpen}
          modalQuestion={
            <I18n
              en="Record is missing required fields. Saving will demote it to draft. Do you want to do this?"
              fr="Il manque des champs obligatoires dans l'enregistrement. L'enregistrement le rétrogradera en brouillon. Est-ce que tu veux le faire ?"
            />
          }
          onClose={() => {
            this.toggleModal("saveIncompleteRecordModalOpen", false);
          }}
          onAccept={() => {
            this.handleSaveClick(true);
            this.toggleModal("saveIncompleteRecordModalOpen", false);
          }}
        />

        <Fab
          color="primary"
          aria-label="add"
          className={classes.fab}
          disabled={
            saveDisabled || !(record.title.en || record.title.fr) || disabled
          }
          onClick={() => this.handleSaveClick()}
        >
          <Tooltip
            placement="right-start"
            title={
              saveDisabled
                ? "Dataset needs a title before it can be saved"
                : "Save record."
            }
          >
            <span>
              <Save />
            </span>
          </Tooltip>
        </Fab>
        <Grid container spacing={2} direction="row" alignItems="center">
          <Grid item xs>
            <Tabs
              scrollButtons="auto"
              variant="fullWidth"
              value={tabIndex}
              onChange={(e, newValue) => this.setState({ tabIndex: newValue })}
              aria-label="simple tabs example"
            >
              <Tab
                fullWidth
                classes={{ root: classes.tabRoot }}
                label={tabs.start[language]}
                value="start"
              />
              <Tab
                fullWidth
                classes={{ root: classes.tabRoot }}
                label={tabs.dataID[language]}
                value="identification"
              />
              <Tab
                fullWidth
                classes={{ root: classes.tabRoot }}
                label={tabs.taxa[language]}
                value="taxa"
              /> 
              <Tab
                fullWidth
                classes={{ root: classes.tabRoot }}
                label={tabs.spatial[language]}
                value="spatial"
              />
              <Tab
                fullWidth
                classes={{ root: classes.tabRoot }}
                label="Contact"
                value="contact"
              />
              <Tab
                fullWidth
                classes={{ root: classes.tabRoot }}
                label={tabs.resources[language]}
                value="distribution"
              />
                {!(['model'].includes(record.metadataScope)) && (
                <Tab
                  fullWidth
                  classes={{ root: classes.tabRoot }}
                  label={tabs.platform[language]}
                  value="platform"
                />
              )}
              {loggedInUserCanEditRecord && (
                <Tab
                  fullWidth
                  classes={{ root: classes.tabRoot }}
                  label={<I18n en="Submit" fr="Soumettre" />}
                  value="submit"
                  disabled={
                    record.status === "submitted" ||
                    record.status === "published"
                  }
                />
              )}
            </Tabs>
            <div style={{ marginTop: "10px", textAlign: "center" }}>
              <Typography variant="h5">
                {(language && record.title?.[language]) || (
                  <I18n en="New Record" fr="Nouvel enregistrement" />
                )}{" "}
                <StatusChip status={record.status} />
              </Typography>
              <Typography component="div">
                <i>
                  <LastEdited dateStr={record.created} />
                  {record.lastEditedBy?.displayName && (
                    <>
                      <I18n>
                        <En>by </En>
                        <Fr>Par </Fr>
                      </I18n>
                      {record.lastEditedBy.displayName}{" "}
                      {isReviewer && record.lastEditedBy.email}
                    </>
                  )}
                </i>
                <LinearProgressWithLabel value={percentValidInt} />
              </Typography>
            </div>
          </Grid>
        </Grid>
        <TabPanel value={tabIndex} index="start">
          <StartTab {...tabProps} />
        </TabPanel>
        <TabPanel value={tabIndex} index="identification">
          <IdentificationTab {...tabProps} projects={projects} />
        </TabPanel>
        <TabPanel value={tabIndex} index="taxa">
            <TaxaTab {...tabProps} />
        </TabPanel>
        <TabPanel value={tabIndex} index="spatial">
          <SpatialTab {...tabProps} />
        </TabPanel>
        <TabPanel value={tabIndex} index="platform">
          <PlatformTab {...tabProps} />
        </TabPanel>
        <TabPanel value={tabIndex} index="distribution">
          <ResourcesTab {...tabProps} />
        </TabPanel>
        <TabPanel value={tabIndex} index="submit">
          <SubmitTab
            {...tabProps}
            doiUpdated={this.state.doiUpdated}
            doiError={this.state.doiError}
            submitRecord={() => this.handleSubmitRecord()}
          />
        </TabPanel>

        <TabPanel value={tabIndex} index="contact">
          {/* userContacts are the ones the user has saved, not necessarily part of the record */}
          <ContactTab
            userContacts={userContacts}
            saveToContacts={(c) => this.saveUpdateContact(c)}
            {...tabProps}
          />
        </TabPanel>
      </Grid>
    );
  }
}
MetadataForm.contextType = UserContext;
export default withStyles(styles)(withRouter(MetadataForm));
