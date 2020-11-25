import React from "react";

import {
  Paper,
  Button,
  Grid,
  FormControl,
  InputLabel,
} from "@material-ui/core";
// import Contacts from "./Contacts";
import { Add, Delete } from "@material-ui/icons";
import { deepCopy } from "../../utils/misc";
import Contact from "./Contact";

import SelectInput from "./SelectInput";
import { QuestionText, SupplementalText, paperClass } from "./QuestionStyles";

import { En, Fr, I18n } from "../I18n";
import RequiredMark from "./RequiredMark";
import { validateField } from "../validate";

const ContactTab = ({ disabled, record, handleInputChange, userContacts }) => {
  const name = "contacts";
  const value = record.contacts || [];

  const initial = {
    role: [],
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
  const contactList = Object.values(userContacts || {});

  function handleAddContact(index) {
    handleInputChange({
      target: {
        name: "contacts",
        value: value.concat(contactList[index]),
      },
    });
  }

  function addItem() {
    const changes = {
      target: {
        name,
        value: value.concat(deepCopy(initial)),
      },
    };

    handleInputChange(changes);
  }
  function handleChange(i) {
    return (e) => {
      const newValue = [...value];
      const propName = e.target.name;
      newValue[i][propName] = e.target.value;
      const parentEvent = { target: { name, value: newValue } };
      handleInputChange(parentEvent);
    };
  }
  function removeItem(i) {
    handleInputChange({
      target: { name, value: value.filter((e, index) => index !== i) },
    });
  }

  return (
    <Grid container spacing={3}>
      <Paper style={paperClass}>
        <Grid item xs>
          <QuestionText>
            <En>Please enter at least one contact related to this dataset.</En>
            <Fr>
              Veuillez saisir au moins un contact lié à cet ensemble de données.
              Vous pouvez créer un nouveau contact ici.
            </Fr>
            <RequiredMark passes={validateField(record, "contacts")} />
            <SupplementalText>
              <En>
                If you have any saved contacts you can select them from the
                list.
              </En>
              <Fr>
                Si vous avez des contacts enregistrés, vous pouvez les
                sélectionner dans la liste.
              </Fr>
            </SupplementalText>
          </QuestionText>
        </Grid>
      </Paper>
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
          <Grid
            container
            direction="row"
            justify="flex-start"
            alignItems="center"
          >
            <Grid item xs={3}>
              <Button
                disabled={disabled}
                startIcon={<Add />}
                onClick={addItem}
                style={{ height: "56px" }}
              >
                <En>Add new contact</En>
                <Fr>Ajouter un contact</Fr>
              </Button>
            </Grid>
            <Grid item xs={3}>
              <FormControl disabled={disabled} style={{ minWidth: "220px" }}>
                <InputLabel id="add-existing" style={{ marginLeft: "10px" }}>
                  <I18n en="Add existing contact" fr="Add existing contact" />
                </InputLabel>

                <SelectInput
                  value=""
                  labelId="add-existing"
                  onChange={(e) => {
                    handleAddContact(e.target.value);
                  }}
                  optionLabels={contactList.map(
                    (contact) => `${contact.indName} ${contact.orgName}`
                  )}
                  options={contactList.map((v, i) => i)}
                  disabled={!contactList.length || disabled}
                  showDefaultLabel={false}
                />
              </FormControl>
            </Grid>
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default ContactTab;
