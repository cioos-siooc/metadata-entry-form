import React, { useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Grid, Button } from "@mui/material";
import { Save } from "@mui/icons-material";
import { instruments as instrumentsAPI } from "../../api/entities";
import { UserContext } from "../../providers/UserProvider";

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
  }

  componentDidMount() {
    this.loadData();
  }

  async loadData() {
    const { region, instrumentID, userID } = this.props;

    if (userID && instrumentID) {
      const instrument = await instrumentsAPI.getOne(
        region,
        userID,
        instrumentID,
      );
      if (instrument) this.safeSetState(instrument);
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
    const { region, language, instrumentID, userID, navigate } = this.props;

    // update
    if (instrumentID)
      await instrumentsAPI.update(region, userID, instrumentID, this.state);
    // create
    else await instrumentsAPI.create(region, userID, this.state);

    navigate(`/${language}/${region}/instruments`);
  }

  render() {
    return (
      <Grid container direction="column" spacing={2}>
        <Grid>
          <InstrumentEditor
            value={this.state}
            handleClear={(key) => this.handleClear(key)}
            updateInstrumentEvent={(key) => this.handleChange(key)}
            paperClass={paperClass}
          />
        </Grid>

        <Grid>
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

// Wrapper component to provide router params, navigate, and the signed-in
// user's ID to the class component
const EditInstrument = () => {
  const { language, region, instrumentID } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  return (
    <EditInstrumentClass
      language={language}
      region={region}
      instrumentID={instrumentID}
      userID={user?.uid}
      navigate={navigate}
    />
  );
};

export default EditInstrument;
