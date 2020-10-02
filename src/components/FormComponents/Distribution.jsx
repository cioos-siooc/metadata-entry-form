import React from "react";
import { I18n } from "../I18n";
import { deepCopy } from "../../utils/misc";
import { Add, Delete } from "@material-ui/icons";
import { TextField, Grid, Typography, IconButton } from "@material-ui/core";
import BilingualTextInput from "./BilingualTextInput";

const Distribution = ({ onChange, value, name, disabled }) => {
  const initial = { url: "", name: "", description: { en: "", fr: "" } };

  function addDistribution() {
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
  // removes the distribution section from the list at index i
  function removeDistribution(i) {
    onChange({
      target: { name, value: value.filter((e, index) => index !== i) },
    });
  }
  const nameLabel = <I18n en="Name" fr="Nom" />;
  const descriptionLabel = <I18n en="Description" fr="Description" />;

  return (
    <Grid container>
      {value.map((dist = deepCopy(initial), i) => {
        const handler = (e) => handleChange(e, i);
        return (
          <Grid key={i} container>
            <Grid item xs={9} style={{ marginLeft: "10px" }}>
              <TextField
                label="URL"
                name="url"
                value={dist.url}
                onChange={handler}
                fullWidth
                disabled={disabled}
              />
              <TextField
                label={nameLabel}
                name="name"
                value={dist.name}
                onChange={handler}
                fullWidth
                disabled={disabled}
              />

              <Typography>Description</Typography>
              <BilingualTextInput
                name={"description"}
                label={descriptionLabel}
                value={dist.description}
                onChange={handler}
                disabled={disabled}
              />
            </Grid>
            <Grid item xs={2}>
              <IconButton disabled={disabled} onClick={removeDistribution}>
                <Delete />
              </IconButton>
            </Grid>
          </Grid>
        );
      })}
      <IconButton disabled={disabled} onClick={addDistribution}>
        <Add />
      </IconButton>
    </Grid>
  );
};

export default Distribution;
