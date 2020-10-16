import React from "react";
import { Add, Delete } from "@material-ui/icons";
import { TextField, Grid, Typography, Button, Paper } from "@material-ui/core";
import { En, Fr, I18n } from "../I18n";
import BilingualTextInput from "./BilingualTextInput";
import { deepCopy } from "../../utils/misc";

const initial = {
  id: "",
  manufacturer: "",
  version: "",
  type: { en: "", fr: "" },
  description: { en: "", fr: "" },
};

const Instruments = ({ onChange, value, name, disabled, paperClass }) => {
  function addItem() {
    onChange({
      target: {
        name,
        value: value.concat(deepCopy(initial)),
      },
    });
  }
  function handleChange(e, i) {
    const newValue = [...value];
    const propName = e.target.name;
    newValue[i][propName] = e.target.value;
    const parentEvent = { target: { name, value: newValue } };
    onChange(parentEvent);
  }
  function removeItem(i) {
    onChange({
      target: { name, value: value.filter((e, index) => index !== i) },
    });
  }

  const manufacturerLabel = <I18n en="Manufacturer" fr="Fabricant" />;
  const versionLabel = <I18n en="Version" fr="Version" />;
  const typeLabel = <I18n en="Type" fr="Type" />;
  const descriptionLabel = <I18n en="Description" fr="Description" />;

  return (
    <Grid container direction="column">
      {value.map((inst, i) => (
        <Paper key={i} style={paperClass}>
          <Grid container direction="column" spacing={2}>
            <Grid item xs>
              <TextField
                label="ID"
                name="id"
                value={inst.id}
                onChange={(e) => handleChange(e, i)}
                fullWidth
                disabled={disabled}
              />
            </Grid>
            <Grid item xs>
              <TextField
                label={manufacturerLabel}
                name="manufacturer"
                value={inst.manufacturer}
                onChange={(e) => handleChange(e, i)}
                fullWidth
                disabled={disabled}
              />{" "}
            </Grid>
            <Grid item xs>
              <TextField
                label={versionLabel}
                value={inst.version}
                name="version"
                onChange={(e) => handleChange(e, i)}
                fullWidth
                disabled={disabled}
              />
            </Grid>
            <Grid item xs>
              <Typography>
                <En>Instrument Type</En>
                <Fr>Type d'instrument</Fr>
              </Typography>
              <BilingualTextInput
                name="type"
                label={typeLabel}
                value={inst.type}
                onChange={(e) => handleChange(e, i)}
                disabled={disabled}
              />
            </Grid>{" "}
            <Grid item xs>
              <Typography>Description</Typography>
              <BilingualTextInput
                name="description"
                label={descriptionLabel}
                value={inst.description}
                onChange={(e) => handleChange(e, i)}
                disabled={disabled}
              />
            </Grid>
            <Grid item xs>
              <Button
                startIcon={<Delete />}
                disabled={disabled}
                onClick={() => removeItem(i)}
              >
                <En>Remove item</En>
                <Fr>Supprimer l'article</Fr>
              </Button>
            </Grid>
          </Grid>
        </Paper>
      ))}
      <Paper style={paperClass}>
        <Button startIcon={<Add />} disabled={disabled} onClick={addItem}>
          <En>Add item</En>
          <Fr>Ajouter un article</Fr>
        </Button>
      </Paper>
    </Grid>
  );
};
export default Instruments;
