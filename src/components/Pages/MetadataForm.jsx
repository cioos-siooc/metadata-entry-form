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
} from "@mui/material";
import { withStyles } from "../../tss-cache";
import { Save } from "@mui/icons-material";
import { useParams, useNavigate, useLocation } from "react-router-dom";

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
import TaxaTab from "../Tabs/TaxaTab";

import { trimStringsInObject } from "../../utils/misc";
import {
  getRecord,
  createRecord,
  saveRecord,
  submitRecord,
  getRegionProjects,
} from "../../api/records";
import { contacts, platforms, instruments } from "../../api/entities";
import { ApiError } from "../../api/client";
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
          value,
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

const useStyles = (theme) => ({
  tabRoot: {
    minWidth: "115px",
  },
  fab: {
    position: "fixed",
    bottom: theme.spacing(2),
    right: theme.spacing(2),
    zIndex: 5,
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
    super.componentDidMount?.();
    this.loadData();
  }

  componentDidUpdate(prevProps) {
    super.componentDidUpdate(prevProps);
    // auth resolves asynchronously in UserProvider; load once the user appears
    const userID = this.context.user?.uid;
    if (userID && userID !== this.loadedForUserID) this.loadData();
  }

  async loadData() {
    const { match } = this.props;
    const user = this.context.user;
    if (!user) return;
    this.loadedForUserID = user.uid;

    const { region, recordID } = match.params;
    const isNewRecord = match.url.endsWith("new");
    const loggedInUserID = user.uid;
    const { isReviewer } = this.context;

    this.safeSetState({
      loading: true,
      loggedInUserID,
      editorInfo: { email: user.email, displayName: user.displayName },
    });

    const [projects] = await Promise.all([
      getRegionProjects(region),
      this.loadUserEntities(),
    ]);
    this.safeSetState({ projects });

    if (isNewRecord) {
      this.safeSetState({ loading: false, loggedInUserCanEditRecord: true });
      return;
    }

    try {
      const record = await getRecord(region, recordID);
      const loggedInUserOwnsRecord = record.userID === loggedInUserID;
      const loggedInUserIsSharedWith =
        record.sharedWith && record.sharedWith[loggedInUserID] === true;
      const loggedInUserCanEditRecord =
        isReviewer || loggedInUserOwnsRecord || loggedInUserIsSharedWith;

      this.safeSetState({
        record,
        loggedInUserCanEditRecord,
        loading: false,
      });
    } catch (err) {
      // Record not found, eg a bad link
      this.safeSetState({ loading: false, record: null });
    }
  }

  // saved contacts/instruments/platforms of the logged-in editor, keyed
  // objects with ids injected — the shape the tab components expect
  async loadUserEntities() {
    const { match } = this.props;
    const { region } = match.params;
    const loggedInUserID = this.context.user?.uid;
    if (!loggedInUserID) return;

    const [userContacts, userInstruments, userPlatforms] = await Promise.all([
      contacts.list(region, loggedInUserID),
      instruments.list(region, loggedInUserID),
      platforms.list(region, loggedInUserID),
    ]);
    Object.entries(userContacts || {}).forEach(([k, v]) => {
      v.contactID = k;
    });
    Object.entries(userInstruments || {}).forEach(([k, v]) => {
      v.instrumentID = k;
    });
    Object.entries(userPlatforms || {}).forEach(([k, v]) => {
      v.instrumentID = k;
    });
    this.safeSetState({ userContacts, userInstruments, userPlatforms });
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

  async saveUpdateContact(contact) {
    const { contactID } = contact;
    const { match } = this.props;
    const { region } = match.params;
    const loggedInUserID = this.context.user.uid;

    let id = contactID;
    if (contactID) {
      await contacts.update(region, loggedInUserID, contactID, contact);
    } else {
      id = await contacts.create(region, loggedInUserID, contact);
    }
    this.loadUserEntities();
    return id;
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
          datacitePrefix,
        );

        if (statusCode === 200) {
          this.state.doiUpdated = true;
        } else {
          this.state.doiError = true;
        }
      }
    } catch (err) {
      console.error("Error updating draft DOI: ", err);
      this.state.doiError = true;
      throw err;
    }
  }

  async handleSaveUpdateInstrument(instrument) {
    const { id } = instrument;
    const { match } = this.props;
    const { region } = match.params;
    const loggedInUserID = this.context.user.uid;

    let instrumentID = id;
    if (id) {
      await instruments.update(region, loggedInUserID, id, instrument);
    } else {
      instrumentID = await instruments.create(region, loggedInUserID, instrument);
    }
    this.loadUserEntities();
    return instrumentID;
  }

  async handleSaveUpdatePlatform(platform) {
    const { id } = platform;
    const { match } = this.props;
    const { region } = match.params;
    const loggedInUserID = this.context.user.uid;

    let platformID = id;
    if (id) {
      await platforms.update(region, loggedInUserID, id, platform);
    } else {
      platformID = await platforms.create(region, loggedInUserID, platform);
    }
    this.loadUserEntities();
    return platformID;
  }

  async handleSubmitRecord() {
    const { match } = this.props;
    const { region } = match.params;

    const recordID = await this.handleSaveClick();
    await this.handleUpdateDraftDOI();

    const updated = await submitRecord(region, recordID, "submitted");
    this.safeSetState(({ record }) => ({
      record: { ...record, status: updated.status, filename: updated.filename },
    }));
    return updated;
  }

  // userOKedRecordDemotion - user has clicked that they understand that their record will be
  // changed from published to draft since the record is incomplete
  async handleSaveClick(userOKedRecordDemotion = false) {
    const { match, history } = this.props;
    const { language, region } = match.params;
    const userID = match.params.userID || this.context.user.uid;

    const { editorInfo } = this.state;

    // trim whitespace from all strings in record
    const record = trimStringsInObject(this.state.record);

    // record doesn't have required fields filled
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

    record.region = region;
    record.lastEditedBy = editorInfo;

    let recordID;
    try {
      if (record.recordID) {
        recordID = record.recordID;
        const saved = await saveRecord(
          region,
          recordID,
          // using blankRecord here in case there are new fields that the old record didn't have
          { ...getBlankRecord(), ...record },
          { ifUnmodifiedSince: record.updatedAt },
        );
        this.safeSetState({ record: { ...record, updatedAt: saved.updatedAt } });
      } else {
        // new record
        const created = await createRecord(region, record);
        recordID = created.recordID;
        this.safeSetState({
          record: { ...record, recordID, updatedAt: created.updatedAt },
        });
        history.push(`/${language}/${region}/${userID}/${recordID}`);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        // eslint-disable-next-line no-alert
        alert(
          language === "fr"
            ? "Cet enregistrement a été modifié par quelqu'un d'autre. Rechargez la page pour voir la dernière version."
            : "This record was changed by someone else. Reload the page to see the latest version.",
        );
        return;
      }
      throw err;
    }

    // regenerate XML on save
    if (["submitted", "published"].includes(record.status)) {
      const { regenerateXMLforRecord } = this.context;
      regenerateXMLforRecord({ region, recordID });
    }

    this.safeSetState({ saveDisabled: true });

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
    const { classes } = this.props;

    const disabled = !loggedInUserCanEditRecord;

    const tabProps = {
      highlightMissingRequireFields,
      disabled,
      record,
      handleUpdateRecord: this.handleUpdateRecord,
      updateRecord: this.updateRecord,
      userID: loggedInUserID,
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
          <Grid size="grow">
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
              {!["model"].includes(record.metadataScopeIso) && (
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
          <PlatformTab
            userInstruments={userInstruments}
            saveUpdateInstrument={(c) => this.handleSaveUpdateInstrument(c)}
            userPlatforms={userPlatforms}
            saveUpdatePlatform={(c) => this.handleSaveUpdatePlatform(c)}
            {...tabProps}
          />
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

const StyledMetadataForm = withStyles(MetadataForm, useStyles);

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

  return (
    <StyledMetadataForm {...props} match={match} history={{ push: navigate }} />
  );
};

export default MetadataFormWrapper;
