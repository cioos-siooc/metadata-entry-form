import React, { useState } from "react";
import {
  Button,
  Grid,
  IconButton,
  List,
  ListItemButton,
  ListItemSecondaryAction,
  ListItemText,
  Paper,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Delete,
  DragHandle as DragHandleIcon,
  FileCopy,
  Save,
} from "@mui/icons-material";
import {
  SortableList,
  SortableItem,
  DragHandle,
  arrayMove,
  useStableItemIds,
} from "./SortableList";
import { deepCopy, deepEquals } from "../../utils/misc";
import { paperClass } from "./QuestionStyles";
import { En, Fr, I18n } from "../I18n";
import SelectInput from "./SelectInput";

const LeftList = ({
  items,
  updateItems,
  activeItem,
  setActiveItem,
  disabled,
  savedUserItems,
  saveItem,
  getBlankItem,
  fieldsNotSavedInFirebase = [],
  addNewItemText,
  addSavedItemLabel,
  leftListHeader,
  leftListEmptyHeader,
  itemTitle,
  itemValidator,
  uidFields,
}) => {
  const getItemId = useStableItemIds("item");
  const [currentItems, setItems] = useState(items);
  if (!deepEquals(currentItems, items)) {
    setItems(items);
  }

  const onDrop = ({
    removedIndex: dragStartIndex,
    addedIndex: dragEndIndex,
  }) => {
    if (dragStartIndex === activeItem) {
      setActiveItem(dragEndIndex);
    } else if (dragEndIndex <= activeItem && dragStartIndex > activeItem) {
      setActiveItem(activeItem + 1);
    }

    const reorderedItems = arrayMove(
      currentItems,
      dragStartIndex,
      dragEndIndex,
    );

    updateItems(reorderedItems);
  };

  function removeItem(itemIndex) {
    updateItems(items.filter((e, index) => index !== itemIndex));
    if (items.length) {
      setActiveItem(items.length - 2);
    }
  }

  function duplicateItem(itemIndex) {
    const duplicatedItem = deepCopy(items[itemIndex]);
    const fieldsToAppend = uidFields || ["id"];

    const uidField = fieldsToAppend.find(
      (fieldName) => duplicatedItem[fieldName],
    );
    duplicatedItem[uidField] += " (Copy)";

    updateItems(items.concat(duplicatedItem));
  }

  const savedUserItemList = Object.values(savedUserItems || {});

  const handleAddFromSavedUserItem = (e) => {
    const index = e.target.value;
    const { role, ...contact } = savedUserItemList[index];

    updateItems(items.concat(deepCopy({ ...getBlankItem(), ...contact })));
    // TODO: Apply UID check for duplicates before adding to list
    setActiveItem(items.length);
  };

  function handleAddNewBlankItem() {
    updateItems(items.concat(getBlankItem()));
    setActiveItem(items.length);
  }

  return (
    <Paper style={paperClass}>
      <Grid container direction="column" justifyContent="flex-start">
        <Grid  style={{ margin: "10px" }}>
          <Typography>
            {items.length
              ? leftListHeader || (
                  <I18n>
                    <En>Items in this record:</En>
                    <Fr>Plateforme dans cet enregistrement :</Fr>
                  </I18n>
                )
              : leftListEmptyHeader || (
                  <I18n>
                    <En>There are no items in this record.</En>
                    <Fr>Il n'y a aucune plateforme dans cet enregistrement.</Fr>
                  </I18n>
                )}
          </Typography>
        </Grid>
        <Grid >
          <List>
            <SortableList items={items} onDrop={onDrop} getItemId={getItemId}>
              {items.map((itemEntry, i) => {
                const itemId = getItemId(itemEntry, i);
                return (
                  <SortableItem key={itemId} id={itemId}>
                    <ListItemButton onClick={() => setActiveItem(i)}>
                      <ListItemText
                        primary={
                          <Typography
                            style={{
                              fontWeight: activeItem === i ? "bold" : "",
                              width: "80%",
                            }}
                          >
                            {itemTitle(itemEntry) || (
                              <I18n en="New item" fr="Nouveau article" />
                            )}
                          </Typography>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Tooltip
                          title={<I18n en="Duplicate entry" fr="Dupliquer" />}
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
                              fr="Supprimer cette entrée"
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
                              en="Add to saved items"
                              fr="Ajouter aux articles enregistrés"
                            />
                          }
                        >
                          <span>
                            <IconButton
                              onClick={() => {
                                const toSave = deepCopy(items[i]);

                                // at this point the contact object could have
                                // a role field, which shouldn't be saved
                                fieldsNotSavedInFirebase.forEach(
                                  (fieldName) => {
                                    delete toSave[fieldName];
                                  },
                                );

                                toSave.contactID = saveItem(toSave);

                                setItems(items);
                              }}
                              disabled={
                                (itemValidator && itemValidator(itemEntry)) ||
                                itemEntry.id?.length === 0
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
                            <I18n
                              en="Drag to reorder"
                              fr="Faites glisser pour réorganiser"
                            />
                          }
                        >
                          <DragHandle disabled={disabled}>
                            <IconButton edge="end" aria-label="reorder">
                              <DragHandleIcon />
                            </IconButton>
                          </DragHandle>
                        </Tooltip>
                      </ListItemSecondaryAction>
                    </ListItemButton>
                  </SortableItem>
                );
              })}
            </SortableList>
          </List>
        </Grid>
        <Grid  style={{ margin: "10px" }}>
          <Button
            disabled={disabled}
            onClick={() => handleAddNewBlankItem()}
            fullWidth
            style={{ height: "56px", justifyContent: "emptyContact" }}
          >
            <Typography>
              {addNewItemText || (
                <I18n>
                  <En>Add new item</En>
                  <Fr>Ajouter un contact</Fr>
                </I18n>
              )}
            </Typography>
          </Button>
        </Grid>
        <Grid  style={{ margin: "10px" }}>
          <SelectInput
            value=""
            labelId="add-existing"
            onChange={handleAddFromSavedUserItem}
            optionLabels={savedUserItemList.map((savedItem) => {
              return itemTitle(savedItem);
            })}
            options={savedUserItemList.map((v, i) => i)}
            disabled={!savedUserItemList.length || disabled}
            label={
              addSavedItemLabel || (
                <I18n en="ADD SAVED ITEM" fr="AJOUTER UN ÉLÉMENT ENREGISTRÉ" />
              )
            }
          />
        </Grid>
      </Grid>
    </Paper>
  );
};

export default LeftList;
