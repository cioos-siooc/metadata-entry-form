import React from "react";
import { withRouter } from "react-router-dom";
import { Grid, Button } from "@material-ui/core";
import { Save } from "@material-ui/icons";
import {child, getDatabase, onValue, ref, update} from "firebase/database";
import firebase from "../../firebase";
import { auth } from "../../auth";

import { En, Fr, I18n } from "../I18n";

import InstrumentEditor from "./InstrumentEditor";
import FormClassTemplate from "../Pages/FormClassTemplate";
import { paperClass } from "./QuestionStyles";

class EditInstrument extends FormClassTemplate {
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

    const database = getDatabase(firebase)
    this.instrumentsRef = ref(database, `${region}/users/${auth.currentUser.uid}/instruments`)
  }

  async componentDidMount() {
    const { match } = this.props;

    const { instrumentID } = match.params;

    if (auth.currentUser && instrumentID) {
      this.setState({ instrumentID });
      const instrumentRef = child(this.instrumentsRef, instrumentID);
      onValue(instrumentRef, (instrument) => this.setState(instrument.toJSON()));
      this.listenerRefs.push(instrumentRef);
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

    history.push(`/${language}/${region}/instruments`);
  }

  // Create or update instrument
  async handleSubmitClick() {
    const { history, match } = this.props;

    const { region, language, instrumentID } = match.params;

    // update
    if (instrumentID) update(child(this.instrumentsRef, instrumentID), this.state);
    // create
    else this.instrumentsRef.push(this.state);

    history.push(`/${language}/${region}/instruments`);
  }

  render() {
    return (
      <Grid container direction="column" spacing={2}>
        <Grid item xs>
          <InstrumentEditor
            value={this.state}
            handleClear={(key) => this.handleClear(key)}
            updateInstrumentEvent={(key) => this.handleChange(key)}
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

export default withRouter(EditInstrument);
