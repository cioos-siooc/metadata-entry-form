import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";
import { withRouter } from "react-router-dom";
import {
  Grid,
  Typography,
  Button,
  Paper,
  Tabs,
  Tab,
  CircularProgress,
  Box,
  Tooltip,
} from "@material-ui/core";
import { Save } from "@material-ui/icons";

import IdentificationTab from "./FormComponents/IdentificationTab";
import MetadataTab from "./FormComponents/MetadataTab";
import SpatialTab from "./FormComponents/SpatialTab";
import ContactTab from "./FormComponents/ContactTab";
import DistributionTab from "./FormComponents/DistributionTab";
import PlatformTab from "./FormComponents/PlatformTab";

import firebase from "../firebase";
import { auth } from "../auth";
import { En, Fr, I18n } from "./I18n";

const styles = {
  paper: {
    padding: "10px",
    margin: "20px",
  },
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
      title: { en: "", fr: "" },
      abstract: { en: "", fr: "" },
      map: { north: "", south: "", east: "", west: "", polygon: "" },
      id: "",
      eov: [],
      role: "",
      progress: "",
      distribution: [],
      dateStart: new Date(),
      // datePublished: new Date(),
      // dateRevised: new Date(),
      recordID: "",
      instruments: [],
      platformName: "",
      platformID: "",
      platformRole: "",
      platformDescription: "",
      language: "",
      license: "",
      contacts: [],
      status: "",
      comment: "",
      history: "",
      limitations: "",
      maintenance: "",
      created: new Date(),

      // contacts saved by user
      userContacts: {},

      // UI state:
      loading: false,
      tabIndex: "identification",
      // whether the 'save' icon button is greyed out or not
      saveDisabled: true,
    };
  }
  // genereric handler for updating state, used by most form components
  handleInputChange = (event) => {
    const { name, value } = event.target;
    const changes = { [name]: value, saveDisabled: false };

    this.setState(changes);
  };
  async handleSubmitClick() {
    const rootRef = firebase
      .database()
      .ref(`test/users`)
      .child(auth.currentUser.uid)
      .child("records");

    // remove userContacts since they get saved elsewhere
    const { userContacts, ...record } = this.state;
    if (record.recordID) {
      await rootRef.child(record.recordID).update(record);
    } else {
      const newNode = await rootRef.push(record);
      const recordID = newNode.key;
      this.setState({ recordID });
    }

    this.setState({ saveDisabled: true });
  }
  // converts firebase style arrays (key as index) to arrays. work on arrays nested in objects
  firebaseToJSObject(json) {
    Object.keys(json).forEach((key) => {
      if (typeof json[key] === "object" && Object.keys(json[key])[0] === "0") {
        json[key] = Object.entries(json[key]).map(([k, v]) => v);
      }
    });
  }
  componentDidMount() {
    this.setState({ loading: true });

    auth.onAuthStateChanged((user) => {
      const userDataRef = firebase.database().ref(`test/users`).child(user.uid);

      // get contacts
      userDataRef.child("contacts").on("value", (contacts) => {
        this.setState({ userContacts: contacts.toJSON() });
      });

      const { recordID } = this.props.match.params;

      // if recordID is set then the user is editing an existing record
      if (recordID) {
        userDataRef.child("records").on("value", (records) => {
          const recordsObj = records.toJSON();
          if (recordsObj && recordID && recordsObj[recordID]) {
            const thisRecord = recordsObj[recordID];
            this.firebaseToJSObject(thisRecord);
            this.setState({ recordID, ...thisRecord, loading: false });
          }
        });
      } else this.setState({ loading: false });
    });
  }

  render() {
    const disabled =
      this.state.status === "submitted" || this.state.status === "published";

    const tabProps = {
      disabled,
      record: this.state,
      handleInputChange: this.handleInputChange,
      paperClass: this.props.classes.paper,
    };

    return this.state.loading ? (
      <CircularProgress />
    ) : (
      <Grid
        container
        direction="column"
        justify="space-between"
        alignItems="stretch"
      >
        <Paper className={this.props.classes.paper}>
          <Typography variant="h3">
            <En>CIOOS Metadata Profile Intake Form</En>
            <Fr>Formulaire de réception des profils de métadonnées du CIOOS</Fr>
          </Typography>
          {disabled && (
            <Typography>
              <En>
                <b>
                  This form is locked because it has already been submitted.
                </b>
              </En>
              <Fr>
                <b>Ce formulaire est verrouillé car il a déjà été soumis.</b>
              </Fr>
            </Typography>
          )}
          <Typography>
            <En>
              Welcome to the CIOOS metadata profile generation form! Please fill
              out each field with as much detail as you can. Using this
              information we will create your metadata profile for the given
              dataset.
            </En>
            <Fr>
              Bienvenue sur le formulaire de génération de profils de
              métadonnées CIOOS ! Veuillez remplir sur chaque champ avec autant
              de détails que vous pouvez. Utilisation de cette informations que
              nous allons créer votre profil de métadonnées pour le jeu de
              données.
            </Fr>
          </Typography>
        </Paper>

        <Tabs
          value={this.state.tabIndex}
          onChange={(e, newValue) => this.setState({ tabIndex: newValue })}
          aria-label="simple tabs example"
        >
          <Tab label="Identification" value={"identification"} />
          <Tab
            label={<I18n en="Metadata" fr="Métadonnées" />}
            value={"metadata"}
          />
          identification
          <Tab label="Spatial" value={"spatial"} />
          <Tab label="Contact" value={"contact"} />
          <Tab label="Distribution" value={"distribution"} />
          <Tab
            label={<I18n en="Platform" fr="Plateforme" />}
            value={"platform"}
          />
        </Tabs>
        <Tooltip title={<I18n en="Edit" fr="Éditer" />}>
          <span>
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={() => this.handleSubmitClick()}
              style={{ width: "100px" }}
              startIcon={<Save />}
              disabled={
                this.state.saveDisabled ||
                !(this.state.title.en || this.state.title.fr)
              }
            >
              <I18n en="Save" fr="Enregistrer" />
            </Button>
          </span>
        </Tooltip>
        <TabPanel value={this.state.tabIndex} index={"identification"}>
          <IdentificationTab {...tabProps} />
        </TabPanel>
        <TabPanel value={this.state.tabIndex} index={"metadata"}>
          <MetadataTab {...tabProps} />
        </TabPanel>
        <TabPanel value={this.state.tabIndex} index={"spatial"}>
          <SpatialTab {...tabProps} />
        </TabPanel>
        <TabPanel value={this.state.tabIndex} index={"platform"}>
          <PlatformTab {...tabProps} />
        </TabPanel>
        <TabPanel value={this.state.tabIndex} index={"distribution"}>
          <DistributionTab {...tabProps} />
        </TabPanel>
        <TabPanel value={this.state.tabIndex} index={"contact"}>
          <ContactTab userContacts={this.state.userContacts} {...tabProps} />
        </TabPanel>
      </Grid>
    );
  }
}

export default withRouter(withStyles(styles)(MetadataForm));
