/* eslint-disable react/jsx-props-no-spreading */
import React, { Component } from "react";
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
import { v4 as uuidv4 } from "uuid";
import { withRouter } from "react-router-dom";
import { I18n, En, Fr } from "../I18n";
import StatusChip from "../FormComponents/StatusChip";
import LastEdited from "../FormComponents/LastEdited";

import StartTab from "../Tabs/StartTab";
import ContactTab from "../Tabs/ContactTab";
import DistributionTab from "../Tabs/DistributionTab";
import IdentificationTab from "../Tabs/IdentificationTab";
import PlatformTab from "../Tabs/PlatformTab";
import SpatialTab from "../Tabs/SpatialTab";
import SubmitTab from "../Tabs/SubmitTab";

import { auth } from "../../auth";
import firebase from "../../firebase";
import { firebaseToJSObject } from "../../utils/misc";
import { UserContext } from "../../providers/UserProvider";
import { percentValid } from "../../utils/validate";

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

const styles = () => ({
  tabRoot: {
    minWidth: "115px",
  },
});
class MetadataForm extends Component {
  constructor(props) {
    super(props);

    this.state = {
      record: {
        title: { en: "", fr: "" },
        abstract: { en: "", fr: "" },
        identifier: uuidv4(),
        keywords: { en: [], fr: [] },
        eov: [],
        progress: "",
        distribution: [],
        dateStart: null,
        map: { north: "", south: "", east: "", west: "", polygon: "" },

        verticalExtentMin: "",
        verticalExtentMax: "",
        datePublished: null,
        dateRevised: null,
        recordID: "",
        instruments: [],
        platformID: "",
        platformDescription: "",
        language: "",
        license: "",
        contacts: [],
        status: "",
        comment: "",
        history: "",
        limitations: "",
        created: new Date().toISOString(),
        lastEditedBy: {},
        category: "",
        verticalExtentDirection: "",
        datasetIdentifier: "",
        noPlatform: false,
        filename: "",
        organization: "",
      },

      // contacts saved by user (not the ones saved in the record)
      // kept in firebase object format instead of array
      userContacts: {},

      // UI state:
      loading: false,
      tabIndex: "start",

      // whether the 'save' icon button is greyed out or not
      saveDisabled: true,

      highlightMissingRequireFields: false,

      userinfo: { email: "", displayName: "" },
      editorInfo: { email: "", displayName: "" },
    };
  }

  componentDidMount() {
    const { match } = this.props;
    this.setState({ loading: true });

    this.unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const { region, recordID } = match.params;

        // get info of the person openeing the record
        firebase
          .database()
          .ref(region)
          .child("users")
          .child(user.uid)
          .child("userinfo")
          .on("value", (userinfo) => {
            this.setState({ editorInfo: userinfo.toJSON() });
          });

        // either from the URL if its a record in review or from auth
        const recordLoadedFromURL = Boolean(match.params.userID);

        const userID = match.params.userID || user.uid;

        // get info of the original author of record
        const userDataRef = firebase
          .database()
          .ref(region)
          .child("users")
          .child(userID);

        if (recordLoadedFromURL)
          userDataRef.child("userinfo").on("value", (userinfo) => {
            this.setState({ userinfo: userinfo.toJSON() });
          });

        // get contacts
        userDataRef.child("contacts").on("value", (contacts) => {
          this.setState({ userContacts: contacts.toJSON() });
        });

        // if recordID is set then the user is editing an existing record
        if (userID && recordID) {
          userDataRef
            .child("records")
            .child(recordID)
            .on("value", (recordFireBase) => {
              const record = firebaseToJSObject(recordFireBase.toJSON());
              this.setState({
                record: { ...record, recordID },
              });
              this.setState({ loading: false });
            });
        } else {
          this.setState({ loading: false });
        }
      }
    });
  }

  componentWillUnmount() {
    // fixes error Can't perform a React state update on an unmounted component
    if (this.unsubscribe) this.unsubscribe();
  }

  // genereric handler for updating state, used by most form components
  handleInputChange = (event) => {
    const { name, value } = event.target;
    const changes = { [name]: value };

    this.setState(({ record }) => ({
      record: { ...record, ...changes },
      saveDisabled: false,
    }));
  };

  // eslint-disable-next-line class-methods-use-this
  async submitRecord() {
    const { match } = this.props;
    const { region } = match.params;
    const { record } = this.state;
    const { recordID } = record;

    if (auth.currentUser && recordID) {
      await firebase
        .database()
        .ref(region)
        .child("users")
        .child(auth.currentUser.uid)
        .child("records")
        .child(recordID)
        .child("status")
        .set("submitted");
    }
  }

  async handleSubmitClick() {
    const { match } = this.props;
    const { region } = match.params;

    const userID = match.params.userID || auth.currentUser.uid;

    const recordsRef = firebase
      .database()
      .ref(region)
      .child("users")
      .child(userID)
      .child("records");

    // remove userContacts since they get saved elsewhere
    const { record, editorInfo } = this.state;
    record.created = new Date().toISOString();
    console.log("editorInfo", editorInfo);
    // this.setState({ lastEditedBy: editorInfo });
    record.lastEditedBy = editorInfo;

    if (record.recordID) {
      await recordsRef.child(record.recordID).update(record);
    } else {
      const newNode = await recordsRef.push(record);

      // cheesy workaround to the issue of push() not saving dates
      await newNode.update(record);
      const recordID = newNode.key;
      this.setState({
        record: { ...record, recordID },
      });
    }

    this.setState({ saveDisabled: true });
  }

  render() {
    const { match } = this.props;
    const { language } = match.params;
    const { isReviewer } = this.context;

    const recordLoadedFromURL = Boolean(match.params.userID);

    const {
      userContacts,
      tabIndex,
      record,
      saveDisabled,
      loading,
      highlightMissingRequireFields,
    } = this.state;
    const { classes } = this.props;

    const disabled =
      (!isReviewer && record.status === "submitted") ||
      record.status === "published";

    const tabProps = {
      highlightMissingRequireFields,
      disabled,
      record,
      handleInputChange: this.handleInputChange,
    };
    const percentValidInt = Math.round(percentValid(record) * 100);

    return loading ? (
      <CircularProgress />
    ) : (
      <Grid
        container
        direction="column"
        justify="space-between"
        alignItems="stretch"
        spacing={3}
      >
        <Tooltip
          placement="left-start"
          title={
            saveDisabled
              ? "Dataset needs a title before it can be saved"
              : "Save record."
          }
        >
          <span>
            <Fab
              color="primary"
              aria-label="add"
              style={{
                right: 20,
                bottom: 20,
                position: "fixed",
              }}
              disabled={
                saveDisabled ||
                !(record.title.en || record.title.fr) ||
                disabled
              }
              onClick={() => this.handleSubmitClick()}
            >
              <Save />
            </Fab>
          </span>
        </Tooltip>
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
                label="Start"
                value="start"
              />
              <Tab
                fullWidth
                classes={{ root: classes.tabRoot }}
                label={
                  <I18n
                    en="Data Identification"
                    fr="Identification des données"
                  />
                }
                value="identification"
              />
              <Tab
                fullWidth
                classes={{ root: classes.tabRoot }}
                label="Spatial"
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
                label={<I18n en="Resources" fr="Ressources" />}
                value="distribution"
              />
              <Tab
                fullWidth
                classes={{ root: classes.tabRoot }}
                label={<I18n en="Platform" fr="Plateforme" />}
                value="platform"
              />
              <Tab
                fullWidth
                classes={{ root: classes.tabRoot }}
                label={<I18n en="Submit" fr="Soumettre" />}
                value="submit"
                disabled={
                  record.status === "submitted" || record.status === "published"
                }
              />
            </Tabs>
            <div style={{ marginTop: "10px", textAlign: "center" }}>
              <Typography variant="h5">
                {(language && record.title && record.title[language]) || (
                  <I18n en="New Record" fr="Nouveau Record" />
                )}{" "}
                <StatusChip status={record.status} />
              </Typography>
              <Typography component="div">
                <i>
                  <LastEdited dateStr={record.created} />
                  {record.lastEditedBy && record.lastEditedBy.displayName && (
                    <>
                      <En>by </En>
                      <Fr>par</Fr>
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
          <IdentificationTab {...tabProps} />
        </TabPanel>
        <TabPanel value={tabIndex} index="spatial">
          <SpatialTab {...tabProps} />
        </TabPanel>
        <TabPanel value={tabIndex} index="platform">
          <PlatformTab {...tabProps} />
        </TabPanel>
        <TabPanel value={tabIndex} index="distribution">
          <DistributionTab {...tabProps} />
        </TabPanel>
        <TabPanel value={tabIndex} index="submit">
          <SubmitTab {...tabProps} submitRecord={() => this.submitRecord()} />
        </TabPanel>
        <TabPanel value={tabIndex} index="contact">
          {/* userContacts are the ones the user has saved, not necessarily part of the record */}
          <ContactTab userContacts={userContacts} {...tabProps} />
        </TabPanel>
      </Grid>
    );
  }
}
MetadataForm.contextType = UserContext;
export default withStyles(styles)(withRouter(MetadataForm));
