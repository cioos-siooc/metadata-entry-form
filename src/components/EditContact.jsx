import React from "react";
import { withRouter } from "react-router-dom";
import { Grid, Button } from "@material-ui/core";
import firebase from "../firebase";
import { auth } from "../auth";

import { I18n } from "./I18n";

import Contact from "./FormComponents/Contact";

class EditContact extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      orgName: "",
      orgEmail: "",
      orgURL: "",
      orgAdress: "",
      orgCity: "",
      orgCountry: "",
      indName: "",
      indPosition: "",
      indEmail: "",
    };
  }

  async componentDidMount() {
    const { match } = this.props;

    const { recordID, region } = match.params;

    if (auth.currentUser && recordID) {
      this.dbRef = firebase
        .database()
        .ref(region)
        .child("users")
        .child(auth.currentUser.uid)
        .child("contacts")
        .child(recordID);

      this.setState({ recordID });

      if (auth.currentUser) {
        this.dbRef.on("value", (record) =>
          this.setState({ ...record.toJSON() })
        );
      }
    }
  }

  componentWillUnmount() {
    if (this.dbRef) this.dbRef.off("value");
  }

  deleteRecord() {
    const { recordID } = this.state;

    if (auth.currentUser) {
      this.dbRef.remove(recordID);
    }
  }

  handleChange(event) {
    const { name, value } = event.target;

    this.setState({ [name]: value });
  }

  handleCancelClick() {
    const { match, history } = this.props;
    const { language, region } = match.params;

    history.push(`/${language}/${region}/contacts`);
  }

  async handleSubmitClick() {
    const { history, match } = this.props;

    const { region, language } = match.params;

    if (this.dbRef) this.dbRef.off("value");
    const baseURL = `/${language}/${region}`;

    const rootRef = firebase
      .database()
      .ref(region)
      .child("users")
      .child(auth.currentUser.uid)
      .child("contacts");

    const { recordID, ...updateValues } = this.state;
    const record = { ...updateValues, created: new Date() };
    if (recordID) {
      await rootRef.child(recordID).update(record);
    } else {
      await rootRef.push(record);
      history.push(`${baseURL}/contacts`);
    }
    history.push(`${baseURL}/contacts`);
  }

  // orgName, orgURL, orgAdress, orgCity, orgCountry
  render() {
    const { orgName, indName, recordID } = this.state;
    const isFilledEnoughToSave = orgName || indName;
    return (
      <Grid container>
        Edit contacts
        <Contact value={this.state} onChange={(e) => this.handleChange(e)} />
        <Button
          variant="contained"
          color="primary"
          onClick={() => this.handleSubmitClick()}
          disabled={!isFilledEnoughToSave}
        >
          {recordID ? (
            <I18n en="Update" fr="Mise à jour" />
          ) : (
            <I18n en="Submit" fr="Soumettre" />
          )}
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={() => this.handleCancelClick()}
        >
          <I18n en="Cancel" fr="Annuler" />
        </Button>
      </Grid>
    );
  }
}

export default withRouter(EditContact);
