import React from "react";
import { withRouter } from "react-router-dom";
import { Grid, Button } from "@material-ui/core";
import { Save } from "@material-ui/icons";
import firebase from "../../firebase";
import { auth } from "../../auth";

import { En, Fr, I18n } from "../I18n";

import ContactEditor from "./ContactEditor";
import FormClassTemplate from "../Pages/FormClassTemplate";

class EditContact extends FormClassTemplate {
  constructor(props) {
    super(props);
    this.state = {
      orgName: "",
      orgEmail: "",
      orgURL: "",
      orgAdress: "",
      orgCity: "",
      orgCountry: "",
      // ind = individual
      indName: "",
      indPosition: "",
      indEmail: "",
    };
    const { match } = this.props;

    const { region } = match.params;

    this.contactsRef = firebase
      .database()
      .ref(region)
      .child("users")
      .child(auth.currentUser.uid)
      .child("contacts");
  }

  async componentDidMount() {
    const { match } = this.props;

    const { contactID } = match.params;

    if (auth.currentUser && contactID) {
      this.setState({ contactID });

      this.contactsRef
        .child(contactID)
        .on("value", (contact) => this.setState(contact.toJSON()));
    }
  }

  handleChange(key) {
    return (event) => {
      this.setState({ [key]: event.target.value });
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
    if (contactID) this.contactsRef.child(contactID).update(this.state);
    // create
    else this.contactsRef.push(this.state);

    history.push(`/${language}/${region}/contacts`);
  }

  render() {
    const { orgName, indName } = this.state;
    const isFilledEnoughToSave = orgName || indName;
    return (
      <Grid container direction="column" spacing={2}>
        <Grid item xs>
          <ContactEditor
            value={this.state}
            updateContactEvent={(key) => this.handleChange(key)}
            // updateContact
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
