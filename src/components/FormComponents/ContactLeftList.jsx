import React, { useState } from "react";

import { Container, Draggable } from "react-smooth-dnd";

import arrayMove from "array-move";
import { Delete, DragHandle, FileCopy, Save } from "@material-ui/icons";
import {
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  IconButton,
  Typography,
  Tooltip,
  Grid,
  Paper,
  Button,
} from "@material-ui/core";
import { deepCopy, deepEquals } from "../../utils/misc";
import { paperClass } from "./QuestionStyles";
import SelectInput from "./SelectInput";
import { En, Fr, I18n } from "../I18n";

import ContactTitle from "./ContactTitle";

const emptyContact = {
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

const ContactLeftList = ({
  contacts,
  updateContacts,
  activeContact,
  setActiveContact,
  disabled,
  userContacts,
  saveToContacts,
}) => {
  const [currentContacts, setItems] = useState(contacts);

  if (!deepEquals(currentContacts, contacts)) {
    setItems(contacts);
  }
  //  removedIndex is dragStart
  //  addedIndex is dragEnd
  function onDrop({ removedIndex, addedIndex }) {
    if (removedIndex === activeContact) setActiveContact(addedIndex);
    else if (addedIndex <= activeContact && removedIndex > activeContact)
      setActiveContact(activeContact + 1);

    const reorderedContacts = arrayMove(
      currentContacts,
      removedIndex,
      addedIndex
    );

    updateContacts(reorderedContacts);
  }

  function removeItem(itemIndex) {
    updateContacts(contacts.filter((e, index) => index !== itemIndex));
    if (contacts.length) setActiveContact(contacts.length - 2);
  }
  function duplicateContact(contactIndex) {
    const duplicatedContact = deepCopy(contacts[contactIndex]);

    if (duplicatedContact.indName) duplicatedContact.indName += " (Copy)";
    else duplicatedContact.orgName += " (Copy)";

    updateContacts(contacts.concat(duplicatedContact));
  }

  const contactList = Object.values(userContacts || {});

  function handleAddFromSavedContacts(e) {
    const index = e.target.value;
    const { role, ...contact } = contactList[index];

    updateContacts(contacts.concat(deepCopy(contact)));
    setActiveContact(contacts.length);
  }

  function handleAddNewContact() {
    updateContacts(contacts.concat(deepCopy(emptyContact)));
    setActiveContact(contacts.length);
  }

  return (
    <Paper style={paperClass}>
      <Grid container direction="column" justify="flex-start">
        <Grid item xs style={{ margin: "10px" }}>
          <Typography>
            {contacts.length ? (
              <I18n>
                <En>Contacts in this record:</En>
                <Fr>Contacts dans cet enregistrement:</Fr>
              </I18n>
            ) : (
              <I18n>
                <En>There are no contacts in this record.</En>
                <Fr>Il n'y a aucun contact dans cet enregistrement.</Fr>
              </I18n>
            )}
          </Typography>
        </Grid>
        <Grid item xs>
          <List>
            <Container
              dragHandleSelector=".drag-handle"
              lockAxis="y"
              onDrop={onDrop}
            >
              {contacts.map((contactItem, i) => {
                return (
                  <Draggable key={i}>
                    <ListItem
                      key={i}
                      button
                      onClick={() => setActiveContact(i)}
                    >
                      <ListItemText
                        primary={
                          <Typography
                            style={{
                              fontWeight: activeContact === i ? "bold" : "",
                              width: "80%",
                            }}
                          >
                            <ContactTitle contact={contactItem} />
                          </Typography>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Tooltip
                          title={
                            <I18n
                              en="Duplicate contact"
                              fr="Duplicate contact"
                            />
                          }
                        >
                          <span>
                            <IconButton
                              onClick={() => duplicateContact(i)}
                              edge="end"
                              aria-label="clone"
                              disabled={disabled}
                            >
                              <FileCopy />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip
                          title={
                            <I18n
                              en="Remove from this record"
                              fr="Supprimer de cet enregistrement"
                            />
                          }
                        >
                          <span>
                            <IconButton
                              onClick={() => removeItem(i)}
                              edge="end"
                              aria-label="clone"
                              disabled={disabled}
                            >
                              <Delete />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip
                          title={
                            <I18n
                              en="Add to saved contacts"
                              fr="Ajouter aux contacts enregistrés"
                            />
                          }
                        >
                          <span>
                            <IconButton
                              onClick={() => {
                                const contact = contacts[i];

                                // at this point the contact object could have
                                // a role field, which shouldn't be saved
                                delete contact.role;

                                contact.contactID = saveToContacts(contact);

                                setItems(contacts);
                              }}
                              disabled={
                                !(
                                  contacts[i].orgName?.length ||
                                  contacts[i].indName?.length
                                )
                              }
                              edge="end"
                              aria-label="clone"
                            >
                              <Save />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip
                          title={
                            <I18n en="Drag to reorder" fr="Duplicate contact" />
                          }
                        >
                          <span>
                            <IconButton
                              className="drag-handle"
                              edge="end"
                              aria-label="clone"
                              disabled={disabled}
                            >
                              <DragHandle />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </ListItemSecondaryAction>
                    </ListItem>
                  </Draggable>
                );
              })}
            </Container>
          </List>
        </Grid>
        <Grid item xs style={{ margin: "10px" }}>
          <Button
            disabled={disabled}
            onClick={handleAddNewContact}
            fullWidth
            style={{ height: "56px", justifyContent: "emptyContact" }}
          >
            <Typography>
              <I18n>
                <En>Add new contact</En>
                <Fr>Ajouter un contact</Fr>
              </I18n>
            </Typography>
          </Button>
        </Grid>
        <Grid item xs style={{ margin: "10px" }}>
          <SelectInput
            value=""
            labelId="add-existing"
            onChange={handleAddFromSavedContacts}
            optionLabels={contactList.map((contactItem) => (
              <ContactTitle contact={contactItem} />
            ))}
            options={contactList.map((v, i) => i)}
            disabled={!contactList.length || disabled}
            label={<I18n en="ADD SAVED CONTACT" fr="AJOUTER UN CONTACT" />}
          />
        </Grid>
      </Grid>
    </Paper>
  );
};
export default ContactLeftList;
