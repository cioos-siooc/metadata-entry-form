import React, { useState } from "react";

import { Typography, Paper, Button } from "@material-ui/core";
import Contacts from "./Contacts";
import SelectInput from "./SelectInput";

import { En, Fr } from "../I18n";

const ContactTab = ({
  disabled,
  record,
  handleInputChange,
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
    <div>
      <Paper className={paperClass}>
        <Typography>
          <En>Contacts</En>
          <Fr>Contacts</Fr>
        </Typography>
        <div>
          <Typography>
            <En>Load a contact from the list</En>
            <Fr>Charger un contact à partir de la liste</Fr>
          </Typography>
          <SelectInput
            value={selectedIndex}
            onChange={(e) => setContact(e.target.value)}
            optionLabels={contactList.map(
              (contact) => `${contact.indName} ${contact.orgName}`
            )}
            options={contactList.map((v, i) => i)}
            disabled={!contactList.length || disabled}
          />

          <Button
            disabled={!contactList.length || selectedIndex === "" || disabled}
            onClick={handleAddContact}
          >
            <En>Add Contact</En>
            <Fr>Ajouter un contact</Fr>
          </Button>
        </div>
        <Contacts
          name="contacts"
          value={record.contacts || []}
          onChange={(e) => handleInputChange(e)}
          disabled={disabled}
        />
      </Paper>
    </div>
  );
};

export default ContactTab;
