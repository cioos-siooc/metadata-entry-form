import React, {useState} from "react";
import {
    Button,
    Grid, IconButton,
    List,
    ListItem,
    ListItemSecondaryAction,
    ListItemText,
    Paper,
    Tooltip,
    Typography,
} from "@material-ui/core";
import {Container, Draggable} from "react-smooth-dnd";
import {Delete, DragHandle, FileCopy, Save} from "@material-ui/icons";
import arrayMove from "array-move";
import {deepCopy, deepEquals} from "../../utils/misc";
import {getBlankContact} from "../../utils/blankRecord";
import {paperClass} from "./QuestionStyles";
import {En, Fr, I18n} from "../I18n";
import ContactTitle from "./ContactTitle";
import SelectInput from "./SelectInput";

// TODO: move this out of this class for encapsulation.
const itemTypes = {
    contact: {
        uid_fields: [
            "lastName",
            "orgName",
        ],
        blankItem: getBlankContact,
    }};

const LeftList = ({
    itemType,
    items,
    updateItems,
    activeItem,
    setActiveItem,
    disabled,
    savedUserItems,
    saveItem,
}) => {
    const [currentItems, setItems] = useState(items)
    if (!(itemType in itemTypes)){
        throw Error("Invalid target for LeftList");
    }

    const itemContextHelper = itemTypes[itemType];

    if (!deepEquals(currentItems, items)){
        setItems(items)
    }

    function onDrop({ removedIndex: dragStartIndex, addedIndex: dragEndIndex }) {
        if (dragStartIndex === activeItem) {
            setActiveItem(dragEndIndex);
        } else if (dragEndIndex <= activeItem && dragStartIndex > activeItem){
            setActiveItem(activeItem + 1)
        }

        const reorderedItems = arrayMove(
            currentItems,
            dragStartIndex,
            dragEndIndex
        )

        updateItems(reorderedItems)
    }

    function removeItem(itemIndex) {
      updateItems(items.filter((e, index) => index !== itemIndex));
      if (items.length) {
        setActiveItem(items.length - 2);
      }
    }

    function duplicateItem(itemIndex) {
        const duplicatedItem = deepCopy(items[itemIndex]);

        const uidField = itemContextHelper.uid_fields.find(fieldName => duplicatedItem[fieldName])
        duplicatedItem[uidField] += " (Copy)";

        updateItems(items.concat(duplicatedItem));
      }

   const savedUserItemList = Object.values(savedUserItems || {});

   function handleAddFromSavedUserItem(e) {
    const index = e.target.value;
    const { role, ...contact } = savedUserItemList[index];

    updateItems(
      items.concat(deepCopy({ ...itemContextHelper.blankItem(), ...contact }))
    );
    // TODO: Apply UID check for duplicates before adding to list
    setActiveItem(items.length);
  }

  function handleAddNewBlankItem() {
    updateItems(items.concat(itemContextHelper.blankItem()));
    setActiveItem(items.length);
  }

  return (
      <Paper style={paperClass}>
      <Grid container direction="column" justifyContent="flex-start">
        <Grid item xs style={{ margin: "10px" }}>
          <Typography>
              {items.length ? (
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
              {items.map((itemEntry, i) => {
                return (
                  <Draggable key={i}>
                    <ListItem
                      key={i}
                      button
                      onClick={() => setActiveItem(i)}
                    >
                      <ListItemText
                        primary={
                          <Typography
                            style={{
                              fontWeight: activeItem === i ? "bold" : "",
                              width: "80%",
                            }}
                          >
                            <ContactTitle contact={itemEntry} />
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
                              onClick={() => duplicateItem(i)}
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
                                const contact = deepCopy(items[i]);

                                // at this point the contact object could have
                                // a role field, which shouldn't be saved
                                delete contact.role;

                                contact.contactID = saveItem(contact);

                                setItems(items);
                              }}
                              disabled={
                                !(
                                  items[i].orgName?.length ||
                                  items[i].givenNames?.length ||
                                  items[i].lastName?.length
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
            onClick={handleAddNewBlankItem}
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
            onChange={handleAddFromSavedUserItem}
            optionLabels={savedUserItemList.map((contactItem) => (
              <ContactTitle contact={contactItem} />
            ))}
            options={savedUserItemList.map((v, i) => i)}
            disabled={!savedUserItemList.length || disabled}
            label={<I18n en="ADD SAVED CONTACT" fr="AJOUTER UN CONTACT" />}
          />
        </Grid>
      </Grid>
      </Paper>
  )

}

export default LeftList;
