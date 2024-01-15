import React from "react";
import { withRouter } from "react-router-dom";
import { Grid, Button } from "@material-ui/core";
import { Save } from "@material-ui/icons";
import firebase from "../../firebase";
import { auth } from "../../auth";

import { En, Fr, I18n } from "../I18n";

import PlatformEditor from "./PlatformEditor";
import FormClassTemplate from "../Pages/FormClassTemplate";

class EditPlatform extends FormClassTemplate {
  constructor(props) {
    super(props);
    this.state = {
      id: "",
      manufacturer: "",
      version: "",
      type: { en: "", fr: "" },
      description: { en: "", fr: "" },
    };
    const { match } = props;

    const { region } = match.params;

    this.platformsRef = firebase
      .database()
      .ref(region)
      .child("users")
      .child(auth.currentUser.uid)
      .child("platforms");
  }

  async componentDidMount() {
    const { match } = this.props;

    const { platformID } = match.params;

    if (auth.currentUser && platformID) {
      this.setState({ platformID });
      const platformRef = this.platformsRef.child(platformID);
      platformRef.on("value", (platform) => this.setState(platform.toJSON()));
      this.listenerRefs.push(platformRef);
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

  handleCancelClick() {
    const { match, history } = this.props;
    const { language, region } = match.params;

    history.push(`/${language}/${region}/platforms`);
  }

  // Create or update platform
  async handleSubmitClick() {
    const { history, match } = this.props;

    const { region, language, platformID } = match.params;

    // update
    if (platformID) this.platformsRef.child(platformID).update(this.state);
    // create
    else this.platformsRef.push(this.state);

    history.push(`/${language}/${region}/platforms`);
  }

  render() {
    return (
      <Grid container direction="column" spacing={2}>
        <Grid item xs>
          <PlatformEditor
            value={this.state}
            handleClear={(key) => this.handleClear(key)}
            updatePlatformEvent={(key) => this.handleChange(key)}
          />
        </Grid>

        <Grid item xs>
          <Button
            startIcon={<Save />}
            variant="contained"
            color="primary"
            onClick={() => this.handleSubmitClick()}
            disabled={!this.state.id}
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

export default withRouter(EditPlatform);
