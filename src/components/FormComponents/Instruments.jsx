import React, { useState } from "react";
import { Add, Delete } from "@material-ui/icons";
import {
  TextField,
  Grid,
  Typography,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
} from "@material-ui/core";
import { En, Fr, I18n } from "../I18n";
import BilingualTextInput from "./BilingualTextInput";
import { deepCopy } from "../../utils/misc";

import RequiredMark from "./RequiredMark";
import InstrumentLeftList from "./InstrumentLeftList";

// Mock activeInstrument data
const activeInstrument = { id: '1', name: 'Instrument 1', email: 'contact1@example.com' };

const Instruments = ({
  updateInstruments,
  instruments = [],
  disabled,
  paperClass,
  saveUpdateInstrument,
  userInstruments,
}) => {
  const [activeInstrument, setActiveInstrument] = useState(0);

  function updateInstrumentField(key) {
    return (e) => {
      const instrumentsCopy = [...instruments];
      instrumentsCopy[activeInstrument][key] = e.target.value;
      updateInstruments(instrumentsCopy);
      console.log(instruments)
    };
  }
  function removeInstrument() {
    updateInstruments(
      instruments.filter((e, index) => index !== activeInstrument)
    );
    if (instruments.length) setActiveInstrument(instruments.length - 2);
  }

  const manufacturerLabel = <I18n en="Manufacturer" fr="Fabricant" />;
  const versionLabel = <I18n en="Version" fr="Version" />;
  const typeLabel = <I18n en="Type" fr="Type" />;
  const descriptionLabel = <I18n en="Description" fr="Description" />;

  const instrument = instruments.length > 0 && instruments[activeInstrument];

  return (
    <Grid container direction="row" style={{ marginLeft: "5px" }}>            
    <Grid item xs={5}>

    <InstrumentLeftList
              instruments={instruments}
              updateInstruments={updateInstruments}
              activeInstrument={activeInstrument}
              setActiveInstrument={setActiveInstrument}
              disabled={disabled}
              userInstruments={userInstruments}
              saveUpdateInstrument={saveUpdateInstrument}
              />
    </Grid>
      <Grid item xs>
        <Grid container direction="column">
          {instrument && (
            <Paper style={paperClass}>
              <Grid container direction="column" spacing={2}>
                <Grid item xs>
                  <I18n>
                    <En>Instrument ID</En>
                    <Fr>L'ID de l'instrument</Fr>
                  </I18n>
                  <RequiredMark passes={instrument.id} />
                  <TextField
                    label="ID"
                    value={instrument.id}
                    onChange={updateInstrumentField("id")}
                    fullWidth
                    disabled={disabled}
                  />
                </Grid>
                <Grid item xs>
                  <TextField
                    label={manufacturerLabel}
                    name="manufacturer"
                    value={instrument.manufacturer}
                    onChange={updateInstrumentField("manufacturer")}
                    fullWidth
                    disabled={disabled}
                  />{" "}
                </Grid>
                <Grid item xs>
                  <TextField
                    label={versionLabel}
                    value={instrument.version}
                    onChange={updateInstrumentField("version")}
                    fullWidth
                    disabled={disabled}
                  />
                </Grid>
                <Grid item xs>
                  <Typography>
                    <I18n>
                      <En>Instrument Type</En>
                      <Fr>Type d'instrument</Fr>
                    </I18n>
                  </Typography>
                  <BilingualTextInput
                    label={typeLabel}
                    value={instrument.type}
                    onChange={updateInstrumentField("type")}
                    disabled={disabled}
                  />
                </Grid>{" "}
                <Grid item xs>
                  <Typography>Description</Typography>
                  <BilingualTextInput
                    label={descriptionLabel}
                    value={instrument.description}
                    onChange={updateInstrumentField("description")}
                    disabled={disabled}
                  />
                </Grid>
                <Grid item xs>
                  <Button
                    startIcon={<Delete />}
                    disabled={disabled}
                    onClick={removeInstrument}
                  >
                    <I18n>
                      <En>Remove item</En>
                      <Fr>Supprimer l'instrument</Fr>
                    </I18n>
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Grid>
  );
};
export default Instruments;
