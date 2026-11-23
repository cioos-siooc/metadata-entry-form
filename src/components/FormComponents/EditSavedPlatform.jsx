import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  child,
  getDatabase,
  onValue,
  ref,
  update,
  push,
} from "firebase/database";
import firebase from "../../firebase";
import { auth } from "../../auth";

import PlatformEditor from "./PlatformEditor";
import { EditorPage } from "../Layout/Page";
import FormClassTemplate from "../Pages/FormClassTemplate";

class EditPlatformClass extends FormClassTemplate {
  constructor(props) {
    super(props);
    this.state = {
      id: "",
      type: "",
      description: { en: "", fr: "" },
    };
    const { region } = props;

    const database = getDatabase(firebase);
    this.platformsRef = ref(
      database,
      `${region}/users/${auth.currentUser.uid}/platforms`,
    );
  }

  async componentDidMount() {
    const { platformID } = this.props;

    if (auth.currentUser && platformID) {
      this.setState({ platformID });
      const platformRef = child(this.platformsRef, platformID);
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
    const lang = this.props.language;
    return (
      <EditorPage
        title={
          this.state.id ||
          (lang === "fr" ? "Nouvelle plateforme" : "New platform")
        }
        backTo={`/${lang}/${this.props.region}/platforms`}
        backLabel={lang === "fr" ? "Plateformes" : "Platforms"}
        onSave={() => this.handleSubmitClick()}
        onCancel={() => this.handleCancelClick()}
        saveDisabled={!this.state.id}
        saveHint={
          lang === "fr"
            ? "Ajoutez l'identifiant de la plateforme pour enregistrer."
            : "Add a platform ID to save."
        }
      >
        <PlatformEditor
          value={this.state}
          handleClear={(key) => this.handleClear(key)}
          updatePlatformEvent={(key) => this.handleChange(key)}
        />
      </EditorPage>
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
