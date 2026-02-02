import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Grid, Button } from "@mui/material";
import { Save } from "@mui/icons-material";
import {child, getDatabase, onValue, ref, update, push} from "firebase/database";
import firebase from "../../firebase";
import { auth } from "../../auth";

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
    const { region } = props;

    const database = getDatabase(firebase)
    this.platformsRef = ref(database, `${region}/users/${auth.currentUser.uid}/platforms`);
  }

  async componentDidMount() {
    const { platformID } = this.props;

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
    const { language, region, navigate } = this.props;
    navigate(`/${language}/${region}/platforms`);
  }

  // Create or update platform
  async handleSubmitClick() {
    const { region, language, platformID, navigate } = this.props;

    // update
    if (platformID) update(child(this.platformsRef, platformID), this.state);
    // create
    else push(this.platformsRef, this.state);

    navigate(`/${language}/${region}/platforms`);
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

// Wrapper component to provide router params and navigate to the class component
const EditPlatform = () => {
  const { language, region, platformID } = useParams();
  const navigate = useNavigate();
  return (
    <EditPlatformClass
      language={language}
      region={region}
      platformID={platformID}
      navigate={navigate}
    />
  );
};

export default EditPlatform;
