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

const emptyInstrument = {
  id: "",
  manufacturer: "",
  version: "",
  type: { en: "", fr: "" },
  description: { en: "", fr: "" },
};

const Instruments = ({
  updateInstruments,
  instruments = [],
  disabled,
  paperClass,
}) => {
  const [activeInstrument, setActiveInstrument] = useState(0);

  function addInstrument() {
    updateInstruments(instruments.concat(deepCopy(emptyInstrument)));
    setActiveInstrument(instruments.length);
  }
  function updateInstrumentField(key) {
    return (e) => {
      const instrumentsCopy = [...instruments];
      instrumentsCopy[activeInstrument][key] = e.target.value;
      updateInstruments(instrumentsCopy);
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
    <Grid container direction="row" spacing={3}>
      <Grid item xs={3}>
        <Grid container direction="column" spacing={2}>
          <Grid item xs>
            Instruments:
            <List>
              {instruments.map((instrumentItem, i) => {
                return (
                  <ListItem
                    key={i}
                    button
                    onClick={() => setActiveInstrument(i)}
                  >
                    <ListItemText
                      primary={
                        <Typography
                          style={{
                            fontWeight: activeInstrument === i ? "bold" : "",
                          }}
                        >
                          {i + 1}. {instrumentItem.id}
                        </Typography>
                      }
                    />
                  </ListItem>
                );
              })}
            </List>
          </Grid>

          <Grid item xs>
            <Button
              disabled={disabled}
              startIcon={<Add />}
              onClick={addInstrument}
              style={{ height: "56px", marginLeft: "10px" }}
            >
              <I18n>
                <En>Add instrument</En>
                <Fr>Ajouter un instrument</Fr>
              </I18n>
            </Button>
          </Grid>
        </Grid>
      </Grid>
      <Grid item xs>
        <Grid container direction="column">
          {instrument && (
            <Paper style={paperClass}>
              <Grid container direction="column" spacing={2}>
                <Grid item xs>
                  <I18n>
                    <En>Instrument ID is required</En>
                    <Fr>L'ID de l'instrument est requis</Fr>
                  </I18n>
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
          {/* <Paper style={paperClass}>
            <Button startIcon={<Add />} disabled={disabled} onClick={addInstrument}>
              <En>Add Instrument</En>
              <Fr>Ajouter un article</Fr>
            </Button>
          </Paper> */}
        </Grid>
      </Grid>
    </Grid>
  );
};
export default Instruments;
