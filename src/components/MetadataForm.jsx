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
import { I18n } from "./I18n";
import StatusChip from "./StatusChip";
import LastEdited from "./LastEdited";

import StartTab from "./FormComponents/StartTab";
import ContactTab from "./FormComponents/ContactTab";
import DistributionTab from "./FormComponents/DistributionTab";
import IdentificationTab from "./FormComponents/IdentificationTab";
import PlatformTab from "./FormComponents/PlatformTab";
import SpatialTab from "./FormComponents/SpatialTab";
import { auth } from "../auth";
import firebase from "../firebase";
import { firebaseToJSObject } from "../utils/misc";
import { UserContext } from "../providers/UserProvider";
import { percentValid } from "./validate";

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
        category: "",
        verticalExtentDirection: "",
        instrumentsWithoutPlatform: [],
        datasetIdentifier: "",
        noPlatform: false,
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
    };
  }

  componentDidMount() {
    const { match } = this.props;
    this.setState({ loading: true });

    this.unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const { region, recordID } = match.params;

        // either from the URL if its a record in review or from auth
        const userID = match.params.userID || user.uid;

        const userDataRef = firebase
          .database()
          .ref(region)
          .child("users")
          .child(userID);

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
            });
        }
      }
      this.setState({ loading: false });
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
    const { record } = this.state;
    record.created = new Date().toISOString();

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
