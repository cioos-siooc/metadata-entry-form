import React, { useState } from "react";

import { Typography, Paper, Button, Grid } from "@material-ui/core";
import Contacts from "./Contacts";
import SelectInput from "./SelectInput";
import RequiredMark from "./RequiredMark";

import { En, Fr } from "../I18n";

const ContactTab = ({
  disabled,
  record,
  handleInputChange,
  paperClassValidate,
  paperClass,
  userContacts,
}) => {
  const contactList = Object.values(userContacts || {});

  const [selectedIndex, setContact] = useState("");

  function handleAddContact() {
    const value = record.contacts;

    handleInputChange({
      target: {
        name: "contacts",
        value: value.concat(contactList[selectedIndex]),
      },
    });
  }

  return (
    <Grid container spacing={3}>
      <Paper style={paperClassValidate("contacts")}>
        <Grid item xs>
          <Typography>
            <En>
              Please enter at least one contact related to this dataset. You can
              create a new contact here or if you have any saved contacts you
              can select them from the list.
            </En>
            <Fr>
              Veuillez saisir au moins un contact lié à cet ensemble de données.
              Vous pouvez créer un nouveau contact ici ou, si vous avez des
              contacts enregistrés, vous pouvez les sélectionner dans la liste.
            </Fr>
            <RequiredMark />
          </Typography>
        </Grid>
      </Paper>
      <Paper style={paperClass}>
        <Grid
          container
          direction="row"
          justify="flex-start"
          alignItems="center"
        >
          <Grid item xs={3}>
            <Typography>
              <En>Load a contact from the list</En>
              <Fr>Au moins un contact est requis.</Fr>
            </Typography>
          </Grid>
          <Grid item xs={3}>
            <SelectInput
              value={selectedIndex}
              onChange={(e) => setContact(e.target.value)}
              optionLabels={contactList.map(
                (contact) => `${contact.indName} ${contact.orgName}`
              )}
              options={contactList.map((v, i) => i)}
              disabled={!contactList.length || disabled}
            />
          </Grid>
          <Grid item xs={3}>
            <Button
              disabled={!contactList.length || selectedIndex === "" || disabled}
              onClick={handleAddContact}
            >
              <En>Add Contact From List</En>
              <Fr>Ajouter un contact de la liste</Fr>
            </Button>
          </Grid>
        </Grid>
      </Paper>
      <Contacts
        paperClass={paperClass}
        name="contacts"
        value={record.contacts || []}
        onChange={(e) => handleInputChange(e)}
        disabled={disabled}
      />
    </Grid>
  );
};

export default ContactTab;
