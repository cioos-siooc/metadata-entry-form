/* eslint-disable react/jsx-props-no-spreading */
import React from "react";
import {
  Box,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  getDatabase,
  ref,
  child,
  onValue,
  update,
  push,
} from "firebase/database";

import FormClassTemplate from "./FormClassTemplate";
import { I18n } from "../I18n";
import NotFound from "./NotFound";

import SimpleModal from "../FormComponents/SimpleModal";
import StartTab from "../Tabs/StartTab";
import ContactTab from "../Tabs/ContactTab";
import ResourcesTab from "../Tabs/ResourcesTab";
import IdentificationTab from "../Tabs/IdentificationTab";
import PlatformTab from "../Tabs/PlatformTab";
import SpatialTab from "../Tabs/SpatialTab";
import SubmitTab from "../Tabs/SubmitTab";
import TaxaTab from "../Tabs/TaxaTab";

import FormShell from "../FormShell/FormShell";
import FormShellSections from "../FormShell/useFormSections";

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

import { getBlankRecord } from "../../utils/blankRecord";
import performUpdateDraftDoi from "../../utils/doiUpdate";

function SectionSwitcher({ sections, activeSection, render }) {
  return (
    <Box>
      {sections.map((section) =>
        section.id === activeSection ? (
          <Box
            key={section.id}
            role="tabpanel"
            id={`section-panel-${section.id}`}
          >
            {render(section.id)}
          </Box>
        ) : null
      )}
    </Box>
  );
}

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

        this.setState({
          projects: await getRegionProjects(region),
          loggedInUserID: user.uid,
        });
        let editorInfo;
        // get info of the person openeing the record
        const editorDataRef = child(
          ref(database, `${region}/users`),
          loggedInUserID
        );
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

        // get instruments
        const editorInstrumentsRef = child(editorDataRef, "instruments");

        onValue(editorInstrumentsRef, (instrumentsFB) => {
          const userInstruments = instrumentsFB.toJSON();
          Object.entries(userInstruments || {}).forEach(([k, v]) => {
            // eslint-disable-next-line no-param-reassign
            v.instrumentID = k;
          });
          this.setState({ userInstruments });
        });
        this.listenerRefs.push(editorInstrumentsRef);

        // get platforms
        const editorPlatformsRef = child(editorDataRef, "platforms");

        onValue(editorPlatformsRef, (platformsFB) => {
          const userPlatforms = platformsFB.toJSON();
          Object.entries(userPlatforms || {}).forEach(([k, v]) => {
            // eslint-disable-next-line no-param-reassign
            v.instrumentID = k;
          });
          this.setState({ userPlatforms });
        });
        this.listenerRefs.push(editorPlatformsRef);

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

            const loggedInUserIsSharedWith =
              record.sharedWith && record.sharedWith[loggedInUserID] === true;

            const loggedInUserCanEditRecord =
              isReviewer || loggedInUserOwnsRecord || loggedInUserIsSharedWith;

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

    const contactsRef = ref(
      database,
      `${region}/users/${auth.currentUser.uid}/contacts`
    );

    // existing contact
    if (contactID) {
      update(child(contactsRef, contactID), contact);
      return contactID;
    }
    // new contact

    return push(contactsRef, contact).key;
  }

  async handleUpdateDraftDOI() {
    const { match } = this.props;
    const { region, language } = match.params;
    const { record } = this.state;
    const { datacitePrefix } = this.context;

    try {
      if (datacitePrefix && record.datasetIdentifier) {
        const statusCode = await performUpdateDraftDoi(
          record,
          region,
          language,
          datacitePrefix
        );

        if (statusCode === 200) {
          this.state.doiUpdated = true;
        } else {
          this.state.doiError = true;
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Error updating draft DOI: ", err);
      this.state.doiError = true;
      throw err;
    }
  }

  handleSaveUpdateInstrument(instrument) {
    const { id } = instrument;
    const { match } = this.props;

    const { region } = match.params;

    const database = getDatabase(firebase);
    const instrumentsRef = ref(
      database,
      `${region}/users/${auth.currentUser.uid}/instruments`
    );

    // existing instrument
    if (id) {
      update(child(instrumentsRef, id), instrument);
      return id;
    }
    // new instrument
    // eslint-disable-next-line no-debugger
    debugger;

    return push(instrumentsRef, instrument).key;
  }

  handleSaveUpdatePlatform(platform) {
    const { id } = platform;
    const { match } = this.props;

    const { region } = match.params;

    const database = getDatabase(firebase);
    const platformRef = ref(
      database,
      `${region}/users/${auth.currentUser.uid}/platforms`
    );

    // existing instrument
    if (id) {
      update(child(platformRef, id), platform);
      return id;
    }
    // new instrument

    return push(platformRef, platform).key;
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
    await this.handleUpdateDraftDOI();

    return submitRecord(region, recordUserID, recordID, "submitted", record);
  }

  // userOKedRecordDemotion - user has clicked that they understand that their record will be
  // changed from published to draft since the record is incomplete
  async handleSaveClick(userOKedRecordDemotion = false) {
    const { match, history } = this.props;
    const { language, region } = match.params;
    const userID = match.params.userID || auth.currentUser.uid;
    const database = getDatabase(firebase);

    const recordsRef = ref(database, `${region}/users/${userID}/records`);

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
      await update(
        child(recordsRef, record.recordID),
        // using blankRecord here in case there are new fields that the old record didn't have
        { ...getBlankRecord(), ...record }
      );
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

      regenerateXMLforRecord({ path, status, filename, region });
    }

    this.setState({ saveDisabled: true, savedSnackbarOpen: true });
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
      userInstruments,
      userPlatforms,
      tabIndex,
      record,
      saveDisabled,
      loading,
      highlightMissingRequireFields,
      loggedInUserCanEditRecord,
      saveIncompleteRecordModalOpen,
      projects,
      loggedInUserID,
    } = this.state;

    if (!record) {
      return <NotFound />;
    }

    const disabled = !loggedInUserCanEditRecord;

    const tabProps = {
      highlightMissingRequireFields,
      disabled,
      record,
      handleUpdateRecord: this.handleUpdateRecord,
      updateRecord: this.updateRecord,
      userID: loggedInUserID,
    };

    if (loading) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", p: 6 }}>
          <CircularProgress />
        </Box>
      );
    }

    const percentValidFraction = percentValid(record);
    const activeSection = tabIndex || "start";
    const saveButtonDisabled =
      saveDisabled || !(record.title?.en || record.title?.fr) || disabled;

    const renderSection = (sectionId) => {
      switch (sectionId) {
        case "start":
          return <StartTab {...tabProps} />;
        case "identification":
          return <IdentificationTab {...tabProps} projects={projects} />;
        case "taxa":
          return <TaxaTab {...tabProps} />;
        case "spatial":
          return <SpatialTab {...tabProps} />;
        case "contact":
          return (
            <ContactTab
              userContacts={userContacts}
              saveToContacts={(c) => this.saveUpdateContact(c)}
              {...tabProps}
            />
          );
        case "distribution":
          return <ResourcesTab {...tabProps} />;
        case "platform":
          return (
            <PlatformTab
              userInstruments={userInstruments}
              saveUpdateInstrument={(c) => this.handleSaveUpdateInstrument(c)}
              userPlatforms={userPlatforms}
              saveUpdatePlatform={(c) => this.handleSaveUpdatePlatform(c)}
              {...tabProps}
            />
          );
        case "submit":
          return (
            <SubmitTab
              {...tabProps}
              doiUpdated={this.state.doiUpdated}
              doiError={this.state.doiError}
              submitRecord={() => this.handleSubmitRecord()}
            />
          );
        default:
          return null;
      }
    };

    return (
      <FormShellWrapper
        record={record}
        language={language}
        loggedInUserCanEditRecord={loggedInUserCanEditRecord}
        activeSection={activeSection}
        onSectionChange={(id) => this.setState({ tabIndex: id })}
        dirty={!saveDisabled}
        saving={false}
        saveDisabled={saveButtonDisabled}
        onSave={() => this.handleSaveClick()}
        isReviewer={isReviewer}
        overflowActions={[]}
        renderSection={renderSection}
        modal={
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
        }
        savedSnackbarOpen={this.state.savedSnackbarOpen}
        onCloseSavedSnackbar={() =>
          this.setState({ savedSnackbarOpen: false })
        }
        percentValidFraction={percentValidFraction}
      />
    );
  }
}
MetadataForm.contextType = UserContext;

// Bridge between the class component and the FormShell hook-based UI.
function FormShellWrapper({
  record,
  language,
  loggedInUserCanEditRecord,
  activeSection,
  onSectionChange,
  dirty,
  saving,
  saveDisabled,
  onSave,
  isReviewer,
  overflowActions,
  renderSection,
  modal,
  savedSnackbarOpen,
  onCloseSavedSnackbar,
  percentValidFraction,
}) {
  const sections = FormShellSections({
    record,
    language,
    loggedInUserCanEditRecord,
  });

  const title = (language && record.title?.[language]) || "";

  return (
    <>
      {modal}
      <FormShell
        sections={sections}
        activeSection={activeSection}
        onSectionChange={onSectionChange}
        headerProps={{
          title,
          status: record.status,
          lastEditedDate: record.created,
          lastEditedBy: record.lastEditedBy,
          isReviewer,
          dirty,
          saving,
          saveDisabled,
          onSave,
          overflowActions,
          percentValid: percentValidFraction,
          language,
        }}
        actionBarProps={{
          dirty,
          saving,
          saveDisabled,
          onSave,
        }}
      >
        <SectionSwitcher
          sections={sections}
          activeSection={activeSection}
          render={renderSection}
        />
      </FormShell>
      <Snackbar
        open={Boolean(savedSnackbarOpen)}
        autoHideDuration={2500}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        onClose={onCloseSavedSnackbar}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={onCloseSavedSnackbar}
        >
          <I18n en="Saved" fr="Enregistré" />
        </Alert>
      </Snackbar>
    </>
  );
}

// Wrapper component to provide router params and navigate to the class component
const MetadataFormWrapper = (props) => {
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Create a match-like object for compatibility
  const match = {
    params,
    url: location.pathname,
  };

  return <MetadataForm {...props} match={match} history={{ push: navigate }} />;
};

export default MetadataFormWrapper;
