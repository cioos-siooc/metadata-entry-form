import React from "react";
import { Add, Delete } from "@material-ui/icons";
import { Button, Grid, Paper } from "@material-ui/core";
import Contact from "./Contact";
import { deepCopy } from "../../utils/misc";
import { En, Fr } from "../I18n";

const initial = {
  role: "",
  orgName: "",
  orgEmail: "",
  orgURL: "",
  orgAdress: "",
  orgCity: "",
  orgCountry: "",
  indName: "",
  indPosition: "",
  indEmail: "",
};

const Contacts = ({ onChange, value, name, disabled, paperClass }) => {
  function addItem() {
    const changes = {
      target: {
        name,
        value: value.concat(deepCopy(initial)),
      },
    };

    onChange(changes);
  }
  function handleChange(i) {
    return (e) => {
      const newValue = [...value];
      const propName = e.target.name;
      newValue[i][propName] = e.target.value;
      const parentEvent = { target: { name, value: newValue } };
      onChange(parentEvent);
    };
  }
  function removeItem(i) {
    onChange({
      target: { name, value: value.filter((e, index) => index !== i) },
    });
  }
  return (
    <Grid container direction="column">
      {value.map((contact, i) => {
        return (
          <Paper key={i} style={paperClass}>
            <Grid container direction="column" spacing={3}>
              <Grid item xs>
                <Contact
                  showRolePicker
                  name={`contact_${i}`}
                  value={contact}
                  onChange={handleChange(i)}
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
        );
      })}
      <Paper style={paperClass}>
        <Button disabled={disabled} startIcon={<Add />} onClick={addItem}>
          <En>Add contact</En>
          <Fr>Ajouter un contact</Fr>
        </Button>
      </Paper>
    </Grid>
  );
};
export default Contacts;
