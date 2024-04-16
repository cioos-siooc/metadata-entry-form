import React from "react";
import { withRouter } from "react-router-dom";
import { Grid, Button } from "@material-ui/core";
import { Save } from "@material-ui/icons";
import {child, getDatabase, onValue, ref, update} from "firebase/database";
import firebase from "../../firebase";
import { auth } from "../../auth";

import { En, Fr, I18n } from "../I18n";

import PlatformEditor from "./PlatformEditor";
import FormClassTemplate from "../Pages/FormClassTemplate";
import { paperClass } from "./QuestionStyles";


class EditPlatform extends FormClassTemplate {
  constructor(props) {
    super(props);
    this.state = {
      id: "",
      type: { en: "", fr: "" },
      description: { en: "", fr: "" },
    };
    const { match } = props;

    const { region } = match.params;

    const database = getDatabase(firebase)
    this.platformsRef = ref(database, `${region}/users/${auth.currentUser.uid}/platforms`);
  }

  async componentDidMount() {
    const { match } = this.props;

    const { platformID } = match.params;

    if (auth.currentUser && platformID) {
      this.setState({ platformID });
      const platformRef = child(this.platformsRef, (platformID));
      onValue(platformRef, (platform) => this.setState(platform.toJSON()));
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
    if (platformID) update(child(this.platformsRef, platformID), this.state);
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
            paperClass={paperClass}
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
