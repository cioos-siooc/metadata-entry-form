import React from "react";
import { withRouter } from "react-router-dom";
import { Grid, Button } from "@material-ui/core";
import { Save } from "@material-ui/icons";
import firebase from "../../firebase";
import { auth } from "../../auth";

import { En, Fr } from "../I18n";

import Contact from "./Contact";

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

    const { contactID, region } = match.params;

    if (auth.currentUser && contactID) {
      this.dbRef = firebase
        .database()
        .ref(region)
        .child("users")
        .child(auth.currentUser.uid)
        .child("contacts")
        .child(contactID);

      this.setState({ contactID });

      if (auth.currentUser) {
        this.dbRef.on("value", (contact) =>
          this.setState({ ...contact.toJSON() })
        );
      }
    }
  }

  componentWillUnmount() {
    if (this.dbRef) this.dbRef.off("value");
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

    await rootRef.push(this.state);
    history.push(`${baseURL}/contacts`);
  }

  render() {
    const { orgName, indName } = this.state;
    const isFilledEnoughToSave = orgName || indName;
    return (
      <Grid container direction="column" spacing={2}>
        <Grid item xs>
          <Contact value={this.state} onChange={(e) => this.handleChange(e)} />
        </Grid>

        <Grid item xs>
          <Button
            startIcon={<Save />}
            variant="contained"
            color="primary"
            onClick={() => this.handleSubmitClick()}
            disabled={!isFilledEnoughToSave}
          >
            <En>Save</En>
            <Fr>Enregistrer</Fr>
          </Button>

          <Button
            style={{ marginLeft: "10px" }}
            variant="contained"
            color="secondary"
            onClick={() => this.handleCancelClick()}
          >
            <En>Cancel</En>
            <Fr>Annuler</Fr>
          </Button>
        </Grid>
      </Grid>
    );
  }
}

export default withRouter(EditContact);
