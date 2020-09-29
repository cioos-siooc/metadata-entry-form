import React from "react";
import firebase from "../firebase";
import { auth } from "../auth";

import { withRouter } from "react-router-dom";

import { I18n } from "./I18n";

import { Grid, Button } from "@material-ui/core";
import Contact from "./FormComponents/Contact";

class EditContact extends React.Component {
  state = {
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

  async componentDidMount() {
    const { recordID } = this.props.match.params;
    if (auth.currentUser && recordID) {
      this.dbRef = firebase
        .database()
        .ref(`test/users`)
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

  deleteRecord(key) {
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
    const baseURL = "/en";
    this.props.history.push(baseURL + "/contacts");
  }
  async handleSubmitClick() {
    if (this.dbRef) this.dbRef.off("value");
    const baseURL = "/en";

    const rootRef = firebase
      .database()
      .ref(`test/users`)
      .child(auth.currentUser.uid)
      .child("contacts");

    const { recordID, ...updateValues } = this.state;
    const record = { ...updateValues, created: new Date() };
    if (recordID) {
      await rootRef.child(recordID).update(record);
    } else {
      await rootRef.push(record);
      this.props.history.push(baseURL + "/contacts");
    }
    this.props.history.push(baseURL + "/contacts");
  }
  componentWillUnmount() {
    if (this.dbRef) this.dbRef.off("value");
  }
  // orgName, orgURL, orgAdress, orgCity, orgCountry
  render() {
    const isFilledEnoughToSave = this.state.orgName || this.state.indName;
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
          {this.state.recordID ? (
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
