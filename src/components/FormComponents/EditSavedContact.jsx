import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Grid, Button } from "@mui/material";
import { Save } from "@mui/icons-material";
import { getDatabase, ref, onValue, push, child, update } from "firebase/database";
import firebase from "../../firebase";
import { auth } from "../../auth";

import { En, Fr, I18n } from "../I18n";

import ContactEditor from "./ContactEditor";
import FormClassTemplate from "../Pages/FormClassTemplate";

class EditContactClass extends FormClassTemplate {
  constructor(props) {
    super(props);
    this.state = {
      orgRor: "",
      orgName: "",
      orgEmail: "",
      orgURL: "",
      orgAdress: "",
      orgCity: "",
      orgCountry: "",
      // ind = individual
      indOrcid: "",
      indPosition: "",
      indEmail: "",
      givenNames: "",
      lastName: "",
    };
    const { region } = props;

    const database = getDatabase(firebase);
    this.contactsRef = ref(database, `${region}/users/${auth.currentUser.uid}/contacts`);
  }

  async componentDidMount() {
    const { contactID } = this.props;

    if (auth.currentUser && contactID) {
      this.setState({ contactID });
      const contactRef = child(this.contactsRef, contactID);
      onValue(contactRef, (contact) => this.setState(contact.toJSON()));
      this.listenerRefs.push(contactRef);
    }
  }

  handleChange(key) {
    return (event) => {
      this.setState({ [key]: event.target.value });
    };
  }

  handleClear(key) {
    this.setState({ [key]: "" });
  }

  updateOrgFromRor(language) {
    return (payload) => {
      this.setState({
        orgRor: payload.id,
        orgName: payload.names.find((n) => n.lang === language)?.value || "",
        orgURL: payload.links.find((l) => l.type ==="website")?.value || "",
        orgCity: payload.locations.find((g) => g.geonames_details.name)?.geonames_details.name || "",
        orgCountry: payload.locations.find((g) => g.geonames_details.country_name)?.geonames_details.country_name || "",
      });
    };
  }

  updateIndFromOrcid() {
    return (payload) => {
      const { name, emails } = payload.person;
      const indEmail = emails.email.length > 0 ? emails.email[0].email : "";
      const lastName = name["family-name"] ? name["family-name"].value : "";

      this.setState({
        indOrcid: payload["orcid-identifier"].uri,
        givenNames: name["given-names"].value,
        indEmail,
        lastName,
      });
    };
  }

  handleCancelClick() {
    const { language, region, navigate } = this.props;
    navigate(`/${language}/${region}/contacts`);
  }

  // Create or update contact
  async handleSubmitClick() {
    const { region, language, contactID, navigate } = this.props;

    // update
    if (contactID) update(child(this.contactsRef, contactID), this.state);
    // create
    else push(this.contactsRef, this.state);

    navigate(`/${language}/${region}/contacts`);
  }

  render() {
    const { language } = this.props;
    const { orgName, givenNames, lastName } = this.state;
    const isFilledEnoughToSave = orgName || (givenNames && lastName);
    return (
      <Grid container direction="column" spacing={2}>
        <Grid >
          <ContactEditor
            value={this.state}
            handleClear={(key) => this.handleClear(key)}
            updateContactEvent={(key) => this.handleChange(key)}
            updateContactRor={this.updateOrgFromRor(language)}
            updateContactOrcid={this.updateIndFromOrcid()}
            language={language}
          />
        </Grid>

        <Grid >
          <Button
            startIcon={<Save />}
            variant="contained"
            color="primary"
            onClick={() => this.handleSubmitClick()}
            disabled={!isFilledEnoughToSave}
          >
            <I18n>
              <En>Save</En>
              <Fr>Enregistrer</Fr>
            </I18n>
          </Button>

          <Button
            style={{ marginLeft: "10px" }}
            variant="contained"
            color="secondary"
            onClick={() => this.handleCancelClick()}
          >
            <I18n>
              <En>Cancel</En>
              <Fr>Annuler</Fr>
            </I18n>
          </Button>
        </Grid>
      </Grid>
    );
  }
}

// Wrapper component to provide router params and navigate to the class component
const EditContact = () => {
  const { language, region, contactID } = useParams();
  const navigate = useNavigate();
  return (
    <EditContactClass
      language={language}
      region={region}
      contactID={contactID}
      navigate={navigate}
    />
  );
};

export default EditContact;
