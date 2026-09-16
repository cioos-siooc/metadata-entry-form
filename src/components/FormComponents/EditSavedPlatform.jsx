import React, { useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Grid, Button } from "@mui/material";
import { Save } from "@mui/icons-material";
import { platforms as platformsAPI } from "../../api/entities";
import { UserContext } from "../../providers/UserProvider";

import { En, Fr, I18n } from "../I18n";

import PlatformEditor from "./PlatformEditor";
import FormClassTemplate from "../Pages/FormClassTemplate";
import { paperClass } from "./QuestionStyles";

class EditPlatformClass extends FormClassTemplate {
  constructor(props) {
    super(props);
    this.state = {
      id: "",
      type: "",
      description: { en: "", fr: "" },
    };
  }

  componentDidMount() {
    this.loadData();
  }

  async loadData() {
    const { region, platformID, userID } = this.props;

    if (userID && platformID) {
      const platform = await platformsAPI.getOne(region, userID, platformID);
      if (platform) this.safeSetState(platform);
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
    navigate(`/${language}/${region}/platforms`);
  }

  // Create or update platform
  async handleSubmitClick() {
    const { region, language, platformID, userID, navigate } = this.props;

    // update
    if (platformID)
      await platformsAPI.update(region, userID, platformID, this.state);
    // create
    else await platformsAPI.create(region, userID, this.state);

    navigate(`/${language}/${region}/platforms`);
  }

  render() {
    return (
      <Grid container direction="column" spacing={2}>
        <Grid>
          <PlatformEditor
            value={this.state}
            handleClear={(key) => this.handleClear(key)}
            updatePlatformEvent={(key) => this.handleChange(key)}
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
const EditPlatform = () => {
  const { language, region, platformID } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  return (
    <EditPlatformClass
      language={language}
      region={region}
      platformID={platformID}
      userID={user?.uid}
      navigate={navigate}
    />
  );
};

export default EditPlatform;
