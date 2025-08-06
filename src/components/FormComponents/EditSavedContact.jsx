import React from "react";
import { withRouter } from "react-router-dom";
import { Grid, Button } from "@material-ui/core";
import { Save } from "@material-ui/icons";
import { getDatabase, ref, onValue, push, child, update } from "firebase/database";
import firebase from "../../firebase";
import { auth } from "../../auth";

import { En, Fr, I18n } from "../I18n";

import ContactEditor from "./ContactEditor";
import FormClassTemplate from "../Pages/FormClassTemplate";

class EditContact extends FormClassTemplate {
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
    const { match } = props;

    const { region } = match.params;

    const database = getDatabase(firebase);
    this.contactsRef = ref(database, `${region}/users/${auth.currentUser.uid}/contacts`);
  }

  async componentDidMount() {
    const { match } = this.props;

    const { contactID } = match.params;

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

  updateOrgFromRor() {
    return (payload) => {
      this.setState({
        orgRor: payload.id,
        orgName: payload.name,
        orgURL: payload.links.find(() => true) || "",
        orgCity: payload.addresses.find(() => true).city || "",
        orgCountry: payload.country.country_name,
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
    const { match, history } = this.props;
    const { language, region } = match.params;

    history.push(`/${language}/${region}/contacts`);
  }

  // Create or update contact
  async handleSubmitClick() {
    const { history, match } = this.props;

    const { region, language, contactID } = match.params;

    // update
    if (contactID) update(child(this.contactsRef, contactID), this.state);
    // create
    else push(this.contactsRef, this.state);

    history.push(`/${language}/${region}/contacts`);
  }

  render() {
    const { orgName, givenNames, lastName } = this.state;
    console.log("CONTACT ::: " ,this.state);
    const isFilledEnoughToSave = orgName || (givenNames && lastName);
    return (
      <Grid container direction="column" spacing={2}>
        <Grid item xs>
          <ContactEditor
            value={this.state}
            handleClear={(key) => this.handleClear(key)}
            updateContactEvent={(key) => this.handleChange(key)}
            updateContactRor={this.updateOrgFromRor()}
            updateContactOrcid={this.updateIndFromOrcid()}
          />
        </Grid>

        <Grid item xs>
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

export default withRouter(EditContact);
