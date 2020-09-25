import React from "react";
import { En, Fr, I18n } from "../I18n";
import { Add, Delete } from "@material-ui/icons";
import { TextField, Grid, Typography, IconButton } from "@material-ui/core";
import BilingualTextInput from "./BilingualTextInput";
import memoize from "../../utils/memoize";
import { deepCopy } from "../../utils/misc";

const initial = {
  id: "",
  manufacturer: "",
  version: "",
  type: { en: "", fr: "" },
  description: { en: "", fr: "" },
};

const Instruments = ({ onChange, value, name, disabled }) => {
  function addItem() {
    onChange({
      target: {
        name,
        value: value.concat(deepCopy(initial)),
      },
    });
  }
  function handleChange(e, i) {
    let newValue = [...value];
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
    <Grid container>
      {value.map((inst, i) => (
        <Grid key={i} container>
          <Grid item xs={9} style={{ marginLeft: "10px" }}>
            <TextField
              label="ID"
              name="id"
              value={inst.id}
              onChange={(e) => handleChange(e, i)}
              fullWidth
              disabled={disabled}
            />
            <TextField
              label={manufacturerLabel}
              name="manufacturer"
              value={inst.manufacturer}
              onChange={(e) => handleChange(e, i)}
              fullWidth
              disabled={disabled}
            />
            <TextField
              label={versionLabel}
              value={inst.version}
              name="version"
              onChange={(e) => handleChange(e, i)}
              fullWidth
              disabled={disabled}
            />

            <Typography>
              <En>Instrument Type</En>
              <Fr>Type d'instrument</Fr>
            </Typography>
            <BilingualTextInput
              name={"type"}
              label={typeLabel}
              value={inst.type}
              onChange={(e) => handleChange(e, i)}
              disabled={disabled}
            />

            <Typography>Description</Typography>
            <BilingualTextInput
              name={"description"}
              label={descriptionLabel}
              value={inst.description}
              onChange={(e) => handleChange(e, i)}
              disabled={disabled}
            />
          </Grid>
          <Grid item xs={2}>
            <IconButton onClick={() => removeItem(i)} disabled={disabled}>
              <Delete />
            </IconButton>
          </Grid>
        </Grid>
      ))}
      <IconButton onClick={addItem} disabled={disabled}>
        <Add />
      </IconButton>
    </Grid>
  );
};
export default memoize(Instruments);
