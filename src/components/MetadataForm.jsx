/* eslint-disable react/jsx-props-no-spreading */
import {
  Box,
  CircularProgress,
  Grid,
  Tab,
  Tabs,
  Fab,
  Checkbox,
  FormControlLabel,
} from "@material-ui/core";
import React, { Component } from "react";
import { Save } from "@material-ui/icons";
import { v4 as uuidv4 } from "uuid";
import { withRouter } from "react-router-dom";
import { I18n, En, Fr } from "./I18n";

import StartTab from "./FormComponents/StartTab";
import ContactTab from "./FormComponents/ContactTab";
import DistributionTab from "./FormComponents/DistributionTab";
import IdentificationTab from "./FormComponents/IdentificationTab";
import MetadataTab from "./FormComponents/MetadataTab";
import PlatformTab from "./FormComponents/PlatformTab";
import SpatialTab from "./FormComponents/SpatialTab";
import { auth } from "../auth";
import firebase from "../firebase";
import { firebaseToJSObject } from "../utils/misc";
import { validateField } from "./validate";

const paperClass = {
  padding: "10px",
  margin: "20px",
};
const paperClassError = {
  ...paperClass,
  borderColor: "red",
  borderStyle: "dotted",
};

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
class MetadataForm extends Component {
  constructor(props) {
    super(props);

    this.state = {
      record: {
        title: { en: "", fr: "" },
        abstract: { en: "", fr: "" },
        identifier: uuidv4(),
        keywords: { en: [], fr: [] },
        role: "",
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
        platformName: "",
        platformID: "",
        platformRole: "",
        platformDescription: "",
        platformAuthority: "",
        language: "",
        license: "",
        contacts: [],
        status: "",
        comment: "",
        history: "",
        limitations: "",
        maintenance: "",
        created: new Date(),
        category: "",
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

    this.unsubscribe = auth.onAuthStateChanged((user) => {
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
              loading: false,
            });
          });
      } else this.setState({ loading: false });
    });
  }

  componentWillUnmount() {
    // fixes error Can't perform a React state update on an unmounted component
    this.unsubscribe();
  }

  paperClassValidate = (fieldName) => {
    const { record, highlightMissingRequireFields } = this.state;

    if (!highlightMissingRequireFields) return paperClass;

    return validateField(record, fieldName) ? paperClass : paperClassError;
  };

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

    const recordsRef = firebase
      .database()
      .ref(region)
      .child("users")
      .child(auth.currentUser.uid)
      .child("records");

    // remove userContacts since they get saved elsewhere
    const { record } = this.state;

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
    const {
      userContacts,
      tabIndex,
      record,
      saveDisabled,
      loading,
      highlightMissingRequireFields,
    } = this.state;

    const disabled =
      record.status === "submitted" || record.status === "published";

    const tabProps = {
      highlightMissingRequireFields,
      disabled,
      record,
      handleInputChange: this.handleInputChange,
      paperClassValidate: this.paperClassValidate,
      paperClass,
    };
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
        <Fab
          color="primary"
          aria-label="add"
          style={{
            right: 20,
            bottom: 20,
            position: "fixed",
          }}
          disabled={
            saveDisabled || !(record.title.en || record.title.fr) || disabled
          }
          onClick={() => this.handleSubmitClick()}
        >
          <Save />
        </Fab>

        <Grid container spacing={2} direction="row" alignItems="center">
          {/* <Grid item xs>
            {formCompleteness * 100}
            {formIsComplete && "FOrm is Complete"}
          </Grid> */}
          <Grid item xs>
            <Tabs
              value={tabIndex}
              onChange={(e, newValue) => this.setState({ tabIndex: newValue })}
              aria-label="simple tabs example"
            >
              <Tab label="Start" value="start" />
              <Tab label="Identification" value="identification" />
              <Tab
                label={<I18n en="Metadata" fr="Métadonnées" />}
                value="metadata"
              />
              identification
              <Tab label="Spatial" value="spatial" />
              <Tab label="Contact" value="contact" />
              <Tab label="Distribution" value="distribution" />
              <Tab
                label={<I18n en="Platform" fr="Plateforme" />}
                value="platform"
              />
            </Tabs>
          </Grid>
          <Grid item xs>
            <FormControlLabel
              disabled={disabled}
              control={
                <Checkbox
                  checked={highlightMissingRequireFields}
                  onChange={() => {
                    this.setState({
                      highlightMissingRequireFields: !highlightMissingRequireFields,
                    });
                  }}
                />
              }
              label={
                <>
                  <En>
                    Highlight missing or incomplete fields that are required.
                  </En>
                  <Fr>
                    Mettez en surbrillance les champs manquants ou incomplets
                    requis.
                  </Fr>
                </>
              }
            />
          </Grid>
        </Grid>
        <TabPanel value={tabIndex} index="start">
          <StartTab {...tabProps} />
        </TabPanel>
        <TabPanel value={tabIndex} index="identification">
          <IdentificationTab {...tabProps} />
        </TabPanel>
        <TabPanel value={tabIndex} index="metadata">
          <MetadataTab {...tabProps} />
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

export default withRouter(MetadataForm);
