import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Grid, Button } from "@mui/material";
import { Save } from "@mui/icons-material";
import {child, getDatabase, onValue, ref, update, push} from "firebase/database";
import firebase from "../../firebase";
import { auth } from "../../auth";

import { En, Fr, I18n } from "../I18n";

import InstrumentEditor from "./InstrumentEditor";
import FormClassTemplate from "../Pages/FormClassTemplate";
import { paperClass } from "./QuestionStyles";

class EditInstrumentClass extends FormClassTemplate {
  constructor(props) {
    super(props);
    this.state = {
      id: "",
      manufacturer: "",
      version: "",
      type: { en: "", fr: "" },
      description: { en: "", fr: "" },
    };
    const { region } = props;

    const database = getDatabase(firebase)
    this.instrumentsRef = ref(database, `${region}/users/${auth.currentUser.uid}/instruments`)
  }

  async componentDidMount() {
    const { instrumentID } = this.props;

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
    const { language, region, navigate } = this.props;
    navigate(`/${language}/${region}/instruments`);
  }

  // Create or update instrument
  async handleSubmitClick() {
    const { region, language, instrumentID, navigate } = this.props;

    // update
    if (instrumentID) update(child(this.instrumentsRef, instrumentID), this.state);
    // create
    else push(this.instrumentsRef, this.state);

    navigate(`/${language}/${region}/instruments`);
  }

  render() {
    return (
      <Grid container direction="column" spacing={2}>
        <Grid >
          <InstrumentEditor
            value={this.state}
            handleClear={(key) => this.handleClear(key)}
            updateInstrumentEvent={(key) => this.handleChange(key)}
            paperClass={paperClass}
          />
        </Grid>

        <Grid >
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

// Wrapper component to provide router params and navigate to the class component
const EditInstrument = () => {
  const { language, region, instrumentID } = useParams();
  const navigate = useNavigate();
  return (
    <EditInstrumentClass
      language={language}
      region={region}
      instrumentID={instrumentID}
      navigate={navigate}
    />
  );
};

export default EditInstrument;
