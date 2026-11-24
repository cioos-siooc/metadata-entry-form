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

import InstrumentEditor from "./InstrumentEditor";
import { EditorPage } from "../Layout/Page";
import FormClassTemplate from "../Pages/FormClassTemplate";

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

    const database = getDatabase(firebase);
    this.instrumentsRef = ref(
      database,
      `${region}/users/${auth.currentUser.uid}/instruments`,
    );
  }

  async componentDidMount() {
    const { instrumentID } = this.props;

    if (auth.currentUser && instrumentID) {
      this.setState({ instrumentID });
      const instrumentRef = child(this.instrumentsRef, instrumentID);
      onValue(instrumentRef, (instrument) =>
        this.setState(instrument.toJSON()),
      );
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
    if (instrumentID)
      update(child(this.instrumentsRef, instrumentID), this.state);
    // create
    else push(this.instrumentsRef, this.state);

    navigate(`/${language}/${region}/instruments`);
  }

  render() {
    const lang = this.props.language;
    return (
      <EditorPage
        title={
          this.state.id ||
          (lang === "fr" ? "Nouvel instrument" : "New instrument")
        }
        backTo={`/${lang}/${this.props.region}/instruments`}
        backLabel={lang === "fr" ? "Instruments" : "Instruments"}
        onSave={() => this.handleSubmitClick()}
        onCancel={() => this.handleCancelClick()}
        saveDisabled={!this.state.id}
        saveHint={
          lang === "fr"
            ? "Ajoutez l'identifiant de l'instrument pour enregistrer."
            : "Add an instrument ID to save."
        }
      >
        <InstrumentEditor
          value={this.state}
          handleClear={(key) => this.handleClear(key)}
          updateInstrumentEvent={(key) => this.handleChange(key)}
        />
      </EditorPage>
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
