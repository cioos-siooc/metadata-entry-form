import React from "react";

import {
  Button,
  Grid, Paper,
  TextField,
  Typography,
} from "@material-ui/core";
import { Delete } from "@material-ui/icons";
import { getBlankInstrument } from "../../utils/blankRecord";

import { En, Fr, I18n } from "../I18n";

import BilingualTextInput from "./BilingualTextInput";

import RequiredMark from "./RequiredMark";


const InstrumentEditor = ({
  value,
  disabled,
  paperClass,
  updateInstrumentEvent,
}) => {

  const manufacturerLabel = <I18n en="Manufacturer" fr="Fabricant" />;
  const versionLabel = <I18n en="Version" fr="Version" />;
  const typeLabel = <I18n en="Type" fr="Type" />;
  const descriptionLabel = <I18n en="Description" fr="Description" />;

  const instrument = { ...getBlankInstrument(), ...value };

  return (
    <Grid container direction="column" spacing={2}>
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
                    onChange={updateInstrumentEvent("id")}
                    fullWidth
                    disabled={disabled}
                  />
                </Grid>
                <Grid item xs>
                  <TextField
                    label={manufacturerLabel}
                    name="manufacturer"
                    value={instrument.manufacturer}
                    onChange={updateInstrumentEvent("manufacturer")}
                    fullWidth
                    disabled={disabled}
                  />{" "}
                </Grid>
                <Grid item xs>
                  <TextField
                    label={versionLabel}
                    value={instrument.version}
                    onChange={updateInstrumentEvent("version")}
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
                    onChange={updateInstrumentEvent("type")}
                    disabled={disabled}
                  />
                </Grid>{" "}
                <Grid item xs>
                  <Typography>Description</Typography>
                  <BilingualTextInput
                    label={descriptionLabel}
                    value={instrument.description}
                    onChange={updateInstrumentEvent("description")}
                    disabled={disabled}
                  />
                </Grid>
                {/*<Grid item xs>*/}
                {/*  <Button*/}
                {/*    startIcon={<Delete />}*/}
                {/*    disabled={disabled}*/}
                {/*    onClick={removeInstrument}*/}
                {/*  >*/}
                {/*    <I18n>*/}
                {/*      <En>Remove item</En>*/}
                {/*      <Fr>Supprimer l'instrument</Fr>*/}
                {/*    </I18n>*/}
                {/*  </Button>*/}
                {/*</Grid>*/}
              </Grid>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Grid>
  );
};

export default InstrumentEditor;
