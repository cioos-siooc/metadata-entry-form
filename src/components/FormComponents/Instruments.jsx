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

const initial = {
  id: "",
  manufacturer: "",
  version: "",
  type: { en: "", fr: "" },
  description: { en: "", fr: "" },
};

const Instruments = ({ onChange, value = [], name, disabled, paperClass }) => {
  const [activeContact, setActiveContact] = useState(0);

  function addItem() {
    onChange({
      target: {
        name,
        value: value.concat(deepCopy(initial)),
      },
    });

    setActiveContact(value.length);
  }
  function handleChange(e) {
    const newValue = [...value];
    const propName = e.target.name;
    newValue[activeContact][propName] = e.target.value;
    const parentEvent = { target: { name, value: newValue } };
    onChange(parentEvent);
  }
  function removeItem() {
    onChange({
      target: {
        name,
        value: value.filter((e, index) => index !== activeContact),
      },
    });

    if (value.length) setActiveContact(value.length - 2);
  }

  const manufacturerLabel = <I18n en="Manufacturer" fr="Fabricant" />;
  const versionLabel = <I18n en="Version" fr="Version" />;
  const typeLabel = <I18n en="Type" fr="Type" />;
  const descriptionLabel = <I18n en="Description" fr="Description" />;

  const instrument = value.length > 0 && value[activeContact];

  return (
    <Grid container direction="row" spacing={3}>
      <Grid item xs={3}>
        <Grid container direction="column" spacing={2}>
          <Grid item xs>
            Instruments:
            <List>
              {value.map((instrumentItem, i) => {
                return (
                  <ListItem key={i} button onClick={() => setActiveContact(i)}>
                    <ListItemText
                      primary={
                        <Typography
                          style={{
                            fontWeight: activeContact === i ? "bold" : "",
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
              onClick={addItem}
              style={{ height: "56px", marginLeft: "10px" }}
            >
              <En>Add instrument</En>
              <Fr>Ajouter un instrument</Fr>
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
                  <En>Instrument ID is required</En>
                  <Fr>L'ID de l'instrument est requis</Fr>
                  <TextField
                    label="ID"
                    name="id"
                    value={instrument.id}
                    onChange={handleChange}
                    fullWidth
                    disabled={disabled}
                  />
                </Grid>
                <Grid item xs>
                  <TextField
                    label={manufacturerLabel}
                    name="manufacturer"
                    value={instrument.manufacturer}
                    onChange={handleChange}
                    fullWidth
                    disabled={disabled}
                  />{" "}
                </Grid>
                <Grid item xs>
                  <TextField
                    label={versionLabel}
                    value={instrument.version}
                    name="version"
                    onChange={handleChange}
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
                    value={instrument.type}
                    onChange={handleChange}
                    disabled={disabled}
                  />
                </Grid>{" "}
                <Grid item xs>
                  <Typography>Description</Typography>
                  <BilingualTextInput
                    name="description"
                    label={descriptionLabel}
                    value={instrument.description}
                    onChange={handleChange}
                    disabled={disabled}
                  />
                </Grid>
                <Grid item xs>
                  <Button
                    startIcon={<Delete />}
                    disabled={disabled}
                    onClick={removeItem}
                  >
                    <En>Remove item</En>
                    <Fr>Supprimer l'instrument</Fr>
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          )}
          {/* <Paper style={paperClass}>
            <Button startIcon={<Add />} disabled={disabled} onClick={addItem}>
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
